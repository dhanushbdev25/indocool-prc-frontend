import type { ExecutionData, TimelineStep } from '../types/execution.types';
import { isRawMaterialsStepCompleteForNavigation } from './rawMaterialsNavigation';

const hasOwn = (value: Record<string, unknown>, key: string): boolean =>
	Object.prototype.hasOwnProperty.call(value, key);

function getInspectionBucket(
	step: TimelineStep,
	prcAggregatedSteps: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
	const prcTemplateStepId = step.stepData?.prcTemplateStepId;
	if (step.type !== 'inspection' || !prcTemplateStepId) return undefined;
	return prcAggregatedSteps?.[prcTemplateStepId.toString()] as Record<string, unknown> | undefined;
}

export function hasInspectionParameterData(
	step: TimelineStep,
	prcAggregatedSteps: Record<string, unknown> | undefined
): boolean {
	const bucket = getInspectionBucket(step, prcAggregatedSteps);
	const parameters = step.inspectionParameters ?? [];
	if (!bucket || parameters.length === 0) return false;

	return parameters.every(parameter => hasOwn(bucket, parameter.id.toString()));
}

function hasSequenceGroupData(step: TimelineStep, prcAggregatedSteps: Record<string, unknown> | undefined): boolean {
	if (step.type !== 'sequence' || !step.stepGroup || !step.prcTemplateStepId) return false;
	const templateBucket = prcAggregatedSteps?.[step.prcTemplateStepId.toString()] as Record<string, unknown> | undefined;
	const groupBucket = templateBucket?.[step.stepGroup.id.toString()] as Record<string, unknown> | undefined;
	if (!groupBucket) return false;

	return step.stepGroup.steps.every(subStep => hasOwn(groupBucket, subStep.id.toString()));
}

export function isTimelineStepComplete(
	step: TimelineStep,
	prcAggregatedSteps: Record<string, unknown> | undefined,
	executionData?: ExecutionData
): boolean {
	switch (step.type) {
		case 'setup': {
			const metadata = prcAggregatedSteps?.prcmetadata;
			return !!metadata && typeof metadata === 'object' && Object.keys(metadata as Record<string, unknown>).length > 0;
		}
		case 'rawMaterials':
			return executionData
				? isRawMaterialsStepCompleteForNavigation({
						...executionData,
						prcAggregatedSteps
					})
				: prcAggregatedSteps?.rawMaterials !== undefined;
		case 'bom':
			return prcAggregatedSteps?.bom !== undefined;
		case 'sequence': {
			if (!hasSequenceGroupData(step, prcAggregatedSteps) || !step.stepGroup || !step.prcTemplateStepId) return false;
			const templateBucket = prcAggregatedSteps?.[step.prcTemplateStepId.toString()] as Record<string, unknown>;
			const groupBucket = templateBucket[step.stepGroup.id.toString()] as Record<string, unknown>;
			const ctqApproved = !step.ctq || groupBucket.ctqApproved === true || groupBucket.partialCtqApprove === true;
			return groupBucket.productionApproved === true && groupBucket.stepCompleted === true && ctqApproved;
		}
		case 'inspection': {
			if (!hasInspectionParameterData(step, prcAggregatedSteps)) return false;
			const bucket = getInspectionBucket(step, prcAggregatedSteps);
			if (!bucket) return false;
			const ctqApproved = !step.ctq || bucket.ctqApproved === true || bucket.partialCtqApprove === true;
			return bucket.productionApproved === true && bucket.stepCompleted === true && ctqApproved;
		}
		case 'sapConfirmations': {
			const sap = prcAggregatedSteps?.sapConfirmations as Record<string, unknown> | undefined;
			return sap?.stepCompleted === true;
		}
	}
}

export function getExecutionFrontierIndex(
	steps: TimelineStep[],
	prcAggregatedSteps: Record<string, unknown> | undefined,
	executionData?: ExecutionData
): number {
	if (steps.length === 0) return 0;
	const firstIncompleteIndex = steps.findIndex(
		step => !isTimelineStepComplete(step, prcAggregatedSteps, executionData)
	);
	return firstIncompleteIndex === -1 ? steps.length - 1 : firstIncompleteIndex;
}

/**
 * SAP confirmations stays reachable at every point in an execution so operators can review
 * postings and retry failures while earlier steps are still open. The all-steps-complete
 * requirement lives on its Complete PRC action instead — see `areNonSapStepsComplete`.
 */
export function isAlwaysAccessibleStep(step: TimelineStep | undefined): boolean {
	return step?.type === 'sapConfirmations';
}

/**
 * True when every step other than SAP confirmations is complete. This gates the Complete PRC
 * action, which is why the SAP card itself is exempt from the navigation frontier.
 */
export function areNonSapStepsComplete(
	steps: TimelineStep[],
	prcAggregatedSteps: Record<string, unknown> | undefined,
	executionData?: ExecutionData
): boolean {
	return steps
		.filter(step => !isAlwaysAccessibleStep(step))
		.every(step => isTimelineStepComplete(step, prcAggregatedSteps, executionData));
}

export function canAccessStepIndex(targetIndex: number, frontierIndex: number, step?: TimelineStep): boolean {
	if (targetIndex < 0) return false;
	if (isAlwaysAccessibleStep(step)) return true;
	return targetIndex <= frontierIndex;
}
