import type { PrcTemplateStep } from '../../../../store/api/business/prc-template/prc-template.validators';

/**
 * A template step stores only the row id of the sequence or inspection it points at, which is
 * meaningless to a reader. `GET prcTemplate/:id` already hydrates every step with the linked
 * master under `step.data` (the backend resolves them through `getProcessSequences` /
 * `getInspections`), so any screen rendering template steps can name the master instead of
 * printing its id. That payload is typed `unknown`, hence the defensive reads below.
 */
export interface TemplateStepDetail {
	/** Name of the linked sequence or inspection; null when the step arrived unhydrated. */
	name: string | null;
	/** The master's own business code (`sequenceId` / `inspectionId`), not its row id. */
	code: string | null;
	/** Classification worth showing beside the name: sequence category and type, or inspection type. */
	summary: string | null;
	/** What the master contains: step groups and steps for a sequence, parameters for an inspection. */
	contents: string | null;
}

const EMPTY_DETAIL: TemplateStepDetail = { name: null, code: null, summary: null, contents: null };

const asRecord = (value: unknown): Record<string, unknown> | null =>
	value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const asText = (value: unknown): string | null => {
	if (typeof value === 'string') return value.trim() === '' ? null : value.trim();
	if (typeof value === 'number' && Number.isFinite(value)) return String(value);
	return null;
};

const asRecords = (value: unknown): Record<string, unknown>[] =>
	Array.isArray(value) ? value.map(asRecord).filter((entry): entry is Record<string, unknown> => entry !== null) : [];

const countLabel = (count: number, singular: string) => `${count} ${singular}${count === 1 ? '' : 's'}`;

const joinParts = (parts: (string | null)[]) => {
	const kept = parts.filter((part): part is string => part !== null && part !== '');
	return kept.length > 0 ? kept.join(' · ') : null;
};

/**
 * Reads the hydrated master off a template step. Branches on the payload's shape rather than on
 * `step.type`, because templates also carry custom step types the two known shapes do not cover.
 */
export function resolveTemplateStepDetail(step: PrcTemplateStep): TemplateStepDetail {
	const data = asRecord(step.data);
	if (!data) return EMPTY_DETAIL;

	const inspection = asRecord(data.inspection);
	if (inspection) {
		const parameters = asRecords(data.inspectionParameters);
		return {
			name: asText(inspection.inspectionName),
			code: asText(inspection.inspectionId),
			summary: asText(inspection.type),
			contents: parameters.length > 0 ? countLabel(parameters.length, 'parameter') : null
		};
	}

	if (asText(data.sequenceName) !== null || Array.isArray(data.stepGroups)) {
		const groups = asRecords(data.stepGroups);
		const stepCount = groups.reduce((total, group) => total + asRecords(group.steps).length, 0);
		return {
			name: asText(data.sequenceName),
			code: asText(data.sequenceId),
			summary: joinParts([asText(data.category), asText(data.type)]),
			contents: joinParts([
				groups.length > 0 ? countLabel(groups.length, 'group') : null,
				stepCount > 0 ? countLabel(stepCount, 'step') : null
			])
		};
	}

	return EMPTY_DETAIL;
}

/** The operation group a step belongs to, as configured on the part. */
export function resolveTemplateStepOperation(step: PrcTemplateStep): string | null {
	return joinParts([asText(step.operationID) ?? asText(step.group), asText(step.operationText)]);
}
