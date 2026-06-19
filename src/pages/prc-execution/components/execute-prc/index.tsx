import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { FullScreenFormSavingOverlay } from '../../../../components/common/FullScreenFormSavingOverlay';
import { useCurrentRole } from '../../../../hooks/useCurrentRole';
import {
	useFetchPrcExecutionDetailsQuery,
	useUpdatePrcExecutionProgressMutation
} from '../../../../store/api/business/prc-execution/prc-execution.api';
import { calculateSequenceStepGroupTiming, findLastTemplateStepIndex } from '../../utils/timelineCardTiming';
import { buildCatalystMixingTimelineStep, buildTimelineSteps } from '../../utils/buildTimelineSteps';
import { canEditStepForRole } from '../../utils/roleStepAccess';
import { buildSequenceDetailedMeasurements } from '../../utils/sequencePreviewMeasurements';
import {
	buildAggregatedData,
	buildTimingData,
	mergeAggregatedData,
	mergeTimingData,
	buildApprovalActionTimingData,
	buildUserApprovalData,
	mergeUserApprovalData
} from '../../utils/dataBuilders';

import {
	type TimelineStep,
	type ExecutionData,
	type FormData,
	type StepPreviewData,
	type ProceedFromPreviewPayload
} from '../../types/execution.types';
import ExecutionHeader from './components/ExecutionHeader';
import StepList from './components/StepList';
import StepDetailView from './components/StepDetailView';
import StepPreview from './components/StepPreview';
import ExecutionQuickStats from './components/ExecutionQuickStats';
import BomStep from './components/steps/BomStep';

type ViewState = 'list' | 'detail' | 'preview';

const ExecutePrc = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const executionId = id ? parseInt(id, 10) : 0;
	const isViewOnlyMode = location.pathname.includes('/prc-execution/view/');
	const { userInfo, hasPermission, currentRole } = useCurrentRole();
	const canKitUpdate = hasPermission('KITTING_UPDATE');
	const canKitView = hasPermission('KITTING_VIEW');
	const canAccessCatalystMixing = canKitUpdate || canKitView;

	// State management
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const stepStartTimeRef = useRef<string | null>(null);
	const [currentView, setCurrentView] = useState<ViewState>('list');
	const [previewData, setPreviewData] = useState<StepPreviewData | null>(null);
	const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([]);
	const [currentAggregatedData, setCurrentAggregatedData] = useState<Record<string, unknown>>({});
	const [catalystMixingOpen, setCatalystMixingOpen] = useState(false);
	const catalystMixingStartTimeRef = useRef<string | null>(null);
	const catalystMixingSubmitRef = useRef<(() => void) | null>(null);

	// API hooks
	const {
		data: executionData,
		isLoading: isExecutionDataLoading,
		isFetching: isExecutionDataFetching,
		error: executionDataError
	} = useFetchPrcExecutionDetailsQuery(executionId);

	const [updateProgress, { isLoading: isUpdateProgressLoading }] = useUpdatePrcExecutionProgressMutation();

	// Build timeline steps from API data, but not during API calls
	useEffect(() => {
		if (executionData && !isUpdateProgressLoading && !isExecutionDataFetching) {
			// Extract the actual data from the API response wrapper
			const actualData = (executionData as { data: ExecutionData }).data;
			const steps = buildTimelineSteps(actualData, { omitStepTypes: ['bom'] });

			// Use setTimeout to avoid setState in effect warning
			setTimeout(() => {
				setTimelineSteps(steps);
				const agg = actualData.prcAggregatedSteps;
				if (agg && typeof agg === 'object' && Object.keys(agg).length > 0) {
					setCurrentAggregatedData({ ...(agg as Record<string, unknown>) });
				} else if (
					(agg == null || (typeof agg === 'object' && Object.keys(agg).length === 0)) &&
					Array.isArray(actualData.operationWiseData) &&
					actualData.operationWiseData.length > 0
				) {
					setCurrentAggregatedData({
						operationWiseData: [...actualData.operationWiseData]
					});
				} else {
					setCurrentAggregatedData({});
				}
			}, 0);
		}
	}, [executionData, isUpdateProgressLoading, isExecutionDataFetching]);

	// Current step
	const currentStep = timelineSteps[currentStepIndex];

	// Role-based read-only: Production cannot edit quality-approved inspections;
	// Quality can edit only quality-approved inspections. Other roles unrestricted.
	const roleReadOnly = currentStep ? !canEditStepForRole(currentStep, currentRole?.name) : false;

	// Helper function to get the most current aggregated data
	const getCurrentAggregatedData = useCallback((): Record<string, unknown> => {
		// If we have currentAggregatedData state, use it
		if (Object.keys(currentAggregatedData).length > 0) {
			return currentAggregatedData;
		}
		// Otherwise, fall back to execution data
		const actualData = (executionData as { data: ExecutionData })?.data;
		return actualData?.prcAggregatedSteps || {};
	}, [currentAggregatedData, executionData]);

	// Helper function to check if timing data already exists for a step
	const hasExistingTimingData = useCallback((step: TimelineStep, formData?: FormData): boolean => {
		if (!executionData) return false;

		const actualData = (executionData as { data: ExecutionData }).data;
		const existingTimingData = actualData.stepStartEndTime as Record<string, unknown>;

		if (!existingTimingData) return false;

		if (step.type === 'rawMaterials') {
			return existingTimingData.rawMaterials !== undefined;
		}

		if (step.type === 'bom') {
			return existingTimingData.bom !== undefined;
		}

		if (step.type === 'sequence') {
			// For sequence steps, we need to check using the step information
			let prcTemplateStepId: number;
			let stepGroupId: number;
			let stepId: number;

			if (step.stepData) {
				// Use stepData if available
				prcTemplateStepId = step.stepData.prcTemplateStepId;
				stepGroupId = step.stepData.stepGroupId || 0;
				stepId = step.stepData.stepId || 0;
			} else if (formData) {
				// Fall back to formData if stepData is not available
				prcTemplateStepId = (formData.prcTemplateStepId as number) || step.prcTemplateStepId || 0;
				stepGroupId = (formData.stepGroupId as number) || step.stepGroup?.id || 0;
				stepId = (formData.stepId as number) || 0;
			} else {
				return false;
			}

			const stepTiming = existingTimingData[prcTemplateStepId.toString()] as Record<string, unknown>;
			if (stepTiming) {
				const groupTiming = stepTiming[stepGroupId.toString()] as Record<string, unknown>;
				if (groupTiming) {
					return groupTiming[stepId.toString()] !== undefined;
				}
			}
		}

		if (step.type === 'inspection' && step.stepData) {
			const prcTemplateStepId = step.stepData.prcTemplateStepId;
			return existingTimingData[prcTemplateStepId.toString()] !== undefined;
		}

		if (step.type === 'setup') {
			return existingTimingData.prcmetadata !== undefined;
		}

		if (step.type === 'sapConfirmations') {
			return existingTimingData.sapConfirmations !== undefined;
		}

		return false;
	}, [executionData]);

	// Initialize step start time when step changes
	useEffect(() => {
		if (currentStep && currentStep.status === 'in-progress') {
			stepStartTimeRef.current = new Date().toISOString();
		}
	}, [currentStep]);

	// Simple function to initialize step start time when clicking on step group card
	const initializeStepStartTime = () => {
		stepStartTimeRef.current = new Date().toISOString();
		console.log('🕐 Initialized start time for step group:', stepStartTimeRef.current);
	};

	const persistExecutionRuntimeStart = useCallback(async () => {
		if (isViewOnlyMode || !executionData) return;

		const actualData = (executionData as { data: ExecutionData }).data;
		const existingRuntime = (actualData.stepStartEndTime as Record<string, unknown> | undefined)
			?.executionRuntime as Record<string, unknown> | undefined;
		if (typeof existingRuntime?.startTime === 'string') return;

		const startTime = new Date().toISOString();
		const mergedTimingData = mergeTimingData(
			(actualData.stepStartEndTime as Record<string, unknown>) ?? {},
			{ executionRuntime: { startTime } }
		);

		await updateProgress({
			id: executionId,
			data: { stepStartEndTime: mergedTimingData }
		}).unwrap();
	}, [executionData, executionId, isViewOnlyMode, updateProgress]);

	const persistStepData = useCallback(
		async (
			stepToProcess: TimelineStep,
			stepFormData: FormData,
			options?: { startTime?: string | null; resetMainStepStartTime?: boolean }
		) => {
			if (!executionData) {
				throw new Error('Execution data is not available');
			}

			const endTime = new Date().toISOString();
			const startTime = options?.startTime || stepStartTimeRef.current || endTime;

			const stepAggregatedData = buildAggregatedData(stepToProcess, stepFormData);

			let stepTimingData = {};
			const hasExisting = hasExistingTimingData(stepToProcess, stepFormData);
			console.log('Timing data check:', {
				stepCategory: stepToProcess.type,
				hasExisting,
				stepToProcess: stepToProcess.stepData ? stepToProcess.stepData : 'No stepData',
				formData: {
					stepId: stepFormData.stepId,
					stepGroupId: stepFormData.stepGroupId,
					prcTemplateStepId: stepFormData.prcTemplateStepId
				}
			});

			if (!hasExisting) {
				stepTimingData = buildTimingData(stepToProcess, startTime, endTime);
				console.log('Built timing data:', stepTimingData);
			} else {
				console.log('Timing data already exists, skipping build');
			}

			const userApprovalData = buildUserApprovalData(stepToProcess, 'dataEnteredBy', userInfo.id);
			const mergedAggregatedData = mergeAggregatedData(getCurrentAggregatedData(), stepAggregatedData);
			const actualData = (executionData as { data: ExecutionData }).data;
			const mergedTimingData = mergeTimingData(actualData.stepStartEndTime as Record<string, unknown>, stepTimingData);
			const mergedUserApprovalData = mergeUserApprovalData(
				actualData.prcAggregatedSteps?.stepApprovedBy as Record<string, unknown>,
				userApprovalData
			);

			await updateProgress({
				id: executionId,
				data: {
					prcAggregatedSteps: {
						...mergedAggregatedData,
						stepApprovedBy: mergedUserApprovalData
					},
					stepStartEndTime: mergedTimingData
				}
			}).unwrap();

			if (options?.resetMainStepStartTime !== false) {
				stepStartTimeRef.current = null;
			}

			setCurrentAggregatedData(mergedAggregatedData);

			return { mergedAggregatedData, mergedTimingData };
		},
		[executionData, executionId, getCurrentAggregatedData, hasExistingTimingData, updateProgress, userInfo.id]
	);

	// Update preview data timing when execution data changes (after API refetch)
	useEffect(() => {
		if (
			executionData &&
			currentView === 'preview' &&
			previewData &&
			previewData.type === 'sequence' &&
			currentStep?.stepGroup
		) {
			const actualData = (executionData as { data: ExecutionData }).data;
			const timingResult = calculateSequenceStepGroupTiming(
				currentStep,
				actualData.stepStartEndTime as Record<string, unknown>
			);

			// Get timing exceeded remarks and reason from the step group data
			let timingExceededRemarks = '';
			let timingExceededReasonCode: string | number | undefined;
			let timingExceededReasonLabel: string | undefined;
			if (currentStep.prcTemplateStepId && currentStep.stepGroup) {
				const stepGroupData = getCurrentAggregatedData()?.[currentStep.prcTemplateStepId.toString()] as Record<
					string,
					unknown
				>;
				if (stepGroupData && stepGroupData[currentStep.stepGroup.id.toString()]) {
					const groupData = stepGroupData[currentStep.stepGroup.id.toString()] as Record<string, unknown>;
					timingExceededRemarks = (groupData.timingExceededRemarks as string) || '';
					const rc = groupData.timingExceededReasonCode;
					if (typeof rc === 'string' || typeof rc === 'number') {
						timingExceededReasonCode = rc;
					}
					const rl = groupData.timingExceededReasonLabel;
					if (typeof rl === 'string') {
						timingExceededReasonLabel = rl;
					}
				}
			}

			// Only update if timing values have changed
			if (
				previewData.timingExceeded !== timingResult.timingExceeded ||
				previewData.actualDuration !== timingResult.actualDuration ||
				previewData.expectedDuration !== timingResult.expectedDuration ||
				previewData.timingExceededRemarks !== timingExceededRemarks ||
				previewData.timingExceededReasonCode !== timingExceededReasonCode ||
				previewData.timingExceededReasonLabel !== timingExceededReasonLabel
			) {
				setPreviewData(prev =>
					prev
						? {
								...prev,
								timingExceeded: timingResult.timingExceeded,
								actualDuration: timingResult.actualDuration,
								expectedDuration: timingResult.expectedDuration,
								timingExceededRemarks: timingExceededRemarks,
								timingExceededReasonCode,
								timingExceededReasonLabel
							}
						: null
				);
			}
		}
	}, [
		executionData,
		currentView,
		previewData?.type,
		currentStep?.stepGroup?.id,
		currentStep,
		getCurrentAggregatedData,
		previewData
	]);

	// Handle step completion - save data and determine next action
	const handleStepComplete = async (stepFormData: FormData): Promise<void> => {
		if (isViewOnlyMode || !currentStep || !executionData) return;

		try {
			// For sequence steps, we need to create a proper step object with stepData
			let stepToProcess = currentStep;
			if (currentStep.type === 'sequence' && currentStep.stepGroup && currentStep.prcTemplateStepId) {
				// Extract step information from formData to create proper stepData structure
				const stepId = stepFormData.stepId as number;
				const stepGroupId = stepFormData.stepGroupId as number;
				const prcTemplateStepId = stepFormData.prcTemplateStepId as number;

				// Create a proper step object with stepData for timing data building
				stepToProcess = {
					...currentStep,
					stepData: {
						prcTemplateStepId: prcTemplateStepId || currentStep.prcTemplateStepId || 0,
						stepGroupId: stepGroupId || currentStep.stepGroup?.id,
						stepId: stepId
					}
				};
			}

			const { mergedAggregatedData, mergedTimingData } = await persistStepData(stepToProcess, stepFormData);

			// Don't rebuild timeline steps immediately - let the API response update the cache naturally
			// This prevents form data from being reset in step components

			// For sequence step groups, check if all steps are completed
			if (currentStep.type === 'sequence' && currentStep.stepGroup) {
				// Use the merged data that includes the current sub-step data
				const allStepsFilled = areAllStepsInGroupFilled(currentStep, mergedAggregatedData);

				console.log('Sequence step completion check:', {
					currentStep: currentStep,
					mergedAggregatedData,
					allStepsFilled,
					stepGroupId: currentStep.stepGroup.id,
					prcTemplateStepId: currentStep.prcTemplateStepId
				});

				if (allStepsFilled) {
					const stepGroupData = mergedAggregatedData[currentStep.prcTemplateStepId?.toString() || ''] as Record<
						string,
						unknown
					>;
					const groupData = stepGroupData?.[currentStep.stepGroup?.id.toString() || ''] as Record<string, unknown>;

					const detailedMeasurements =
						groupData && currentStep.stepGroup
							? buildSequenceDetailedMeasurements(groupData, currentStep.stepGroup.steps)
							: [];

					// Load approval state from backend (look inside step group)
					let productionApproved = false;
					let ctqApproved = false;
					let stepCompleted = false;

					if (currentStep.prcTemplateStepId && currentStep.stepGroup) {
						const stepGroupData = mergedAggregatedData[currentStep.prcTemplateStepId.toString()] as Record<
							string,
							unknown
						>;
						if (stepGroupData && stepGroupData[currentStep.stepGroup.id.toString()]) {
							const groupData = stepGroupData[currentStep.stepGroup.id.toString()] as Record<string, unknown>;
							productionApproved = groupData.productionApproved === true;
							ctqApproved = groupData.ctqApproved === true || groupData.partialCtqApprove === true;
							stepCompleted = groupData.stepCompleted === true;
						}
					}

					// Calculate timing for this step group
					const timingResult = calculateSequenceStepGroupTiming(currentStep, mergedTimingData);

					// Get timing exceeded remarks and reason from the step group data
					let timingExceededRemarks = '';
					let timingExceededReasonCode: string | number | undefined;
					let timingExceededReasonLabel: string | undefined;
					if (currentStep.prcTemplateStepId && currentStep.stepGroup) {
						const stepGroupData = mergedAggregatedData[currentStep.prcTemplateStepId.toString()] as Record<
							string,
							unknown
						>;
						if (stepGroupData && stepGroupData[currentStep.stepGroup.id.toString()]) {
							const groupData = stepGroupData[currentStep.stepGroup.id.toString()] as Record<string, unknown>;
							timingExceededRemarks = (groupData.timingExceededRemarks as string) || '';
							const rc = groupData.timingExceededReasonCode;
							if (typeof rc === 'string' || typeof rc === 'number') {
								timingExceededReasonCode = rc;
							}
							const rl = groupData.timingExceededReasonLabel;
							if (typeof rl === 'string') {
								timingExceededReasonLabel = rl;
							}
						}
					}

					const newPreviewData: StepPreviewData = {
						stepNumber: currentStep.stepNumber,
						title: currentStep.title,
						description: currentStep.description,
						type: currentStep.type,
						ctq: currentStep.ctq,
						data: detailedMeasurements,
						productionApproved: productionApproved,
						ctqApproved: ctqApproved,
						stepCompleted: stepCompleted,
						timingExceeded: timingResult.timingExceeded,
						actualDuration: timingResult.actualDuration,
						expectedDuration: timingResult.expectedDuration,
						timingExceededRemarks: timingExceededRemarks,
						timingExceededReasonCode,
						timingExceededReasonLabel
					};

					console.log('Creating preview data for completed sequence group:', {
						currentStep: currentStep,
						productionApproved,
						ctqApproved,
						newPreviewData
					});

					setPreviewData(newPreviewData);
					setCurrentView('preview');
				} else {
					// More steps to complete, stay in detail view
					// The StepDetailView will handle advancing to the next sub-step
					setCurrentView('detail');
				}
			} else if (currentStep.type === 'inspection') {
				// For inspection steps, create preview data and show preview
				// Use the merged aggregated data that includes the current step's data
				const prcTemplateStepId = currentStep.stepData?.prcTemplateStepId;
				let stepData = {};

				console.log('🔍 INSPECTION_PREVIEW_DEBUG:', {
					prcTemplateStepId,
					mergedAggregatedData,
					rawDataKeys: Object.keys(mergedAggregatedData),
					currentStepStepData: currentStep.stepData
				});

				if (mergedAggregatedData && prcTemplateStepId) {
					// Get the inspection data from the merged aggregated data
					const templateData = mergedAggregatedData[prcTemplateStepId.toString()] as Record<string, unknown>;
					if (templateData) {
						stepData = templateData;
						console.log('✅ FOUND_INSPECTION_DATA_UNDER_TEMPLATE_ID:', prcTemplateStepId, stepData);
					} else {
						console.log('❌ NO_DATA_FOUND_UNDER_TEMPLATE_ID:', prcTemplateStepId);
					}
				}

				// Load approval state from backend (look inside inspection step data)
				let productionApproved = false;
				let ctqApproved = false;
				let stepCompleted = false;

				if (mergedAggregatedData && prcTemplateStepId) {
					const templateData = mergedAggregatedData[prcTemplateStepId.toString()] as Record<string, unknown>;
					if (templateData) {
						productionApproved = templateData.productionApproved === true;
						ctqApproved =
							!currentStep.ctq || templateData.ctqApproved === true || templateData.partialCtqApprove === true;
						stepCompleted = templateData.stepCompleted === true;
					}
				}

				const newPreviewData: StepPreviewData = {
					stepNumber: currentStep.stepNumber,
					title: currentStep.title,
					type: 'inspection',
					ctq: currentStep.ctq,
					data: stepData,
					productionApproved: productionApproved,
					ctqApproved: ctqApproved,
					stepCompleted: stepCompleted,
					inspectionParameters: currentStep.inspectionParameters,
					inspectionMetadata: currentStep.inspectionMetadata
				};

				console.log('📋 CREATING_PREVIEW_DATA_FOR_INSPECTION:', {
					currentStep: currentStep,
					prcTemplateStepId: prcTemplateStepId,
					mergedAggregatedData,
					stepData,
					productionApproved,
					ctqApproved,
					stepCompleted,
					newPreviewData
				});

				setPreviewData(newPreviewData);
				setCurrentView('preview');
			} else {
				// For raw materials, go directly to the next step without additional save
				// because the data has already been persisted above.

				// Move to next step
				if (currentStepIndex < timelineSteps.length - 1) {
					setCurrentStepIndex(prev => prev + 1);
					setCurrentView('list');
				} else {
					// All steps completed
					navigate('/prc-execution');
				}
			}
		} catch (error) {
			console.error('Failed to save step data:', error);
		}
	};

	const handleOpenCatalystMixing = () => {
		if (!executionData) return;

		const actualData = (executionData as { data: ExecutionData }).data;
		const existingBomTiming = (actualData.stepStartEndTime as Record<string, unknown> | undefined)?.bom;

		if (canKitUpdate && existingBomTiming === undefined) {
			catalystMixingStartTimeRef.current = new Date().toISOString();
		}

		setCatalystMixingOpen(true);
	};

	const handleCloseCatalystMixing = () => {
		if (executionData) {
			const actualData = (executionData as { data: ExecutionData }).data;
			const existingBomTiming = (actualData.stepStartEndTime as Record<string, unknown> | undefined)?.bom;

			if (canKitUpdate && existingBomTiming === undefined) {
				catalystMixingStartTimeRef.current = null;
			}
		}

		setCatalystMixingOpen(false);
	};

	const handleCatalystMixingSave = async (stepFormData: FormData): Promise<void> => {
		if (!executionData || !canKitUpdate) return;

		const actualData = (executionData as { data: ExecutionData }).data;
		const catalystStep = buildCatalystMixingTimelineStep(actualData, { status: 'pending' });

		if (!catalystStep) return;

		try {
			await persistStepData(catalystStep, stepFormData, {
				startTime: catalystMixingStartTimeRef.current,
				resetMainStepStartTime: false
			});
			catalystMixingStartTimeRef.current = null;
		} catch (error) {
			console.error('Failed to save catalyst mixing:', error);
		}
	};

	// Helper function to check if all steps in a sequence group are filled (but not necessarily approved)
	const areAllStepsInGroupFilled = (step: TimelineStep, aggregatedData?: Record<string, unknown>): boolean => {
		if (!step.stepGroup || !step.prcTemplateStepId) {
			return false;
		}

		// Use provided aggregated data or fall back to the most current aggregated data
		const dataToCheck = aggregatedData || getCurrentAggregatedData();
		if (!dataToCheck) {
			return false;
		}

		const stepData = dataToCheck[step.prcTemplateStepId.toString()] as Record<string, unknown>;
		if (!stepData) {
			return false;
		}

		const groupData = stepData[step.stepGroup.id.toString()] as Record<string, unknown>;
		if (!groupData) {
			return false;
		}

		// Check if all steps within the group are filled
		const allStepsFilled = step.stepGroup.steps.every(subStep => {
			const hasData = groupData[subStep.id.toString()] !== undefined;
			console.log(`Checking step ${subStep.id}: hasData=${hasData}`, groupData[subStep.id.toString()]);
			return hasData;
		});

		console.log('areAllStepsInGroupFilled result:', {
			stepGroupId: step.stepGroup.id,
			prcTemplateStepId: step.prcTemplateStepId,
			groupData,
			allStepsFilled
		});

		return allStepsFilled;
	};

	// Handle approval actions
	const handleApproveProduction = async () => {
		if (isViewOnlyMode || !currentStep || !executionData || !previewData) return;

		try {
			// Record the timestamp when approve production button was clicked
			const approvalTimestamp = new Date().toISOString();

			// Build approval action timing data
			const approvalTimingData = buildApprovalActionTimingData(currentStep, 'productionApproved', approvalTimestamp);

			// Build user approval data for production approval
			const userApprovalData = buildUserApprovalData(currentStep, 'productionApprovedBy', userInfo.id);

			// Get current timing data from execution data
			const actualData = (executionData as { data: ExecutionData }).data;
			const mergedApprovalTimingData = mergeTimingData(
				actualData.stepStartEndTime as Record<string, unknown>,
				approvalTimingData
			);
			// Merge user approval data
			const mergedUserApprovalData = mergeUserApprovalData(
				actualData.prcAggregatedSteps?.stepApprovedBy as Record<string, unknown>,
				userApprovalData
			);

			// Update the step with production approval
			const updatedStep = { ...currentStep, productionApproved: true };
			// Update the timeline steps array
			const updatedSteps = [...timelineSteps];
			updatedSteps[currentStepIndex] = updatedStep;

			// Use the helper function to get the most current aggregated data
			const currentPrcAggregatedSteps = getCurrentAggregatedData();

			// Deep copy to avoid mutating the original data
			const updatedPrcAggregatedSteps = JSON.parse(JSON.stringify(currentPrcAggregatedSteps));

			console.log('Before PRODUCTION approval update:', {
				currentStep: currentStep,
				currentPrcAggregatedSteps,
				updatedPrcAggregatedSteps,
				stepGroupId: currentStep.stepGroup?.id,
				prcTemplateStepId: currentStep.prcTemplateStepId,
				approvalTimestamp,
				approvalTimingData
			});

			if (currentStep.type === 'sequence' && currentStep.prcTemplateStepId && currentStep.stepGroup) {
				// Handle sequence step groups
				// Ensure the structure exists and preserve existing data
				if (!updatedPrcAggregatedSteps[currentStep.prcTemplateStepId.toString()]) {
					updatedPrcAggregatedSteps[currentStep.prcTemplateStepId.toString()] = {};
				}

				const stepGroupData = updatedPrcAggregatedSteps[currentStep.prcTemplateStepId.toString()] as Record<
					string,
					unknown
				>;
				if (!stepGroupData[currentStep.stepGroup.id.toString()]) {
					stepGroupData[currentStep.stepGroup.id.toString()] = {};
				}

				// Preserve existing step data and add approval
				const existingGroupData = stepGroupData[currentStep.stepGroup.id.toString()] as Record<string, unknown>;
				stepGroupData[currentStep.stepGroup.id.toString()] = {
					...existingGroupData,
					productionApproved: true
				};
			} else if (currentStep.type === 'inspection' && currentStep.stepData?.prcTemplateStepId) {
				// Handle inspection steps
				const prcTemplateStepId = currentStep.stepData.prcTemplateStepId;

				// Ensure the structure exists and preserve existing data
				if (!updatedPrcAggregatedSteps[prcTemplateStepId.toString()]) {
					updatedPrcAggregatedSteps[prcTemplateStepId.toString()] = {};
				}

				// Preserve existing step data and add approval
				const existingStepData = updatedPrcAggregatedSteps[prcTemplateStepId.toString()] as Record<string, unknown>;
				updatedPrcAggregatedSteps[prcTemplateStepId.toString()] = {
					...existingStepData,
					productionApproved: true
				};
			}

			console.log('After PRODUCTION approval update:', updatedPrcAggregatedSteps);

			await updateProgress({
				id: executionId,
				data: {
					prcAggregatedSteps: {
						...updatedPrcAggregatedSteps,
						stepApprovedBy: mergedUserApprovalData
					},
					stepStartEndTime: mergedApprovalTimingData
				}
			}).unwrap();

			// Update local state
			setTimelineSteps(updatedSteps);
			setCurrentAggregatedData(updatedPrcAggregatedSteps);

			console.log('PRODUCTION approval - Updated currentAggregatedData:', updatedPrcAggregatedSteps);

			// Update preview data to reflect the approval
			setPreviewData(prev => (prev ? { ...prev, productionApproved: true } : null));
		} catch (error) {
			console.error('Failed to update production approval:', error);
		}
	};

	const handleApproveCTQ = async () => {
		if (isViewOnlyMode || !currentStep || !executionData || !previewData) return;

		try {
			// Record the timestamp when approve CTQ button was clicked
			const approvalTimestamp = new Date().toISOString();

			// Build approval action timing data
			const approvalTimingData = buildApprovalActionTimingData(currentStep, 'ctqApproved', approvalTimestamp);

			// Build user approval data for CTQ approval
			const userApprovalData = buildUserApprovalData(currentStep, 'ctqApprovedBy', userInfo.id);

			// Get current timing data from execution data
			const actualData = (executionData as { data: ExecutionData }).data;
			const mergedApprovalTimingData = mergeTimingData(
				actualData.stepStartEndTime as Record<string, unknown>,
				approvalTimingData
			);
			// Merge user approval data
			const mergedUserApprovalData = mergeUserApprovalData(
				actualData.prcAggregatedSteps?.stepApprovedBy as Record<string, unknown>,
				userApprovalData
			);

			// Update the step with CTQ approval
			const updatedStep = { ...currentStep, ctqApproved: true };
			// Update the timeline steps array
			const updatedSteps = [...timelineSteps];
			updatedSteps[currentStepIndex] = updatedStep;

			// Use the helper function to get the most current aggregated data
			const currentPrcAggregatedSteps = getCurrentAggregatedData();

			// Deep copy to avoid mutating the original data
			const updatedPrcAggregatedSteps = JSON.parse(JSON.stringify(currentPrcAggregatedSteps));

			console.log('Before CTQ approval update:', {
				currentStep: currentStep,
				currentPrcAggregatedSteps,
				updatedPrcAggregatedSteps,
				stepGroupId: currentStep.stepGroup?.id,
				prcTemplateStepId: currentStep.prcTemplateStepId,
				approvalTimestamp,
				approvalTimingData
			});

			if (currentStep.type === 'sequence' && currentStep.prcTemplateStepId && currentStep.stepGroup) {
				// Handle sequence step groups
				// Ensure the structure exists and preserve existing data
				if (!updatedPrcAggregatedSteps[currentStep.prcTemplateStepId.toString()]) {
					updatedPrcAggregatedSteps[currentStep.prcTemplateStepId.toString()] = {};
				}

				const stepGroupData = updatedPrcAggregatedSteps[currentStep.prcTemplateStepId.toString()] as Record<
					string,
					unknown
				>;
				if (!stepGroupData[currentStep.stepGroup.id.toString()]) {
					stepGroupData[currentStep.stepGroup.id.toString()] = {};
				}

				// Preserve existing step data and add approval
				const existingGroupData = stepGroupData[currentStep.stepGroup.id.toString()] as Record<string, unknown>;
				stepGroupData[currentStep.stepGroup.id.toString()] = {
					...existingGroupData,
					ctqApproved: true
				};
			} else if (currentStep.type === 'inspection' && currentStep.stepData?.prcTemplateStepId) {
				// Handle inspection steps
				const prcTemplateStepId = currentStep.stepData.prcTemplateStepId;

				// Ensure the structure exists and preserve existing data
				if (!updatedPrcAggregatedSteps[prcTemplateStepId.toString()]) {
					updatedPrcAggregatedSteps[prcTemplateStepId.toString()] = {};
				}

				// Preserve existing step data and add approval
				const existingStepData = updatedPrcAggregatedSteps[prcTemplateStepId.toString()] as Record<string, unknown>;
				updatedPrcAggregatedSteps[prcTemplateStepId.toString()] = {
					...existingStepData,
					ctqApproved: true
				};
			}

			console.log('After CTQ approval update:', updatedPrcAggregatedSteps);

			await updateProgress({
				id: executionId,
				data: {
					prcAggregatedSteps: {
						...updatedPrcAggregatedSteps,
						stepApprovedBy: mergedUserApprovalData
					},
					stepStartEndTime: mergedApprovalTimingData
				}
			}).unwrap();

			// Update local state
			setTimelineSteps(updatedSteps);
			setCurrentAggregatedData(updatedPrcAggregatedSteps);

			console.log('CTQ approval - Updated currentAggregatedData:', updatedPrcAggregatedSteps);

			// Update preview data to reflect the approval
			setPreviewData(prev => (prev ? { ...prev, ctqApproved: true } : null));
		} catch (error) {
			console.error('Failed to update CTQ approval:', error);
		}
	};

	const handlePartialApproveCTQ = async () => {
		if (isViewOnlyMode || !currentStep || !executionData || !previewData) return;

		try {
			// Record the timestamp when partial approve CTQ button was clicked
			const approvalTimestamp = new Date().toISOString();

			// Build approval action timing data
			const approvalTimingData = buildApprovalActionTimingData(currentStep, 'ctqApproved', approvalTimestamp);

			// Build user approval data for partial CTQ approval
			const userApprovalData = buildUserApprovalData(currentStep, 'ctqApprovedBy', userInfo.id);

			// Get current timing data from execution data
			const actualData = (executionData as { data: ExecutionData }).data;
			const mergedApprovalTimingData = mergeTimingData(
				actualData.stepStartEndTime as Record<string, unknown>,
				approvalTimingData
			);
			// Merge user approval data
			const mergedUserApprovalData = mergeUserApprovalData(
				actualData.prcAggregatedSteps?.stepApprovedBy as Record<string, unknown>,
				userApprovalData
			);

			// Update the step with partial CTQ approval
			const updatedStep = { ...currentStep, partialCtqApprove: true };
			// Update the timeline steps array
			const updatedSteps = [...timelineSteps];
			updatedSteps[currentStepIndex] = updatedStep;

			// Use the helper function to get the most current aggregated data
			const currentPrcAggregatedSteps = getCurrentAggregatedData();

			// Deep copy to avoid mutating the original data
			const updatedPrcAggregatedSteps = JSON.parse(JSON.stringify(currentPrcAggregatedSteps));

			console.log('Before partial CTQ approval update:', {
				currentStep: currentStep,
				currentPrcAggregatedSteps,
				updatedPrcAggregatedSteps,
				stepGroupId: currentStep.stepGroup?.id,
				prcTemplateStepId: currentStep.prcTemplateStepId,
				approvalTimestamp,
				approvalTimingData
			});

			if (currentStep.type === 'sequence' && currentStep.prcTemplateStepId && currentStep.stepGroup) {
				// Handle sequence step groups
				// Ensure the structure exists and preserve existing data
				if (!updatedPrcAggregatedSteps[currentStep.prcTemplateStepId.toString()]) {
					updatedPrcAggregatedSteps[currentStep.prcTemplateStepId.toString()] = {};
				}

				const stepGroupData = updatedPrcAggregatedSteps[currentStep.prcTemplateStepId.toString()] as Record<
					string,
					unknown
				>;
				if (!stepGroupData[currentStep.stepGroup.id.toString()]) {
					stepGroupData[currentStep.stepGroup.id.toString()] = {};
				}

				// Preserve existing step data and add partial approval
				const existingGroupData = stepGroupData[currentStep.stepGroup.id.toString()] as Record<string, unknown>;
				stepGroupData[currentStep.stepGroup.id.toString()] = {
					...existingGroupData,
					partialCtqApprove: true
				};
			} else if (currentStep.type === 'inspection' && currentStep.stepData?.prcTemplateStepId) {
				// Handle inspection steps
				const prcTemplateStepId = currentStep.stepData.prcTemplateStepId;

				// Ensure the structure exists and preserve existing data
				if (!updatedPrcAggregatedSteps[prcTemplateStepId.toString()]) {
					updatedPrcAggregatedSteps[prcTemplateStepId.toString()] = {};
				}

				// Preserve existing step data and add partial approval
				const existingStepData = updatedPrcAggregatedSteps[prcTemplateStepId.toString()] as Record<string, unknown>;
				updatedPrcAggregatedSteps[prcTemplateStepId.toString()] = {
					...existingStepData,
					partialCtqApprove: true
				};
			}

			console.log('After partial CTQ approval update:', updatedPrcAggregatedSteps);

			await updateProgress({
				id: executionId,
				data: {
					prcAggregatedSteps: {
						...updatedPrcAggregatedSteps,
						stepApprovedBy: mergedUserApprovalData
					},
					stepStartEndTime: mergedApprovalTimingData
				}
			}).unwrap();

			// Update local state
			setTimelineSteps(updatedSteps);
			setCurrentAggregatedData(updatedPrcAggregatedSteps);

			console.log('Partial CTQ approval - Updated currentAggregatedData:', updatedPrcAggregatedSteps);

			// Update preview data to reflect the partial approval
			setPreviewData(prev => (prev ? { ...prev, partialCtqApprove: true } : null));
		} catch (error) {
			console.error('Failed to update partial CTQ approval:', error);
		}
	};

	// Handle proceeding to next step after approvals
	const handleProceedToNext = async (payload?: ProceedFromPreviewPayload) => {
		if (isViewOnlyMode || !currentStep || !executionData) return;

		try {
			const endTime = new Date().toISOString();
			const startTime = stepStartTimeRef.current || endTime;

			// Record the timestamp when complete step button was clicked
			const stepCompletionTimestamp = new Date().toISOString();

			// Build approval action timing data for step completion
			const stepCompletionTimingData = buildApprovalActionTimingData(
				currentStep,
				'stepCompleted',
				stepCompletionTimestamp
			);

			// Build user approval data for step completion
			const userApprovalData = buildUserApprovalData(currentStep, 'stepCompletedBy', userInfo.id);

			// Build aggregated data for this step
			const stepAggregatedData = previewData ? buildAggregatedData(currentStep, previewData.data as FormData) : {};

			// Only build timing data if it doesn't already exist for this step
			let stepTimingData = {};
			if (!hasExistingTimingData(currentStep, previewData?.data as FormData)) {
				stepTimingData = buildTimingData(currentStep, startTime, endTime);
			}

			// Merge with existing data using the most current aggregated data
			let mergedAggregatedData = mergeAggregatedData(getCurrentAggregatedData(), stepAggregatedData);
			// Get current timing data from execution data
			const actualData = (executionData as { data: ExecutionData }).data;
			let mergedTimingData = mergeTimingData(actualData.stepStartEndTime as Record<string, unknown>, stepTimingData);

			// Merge step completion timing data
			mergedTimingData = mergeTimingData(mergedTimingData, stepCompletionTimingData);

			const lastTemplateStepIndex = findLastTemplateStepIndex(timelineSteps);
			if (
				lastTemplateStepIndex >= 0 &&
				lastTemplateStepIndex === currentStepIndex &&
				(currentStep.type === 'sequence' || currentStep.type === 'inspection')
			) {
				const existingRuntime = ((mergedTimingData as Record<string, unknown>).executionRuntime ??
					(actualData.stepStartEndTime as Record<string, unknown> | undefined)?.executionRuntime) as
					| Record<string, unknown>
					| undefined;
				const runtimeStart =
					typeof existingRuntime?.startTime === 'string' ? existingRuntime.startTime : undefined;
				if (runtimeStart && typeof existingRuntime?.endTime !== 'string') {
					mergedTimingData = mergeTimingData(mergedTimingData, {
						executionRuntime: { startTime: runtimeStart, endTime }
					});
				}
			}

			// Merge user approval data
			const mergedUserApprovalData = mergeUserApprovalData(
				actualData.prcAggregatedSteps?.stepApprovedBy as Record<string, unknown>,
				userApprovalData
			);

			// For sequence step groups and inspection steps, mark the step as completed
			if (currentStep.type === 'sequence' && currentStep.stepGroup && currentStep.prcTemplateStepId) {
				// Create a deep copy to avoid read-only property issues
				mergedAggregatedData = JSON.parse(JSON.stringify(mergedAggregatedData));

				// Ensure the structure exists
				if (!mergedAggregatedData[currentStep.prcTemplateStepId.toString()]) {
					mergedAggregatedData[currentStep.prcTemplateStepId.toString()] = {};
				}

				const stepGroupData = mergedAggregatedData[currentStep.prcTemplateStepId.toString()] as Record<string, unknown>;
				if (!stepGroupData[currentStep.stepGroup.id.toString()]) {
					stepGroupData[currentStep.stepGroup.id.toString()] = {};
				}

				// Preserve existing data and add stepCompleted flag and timing metadata
				const existingGroupData = stepGroupData[currentStep.stepGroup.id.toString()] as Record<string, unknown>;
				const timingMetadata: Record<string, unknown> = {
					...existingGroupData,
					stepCompleted: true
				};

				// Add timing exceeded metadata if applicable
				if (previewData?.timingExceeded) {
					timingMetadata.timingExceeded = true;
					const timingExceededRemarks = payload?.timingExceededRemarks;
					if (timingExceededRemarks) {
						timingMetadata.timingExceededRemarks = timingExceededRemarks;
					}
					if (payload?.timingExceededReasonCode !== undefined) {
						timingMetadata.timingExceededReasonCode = payload.timingExceededReasonCode;
					}
					if (payload?.timingExceededReasonLabel) {
						timingMetadata.timingExceededReasonLabel = payload.timingExceededReasonLabel;
					}
				}

				stepGroupData[currentStep.stepGroup.id.toString()] = timingMetadata;
			} else if (currentStep.type === 'inspection' && currentStep.stepData?.prcTemplateStepId) {
				// Handle inspection steps
				// Create a deep copy to avoid read-only property issues
				mergedAggregatedData = JSON.parse(JSON.stringify(mergedAggregatedData));

				const prcTemplateStepId = currentStep.stepData.prcTemplateStepId;

				// Ensure the structure exists
				if (!mergedAggregatedData[prcTemplateStepId.toString()]) {
					mergedAggregatedData[prcTemplateStepId.toString()] = {};
				}

				// Preserve existing data and add stepCompleted flag
				const existingStepData = mergedAggregatedData[prcTemplateStepId.toString()] as Record<string, unknown>;
				mergedAggregatedData[prcTemplateStepId.toString()] = {
					...existingStepData,
					stepCompleted: true
				};
			}

			console.log('handleProceedToNext - Data being sent:', {
				prcAggregatedSteps: {
					...mergedAggregatedData,
					stepApprovedBy: mergedUserApprovalData
				},
				stepStartEndTime: mergedTimingData,
				stepCompletionTimestamp,
				stepCompletionTimingData
			});

			// Update backend with completed step data
			await updateProgress({
				id: executionId,
				data: {
					prcAggregatedSteps: {
						...mergedAggregatedData,
						stepApprovedBy: mergedUserApprovalData
					},
					stepStartEndTime: mergedTimingData
				}
			}).unwrap();

			// Reset step start time after completion
			stepStartTimeRef.current = null;

			// Update local state - rebuild timeline steps with updated data
			const updatedExecutionData = {
				...actualData,
				prcAggregatedSteps: {
					...mergedAggregatedData,
					stepApprovedBy: mergedUserApprovalData
				},
				stepStartEndTime: mergedTimingData
			};

			// Update current aggregated data state
			setCurrentAggregatedData(mergedAggregatedData);

			// Rebuild timeline steps with updated execution data
			const updatedTimelineSteps = buildTimelineSteps(updatedExecutionData);
			setTimelineSteps(updatedTimelineSteps);

			// Move to next step
			if (currentStepIndex < updatedTimelineSteps.length - 1) {
				setCurrentStepIndex(prev => prev + 1);
				setCurrentView('list');
				setPreviewData(null);
			} else {
				// All steps completed
				navigate('/prc-execution');
			}
		} catch (error) {
			console.error('Failed to update progress:', error);
		}
	};

	// Handle step navigation
	const handleStepNavigation = (stepIndex: number) => {
		const targetStep = timelineSteps[stepIndex];
		if (!targetStep) return;

		// Check if user is trying to skip ahead without completing current step
		if (!isViewOnlyMode && stepIndex > currentStepIndex) {
			// Check if current step is properly completed
			const currentStepCompleted = isStepProperlyCompleted(timelineSteps[currentStepIndex]);
			if (!currentStepCompleted) {
				console.log('Cannot proceed to next step - current step not properly completed');
				// Stay on current step and show detail view
				setCurrentView('detail');
				return;
			}
		}

		// For sequence step groups, check if all steps are filled
		if (targetStep.type === 'sequence' && targetStep.stepGroup) {
			// Initialize start time when clicking on sequence step group
			if (!isViewOnlyMode) {
				initializeStepStartTime();
				void persistExecutionRuntimeStart().catch(err =>
					console.error('Failed to persist execution runtime start:', err)
				);
			}

			const allStepsFilled = areAllStepsInGroupFilled(targetStep);

			if (allStepsFilled) {
				// All steps completed, show preview
				setCurrentStepIndex(stepIndex);

				// Extract actual measurement data from the group with context
				const stepGroupData = getCurrentAggregatedData()?.[targetStep.prcTemplateStepId?.toString() || ''] as Record<
					string,
					unknown
				>;
				const groupData = stepGroupData?.[targetStep.stepGroup?.id.toString() || ''] as Record<string, unknown>;

				const detailedMeasurements =
					groupData && targetStep.stepGroup
						? buildSequenceDetailedMeasurements(groupData, targetStep.stepGroup.steps)
						: [];

				// Load approval state from backend (look inside step group)
				let productionApproved = false;
				let ctqApproved = false;
				let stepCompleted = false;

				if (targetStep.prcTemplateStepId && targetStep.stepGroup) {
					const stepGroupData = getCurrentAggregatedData()?.[targetStep.prcTemplateStepId.toString()] as Record<
						string,
						unknown
					>;
					if (stepGroupData && stepGroupData[targetStep.stepGroup.id.toString()]) {
						const groupData = stepGroupData[targetStep.stepGroup.id.toString()] as Record<string, unknown>;
						productionApproved = groupData.productionApproved === true;
						ctqApproved = groupData.ctqApproved === true || groupData.partialCtqApprove === true;
						stepCompleted = groupData.stepCompleted === true;
					}
				}

				// Calculate timing for the step group
				const actualData = (executionData as { data: ExecutionData }).data;
				const timingResult = calculateSequenceStepGroupTiming(
					targetStep,
					actualData.stepStartEndTime as Record<string, unknown>
				);

				// Get timing exceeded remarks and reason from the step group data
				let timingExceededRemarks = '';
				let timingExceededReasonCode: string | number | undefined;
				let timingExceededReasonLabel: string | undefined;
				if (targetStep.prcTemplateStepId && targetStep.stepGroup) {
					const stepGroupData = getCurrentAggregatedData()?.[targetStep.prcTemplateStepId.toString()] as Record<
						string,
						unknown
					>;
					if (stepGroupData && stepGroupData[targetStep.stepGroup.id.toString()]) {
						const groupData = stepGroupData[targetStep.stepGroup.id.toString()] as Record<string, unknown>;
						timingExceededRemarks = (groupData.timingExceededRemarks as string) || '';
						const rc = groupData.timingExceededReasonCode;
						if (typeof rc === 'string' || typeof rc === 'number') {
							timingExceededReasonCode = rc;
						}
						const rl = groupData.timingExceededReasonLabel;
						if (typeof rl === 'string') {
							timingExceededReasonLabel = rl;
						}
					}
				}

				const newPreviewData: StepPreviewData = {
					stepNumber: targetStep.stepNumber,
					title: targetStep.title,
					description: targetStep.description,
					type: targetStep.type,
					ctq: targetStep.ctq,
					data: detailedMeasurements,
					productionApproved: productionApproved,
					ctqApproved: ctqApproved,
					stepCompleted: stepCompleted,
					timingExceeded: timingResult.timingExceeded,
					actualDuration: timingResult.actualDuration,
					expectedDuration: timingResult.expectedDuration,
					timingExceededRemarks: timingExceededRemarks,
					timingExceededReasonCode,
					timingExceededReasonLabel
				};

				setPreviewData(newPreviewData);
				setCurrentView('preview');
				return;
			} else {
				// Not all steps completed, go to detail view
				if (isViewOnlyMode) {
					setCurrentStepIndex(stepIndex);
					setCurrentView('detail');
					return;
				}
				const lastCompletedStepIndex = findLastCompletedStepInGroup(targetStep);
				if (lastCompletedStepIndex !== -1) {
					setCurrentStepIndex(stepIndex);
					setCurrentView('detail');
					return;
				}
			}
		}

		// For inspection steps, check if data is filled and show preview if ready
		if (targetStep.type === 'inspection') {
			if (!isViewOnlyMode) {
				initializeStepStartTime();
				void persistExecutionRuntimeStart().catch(err =>
					console.error('Failed to persist execution runtime start:', err)
				);
			}

			const prcTemplateStepId = targetStep.stepData?.prcTemplateStepId;
			if (prcTemplateStepId) {
				const stepData = getCurrentAggregatedData()?.[prcTemplateStepId.toString()] as Record<string, unknown>;
				if (stepData && Object.keys(stepData).length > 0) {
					// Data is filled, show preview
					setCurrentStepIndex(stepIndex);

					// Load approval state from backend
					let productionApproved = false;
					let ctqApproved = false;
					let stepCompleted = false;

					productionApproved = stepData.productionApproved === true;
					ctqApproved = !targetStep.ctq || stepData.ctqApproved === true || stepData.partialCtqApprove === true;
					stepCompleted = stepData.stepCompleted === true;

					const newPreviewData: StepPreviewData = {
						stepNumber: targetStep.stepNumber,
						title: targetStep.title,
						type: 'inspection',
						ctq: targetStep.ctq,
						data: stepData,
						productionApproved: productionApproved,
						ctqApproved: ctqApproved,
						stepCompleted: stepCompleted,
						inspectionParameters: targetStep.inspectionParameters,
						inspectionMetadata: targetStep.inspectionMetadata
					};

					setPreviewData(newPreviewData);
					setCurrentView('preview');
					return;
				}
			}
		}

		// For other step types, allow navigation to completed steps or current step
		if (
			isViewOnlyMode ||
			targetStep.status === 'completed' ||
			targetStep.status === 'in-progress' ||
			stepIndex === currentStepIndex
		) {
			setCurrentStepIndex(stepIndex);
			setCurrentView('detail');
		}
	};

	// Helper function to check if a step is properly completed (both productionApproved and stepCompleted)
	const isStepProperlyCompleted = (step: TimelineStep): boolean => {
		if (!step) return false;

		if (step.type === 'sequence' && step.stepGroup && step.prcTemplateStepId) {
			const stepData = getCurrentAggregatedData()?.[step.prcTemplateStepId.toString()] as Record<string, unknown>;
			if (!stepData) return false;

			const groupData = stepData[step.stepGroup.id.toString()] as Record<string, unknown>;
			if (!groupData) return false;

			const productionApproved = groupData.productionApproved === true;
			const ctqApproved = !step.ctq || groupData.ctqApproved === true || groupData.partialCtqApprove === true;
			const stepCompleted = groupData.stepCompleted === true;

			return productionApproved && stepCompleted && ctqApproved;
		} else if (step.type === 'inspection' && step.stepData?.prcTemplateStepId) {
			const stepData = getCurrentAggregatedData()?.[step.stepData.prcTemplateStepId.toString()] as Record<
				string,
				unknown
			>;
			if (!stepData || Object.keys(stepData).length === 0) return false;

			const productionApproved = stepData.productionApproved === true;
			const ctqApproved = !step.ctq || stepData.ctqApproved === true || stepData.partialCtqApprove === true;
			const stepCompleted = stepData.stepCompleted === true;

			return productionApproved && stepCompleted && ctqApproved;
		}

		if (step.type === 'setup') {
			const meta = getCurrentAggregatedData()?.prcmetadata as Record<string, unknown> | undefined;
			return !!meta && typeof meta === 'object' && Object.keys(meta).length > 0;
		}

		if (step.type === 'sapConfirmations') {
			const sap = getCurrentAggregatedData()?.sapConfirmations as Record<string, unknown> | undefined;
			return sap?.stepCompleted === true;
		}

		// For other step types (rawMaterials, bom), just check if they have data
		return step.status === 'completed';
	};

	// Helper function to find the last completed step in a sequence group
	const findLastCompletedStepInGroup = (step: TimelineStep): number => {
		if (!step.stepGroup || !step.prcTemplateStepId) {
			return -1;
		}

		const currentData = getCurrentAggregatedData();
		if (!currentData) {
			return -1;
		}

		const stepData = currentData[step.prcTemplateStepId.toString()] as Record<string, unknown>;
		if (!stepData) return -1;

		const groupData = stepData[step.stepGroup.id.toString()] as Record<string, unknown>;
		if (!groupData) return -1;

		// Find the last completed step in the group
		let lastCompletedIndex = -1;
		step.stepGroup.steps.forEach((subStep, index) => {
			if (groupData[subStep.id.toString()] !== undefined) {
				lastCompletedIndex = index;
			}
		});

		return lastCompletedIndex;
	};

	// Handle navigation between views
	const handleBackToList = () => {
		setCurrentView('list');
	};

	const handleBackToStep = () => {
		setCurrentView('detail');
	};

	const handleBackToStepGroup = () => {
		if (currentStep && currentStep.type === 'sequence' && currentStep.stepGroup) {
			setCurrentView('detail');
			setPreviewData(null);
		}
	};

	// Loading state
	if (isExecutionDataLoading) {
		return <FullScreenFormSavingOverlay open message="Loading…" />;
	}

	// Error state
	if (executionDataError) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="error">Failed to load PRC execution details. Please try again.</Alert>
			</Box>
		);
	}

	// No data state
	if (!executionData) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="warning">No execution data found for this PRC.</Alert>
			</Box>
		);
	}

	// Extract actual data from API response
	const actualExecutionData = (executionData as { data: ExecutionData }).data;
	const catalystMixingExecutionData = {
		...actualExecutionData,
		prcAggregatedSteps: getCurrentAggregatedData()
	};
	const isCatalystMixingReadOnly = !canKitUpdate;
	const catalystMixingStep = buildCatalystMixingTimelineStep(actualExecutionData, {
		status: isCatalystMixingReadOnly ? undefined : 'pending'
	});

	// No timeline steps state
	if (timelineSteps.length === 0) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="warning">No execution steps found for this PRC.</Alert>
			</Box>
		);
	}

	return (
		<>
			<FullScreenFormSavingOverlay
				open={isExecutionDataFetching || isUpdateProgressLoading}
				message={isUpdateProgressLoading ? 'Saving…' : 'Refreshing…'}
			/>
			<Box
				sx={{
					height: 'calc(100vh - 64px - 38px)', // Subtract header height + padding + border
					display: 'flex',
					flexDirection: 'column',
					overflow: 'hidden',
					margin: -3, // Counter the MainLayout padding
					p: 3, // Add our own padding
					boxSizing: 'border-box' // Ensure padding is included in height calculation
				}}
			>
				{/* Header */}
				<ExecutionHeader
					executionData={actualExecutionData}
					viewOnlyMode={isViewOnlyMode}
					hideExecutionActions={isViewOnlyMode}
					onCatalystMixingClick={canAccessCatalystMixing ? handleOpenCatalystMixing : undefined}
					catalystMixingDisabled={isExecutionDataFetching || isUpdateProgressLoading}
				/>

				{/* Main Content */}
				<Box sx={{ flex: 1, overflow: 'hidden' }}>
					{currentView === 'list' && (
						<Box sx={{ display: 'flex', height: '100%' }}>
							{/* Step List */}
							<Box sx={{ flex: 1, borderRight: '1px solid #e0e0e0' }}>
								<StepList
									steps={timelineSteps}
									currentStepIndex={currentStepIndex}
									onStepClick={handleStepNavigation}
									previewMode={isViewOnlyMode}
									stepStartEndTime={actualExecutionData.stepStartEndTime ?? {}}
									executionId={actualExecutionData.id}
								/>
							</Box>
							{/* Quick Stats */}
							<Box sx={{ width: '300px', overflowY: 'auto' }}>
								<ExecutionQuickStats executionData={actualExecutionData} currentStep={currentStep} />
							</Box>
						</Box>
					)}

					{currentView === 'detail' && currentStep && (
						<StepDetailView
							step={currentStep}
							executionData={actualExecutionData}
							aggregatedStepsSnapshot={getCurrentAggregatedData()}
							readOnly={isViewOnlyMode || roleReadOnly}
							onBackToList={handleBackToList}
							onPreviousStep={() => {
								if (currentStepIndex > 0) {
									setCurrentStepIndex(prev => prev - 1);
								}
							}}
							onNextStep={() => {
								if (currentStepIndex < timelineSteps.length - 1) {
									setCurrentStepIndex(prev => prev + 1);
								}
							}}
							onStepComplete={handleStepComplete}
							canGoPrevious={currentStepIndex > 0}
							canGoNext={currentStepIndex < timelineSteps.length - 1}
						/>
					)}

					{currentView === 'preview' && previewData && (
						<Box sx={{ height: '100%', overflowY: 'auto' }}>
							<StepPreview
								key={`preview-${currentStepIndex}-${previewData.stepNumber}-${previewData.type}`}
								previewData={previewData}
								readOnlyMode={isViewOnlyMode}
								onBackToStep={handleBackToStep}
								onApproveProduction={handleApproveProduction}
								onApproveCTQ={handleApproveCTQ}
								onPartialApproveCTQ={handlePartialApproveCTQ}
								onProceedToNext={handleProceedToNext}
								onBackToStepGroup={currentStep?.type === 'sequence' ? handleBackToStepGroup : undefined}
							/>
						</Box>
					)}
				</Box>
			</Box>
			<Dialog open={catalystMixingOpen} onClose={handleCloseCatalystMixing} fullWidth maxWidth="lg">
				<DialogTitle>Catalyst Mixing</DialogTitle>
				<DialogContent dividers sx={{ p: 0 }}>
					{catalystMixingStep ? (
						<BomStep
							step={catalystMixingStep}
							executionData={catalystMixingExecutionData}
							onStepComplete={handleCatalystMixingSave}
							readOnlyOverride={isCatalystMixingReadOnly}
							submitLabel="Save Catalyst Mixing"
							hideSubmitButton
							submitActionRef={catalystMixingSubmitRef}
						/>
					) : (
						<Box sx={{ p: 3 }}>
							<Alert severity="info">No catalyst mixing items are available for this execution.</Alert>
						</Box>
					)}
				</DialogContent>
				<DialogActions>
					{catalystMixingStep && !isCatalystMixingReadOnly && canKitUpdate && (
						<Button
							variant="contained"
							onClick={() => catalystMixingSubmitRef.current?.()}
							disabled={isUpdateProgressLoading || isExecutionDataFetching}
						>
							Save Catalyst Mixing
						</Button>
					)}
					<Button onClick={handleCloseCatalystMixing}>Close</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default ExecutePrc;
