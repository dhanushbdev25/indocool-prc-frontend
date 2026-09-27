import { describe, expect, it } from 'vitest';
import type { PrcTemplateStep } from '../../../../store/api/business/prc-template/prc-template.validators';
import { resolveTemplateStepDetail, resolveTemplateStepOperation } from './templateStepDetail';

const step = (overrides: Partial<PrcTemplateStep>): PrcTemplateStep =>
	({
		version: 1,
		isLatest: true,
		sequence: 1,
		type: 'sequence',
		blockCatalystMixing: false,
		requestSupervisorApproval: false,
		stepId: 412,
		...overrides
	}) as PrcTemplateStep;

/** The shape `GET prcTemplate/:id` hydrates onto a sequence step. */
const sequenceData = {
	id: 412,
	sequenceId: 'SEQ-014',
	sequenceName: 'Gelcoat application',
	category: 'Production',
	type: 'Manual',
	stepGroups: [
		{ id: 1, processName: 'Spray', steps: [{ id: 11 }, { id: 12 }] },
		{ id: 2, processName: 'Cure', steps: [{ id: 13 }] }
	]
};

/** The shape it hydrates onto an inspection step. */
const inspectionData = {
	inspection: { id: 378, inspectionId: 'INS-007', inspectionName: 'Demould Inspection', type: 'In-process' },
	inspectionParameters: [{ id: 1 }, { id: 2 }, { id: 3 }]
};

describe('resolveTemplateStepDetail', () => {
	it('names a hydrated sequence step and counts what it holds', () => {
		expect(resolveTemplateStepDetail(step({ data: sequenceData }))).toEqual({
			name: 'Gelcoat application',
			code: 'SEQ-014',
			summary: 'Production · Manual',
			contents: '2 groups · 3 steps'
		});
	});

	it('names a hydrated inspection step and counts its parameters', () => {
		expect(resolveTemplateStepDetail(step({ type: 'inspection', data: inspectionData }))).toEqual({
			name: 'Demould Inspection',
			code: 'INS-007',
			summary: 'In-process',
			contents: '3 parameters'
		});
	});

	it('reads the payload shape rather than the declared type', () => {
		// Templates also carry custom step types (e.g. "mixing h1"), so a mislabelled step
		// still resolves as long as the API hydrated it.
		const detail = resolveTemplateStepDetail(step({ type: 'mixing h1', data: inspectionData }));

		expect(detail.name).toBe('Demould Inspection');
	});

	it('singularises a one-item count', () => {
		const single = { ...sequenceData, stepGroups: [{ id: 1, processName: 'Spray', steps: [{ id: 11 }] }] };

		expect(resolveTemplateStepDetail(step({ data: single })).contents).toBe('1 group · 1 step');
	});

	it('reports nothing for an unhydrated step so the caller can fall back to the id', () => {
		const empty = { name: null, code: null, summary: null, contents: null };

		expect(resolveTemplateStepDetail(step({ data: undefined }))).toEqual(empty);
		expect(resolveTemplateStepDetail(step({ data: null }))).toEqual(empty);
		expect(resolveTemplateStepDetail(step({ data: 'unexpected' }))).toEqual(empty);
		expect(resolveTemplateStepDetail(step({ data: { unrelated: true } }))).toEqual(empty);
	});

	it('omits fields the master left blank instead of printing empty separators', () => {
		const sparse = { sequenceName: 'Trim', sequenceId: '  ', category: '', type: null, stepGroups: [] };

		expect(resolveTemplateStepDetail(step({ data: sparse }))).toEqual({
			name: 'Trim',
			code: null,
			summary: null,
			contents: null
		});
	});
});

describe('resolveTemplateStepOperation', () => {
	it('joins the operation code with its text', () => {
		expect(resolveTemplateStepOperation(step({ operationID: '40', operationText: 'Layup' }))).toBe('40 · Layup');
	});

	it('falls back to the legacy group field', () => {
		expect(resolveTemplateStepOperation(step({ group: '50', operationText: 'Demould' }))).toBe('50 · Demould');
	});

	it('reports nothing when the step carries no operation', () => {
		expect(resolveTemplateStepOperation(step({}))).toBeNull();
	});
});
