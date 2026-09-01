import { useRef, useState } from 'react';
import { Box, Typography, Button, Avatar, Chip, IconButton } from '@mui/material';
import { ArrowBack, ArrowForward, CheckCircle, PlayArrow } from '@mui/icons-material';
import { type TimelineStep, type ExecutionData, type FormData } from '../../../types/execution.types';
import { isRawMaterialsStepCompleteForNavigation } from '../../../utils/rawMaterialsNavigation';
// REVERTED: `isCtqFillLocked` no longer imported — CTQ quality-only data entry is off.
import { isTimelineStepComplete } from '../../../utils/stepGating';
import RawMaterialsStep from './steps/RawMaterialsStep';
import BomStep from './steps/BomStep';
import SequenceStep from './steps/SequenceStep';
import InspectionStep from './steps/InspectionStep';
import ExecutionSetupStep from './steps/ExecutionSetupStep';
import SapConfirmationStep from './steps/SapConfirmationStep';

interface StepDetailViewProps {
	step: TimelineStep;
	executionData: ExecutionData;
	aggregatedStepsSnapshot?: Record<string, unknown>;
	onBackToList: () => void;
	onPreviousStep: () => void;
	onNextStep: () => void;
	onStepComplete: (formData: FormData) => void;
	canGoPrevious: boolean;
	canGoNext: boolean;
	/** Browse-only mode: same step UI as execution, inputs disabled, Prev/Next navigate without completing. */
	readOnly?: boolean;
	// REVERTED: CTQ quality-only data entry.
	// /**
	//  * Whether the current user may enter data on CTQ sequence sub-steps. Passed in rather than
	//  * read from RoleContext here so this stays renderable outside a RoleProvider, the same way
	//  * `readOnly` is supplied by the caller. Defaults to locked, so a caller that forgets it
	//  * fails visibly rather than silently dropping the gate.
	//  */
	// canFillCtqSteps?: boolean;
	/** Defect categories offered by the image annotator — see `utils/demouldDefects.ts`. */
	defectCategories?: string[];
	/** False while any non-SAP step is still open; gates Complete PRC on the SAP confirmations step. */
	allOtherStepsComplete?: boolean;
}

const StepDetailView = ({
	step,
	executionData,
	aggregatedStepsSnapshot,
	onBackToList,
	onPreviousStep,
	onNextStep,
	onStepComplete,
	canGoPrevious,
	canGoNext,
	readOnly = false,
	// canFillCtqSteps = false, // REVERTED: CTQ quality-only data entry
	defectCategories = [],
	allOtherStepsComplete = true
}: StepDetailViewProps) => {
	// For sequence step groups, we need to handle sub-steps
	const isSequenceGroup = step.type === 'sequence' && step.stepGroup;
	const subSteps = isSequenceGroup ? step.stepGroup!.steps : [];

	// Initialize to the last completed step or first incomplete step
	const getInitialSubStepIndex = () => {
		if (!isSequenceGroup || !step.stepGroup || !step.prcTemplateStepId || !executionData.prcAggregatedSteps) {
			return 0;
		}

		const stepData = executionData.prcAggregatedSteps[step.prcTemplateStepId.toString()] as Record<string, unknown>;
		if (!stepData) return 0;

		const groupData = stepData[step.stepGroup.id.toString()] as Record<string, unknown>;
		if (!groupData) return 0;

		// Find the last completed step
		let lastCompletedIndex = -1;
		step.stepGroup.steps.forEach((subStep, index) => {
			if (groupData[subStep.id.toString()] !== undefined) {
				lastCompletedIndex = index;
			}
		});

		// Return the next step after the last completed one, or 0 if none completed
		return lastCompletedIndex + 1 < subSteps.length ? lastCompletedIndex + 1 : 0;
	};

	const [currentSubStepIndex, setCurrentSubStepIndex] = useState(getInitialSubStepIndex);
	const currentSubStep = isSequenceGroup ? subSteps[currentSubStepIndex] : null;

	/**
	 * The rendered step registers its validate-and-save here. Next uses it when the step is not
	 * yet filled: rather than sitting greyed out with no explanation, the arrow runs the step's
	 * own validation, which surfaces the red fields and scrolls to the first one.
	 */
	const stepSubmitRef = useRef<(() => void) | null>(null);

	// REVERTED: CTQ sub-steps are no longer locked to quality approvers. Pinned to false so the
	// downstream checks stay in place; swap the two lines below to bring the lock back.
	//
	// A CTQ sub-step is a hard stop for anyone without the quality permission: inputs are
	// disabled and it cannot be completed, so the group waits here until they hand over.
	// Browse-only callers are exempt — everything is already disabled there, and the lock
	// notice would be noise in a template preview.
	// const ctqRoleLocked = !readOnly && isCtqFillLocked(currentSubStep, canFillCtqSteps);
	const ctqRoleLocked = false;

	const handleSubStepComplete = async (formData: FormData) => {
		if (isSequenceGroup && currentSubStep) {
			// For sequence groups, we need to handle individual sub-step completion
			// Add the step metadata to the form data
			await onStepComplete({
				...formData,
				stepId: currentSubStep.id,
				stepGroupId: step.stepGroup!.id,
				prcTemplateStepId: step.prcTemplateStepId
			});

			// After successful completion, check if we should advance to next sub-step
			if (currentSubStepIndex < subSteps.length - 1) {
				// Go to next sub-step
				setCurrentSubStepIndex(prev => prev + 1);
			}
			// Note: For the last sub-step, the main handleStepComplete will handle
			// the transition to preview/next step based on whether all steps are filled
		} else {
			// For non-sequence steps, complete directly
			await onStepComplete(formData);
		}
	};

	// Helper function to check if all steps in the group are filled
	const areAllStepsInGroupFilled = () => {
		if (!isSequenceGroup || !step.stepGroup || !step.prcTemplateStepId) {
			return false;
		}

		const stepData = executionData.prcAggregatedSteps?.[step.prcTemplateStepId.toString()] as Record<string, unknown>;
		if (!stepData) {
			return false;
		}

		const groupData = stepData[step.stepGroup.id.toString()] as Record<string, unknown>;
		if (!groupData) {
			return false;
		}

		// Check if all steps within the group are filled
		return step.stepGroup.steps.every(subStep => groupData[subStep.id.toString()] !== undefined);
	};

	const isCurrentSubStepFilled = (): boolean => {
		if (!isSequenceGroup || !currentSubStep || !step.prcTemplateStepId || !step.stepGroup) {
			return false;
		}
		const stepData = executionData.prcAggregatedSteps?.[step.prcTemplateStepId.toString()] as Record<string, unknown>;
		if (!stepData) return false;
		const groupData = stepData[step.stepGroup.id.toString()] as Record<string, unknown>;
		if (!groupData) return false;
		return groupData[currentSubStep.id.toString()] !== undefined;
	};

	const isNonSequenceStepFilled = (): boolean => {
		if (isSequenceGroup) return false;
		switch (step.type) {
			case 'setup': {
				const meta = executionData.prcAggregatedSteps?.prcmetadata as Record<string, unknown> | undefined;
				return !!meta && typeof meta === 'object' && Object.keys(meta).length > 0;
			}
			case 'rawMaterials':
				return isRawMaterialsStepCompleteForNavigation(executionData);
			case 'bom':
				return executionData.prcAggregatedSteps?.bom !== undefined;
			case 'inspection': {
				return isTimelineStepComplete(step, aggregatedStepsSnapshot ?? executionData.prcAggregatedSteps, executionData);
			}
			case 'sapConfirmations': {
				const sap = executionData.prcAggregatedSteps?.sapConfirmations as Record<string, unknown> | undefined;
				return sap?.stepCompleted === true;
			}
			default:
				return false;
		}
	};

	const handleNextSubStep = async () => {
		if (readOnly) {
			if (isSequenceGroup) {
				if (currentSubStepIndex < subSteps.length - 1) {
					setCurrentSubStepIndex(prev => prev + 1);
				} else {
					onNextStep();
				}
			} else {
				onNextStep();
			}
			return;
		}

		// Not filled in yet: hand off to the step's own validation so the operator sees *what* is
		// missing (and gets scrolled to it) instead of the arrow silently doing nothing.
		if (isSequenceGroup && !isCurrentSubStepFilled()) {
			stepSubmitRef.current?.();
			return;
		}
		if (!isSequenceGroup && !isNonSequenceStepFilled()) {
			stepSubmitRef.current?.();
			return;
		}

		if (isSequenceGroup) {
			if (currentSubStepIndex < subSteps.length - 1) {
				// Go to next sub-step
				setCurrentSubStepIndex(prev => prev + 1);
			} else if (areAllStepsInGroupFilled()) {
				// All steps filled, trigger step completion to show preview
				await onStepComplete({} as FormData);
			} else {
				// Go to next step group
				onNextStep();
			}
		} else {
			onNextStep();
		}
	};

	const handlePreviousSubStep = () => {
		if (readOnly) {
			if (isSequenceGroup && currentSubStepIndex > 0) {
				setCurrentSubStepIndex(prev => prev - 1);
			} else {
				onPreviousStep();
			}
			return;
		}

		if (isSequenceGroup && currentSubStepIndex > 0) {
			setCurrentSubStepIndex(prev => prev - 1);
		} else {
			onPreviousStep();
		}
	};

	const canGoPreviousSubStep = isSequenceGroup ? currentSubStepIndex > 0 : canGoPrevious;

	const canGoNextSubStep = readOnly
		? isSequenceGroup
			? currentSubStepIndex < subSteps.length - 1 || canGoNext
			: canGoNext
		: isSequenceGroup
			? isCurrentSubStepFilled() && (currentSubStepIndex < subSteps.length - 1 || areAllStepsInGroupFilled())
			: isNonSequenceStepFilled() && canGoNext;

	/**
	 * Next stays clickable while a step still needs input, so it can run that step's validation
	 * and point at the missing field. Only step types that actually validate qualify — Raw
	 * Materials has nothing to validate and SAP confirmations has its own completion gate.
	 */
	const stepAwaitingInput = !readOnly && (isSequenceGroup ? !isCurrentSubStepFilled() : !isNonSequenceStepFilled());
	const canValidateOnNext =
		stepAwaitingInput &&
		!ctqRoleLocked &&
		(isSequenceGroup || step.type === 'setup' || step.type === 'bom' || step.type === 'inspection');

	const renderStepContent = () => {
		if (isSequenceGroup && currentSubStep) {
			// Create a timeline step for the current sub-step
			const subStepTimelineStep: TimelineStep = {
				stepNumber: step.stepNumber,
				type: 'sequence',
				title: currentSubStep.parameterDescription,
				description: currentSubStep.notes || step.description,
				status: step.status,
				ctq: currentSubStep.ctq,
				criticalityTag: currentSubStep.criticalityTag ?? null,
				stepData: {
					prcTemplateStepId: step.prcTemplateStepId!,
					stepGroupId: step.stepGroup!.id,
					stepId: currentSubStep.id,
					targetValueType: currentSubStep.targetValueType,
					uom: currentSubStep.uom,
					minValue: currentSubStep.minValue,
					maxValue: currentSubStep.maxValue,
					minimumAcceptanceValue: currentSubStep.minimumAcceptanceValue,
					maximumAcceptanceValue: currentSubStep.maximumAcceptanceValue,
					multipleMeasurements: currentSubStep.multipleMeasurements,
					multipleMeasurementMaxCount: currentSubStep.multipleMeasurementMaxCount,
					tableConfig: currentSubStep.tableConfig,
					notes: currentSubStep.notes,
					parameterDescription: currentSubStep.parameterDescription,
					evaluationMethod: currentSubStep.evaluationMethod,
					allowAttachments: currentSubStep.allowAttachments,
					stepNumber: currentSubStep.stepNumber,
					responsiblePerson: currentSubStep.responsiblePerson,
					getInstrumentId: currentSubStep.getInstrumentId
				}
			};

			return (
				<SequenceStep
					key={`${step.prcTemplateStepId}-${step.stepGroup!.id}-${currentSubStep.id}`}
					step={subStepTimelineStep}
					executionData={executionData}
					onStepComplete={handleSubStepComplete}
					readOnlyOverride={readOnly || ctqRoleLocked}
					// ctqRoleLocked={ctqRoleLocked} // REVERTED: CTQ quality-only data entry
					submitActionRef={stepSubmitRef}
				/>
			);
		}

		// For non-sequence steps, render the appropriate component
		switch (step.type) {
			case 'setup':
				return (
					<ExecutionSetupStep
						step={step}
						executionData={executionData}
						aggregatedStepsSnapshot={aggregatedStepsSnapshot}
						onStepComplete={handleSubStepComplete}
						readOnlyOverride={readOnly}
						plainReadOnlyFields={readOnly}
						submitActionRef={stepSubmitRef}
					/>
				);
			case 'rawMaterials':
				return <RawMaterialsStep step={step} onStepComplete={handleSubStepComplete} readOnlyOverride={readOnly} />;
			case 'bom':
				return (
					<BomStep
						step={step}
						executionData={executionData}
						onStepComplete={handleSubStepComplete}
						readOnlyOverride={readOnly}
						submitActionRef={stepSubmitRef}
					/>
				);
			case 'inspection':
				return (
					<InspectionStep
						step={step}
						executionData={executionData}
						onStepComplete={handleSubStepComplete}
						readOnlyOverride={readOnly}
						defectCategories={defectCategories}
						submitActionRef={stepSubmitRef}
					/>
				);
			case 'sapConfirmations':
				return (
					<SapConfirmationStep
						executionData={executionData}
						onStepComplete={handleSubStepComplete}
						readOnlyOverride={readOnly}
						allOtherStepsComplete={allOtherStepsComplete}
					/>
				);
			default:
				return <div>Unknown step type: {step.type}</div>;
		}
	};

	return (
		<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			{/* Compact Header */}
			<Box sx={{ p: 1.5, borderBottom: '1px solid #e0e0e0', backgroundColor: 'white' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
					<IconButton onClick={onBackToList} size="small">
						<ArrowBack />
					</IconButton>
					<Avatar
						sx={{
							width: 32,
							height: 32,
							backgroundColor: step.status === 'completed' ? '#4caf50' : '#2196f3'
						}}
					>
						{step.status === 'completed' ? <CheckCircle sx={{ fontSize: 18 }} /> : <PlayArrow sx={{ fontSize: 18 }} />}
					</Avatar>
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Typography variant="h6" sx={{ fontWeight: 600, color: '#333', lineHeight: 1.2 }}>
							{step.title}
						</Typography>
						{step.type === 'sequence' && step.description && step.description !== step.title && (
							<Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem', mt: 0.5, lineHeight: 1.4 }}>
								{step.description}
							</Typography>
						)}
					</Box>
					<Box sx={{ display: 'flex', gap: 0.5 }}>
						{step.ctq && (
							<Chip
								label="CTQ"
								size="small"
								sx={{
									backgroundColor: '#fff3e0',
									color: '#f57c00',
									height: 24,
									fontSize: '0.75rem'
								}}
							/>
						)}
						<Chip
							label={step.type}
							size="small"
							sx={{
								backgroundColor: '#f5f5f5',
								color: '#666',
								height: 24,
								fontSize: '0.75rem'
							}}
						/>
					</Box>
					{/* Compact Navigation */}
					<Box sx={{ display: 'flex', gap: 0.5 }}>
						<Button
							variant="outlined"
							size="small"
							startIcon={<ArrowBack />}
							onClick={handlePreviousSubStep}
							disabled={!canGoPreviousSubStep}
							sx={{ minWidth: 'auto', px: 1 }}
						>
							Prev
						</Button>
						<Button
							variant="outlined"
							size="small"
							endIcon={<ArrowForward />}
							onClick={handleNextSubStep}
							disabled={!canGoNextSubStep && !canValidateOnNext}
							sx={{ minWidth: 'auto', px: 1 }}
						>
							Next
						</Button>
					</Box>
				</Box>
			</Box>

			{/* Compact Sub-steps for sequence groups */}
			{isSequenceGroup && (
				<Box sx={{ p: 1, backgroundColor: '#f9f9f9', borderBottom: '1px solid #e0e0e0' }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
						<Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem', minWidth: 'fit-content' }}>
							Step {currentSubStepIndex + 1} of {subSteps.length}
						</Typography>
						<Box sx={{ flex: 1, height: 3, backgroundColor: '#e0e0e0', borderRadius: 1.5 }}>
							<Box
								sx={{
									width: `${((currentSubStepIndex + 1) / subSteps.length) * 100}%`,
									height: '100%',
									backgroundColor: '#2196f3',
									borderRadius: 1.5,
									transition: 'width 0.3s ease'
								}}
							/>
						</Box>
						<Typography
							variant="body2"
							sx={{
								color: '#666',
								fontSize: '0.875rem',
								textAlign: 'right',
								maxWidth: '200px',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap'
							}}
						>
							{currentSubStep?.parameterDescription}
						</Typography>
					</Box>
				</Box>
			)}

			{/* Step Content */}
			<Box sx={{ flex: 1, overflow: 'auto' }}>{renderStepContent()}</Box>
		</Box>
	);
};

export default StepDetailView;
