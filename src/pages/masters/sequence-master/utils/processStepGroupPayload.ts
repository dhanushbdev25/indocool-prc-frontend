import { normalizeTableConfig } from '../components/create-sequence/table-config.utils';
import { normalizeCriticalityTag, resolveCriticality, toCriticalityFields } from '../../../../utils/criticality';
import type { SequenceFormData } from '../components/create-sequence/schemas';
import type { TableConfig } from '../../../../types/table-config.types';
import type {
	ProcessStep,
	ProcessStepGroup,
	ProcessStepGroupRequest,
	ProcessStepRequest
} from '../../../../store/api/business/sequence-master/sequence.validators';

export type ProcessStepGroupFormValues = NonNullable<SequenceFormData['processStepGroups']>[number];

// Expected duration is held as HH:MM in the form but as seconds on the wire.
const convertTimeToSeconds = (timeString: string): number => {
	if (!timeString) return 0;
	const [hours, minutes] = timeString.split(':').map(Number);
	return (hours * 60 + minutes) * 60;
};

const convertSecondsToTime = (seconds: number): string => {
	if (!seconds || seconds === 0) return '00:01';
	const totalMinutes = Math.floor(seconds / 60);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const withId = (id: number | undefined) => (id != null ? { id } : {});

const toNumberOrNull = (value: string | number | null | undefined): number | null => {
	if (value == null || value === '') return null;
	const parsed = Number(value);
	return Number.isNaN(parsed) ? null : parsed;
};

const stepTableConfig = (step: ProcessStep): TableConfig | null => {
	if (step.targetValueType !== 'table') return null;
	const raw = (step.tableConfig ?? (step as Record<string, unknown>).table_config) as
		| Parameters<typeof normalizeTableConfig>[0]
		| undefined;
	return normalizeTableConfig(raw ?? null);
};

/**
 * API step groups -> form values.
 *
 * Keeps the database ids on the group and every nested step. The update endpoint
 * deletes and re-inserts both tables, so a payload without ids makes Postgres
 * assign new primary keys and orphans the execution answers stored under
 * prcAggregatedSteps[groupId][stepId].
 */
export const toProcessStepGroupFormValues = (groups: readonly ProcessStepGroup[]): ProcessStepGroupFormValues[] =>
	(groups ?? [])
		.filter((group): group is ProcessStepGroup => group != null)
		.slice()
		.sort((a, b) => a.sequence - b.sequence)
		.map(group => ({
			...withId(group.id),
			sequence: group.sequence,
			processName: group.processName,
			processDescription: group.processDescription,
			sequenceTiming: convertSecondsToTime(group.sequenceTiming || 60),
			shift: group.shift || '',
			pfdNumber: group.pfdNumber || '',
			processSteps: (group.steps ?? [])
				.filter((step): step is ProcessStep => step != null)
				.map(step => {
					const minNum = toNumberOrNull(step.minimumAcceptanceValue);
					const maxNum = toNumberOrNull(step.maximumAcceptanceValue);
					// An exact value is stored as a collapsed range; show the same number on both sides.
					const isExact = step.targetValueType === 'exact value';
					const target = minNum ?? maxNum;

					return {
						...withId(step.id),
						parameterDescription: step.parameterDescription,
						stepNumber: step.stepNumber,
						evaluationMethod: step.evaluationMethod,
						targetValueType: step.targetValueType,
						minimumAcceptanceValue: isExact ? target : minNum,
						maximumAcceptanceValue: isExact ? target : maxNum,
						multipleMeasurements: step.multipleMeasurements ?? false,
						multipleMeasurementMaxCount: step.multipleMeasurementMaxCount,
						tableConfig: stepTableConfig(step),
						uom: step.uom,
						ctq: step.ctq ?? false,
						criticalityTag: normalizeCriticalityTag(step.criticalityTag),
						allowAttachments: step.allowAttachments ?? false,
						responsiblePerson: step.responsiblePerson ?? false,
						getInstrumentId: step.getInstrumentId ?? false,
						notes: step.notes
					};
				})
		})) as ProcessStepGroupFormValues[];

/**
 * Clone posts to the create endpoint, which honours an explicit id just as update
 * does, so the source ids have to go or the insert collides.
 */
export const stripProcessStepGroupIds = (groups: readonly ProcessStepGroupFormValues[]): ProcessStepGroupFormValues[] =>
	groups.map(group => {
		const { id: _groupId, ...groupWithoutId } = group;
		return {
			...groupWithoutId,
			processSteps: (group.processSteps ?? []).map(step => {
				const { id: _stepId, ...stepWithoutId } = step;
				return stepWithoutId;
			})
		} as ProcessStepGroupFormValues;
	});

/** Form values -> update/create request payload. */
export const toProcessStepGroupRequests = (groups: readonly ProcessStepGroupFormValues[]): ProcessStepGroupRequest[] =>
	groups.map((group, groupIndex) => ({
		...withId(group.id),
		sequence: groupIndex + 1,
		processName: group.processName,
		processDescription: group.processDescription,
		sequenceTiming: convertTimeToSeconds(group.sequenceTiming),
		shift: group.shift || null,
		pfdNumber: group.pfdNumber || null,
		processSteps: (group.processSteps ?? []).map((step, stepIndex) => {
			const isExact = step.targetValueType === 'exact value';
			const minVal = step.minimumAcceptanceValue ?? null;
			const maxVal = isExact ? minVal : (step.maximumAcceptanceValue ?? null);

			return {
				...withId(step.id),
				parameterDescription: step.parameterDescription,
				stepNumber: stepIndex + 1,
				evaluationMethod: step.evaluationMethod,
				targetValueType: step.targetValueType,
				minimumAcceptanceValue: minVal,
				maximumAcceptanceValue: maxVal,
				multipleMeasurements: step.multipleMeasurements ?? false,
				multipleMeasurementMaxCount: step.multipleMeasurementMaxCount ?? null,
				tableConfig: step.targetValueType === 'table' ? ((step.tableConfig ?? null) as TableConfig | null) : null,
				uom: step.uom,
				// Sent as an explicit null (not omitted) so clearing a tag actually clears the column.
				...toCriticalityFields(resolveCriticality(step)),
				allowAttachments: step.allowAttachments ?? false,
				responsiblePerson: step.responsiblePerson ?? false,
				getInstrumentId: step.getInstrumentId ?? false,
				notes: step.notes || ''
			};
		})
	})) as ProcessStepGroupRequest[];

/**
 * API step groups -> request payload, for callers that only want to change the
 * parent (the list screen's deactivate action) and must resend the children
 * untouched.
 *
 * Deliberately does NOT go through the form representation: sequenceTiming is
 * HH:MM there, which cannot represent 0 (it becomes one minute), drops sub-minute
 * precision, and cannot hold durations past 23:59 — and real data has all three.
 */
export const toProcessStepGroupRequestsFromDetail = (groups: readonly ProcessStepGroup[]): ProcessStepGroupRequest[] =>
	(groups ?? [])
		.filter((group): group is ProcessStepGroup => group != null)
		.map(group => ({
			...withId(group.id),
			sequence: group.sequence,
			processName: group.processName,
			processDescription: group.processDescription,
			sequenceTiming: group.sequenceTiming ?? 0,
			shift: group.shift ?? null,
			pfdNumber: group.pfdNumber ?? null,
			processSteps: (group.steps ?? [])
				.filter((step): step is ProcessStep => step != null)
				.map(step => ({
					...withId(step.id),
					parameterDescription: step.parameterDescription,
					stepNumber: step.stepNumber,
					evaluationMethod: step.evaluationMethod,
					targetValueType: step.targetValueType,
					minimumAcceptanceValue: toNumberOrNull(step.minimumAcceptanceValue),
					maximumAcceptanceValue: toNumberOrNull(step.maximumAcceptanceValue),
					multipleMeasurements: step.multipleMeasurements,
					multipleMeasurementMaxCount: step.multipleMeasurementMaxCount,
					tableConfig: stepTableConfig(step),
					uom: step.uom,
					ctq: step.ctq,
					criticalityTag: normalizeCriticalityTag(step.criticalityTag),
					allowAttachments: step.allowAttachments,
					responsiblePerson: step.responsiblePerson || false,
					getInstrumentId: step.getInstrumentId || false,
					notes: step.notes
				})) as ProcessStepRequest[]
		}));
