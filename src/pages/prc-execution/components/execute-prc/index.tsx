import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
	Box,
	Alert,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Typography
} from '@mui/material';
import { FullScreenFormSavingOverlay } from '../../../../components/common/FullScreenFormSavingOverlay';
import { useCurrentRole } from '../../../../hooks/useCurrentRole';
import {
	useFetchPrcExecutionDetailsQuery,
	useUpdatePrcExecutionProgressMutation
} from '../../../../store/api/business/prc-execution/prc-execution.api';
import { useFetchRawMaterialsMutation } from '../../../../store/api/business/sap-job-runs/sap-job-runs.api';
import {
	getStepTimingStatus,
	getLiveStepTimingStatus,
	readPersistedDelayMetadata,
	findLastTemplateStepIndex
} from '../../utils/timelineCardTiming';
import { buildCatalystMixingTimelineStep, buildTimelineSteps } from '../../utils/buildTimelineSteps';
import { canEditStepForRole } from '../../utils/roleStepAccess';
import { buildSequenceDetailedMeasurements } from '../../utils/sequencePreviewMeasurements';
import {
	canAccessStepIndex,
	getExecutionFrontierIndex,
	hasInspectionParameterData,
	isTimelineStepComplete
} from '../../utils/stepGating';
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
import RawMaterialsStep from './components/steps/RawMaterialsStep';

type ViewState = 'list' | 'detail' | 'preview';

/**
 * When a step that was already submitted (`stepCompleted: true`) is persisted again (admin edit),
 * mark its aggregated bucket so the preview can show an "Edited after submission" note.
 * Clones only along the stamped path; returns the merged data unchanged when not applicable.
 */
const stampEditedAfterSubmit = (
	step: TimelineStep,
	previousAggregated: Record<string, unknown> | undefined,
	mergedAggregated: Record<string, unknown>,
	userId: number | undefined
): Record<string, unknown> => {
	const stamp = (bucket: Record<string, unknown>): Record<string, unknown> => ({
		...bucket,
		editedAfterSubmit: true,
		editedAfterSubmitAt: new Date().toISOString(),
		editedAfterSubmitBy: userId
	});

	if (step.type === 'sequence' && step.stepGroup && step.prcTemplateStepId) {
		const pid = step.prcTemplateStepId.toString();
		const gid = step.stepGroup.id.toString();
		const prevGroup = (previousAggregated?.[pid] as Record<string, unknown> | undefined)?.[gid] as
			| Record<string, unknown>
			| undefined;
		if (prevGroup?.stepCompleted !== true) return mergedAggregated;
		const tplBucket = mergedAggregated[pid] as Record<string, unknown> | undefined;
		const groupBucket = tplBucket?.[gid] as Record<string, unknown> | undefined;
		if (!tplBucket || !groupBucket) return mergedAggregated;
		return { ...mergedAggregated, [pid]: { ...tplBucket, [gid]: stamp(groupBucket) } };
	}
	if (step.type === 'inspection' && step.stepData?.prcTemplateStepId) {
		const tid = step.stepData.prcTemplateStepId.toString();
		const prevBucket = previousAggregated?.[tid] as Record<string, unknown> | undefined;
		if (prevBucket?.stepCompleted !== true) return mergedAggregated;
		const bucket = mergedAggregated[tid] as Record<string, unknown> | undefined;
		if (!bucket) return mergedAggregated;
		return { ...mergedAggregated, [tid]: stamp(bucket) };
	}
	return mergedAggregated;
};

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
	// Timing root the open preview is judged against (freshly merged at creation, refreshed on refetch).
	const previewTimingRootRef = useRef<Record<string, unknown> | null>(null);
	const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([]);
	const [currentAggregatedData, setCurrentAggregatedData] = useState<Record<string, unknown>>({});
	const [catalystMixingOpen, setCatalystMixingOpen] = useState(false);
	const [rawMaterialsOpen, setRawMaterialsOpen] = useState(false);
	const catalystMixingStartTimeRef = useRef<string | null>(null);
	const catalystMixingSubmitRef = useRef<(() => void) | null>(null);
	const initializedExecutionIdRef = useRef<number | null>(null);

	// API hooks
	const {
		data: executionData,
		isLoading: isExecutionDataLoading,
		isFetching: isExecutionDataFetching,
		error: executionDataError
	} = useFetchPrcExecutionDetailsQuery(executionId);

	const [updateProgress, { isLoading: isUpdateProgressLoading }] = useUpdatePrcExecutionProgressMutation();

	const [fetchRawMaterials, { data: rmData, isLoading: rmLoading, error: rmError, reset: rmReset }] =
		useFetchRawMaterialsMutation();

	// Build timeline steps from API data, but not during API calls
	useEffect(() => {
		if (executionData && !isUpdateProgressLoading && !isExecutionDataFetching) {
			// Extract the actual data from the API response wrapper
			const actualData = (executionData as { data: ExecutionData }).data;
			const steps = buildTimelineSteps(actualData, { omitStepTypes: ['bom', 'rawMaterials'] });

			// Use setTimeout to avoid setState in effect warning
			setTimeout(() => {
				setTimelineSteps(steps);
				const agg = actualData.prcAggregatedSteps;
				const currentAggregated =
					agg && typeof agg === 'object'
						? (agg as Record<string, unknown>)
						: Array.isArray(actualData.operationWiseData) && actualData.operationWiseData.length > 0
							? { operationWiseData: [...actualData.operationWiseData] }
							: {};
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

				if (!isViewOnlyMode) {
					const frontierIndex = getExecutionFrontierIndex(steps, currentAggregated, actualData);
					setCurrentStepIndex(previousIndex => {
						if (initializedExecutionIdRef.current !== executionId) {
							initializedExecutionIdRef.current = executionId;
							return frontierIndex;
						}
						return Math.min(previousIndex, frontierIndex);
					});
				}
			}, 0);
		}
	}, [executionData, executionId, isUpdateProgressLoading, isExecutionDataFetching, isViewOnlyMode]);

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

	const actualExecutionData = (executionData as { data: ExecutionData })?.data;
	const executionFrontierIndex = getExecutionFrontierIndex(
		timelineSteps,
		getCurrentAggregatedData(),
		actualExecutionData
	);

	// The step whose completion starts the delay clock of the step at `index` (setup for the
	// first template step; undefined for the first timeline entry).
	const previousTimelineStepOf = useCallback(
		(index: number): TimelineStep | undefined => (index > 0 ? timelineSteps[index - 1] : undefined),
		[timelineSteps]
	);

	// Single lateness clock for preview checkpoints: in-progress steps are judged on wall clock
	// (previous step's completion → now); completed steps keep the persisted duration.
	const resolvePreviewTimingStatus = useCallback(
		(step: TimelineStep, root: Record<string, unknown>, stepCompleted: boolean, previousStep?: TimelineStep) =>
			stepCompleted ? getStepTimingStatus(step, root) : getLiveStepTimingStatus(step, root, previousStep),
		[]
	);

	// Helper function to check if timing data already exists for a step
	const hasExistingTimingData = useCallback(
		(step: TimelineStep, formData?: FormData): boolean => {
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
				// The inspection bucket is shared with approval-action timestamps
				// (productionApproved/ctqApproved/stepCompleted), so existence of the bucket
				// does NOT mean step timing has been written. Check the actual interval keys.
				const bucket = existingTimingData[step.stepData.prcTemplateStepId.toString()] as
					| Record<string, unknown>
					| undefined;
				return typeof bucket?.startTime === 'string' && typeof bucket?.endTime === 'string';
			}

			if (step.type === 'setup') {
				return existingTimingData.prcmetadata !== undefined;
			}

			if (step.type === 'sapConfirmations') {
				return existingTimingData.sapConfirmations !== undefined;
			}

			return false;
		},
		[executionData]
	);

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

	const persistExecutionRuntimeStart = useCallback(
		async (startTimeOverride?: string) => {
			if (isViewOnlyMode || !executionData) return;

			const actualData = (executionData as { data: ExecutionData }).data;
			const existingRuntime = (actualData.stepStartEndTime as Record<string, unknown> | undefined)?.executionRuntime as
				| Record<string, unknown>
				| undefined;
			if (typeof existingRuntime?.startTime === 'string') return;

			const startTime = startTimeOverride ?? new Date().toISOString();
			const mergedTimingData = mergeTimingData((actualData.stepStartEndTime as Record<string, unknown>) ?? {}, {
				executionRuntime: { startTime }
			});

			await updateProgress({
				id: executionId,
				data: { stepStartEndTime: mergedTimingData }
			}).unwrap();
		},
		[executionData, executionId, isViewOnlyMode, updateProgress]
	);

	// Backfill executionRuntime for in-progress executions that completed setup before runtime tracking
	useEffect(() => {
		if (isViewOnlyMode || !executionData || isUpdateProgressLoading || isExecutionDataFetching) return;

		const actualData = (executionData as { data: ExecutionData }).data;
		if (['COMPLETED', 'INACTIVE', 'PREVIEW'].includes(actualData.status)) return;

		const timing = actualData.stepStartEndTime as Record<string, unknown> | undefined;
		const existingRuntime = timing?.executionRuntime as Record<string, unknown> | undefined;
		if (typeof existingRuntime?.startTime === 'string') return;

		const meta = actualData.prcAggregatedSteps?.prcmetadata;
		const setupCompleted = meta && typeof meta === 'object' && Object.keys(meta as Record<string, unknown>).length > 0;
		if (!setupCompleted) return;

		const setupEndTime = (timing?.prcmetadata as Record<string, unknown> | undefined)?.endTime;
		const startTime = typeof setupEndTime === 'string' ? setupEndTime : new Date().toISOString();

		void persistExecutionRuntimeStart(startTime).catch(err =>
			console.error('Failed to backfill execution runtime start:', err)
		);
	}, [executionData, isViewOnlyMode, isUpdateProgressLoading, isExecutionDataFetching, persistExecutionRuntimeStart]);

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
			const previousAggregatedData = getCurrentAggregatedData();
			const mergedAggregatedData = stampEditedAfterSubmit(
				stepToProcess,
				previousAggregatedData,
				mergeAggregatedData(previousAggregatedData, stepAggregatedData),
				userInfo.id
			);
			const actualData = (executionData as { data: ExecutionData }).data;
			let mergedTimingData = mergeTimingData(actualData.stepStartEndTime as Record<string, unknown>, stepTimingData);

			if (stepToProcess.type === 'setup') {
				const existingRuntime =
					((mergedTimingData as Record<string, unknown>).executionRuntime as Record<string, unknown> | undefined) ??
					((actualData.stepStartEndTime as Record<string, unknown> | undefined)?.executionRuntime as
						| Record<string, unknown>
						| undefined);
				if (typeof existingRuntime?.startTime !== 'string') {
					mergedTimingData = mergeTimingData(mergedTimingData, {
						executionRuntime: { startTime: endTime }
					});
				}
			}

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
		if (!executionData || currentView !== 'preview' || !previewData || !currentStep) return;

		const actualData = (executionData as { data: ExecutionData }).data;

		if (
			(previewData.type === 'sequence' && currentStep.stepGroup) ||
			(previewData.type === 'inspection' && currentStep.stepData?.prcTemplateStepId)
		) {
			const refreshedRoot = actualData.stepStartEndTime as Record<string, unknown>;
			previewTimingRootRef.current = refreshedRoot;
			const timingResult = resolvePreviewTimingStatus(
				currentStep,
				refreshedRoot,
				previewData.stepCompleted === true,
				previousTimelineStepOf(currentStepIndex)
			);
			const delayMeta = readPersistedDelayMetadata(currentStep, getCurrentAggregatedData());

			// Only update if timing values have changed
			if (
				previewData.timingExceeded !== timingResult.timingExceeded ||
				previewData.actualDuration !== timingResult.actualDuration ||
				previewData.plannedDuration !== timingResult.plannedDuration ||
				previewData.persistedTimingExceeded !== delayMeta.persistedTimingExceeded ||
				previewData.timingExceededRemarks !== delayMeta.timingExceededRemarks ||
				previewData.timingExceededReasonCode !== delayMeta.timingExceededReasonCode ||
				previewData.timingExceededReasonLabel !== delayMeta.timingExceededReasonLabel ||
				(previewData.editedAfterSubmit === undefined) !== (delayMeta.editedAfterSubmit === undefined) ||
				previewData.editedAfterSubmit?.at !== delayMeta.editedAfterSubmit?.at
			) {
				setPreviewData(prev =>
					prev
						? {
								...prev,
								timingExceeded: timingResult.timingExceeded,
								actualDuration: timingResult.actualDuration,
								plannedDuration: timingResult.plannedDuration,
								persistedTimingExceeded: delayMeta.persistedTimingExceeded,
								timingExceededRemarks: delayMeta.timingExceededRemarks,
								timingExceededReasonCode: delayMeta.timingExceededReasonCode,
								timingExceededReasonLabel: delayMeta.timingExceededReasonLabel,
								editedAfterSubmit: delayMeta.editedAfterSubmit
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
		resolvePreviewTimingStatus,
		previousTimelineStepOf,
		currentStepIndex,
		previewData
	]);

	// Checkpoint 1 keeps ticking: while an uncompleted sequence/inspection preview is open,
	// re-evaluate wall-clock lateness every second so the delay prompt appears the moment
	// planned time is exceeded (not only at render).
	useEffect(() => {
		if (isViewOnlyMode || currentView !== 'preview' || !previewData || previewData.stepCompleted) return;
		if (previewData.type !== 'sequence' && previewData.type !== 'inspection') return;
		if (!currentStep) return;

		const tick = () => {
			const root =
				previewTimingRootRef.current ??
				((executionData as { data: ExecutionData } | undefined)?.data?.stepStartEndTime as
					| Record<string, unknown>
					| undefined) ??
				{};
			const status = getLiveStepTimingStatus(currentStep, root, previousTimelineStepOf(currentStepIndex));
			setPreviewData(prev => {
				if (!prev || prev.stepCompleted) return prev;
				const flipped = prev.timingExceeded !== status.timingExceeded;
				const overrunTicked =
					status.timingExceeded && Math.floor(prev.actualDuration ?? 0) !== Math.floor(status.actualDuration);
				if (!flipped && !overrunTicked) return prev;
				return {
					...prev,
					timingExceeded: status.timingExceeded,
					actualDuration: status.actualDuration,
					plannedDuration: status.plannedDuration
				};
			});
		};

		tick();
		const intervalId = window.setInterval(tick, 1000);
		return () => window.clearInterval(intervalId);
	}, [
		isViewOnlyMode,
		currentView,
		previewData?.stepCompleted,
		previewData?.type,
		currentStep,
		currentStepIndex,
		previousTimelineStepOf,
		executionData,
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

					// Checkpoint 1: wall-clock lateness against the freshly merged root (previous step completion → now)
					previewTimingRootRef.current = mergedTimingData;
					const timingResult = resolvePreviewTimingStatus(
						currentStep,
						mergedTimingData,
						stepCompleted,
						previousTimelineStepOf(currentStepIndex)
					);
					const delayMeta = readPersistedDelayMetadata(currentStep, mergedAggregatedData);

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
						plannedDuration: timingResult.plannedDuration,
						persistedTimingExceeded: delayMeta.persistedTimingExceeded,
						timingExceededRemarks: delayMeta.timingExceededRemarks,
						timingExceededReasonCode: delayMeta.timingExceededReasonCode,
						timingExceededReasonLabel: delayMeta.timingExceededReasonLabel,
						editedAfterSubmit: delayMeta.editedAfterSubmit
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

				// Checkpoint 1: wall-clock lateness against the freshly merged root (previous step completion → now)
				previewTimingRootRef.current = mergedTimingData;
				const inspectionTimingResult = resolvePreviewTimingStatus(
					currentStep,
					mergedTimingData,
					stepCompleted,
					previousTimelineStepOf(currentStepIndex)
				);
				const delayMeta = readPersistedDelayMetadata(currentStep, mergedAggregatedData);

				const newPreviewData: StepPreviewData = {
					stepNumber: currentStep.stepNumber,
					title: currentStep.title,
					type: 'inspection',
					ctq: currentStep.ctq,
					data: stepData,
					productionApproved: productionApproved,
					ctqApproved: ctqApproved,
					stepCompleted: stepCompleted,
					timingExceeded: inspectionTimingResult.timingExceeded,
					actualDuration: inspectionTimingResult.actualDuration,
					plannedDuration: inspectionTimingResult.plannedDuration,
					persistedTimingExceeded: delayMeta.persistedTimingExceeded,
					timingExceededRemarks: delayMeta.timingExceededRemarks,
					timingExceededReasonCode: delayMeta.timingExceededReasonCode,
					timingExceededReasonLabel: delayMeta.timingExceededReasonLabel,
					editedAfterSubmit: delayMeta.editedAfterSubmit,
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

	const handleOpenRawMaterials = async () => {
		const actualData = (executionData as { data: ExecutionData } | undefined)?.data;
		const orderId = actualData?.orderId;
		if (orderId == null || String(orderId).trim() === '') {
			return;
		}
		setRawMaterialsOpen(true);
		try {
			await fetchRawMaterials({ orderId: String(orderId) }).unwrap();
		} catch (error) {
			console.error('Failed to fetch raw materials from SAP:', error);
		}
	};

	const handleCloseRawMaterials = () => {
		setRawMaterialsOpen(false);
		rmReset();
	};

	const handleRetryRawMaterials = () => {
		const actualData = (executionData as { data: ExecutionData } | undefined)?.data;
		const orderId = actualData?.orderId;
		if (orderId == null || String(orderId).trim() === '') return;
		void fetchRawMaterials({ orderId: String(orderId) });
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

	// Checkpoints 2 & 3: wall-clock lateness recomputed at the moment of the click, so a step
	// that became late while the preview was open is still flagged. Completed steps keep the
	// flag the preview already carries.
	const isPreviewStepLateNow = (): boolean => {
		if (!currentStep) return false;
		if (previewData?.stepCompleted) return previewData.timingExceeded === true;
		const root =
			previewTimingRootRef.current ??
			((executionData as { data: ExecutionData } | undefined)?.data?.stepStartEndTime as
				| Record<string, unknown>
				| undefined) ??
			{};
		return getLiveStepTimingStatus(currentStep, root, previousTimelineStepOf(currentStepIndex)).timingExceeded;
	};

	// Hard gate for checkpoint 3 (Complete Step): a late step can never be completed without delay
	// documentation, even when lateness crossed planned time between ticker runs and the click.
	// Approvals are not blocked (StepPreview marks them optimistically) — they stamp the flag via
	// applyTimingExceededMetadata, and the prompt then holds completion until documented.
	// Blocks the action and surfaces the required inputs instead. Returns true when blocked.
	const blockActionIfDelayUndocumented = (payload?: ProceedFromPreviewPayload): boolean => {
		if (previewData?.stepCompleted) return false;
		if (!isPreviewStepLateNow()) return false;
		const remarksOk = Boolean((payload?.timingExceededRemarks ?? previewData?.timingExceededRemarks ?? '').trim());
		const reasonRaw = payload?.timingExceededReasonCode ?? previewData?.timingExceededReasonCode;
		const reasonOk = reasonRaw !== undefined && reasonRaw !== null && String(reasonRaw).trim() !== '';
		if (remarksOk && reasonOk) return false;
		// Reveal the required delay inputs; the operator retries the action once they are filled.
		setPreviewData(prev => (prev ? { ...prev, timingExceeded: true } : prev));
		return true;
	};

	// Helper: apply timing-exceeded remarks + delay reason into a step's aggregated bucket.
	// Used by every approval/complete handler so the comment is persisted on the first action and refreshed on later ones.
	const applyTimingExceededMetadata = (
		bucket: Record<string, unknown>,
		payload?: ProceedFromPreviewPayload
	): Record<string, unknown> => {
		if (!isPreviewStepLateNow() && !payload?.timingExceededRemarks) return bucket;
		const next: Record<string, unknown> = { ...bucket, timingExceeded: true };
		const remarks = payload?.timingExceededRemarks;
		if (remarks) {
			next.timingExceededRemarks = remarks;
		}
		if (payload?.timingExceededReasonCode !== undefined) {
			next.timingExceededReasonCode = payload.timingExceededReasonCode;
		}
		if (payload?.timingExceededReasonLabel) {
			next.timingExceededReasonLabel = payload.timingExceededReasonLabel;
		}
		return next;
	};

	// Handle approval actions
	const handleApproveProduction = async (payload?: ProceedFromPreviewPayload) => {
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

				// Preserve existing step data and add approval (+ timing metadata if exceeded)
				const existingGroupData = stepGroupData[currentStep.stepGroup.id.toString()] as Record<string, unknown>;
				stepGroupData[currentStep.stepGroup.id.toString()] = applyTimingExceededMetadata(
					{
						...existingGroupData,
						productionApproved: true
					},
					payload
				);
			} else if (currentStep.type === 'inspection' && currentStep.stepData?.prcTemplateStepId) {
				// Handle inspection steps
				const prcTemplateStepId = currentStep.stepData.prcTemplateStepId;

				// Ensure the structure exists and preserve existing data
				if (!updatedPrcAggregatedSteps[prcTemplateStepId.toString()]) {
					updatedPrcAggregatedSteps[prcTemplateStepId.toString()] = {};
				}

				// Preserve existing step data and add approval (+ timing metadata if exceeded)
				const existingStepData = updatedPrcAggregatedSteps[prcTemplateStepId.toString()] as Record<string, unknown>;
				updatedPrcAggregatedSteps[prcTemplateStepId.toString()] = applyTimingExceededMetadata(
					{
						...existingStepData,
						productionApproved: true
					},
					payload
				);
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

	const handleApproveCTQ = async (payload?: ProceedFromPreviewPayload) => {
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

				// Preserve existing step data and add approval (+ timing metadata if exceeded)
				const existingGroupData = stepGroupData[currentStep.stepGroup.id.toString()] as Record<string, unknown>;
				stepGroupData[currentStep.stepGroup.id.toString()] = applyTimingExceededMetadata(
					{
						...existingGroupData,
						ctqApproved: true
					},
					payload
				);
			} else if (currentStep.type === 'inspection' && currentStep.stepData?.prcTemplateStepId) {
				// Handle inspection steps
				const prcTemplateStepId = currentStep.stepData.prcTemplateStepId;

				// Ensure the structure exists and preserve existing data
				if (!updatedPrcAggregatedSteps[prcTemplateStepId.toString()]) {
					updatedPrcAggregatedSteps[prcTemplateStepId.toString()] = {};
				}

				// Preserve existing step data and add approval (+ timing metadata if exceeded)
				const existingStepData = updatedPrcAggregatedSteps[prcTemplateStepId.toString()] as Record<string, unknown>;
				updatedPrcAggregatedSteps[prcTemplateStepId.toString()] = applyTimingExceededMetadata(
					{
						...existingStepData,
						ctqApproved: true
					},
					payload
				);
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

	const handlePartialApproveCTQ = async (payload?: ProceedFromPreviewPayload) => {
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

				// Preserve existing step data and add partial approval (+ timing metadata if exceeded)
				const existingGroupData = stepGroupData[currentStep.stepGroup.id.toString()] as Record<string, unknown>;
				stepGroupData[currentStep.stepGroup.id.toString()] = applyTimingExceededMetadata(
					{
						...existingGroupData,
						partialCtqApprove: true
					},
					payload
				);
			} else if (currentStep.type === 'inspection' && currentStep.stepData?.prcTemplateStepId) {
				// Handle inspection steps
				const prcTemplateStepId = currentStep.stepData.prcTemplateStepId;

				// Ensure the structure exists and preserve existing data
				if (!updatedPrcAggregatedSteps[prcTemplateStepId.toString()]) {
					updatedPrcAggregatedSteps[prcTemplateStepId.toString()] = {};
				}

				// Preserve existing step data and add partial approval (+ timing metadata if exceeded)
				const existingStepData = updatedPrcAggregatedSteps[prcTemplateStepId.toString()] as Record<string, unknown>;
				updatedPrcAggregatedSteps[prcTemplateStepId.toString()] = applyTimingExceededMetadata(
					{
						...existingStepData,
						partialCtqApprove: true
					},
					payload
				);
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
		if (blockActionIfDelayUndocumented(payload)) return;

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
				const runtimeStart = typeof existingRuntime?.startTime === 'string' ? existingRuntime.startTime : undefined;
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

				// Preserve existing data and add stepCompleted flag (+ timing metadata if exceeded)
				const existingGroupData = stepGroupData[currentStep.stepGroup.id.toString()] as Record<string, unknown>;
				stepGroupData[currentStep.stepGroup.id.toString()] = applyTimingExceededMetadata(
					{
						...existingGroupData,
						stepCompleted: true
					},
					payload
				);
			} else if (currentStep.type === 'inspection' && currentStep.stepData?.prcTemplateStepId) {
				// Handle inspection steps
				// Create a deep copy to avoid read-only property issues
				mergedAggregatedData = JSON.parse(JSON.stringify(mergedAggregatedData));

				const prcTemplateStepId = currentStep.stepData.prcTemplateStepId;

				// Ensure the structure exists
				if (!mergedAggregatedData[prcTemplateStepId.toString()]) {
					mergedAggregatedData[prcTemplateStepId.toString()] = {};
				}

				// Preserve existing data and add stepCompleted flag (+ timing metadata if exceeded)
				const existingStepData = mergedAggregatedData[prcTemplateStepId.toString()] as Record<string, unknown>;
				mergedAggregatedData[prcTemplateStepId.toString()] = applyTimingExceededMetadata(
					{
						...existingStepData,
						stepCompleted: true
					},
					payload
				);
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
			const updatedTimelineSteps = buildTimelineSteps(updatedExecutionData, {
				omitStepTypes: ['bom', 'rawMaterials']
			});
			setTimelineSteps(updatedTimelineSteps);

			// Move to next step
			const updatedFrontierIndex = getExecutionFrontierIndex(
				updatedTimelineSteps,
				updatedExecutionData.prcAggregatedSteps,
				updatedExecutionData
			);
			const completedCurrentStep = isTimelineStepComplete(
				currentStep,
				updatedExecutionData.prcAggregatedSteps,
				updatedExecutionData
			);
			if (!completedCurrentStep) {
				return;
			}
			if (currentStepIndex < updatedTimelineSteps.length - 1 && updatedFrontierIndex > currentStepIndex) {
				setCurrentStepIndex(prev => prev + 1);
				setCurrentView('list');
				setPreviewData(null);
			} else if (currentStepIndex === updatedTimelineSteps.length - 1) {
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

		if (!isViewOnlyMode && !canAccessStepIndex(stepIndex, executionFrontierIndex)) {
			setCurrentStepIndex(executionFrontierIndex);
			setCurrentView('detail');
			return;
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

				// Checkpoint 1: wall-clock lateness for the step group (previous step completion → now)
				const actualData = (executionData as { data: ExecutionData }).data;
				const navTimingRoot = actualData.stepStartEndTime as Record<string, unknown>;
				previewTimingRootRef.current = navTimingRoot;
				const timingResult = resolvePreviewTimingStatus(
					targetStep,
					navTimingRoot,
					stepCompleted,
					previousTimelineStepOf(stepIndex)
				);
				const delayMeta = readPersistedDelayMetadata(targetStep, getCurrentAggregatedData());

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
					plannedDuration: timingResult.plannedDuration,
					persistedTimingExceeded: delayMeta.persistedTimingExceeded,
					timingExceededRemarks: delayMeta.timingExceededRemarks,
					timingExceededReasonCode: delayMeta.timingExceededReasonCode,
					timingExceededReasonLabel: delayMeta.timingExceededReasonLabel,
					editedAfterSubmit: delayMeta.editedAfterSubmit
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
				if (stepData && hasInspectionParameterData(targetStep, getCurrentAggregatedData())) {
					// Data is filled, show preview
					setCurrentStepIndex(stepIndex);

					// Load approval state from backend
					const productionApproved = stepData.productionApproved === true;
					const ctqApproved = !targetStep.ctq || stepData.ctqApproved === true || stepData.partialCtqApprove === true;
					const stepCompleted = stepData.stepCompleted === true;

					// Checkpoint 1: wall-clock lateness (previous step completion → now)
					const actualData = (executionData as { data: ExecutionData }).data;
					const inspNavTimingRoot = actualData.stepStartEndTime as Record<string, unknown>;
					previewTimingRootRef.current = inspNavTimingRoot;
					const inspectionTimingResult = resolvePreviewTimingStatus(
						targetStep,
						inspNavTimingRoot,
						stepCompleted,
						previousTimelineStepOf(stepIndex)
					);
					const delayMeta = readPersistedDelayMetadata(targetStep, getCurrentAggregatedData());

					const newPreviewData: StepPreviewData = {
						stepNumber: targetStep.stepNumber,
						title: targetStep.title,
						type: 'inspection',
						ctq: targetStep.ctq,
						data: stepData,
						productionApproved: productionApproved,
						ctqApproved: ctqApproved,
						stepCompleted: stepCompleted,
						timingExceeded: inspectionTimingResult.timingExceeded,
						actualDuration: inspectionTimingResult.actualDuration,
						plannedDuration: inspectionTimingResult.plannedDuration,
						persistedTimingExceeded: delayMeta.persistedTimingExceeded,
						timingExceededRemarks: delayMeta.timingExceededRemarks,
						timingExceededReasonCode: delayMeta.timingExceededReasonCode,
						timingExceededReasonLabel: delayMeta.timingExceededReasonLabel,
						editedAfterSubmit: delayMeta.editedAfterSubmit,
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

	const catalystMixingExecutionData = {
		...actualExecutionData,
		prcAggregatedSteps: getCurrentAggregatedData()
	};
	const isCatalystMixingReadOnly = !canKitUpdate;
	const catalystMixingStep = buildCatalystMixingTimelineStep(actualExecutionData, {
		status: isCatalystMixingReadOnly ? undefined : 'pending'
	});
	const hasOrderId = actualExecutionData?.orderId != null && String(actualExecutionData.orderId).trim() !== '';

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
					onRawMaterialsClick={hasOrderId ? handleOpenRawMaterials : undefined}
					rawMaterialsDisabled={isExecutionDataFetching || isUpdateProgressLoading || rmLoading}
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
									frontierIndex={executionFrontierIndex}
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
								const nextStepIndex = currentStepIndex + 1;
								if (
									nextStepIndex < timelineSteps.length &&
									(isViewOnlyMode || canAccessStepIndex(nextStepIndex, executionFrontierIndex))
								) {
									setCurrentStepIndex(prev => prev + 1);
								}
							}}
							onStepComplete={handleStepComplete}
							canGoPrevious={currentStepIndex > 0}
							canGoNext={
								currentStepIndex < timelineSteps.length - 1 &&
								(isViewOnlyMode || canAccessStepIndex(currentStepIndex + 1, executionFrontierIndex))
							}
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
			<Dialog open={rawMaterialsOpen} onClose={handleCloseRawMaterials} fullWidth maxWidth="lg">
				<DialogTitle>Raw Materials</DialogTitle>
				<DialogContent dividers sx={{ p: 0 }}>
					{rmLoading || (!rmData && !rmError) ? (
						<Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
							<CircularProgress />
							<Typography variant="body2" sx={{ color: '#666' }}>
								Fetching raw materials from SAP…
							</Typography>
						</Box>
					) : rmError ? (
						<Box sx={{ p: 3 }}>
							<Alert severity="error" sx={{ mb: 2 }}>
								Failed to fetch raw materials. Please try again.
							</Alert>
							<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
								<Button variant="outlined" onClick={handleRetryRawMaterials}>
									Retry
								</Button>
							</Box>
						</Box>
					) : (
						<RawMaterialsStep sapRawMaterials={rmData?.rawMaterials ?? []} readOnlyOverride />
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseRawMaterials}>Close</Button>
				</DialogActions>
			</Dialog>
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
