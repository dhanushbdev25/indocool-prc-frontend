import { describe, expect, it } from 'vitest';
import type { TimelineStep } from '../types/execution.types';
import {
	applyDemouldStatusDeviation,
	collectDemouldDefectCategories,
	collectDemouldDefectCategoriesFromForm,
	findDemouldStatusParameter,
	findDemouldStep,
	hasAnyAnnotationRegion,
	hasDemouldDefectCount,
	hasDemouldDefectCountInForm,
	isDemouldInspectionStep
} from './demouldDefects';

const TEMPLATE_STEP_ID = 26114;

/** Mirrors the real inspection: a fixed table, numeric defect counts, then a Status ok/not ok. */
const demouldStep = (overrides: Partial<TimelineStep> = {}): TimelineStep =>
	({
		stepNumber: 2,
		type: 'inspection',
		title: 'Demould Inspection',
		description: 'Demould Inspection',
		status: 'pending',
		ctq: false,
		stepData: { prcTemplateStepId: TEMPLATE_STEP_ID },
		inspectionMetadata: { id: 378, type: 'Demould Inspection', inspectionName: 'Demould Inspection' },
		inspectionParameters: [
			{ id: 17174, parameterName: 'Inspector details', type: 'fixed-table', ctq: false, role: '', columns: [] },
			{ id: 17175, parameterName: 'Air bubbles', type: 'number', ctq: false, role: '', columns: [] },
			{ id: 17176, parameterName: 'Air leak', type: 'number', ctq: false, role: '', columns: [] },
			{ id: 17187, parameterName: 'Pin holes', type: 'number', ctq: false, role: '', columns: [] },
			{ id: 17238, parameterName: 'Status', type: 'ok/not ok', ctq: false, role: '', columns: [] }
		],
		...overrides
	}) as unknown as TimelineStep;

const firStep = (): TimelineStep =>
	({
		stepNumber: 3,
		type: 'inspection',
		title: 'FIR',
		description: 'FIR',
		status: 'pending',
		ctq: false,
		stepData: { prcTemplateStepId: 999 },
		inspectionMetadata: { id: 605, type: 'FIR', inspectionName: 'FIR' },
		inspectionParameters: []
	}) as unknown as TimelineStep;

const aggregated = (values: Record<number, unknown>) => ({
	[String(TEMPLATE_STEP_ID)]: {
		stepCompleted: true,
		productionApproved: true,
		...Object.fromEntries(Object.entries(values).map(([id, value]) => [id, { value }]))
	}
});

describe('isDemouldInspectionStep', () => {
	it('matches on inspection type, not on a hardcoded id', () => {
		expect(isDemouldInspectionStep(demouldStep())).toBe(true);
		// The second Demould Inspection row has a different id but the same type.
		expect(
			isDemouldInspectionStep(
				demouldStep({ inspectionMetadata: { id: 913, type: 'Demould Inspection' } } as Partial<TimelineStep>)
			)
		).toBe(true);
	});

	it('ignores case and surrounding space', () => {
		expect(
			isDemouldInspectionStep(
				demouldStep({ inspectionMetadata: { id: 1, type: '  demould inspection ' } } as Partial<TimelineStep>)
			)
		).toBe(true);
	});

	it('rejects other inspections and non-inspection steps', () => {
		expect(isDemouldInspectionStep(firStep())).toBe(false);
		expect(isDemouldInspectionStep({ type: 'sequence' } as TimelineStep)).toBe(false);
		expect(isDemouldInspectionStep(undefined)).toBe(false);
	});
});

describe('findDemouldStep', () => {
	it('picks the demould step out of the timeline', () => {
		expect(findDemouldStep([firStep(), demouldStep()])?.title).toBe('Demould Inspection');
	});

	it('returns undefined when the PRC has no demould inspection', () => {
		expect(findDemouldStep([firStep()])).toBeUndefined();
	});
});

describe('findDemouldStatusParameter', () => {
	it('finds the ok/not ok Status parameter', () => {
		expect(findDemouldStatusParameter(demouldStep())).toEqual({ id: 17238, parameterName: 'Status' });
	});
});

describe('collectDemouldDefectCategories', () => {
	it('lists only defects recorded above zero, in master order', () => {
		const categories = collectDemouldDefectCategories(
			demouldStep(),
			aggregated({ 17175: '2', 17176: '0', 17187: '5' })
		);

		expect(categories).toEqual(['Air bubbles', 'Pin holes']);
	});

	it('reads a leading-zero count as a number', () => {
		expect(collectDemouldDefectCategories(demouldStep(), aggregated({ 17175: '02' }))).toEqual(['Air bubbles']);
	});

	it('excludes blank, zero and non-numeric entries', () => {
		expect(collectDemouldDefectCategories(demouldStep(), aggregated({ 17175: '', 17176: '0', 17187: 'abc' }))).toEqual(
			[]
		);
	});

	it('never offers the fixed table or the Status parameter', () => {
		const categories = collectDemouldDefectCategories(
			demouldStep(),
			aggregated({ 17174: { '0': { 'Employee Code': '9626' } }, 17238: 'not ok', 17175: '1' })
		);

		expect(categories).toEqual(['Air bubbles']);
	});

	it('returns nothing when the PRC has no demould step, which drives the free-text fallback', () => {
		expect(collectDemouldDefectCategories(undefined, aggregated({ 17175: '3' }))).toEqual([]);
	});

	it('returns nothing before the demould step has been filled in', () => {
		expect(collectDemouldDefectCategories(demouldStep(), {})).toEqual([]);
	});
});

describe('hasAnyAnnotationRegion', () => {
	it('finds regions on a parameter', () => {
		expect(
			hasAnyAnnotationRegion({ '999': { '1': { annotations: [{ regions: [{ category: 'Air bubbles' }] }] } } })
		).toBe(true);
	});

	it('finds regions nested under fixed-table rows', () => {
		expect(
			hasAnyAnnotationRegion({
				'999': { '1': { rowAnnotations: [{ rowIndex: 0, annotations: [{ regions: [{}] }] }] } }
			})
		).toBe(true);
	});

	it('is false when images carry no marked regions', () => {
		expect(hasAnyAnnotationRegion({ '999': { '1': { annotations: [{ regions: [] }] } } })).toBe(false);
		expect(hasAnyAnnotationRegion({})).toBe(false);
		expect(hasAnyAnnotationRegion(undefined)).toBe(false);
	});
});

describe('applyDemouldStatusDeviation', () => {
	const withRegion = (base: Record<string, unknown>): Record<string, unknown> => ({
		...base,
		'999': { '1': { annotations: [{ regions: [{ category: 'Air bubbles' }] }] } }
	});

	it('sets Status to OK with deviation once a defect is marked', () => {
		const next = applyDemouldStatusDeviation(withRegion(aggregated({ 17238: 'ok' })), demouldStep());
		const bucket = next[String(TEMPLATE_STEP_ID)] as Record<string, { value: string }>;

		expect(bucket['17238'].value).toBe('not ok');
	});

	it('leaves everything alone when no defect has been marked', () => {
		const before = aggregated({ 17238: 'ok' });
		expect(applyDemouldStatusDeviation(before, demouldStep())).toBe(before);
	});

	it('never writes Status back to OK, so clearing the defects does not undo it', () => {
		const before = aggregated({ 17238: 'not ok' });
		expect(applyDemouldStatusDeviation(before, demouldStep())).toBe(before);
	});

	it('does not overwrite a Status already set to the deviation by hand', () => {
		const before = withRegion(aggregated({ 17238: 'not ok' }));
		expect(applyDemouldStatusDeviation(before, demouldStep())).toBe(before);
	});

	it('keeps any other fields already saved against the Status parameter', () => {
		const base = withRegion(aggregated({ 17238: 'ok' }));
		(base[String(TEMPLATE_STEP_ID)] as Record<string, Record<string, unknown>>)['17238'].comments = 'checked';

		const next = applyDemouldStatusDeviation(base, demouldStep());
		const bucket = next[String(TEMPLATE_STEP_ID)] as Record<string, Record<string, unknown>>;

		expect(bucket['17238']).toEqual({ value: 'not ok', comments: 'checked' });
	});

	it('leaves the other steps untouched', () => {
		const before = withRegion(aggregated({ 17238: 'ok' }));
		const next = applyDemouldStatusDeviation(before, demouldStep());

		expect(next['999']).toBe(before['999']);
	});

	it('does nothing when the PRC has no demould step', () => {
		const before = withRegion({});
		expect(applyDemouldStatusDeviation(before, undefined)).toBe(before);
	});

	// A recorded defect count is a deviation in its own right: the operator has said the part
	// came out of the mould with defects on it, whether or not anyone circled them on a photo.
	const statusAfter = (values: Record<number, unknown>): string => {
		const next = applyDemouldStatusDeviation(aggregated(values), demouldStep());
		const bucket = next[String(TEMPLATE_STEP_ID)] as Record<string, { value: string }>;
		return bucket['17238'].value;
	};

	it('sets Status to OK with deviation from a defect count alone, with no image annotated', () => {
		expect(statusAfter({ 17175: '5', 17238: 'ok' })).toBe('not ok');
	});

	it('flips on a count of exactly one, the threshold case', () => {
		expect(statusAfter({ 17175: '1', 17238: 'ok' })).toBe('not ok');
	});

	it('flips when only the last of several defect parameters is non-zero', () => {
		expect(statusAfter({ 17175: '0', 17176: '0', 17187: '3', 17238: 'ok' })).toBe('not ok');
	});

	it('reads a leading-zero count as a number, so 02 still flips', () => {
		expect(statusAfter({ 17175: '02', 17238: 'ok' })).toBe('not ok');
	});

	it('leaves Status alone when every defect count is zero, blank or non-numeric', () => {
		expect(statusAfter({ 17175: '0', 17176: '', 17187: 'abc', 17238: 'ok' })).toBe('ok');
	});

	it('ignores the Status parameter itself when looking for counts', () => {
		const before = aggregated({ 17238: 'ok' });
		expect(applyDemouldStatusDeviation(before, demouldStep())).toBe(before);
	});
});

describe('hasDemouldDefectCount', () => {
	it('is true once any defect parameter carries a count of one or more', () => {
		expect(hasDemouldDefectCount(demouldStep(), aggregated({ 17175: '1' }))).toBe(true);
		expect(hasDemouldDefectCount(demouldStep(), aggregated({ 17187: '9' }))).toBe(true);
	});

	it('is false for zero, blank and non-numeric counts', () => {
		expect(hasDemouldDefectCount(demouldStep(), aggregated({ 17175: '0', 17176: '', 17187: 'abc' }))).toBe(false);
	});

	it('counts a defect row even when its parameter name is blank', () => {
		const step = demouldStep({
			inspectionParameters: [
				{ id: 17175, parameterName: '', type: 'number', ctq: false, role: '', columns: [] },
				{ id: 17238, parameterName: 'Status', type: 'ok/not ok', ctq: false, role: '', columns: [] }
			]
		} as unknown as Partial<TimelineStep>);

		// The annotator drops the unnamed row from its dropdown, but it is still a real defect.
		expect(collectDemouldDefectCategories(step, aggregated({ 17175: '2' }))).toEqual([]);
		expect(hasDemouldDefectCount(step, aggregated({ 17175: '2' }))).toBe(true);
	});

	it('is false with no demould step or nothing filled in', () => {
		expect(hasDemouldDefectCount(undefined, aggregated({ 17175: '3' }))).toBe(false);
		expect(hasDemouldDefectCount(demouldStep(), {})).toBe(false);
	});
});

describe('hasDemouldDefectCountInForm', () => {
	// The step form keys answers by bare parameter id, not under a template-step bucket, and
	// holds either `{ value }` or the bare value.
	it('reads the wrapped and bare shapes the form uses', () => {
		expect(hasDemouldDefectCountInForm(demouldStep(), { '17175': { value: '1' } })).toBe(true);
		expect(hasDemouldDefectCountInForm(demouldStep(), { '17175': '3' })).toBe(true);
	});

	it('is false while every count is zero, which is what demould rows default to', () => {
		expect(
			hasDemouldDefectCountInForm(demouldStep(), {
				'17175': { value: '0' },
				'17176': { value: '0' },
				'17187': { value: '0' }
			})
		).toBe(false);
	});

	it('ignores blank and non-numeric entries', () => {
		expect(hasDemouldDefectCountInForm(demouldStep(), { '17175': { value: '' }, '17176': { value: 'abc' } })).toBe(
			false
		);
	});

	it('never fires on a non-demould inspection, so other sheets are untouched', () => {
		const fir = firStep();
		(fir as unknown as { inspectionParameters: unknown[] }).inspectionParameters = [
			{ id: 900, parameterName: 'Scrap count', type: 'number', ctq: false, role: '', columns: [] }
		];

		expect(hasDemouldDefectCountInForm(fir, { '900': { value: '7' } })).toBe(false);
	});

	it('is false with no step or no form data', () => {
		expect(hasDemouldDefectCountInForm(undefined, { '17175': { value: '5' } })).toBe(false);
		expect(hasDemouldDefectCountInForm(demouldStep(), undefined)).toBe(false);
	});
});

describe('collectDemouldDefectCategoriesFromForm', () => {
	// Drives the annotator dropdown while the demould sheet is still being filled in — the saved
	// tree is empty at that point, which is what made the field fall back to free text.
	it('lists the defects typed above zero, in master order', () => {
		expect(
			collectDemouldDefectCategoriesFromForm(demouldStep(), {
				'17175': { value: '2' },
				'17176': { value: '0' },
				'17187': { value: '5' }
			})
		).toEqual(['Air bubbles', 'Pin holes']);
	});

	it('drops a defect again as soon as its count goes back to zero', () => {
		expect(collectDemouldDefectCategoriesFromForm(demouldStep(), { '17187': { value: '0' } })).toEqual([]);
	});

	it('excludes blank and non-numeric counts, and the Status parameter itself', () => {
		expect(
			collectDemouldDefectCategoriesFromForm(demouldStep(), {
				'17175': { value: '' },
				'17176': { value: 'abc' },
				'17238': { value: 'not ok' }
			})
		).toEqual([]);
	});

	it('returns nothing for a non-demould step, so other sheets keep the saved list', () => {
		expect(collectDemouldDefectCategoriesFromForm(firStep(), { '900': { value: '4' } })).toEqual([]);
	});
});
