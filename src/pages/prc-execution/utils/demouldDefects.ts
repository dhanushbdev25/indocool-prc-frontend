/**
 * Demould inspection rules that reach across steps.
 *
 * Image annotation almost always happens on a FIR/AFIR inspection rather than on demoulding
 * itself, so both of these read or write the demould step's bucket in `prcAggregatedSteps`
 * from wherever the operator currently is:
 *
 * - the defect category list offered by the annotator is the demould defect parameters the
 *   operator actually recorded a count above zero for, and
 * - recording any defect flips the demould `Status` parameter to OK with deviation, whether the
 *   defect was entered as a count on the inspection sheet or marked on an image.
 *
 * The demould step is matched on `inspectionMetadata.type`, not on a hardcoded id. Two
 * separate Demould Inspection rows exist and both are live in templates, and their ids differ
 * per environment, so an id check silently misses one. This mirrors how the backend already
 * locates the moulding step (`inspection.type === 'Moulding'`).
 */

import { OK_NOT_OK_NEGATIVE_VALUE } from '../../../utils/okNotOkLabels';
import type { TimelineStep } from '../types/execution.types';

export const DEMOULD_INSPECTION_TYPE = 'Demould Inspection';

type AggregatedSteps = Record<string, unknown>;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	value !== null && typeof value === 'object' && !Array.isArray(value);

export function isDemouldInspectionStep(step: TimelineStep | null | undefined): boolean {
	if (!step || step.type !== 'inspection') return false;
	return step.inspectionMetadata?.type?.trim().toLowerCase() === DEMOULD_INSPECTION_TYPE.toLowerCase();
}

export function findDemouldStep(timelineSteps: readonly TimelineStep[]): TimelineStep | undefined {
	return timelineSteps.find(isDemouldInspectionStep);
}

/** The template step id the demould answers are stored under. */
function demouldBucketKey(demouldStep: TimelineStep): string | undefined {
	const id = demouldStep.stepData?.prcTemplateStepId ?? demouldStep.prcTemplateStepId;
	return id != null ? String(id) : undefined;
}

function demouldBucket(
	demouldStep: TimelineStep,
	prcAggregatedSteps: AggregatedSteps | undefined
): Record<string, unknown> | undefined {
	const key = demouldBucketKey(demouldStep);
	if (!key || !prcAggregatedSteps) return undefined;
	const bucket = prcAggregatedSteps[key];
	return isPlainObject(bucket) ? bucket : undefined;
}

/** Answers are stored as `{ value: '2' }`; older rows may hold the bare value. */
function readParameterValue(bucket: Record<string, unknown> | undefined, parameterId: number): unknown {
	const entry = bucket?.[String(parameterId)];
	if (isPlainObject(entry) && 'value' in entry) return entry.value;
	return entry;
}

/** Counts arrive as strings and sometimes carry a leading zero, so '02' has to read as 2. */
function isPositiveCount(raw: unknown): boolean {
	if (raw === null || raw === undefined || typeof raw === 'object') return false;
	const text = String(raw).trim();
	if (text === '') return false;
	const parsed = Number(text);
	return Number.isFinite(parsed) && parsed > 0;
}

/** The single `ok/not ok` parameter on the demould inspection — the Status field. */
export function findDemouldStatusParameter(
	demouldStep: TimelineStep | null | undefined
): { id: number; parameterName: string } | undefined {
	if (!demouldStep) return undefined;
	const parameter = demouldStep.inspectionParameters?.find(param => param.type === 'ok/not ok');
	return parameter ? { id: parameter.id, parameterName: parameter.parameterName } : undefined;
}

/**
 * Defect categories the annotator may offer: the demould number parameters the operator gave a
 * count above zero. Returned in master order so the dropdown matches the inspection sheet.
 *
 * Returns an empty list when there is no demould step in the PRC, which is what makes the
 * annotator fall back to free text.
 */
export function collectDemouldDefectCategories(
	demouldStep: TimelineStep | null | undefined,
	prcAggregatedSteps: AggregatedSteps | undefined
): string[] {
	if (!demouldStep) return [];
	const bucket = demouldBucket(demouldStep, prcAggregatedSteps);
	if (!bucket) return [];

	return (demouldStep.inspectionParameters ?? [])
		.filter(param => param.type === 'number' && isPositiveCount(readParameterValue(bucket, param.id)))
		.map(param => param.parameterName)
		.filter(name => typeof name === 'string' && name.trim() !== '');
}

/**
 * True when the operator recorded a count of at least one against any demould defect parameter.
 *
 * Deliberately independent of the parameter's name, unlike the annotator's category list: a
 * defect row with a blank name still means the part came out of the mould with a defect on it.
 */
export function hasDemouldDefectCount(
	demouldStep: TimelineStep | null | undefined,
	prcAggregatedSteps: AggregatedSteps | undefined
): boolean {
	if (!demouldStep) return false;
	const bucket = demouldBucket(demouldStep, prcAggregatedSteps);
	if (!bucket) return false;

	return (demouldStep.inspectionParameters ?? []).some(
		param => param.type === 'number' && isPositiveCount(readParameterValue(bucket, param.id))
	);
}

/**
 * Reads a parameter's value out of the in-progress form state. The step form keys answers by
 * bare parameter id and stores either the value itself or `{ value }`, the same two shapes the
 * saved tree uses.
 */
function readFormParameterValue(formData: Record<string, unknown>, parameterId: number): unknown {
	const entry = formData[String(parameterId)];
	if (isPlainObject(entry) && 'value' in entry) return entry.value;
	return entry;
}

/**
 * True when the operator has typed a count of at least one against any demould defect parameter
 * in the form that is open right now — before anything has been saved.
 *
 * This is what lets the Status radio move as the count is typed. `hasDemouldDefectCount` answers
 * the same question against the saved tree, which is what the save-time latch uses.
 */
export function hasDemouldDefectCountInForm(
	step: TimelineStep | null | undefined,
	formData: Record<string, unknown> | undefined
): boolean {
	if (!step || !isDemouldInspectionStep(step) || !formData) return false;

	return (step.inspectionParameters ?? []).some(
		param => param.type === 'number' && isPositiveCount(readFormParameterValue(formData, param.id))
	);
}

/**
 * The same list as `collectDemouldDefectCategories`, but read from the demould step's own
 * in-progress form instead of the saved tree.
 *
 * Annotating on the demould sheet itself is the case this exists for: the counts the operator
 * just typed have not been saved yet, so the saved-tree version returns nothing and the
 * annotator would fall back to free text.
 */
export function collectDemouldDefectCategoriesFromForm(
	step: TimelineStep | null | undefined,
	formData: Record<string, unknown> | undefined
): string[] {
	if (!step || !isDemouldInspectionStep(step) || !formData) return [];

	return (step.inspectionParameters ?? [])
		.filter(param => param.type === 'number' && isPositiveCount(readFormParameterValue(formData, param.id)))
		.map(param => param.parameterName)
		.filter(name => typeof name === 'string' && name.trim() !== '');
}

/**
 * True when any image anywhere in the execution carries at least one marked region.
 *
 * Walks the saved tree rather than a specific shape: regions hang off `annotations` on a
 * parameter and off `rowAnnotations` on fixed-table rows, and both nest a `regions` array.
 */
export function hasAnyAnnotationRegion(prcAggregatedSteps: AggregatedSteps | undefined): boolean {
	if (!prcAggregatedSteps) return false;

	const seen = new Set<unknown>();
	const walk = (node: unknown, depth: number): boolean => {
		if (depth > 12 || node === null || typeof node !== 'object') return false;
		if (seen.has(node)) return false;
		seen.add(node);

		if (Array.isArray(node)) return node.some(item => walk(item, depth + 1));

		for (const [key, value] of Object.entries(node)) {
			if (key === 'regions' && Array.isArray(value) && value.length > 0) return true;
			if (walk(value, depth + 1)) return true;
		}
		return false;
	};

	return walk(prcAggregatedSteps, 0);
}

/**
 * Flips the demould Status to OK with deviation once any defect has been recorded — either as a
 * count of one or more on the demould inspection sheet, or as a region marked on an image.
 *
 * Either trigger alone is enough: operators routinely enter the counts without ever opening the
 * annotator, and an image can be marked from a later FIR/AFIR step without the counts being
 * touched, so gating on both together would miss the common case.
 *
 * A one-way latch: it only ever writes the deviation value, never back to OK, so clearing the
 * counts or annotations later leaves the Status where it is and a manual override is never
 * overwritten. Returns the original object untouched when there is nothing to do, so callers can
 * use the result unconditionally.
 */
export function applyDemouldStatusDeviation(
	prcAggregatedSteps: AggregatedSteps,
	demouldStep: TimelineStep | null | undefined
): AggregatedSteps {
	if (!demouldStep) return prcAggregatedSteps;

	const defectRecorded =
		hasDemouldDefectCount(demouldStep, prcAggregatedSteps) || hasAnyAnnotationRegion(prcAggregatedSteps);
	if (!defectRecorded) return prcAggregatedSteps;

	const key = demouldBucketKey(demouldStep);
	const status = findDemouldStatusParameter(demouldStep);
	if (!key || !status) return prcAggregatedSteps;

	const bucket = demouldBucket(demouldStep, prcAggregatedSteps);
	if (!bucket) return prcAggregatedSteps;

	if (readParameterValue(bucket, status.id) === OK_NOT_OK_NEGATIVE_VALUE) return prcAggregatedSteps;

	const existing = bucket[String(status.id)];
	return {
		...prcAggregatedSteps,
		[key]: {
			...bucket,
			[String(status.id)]: {
				...(isPlainObject(existing) ? existing : {}),
				value: OK_NOT_OK_NEGATIVE_VALUE
			}
		}
	};
}
