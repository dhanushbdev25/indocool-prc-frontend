import type { StepPreviewData, TimelineStep } from '../types/execution.types';
import { buildSequenceDetailedMeasurements } from './sequencePreviewMeasurements';
import { getStepTimingStatus, readPersistedDelayMetadata } from './timelineCardTiming';

/** Builds the same `StepPreviewData` shape as live execution preview for sequence groups. */
export function buildSequenceStepPreviewForReport(
	step: TimelineStep,
	agg: Record<string, unknown>,
	stepTimingRoot: Record<string, unknown>
): StepPreviewData | null {
	const pid = step.prcTemplateStepId;
	const gid = step.stepGroup?.id;
	if (!pid || gid === undefined || !step.stepGroup) {
		return null;
	}

	const tplBucket = agg[String(pid)] as Record<string, unknown> | undefined;
	const groupData = tplBucket?.[String(gid)] as Record<string, unknown> | undefined;

	const measurements =
		groupData && step.stepGroup ? buildSequenceDetailedMeasurements(groupData, step.stepGroup.steps) : [];

	const timing = getStepTimingStatus(step, stepTimingRoot);
	const delayMeta = readPersistedDelayMetadata(step, agg);

	const productionApproved = groupData?.productionApproved === true;
	const ctqApproved =
		!step.ctq || groupData?.ctqApproved === true || groupData?.partialCtqApprove === true;
	const stepCompleted = groupData?.stepCompleted === true;

	return {
		stepNumber: step.stepNumber,
		title: step.title,
		description: step.description,
		type: 'sequence',
		ctq: step.ctq,
		data: measurements,
		productionApproved,
		ctqApproved,
		stepCompleted,
		timingExceeded: timing.timingExceeded,
		actualDuration: timing.actualDuration,
		plannedDuration: timing.plannedDuration,
		persistedTimingExceeded: delayMeta.persistedTimingExceeded,
		timingExceededRemarks: delayMeta.timingExceededRemarks,
		timingExceededReasonCode: delayMeta.timingExceededReasonCode,
		timingExceededReasonLabel: delayMeta.timingExceededReasonLabel,
		editedAfterSubmit: delayMeta.editedAfterSubmit
	};
}

export function buildInspectionStepPreviewForReport(
	step: TimelineStep,
	agg: Record<string, unknown>,
	stepTimingRoot?: Record<string, unknown>
): StepPreviewData | null {
	const tid = step.stepData?.prcTemplateStepId;
	if (tid === undefined || tid === null) {
		return null;
	}
	const slice = agg[String(tid)];
	const stepData =
		slice && typeof slice === 'object' ? (slice as Record<string, unknown>) : {};

	const productionApproved = stepData.productionApproved === true;
	const ctqApproved =
		!step.ctq ||
		stepData.ctqApproved === true ||
		stepData.partialCtqApprove === true;
	const stepCompleted = stepData.stepCompleted === true;

	const timing = getStepTimingStatus(step, stepTimingRoot);
	const delayMeta = readPersistedDelayMetadata(step, agg);

	return {
		stepNumber: step.stepNumber,
		title: step.title,
		type: 'inspection',
		ctq: step.ctq,
		data: stepData,
		productionApproved,
		ctqApproved,
		partialCtqApprove: stepData.partialCtqApprove === true,
		stepCompleted,
		timingExceeded: timing.timingExceeded,
		actualDuration: timing.actualDuration,
		plannedDuration: timing.plannedDuration,
		persistedTimingExceeded: delayMeta.persistedTimingExceeded,
		timingExceededRemarks: delayMeta.timingExceededRemarks,
		timingExceededReasonCode: delayMeta.timingExceededReasonCode,
		timingExceededReasonLabel: delayMeta.timingExceededReasonLabel,
		editedAfterSubmit: delayMeta.editedAfterSubmit,
		inspectionParameters: step.inspectionParameters,
		inspectionMetadata: step.inspectionMetadata
	};
}
