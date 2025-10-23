import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Alert, CircularProgress, Backdrop } from '@mui/material';
import {
	useFetchPrcExecutionDetailsQuery,
	useUpdatePrcExecutionProgressMutation
} from '../../../../store/api/business/prc-execution/prc-execution.api';
import { buildTimelineSteps } from '../../utils/buildTimelineSteps';
import { buildAggregatedData, buildTimingData, mergeAggregatedData, mergeTimingData } from '../../utils/dataBuilders';

// Utility function to filter out metadata fields from step data
const filterMeasurementSteps = (groupData: Record<string, unknown>): Array<[string, unknown]> => {
	const metadataFields = ['stepCompleted', 'productionApproved', 'ctqApproved'];
	return Object.entries(groupData).filter(([stepId]) => !metadataFields.includes(stepId));
};
import { type TimelineStep, type ExecutionData, type FormData, type StepPreviewData } from '../../types/execution.types';
import ExecutionHeader from './components/ExecutionHeader';
import StepList from './components/StepList';
import StepDetailView from './components/StepDetailView';
import StepPreview from './components/StepPreview';
import ExecutionQuickStats from './components/ExecutionQuickStats';

type ViewState = 'list' | 'detail' | 'preview';

const ExecutePrc = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const executionId = id ? parseInt(id, 10) : 0;

	// State management
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const stepStartTimeRef = useRef<string | null>(null);
	const [currentView, setCurrentView] = useState<ViewState>('list');
	const [previewData, setPreviewData] = useState<StepPreviewData | null>(null);
	const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([]);
	const [currentAggregatedData, setCurrentAggregatedData] = useState<Record<string, unknown>>({});

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
			const steps = buildTimelineSteps(actualData);
			setTimelineSteps(steps);
			// Initialize current aggregated data
			setCurrentAggregatedData(actualData.prcAggregatedSteps || {});
		}
	}, [executionData, isUpdateProgressLoading, isExecutionDataFetching]);

	// Current step
	const currentStep = timelineSteps[currentStepIndex];

	// Helper function to get the most current aggregated data
	const getCurrentAggregatedData = (): Record<string, unknown> => {
		// If we have currentAggregatedData state, use it
		if (Object.keys(currentAggregatedData).length > 0) {
			return currentAggregatedData;
		}
		// Otherwise, fall back to execution data
		const actualData = (executionData as { data: ExecutionData })?.data;
		return actualData?.prcAggregatedSteps || {};
	};

	// Initialize step start time when step changes
	useEffect(() => {
		if (currentStep && currentStep.status === 'in-progress') {
			stepStartTimeRef.current = new Date().toISOString();
		}
	}, [currentStep]);

	// Handle step completion - save data and determine next action
	const handleStepComplete = async (stepFormData: FormData): Promise<void> => {
		if (!currentStep || !executionData) return;
		
		try {
			const endTime = new Date().toISOString();
			const startTime = stepStartTimeRef.current || endTime;

			// For sequence steps, we need to create a proper step object with stepData
			let stepToProcess = currentStep;
			if (currentStep.type === 'sequence' && currentStep.stepGroup && currentStep.prcTemplateStepId) {
				// We need to get the current sub-step data from the StepDetailView
				// For now, we'll use the step group data and let the data builder handle it
				// The actual sub-step data will be passed through the formData
				stepToProcess = currentStep;
			}

			// Build aggregated data for this step
			const stepAggregatedData = buildAggregatedData(stepToProcess, stepFormData);
			const stepTimingData = buildTimingData(stepToProcess, startTime, endTime);

		// Merge with existing data using the most current aggregated data
		const mergedAggregatedData = mergeAggregatedData(
			getCurrentAggregatedData(),
			stepAggregatedData
		);
		// Get current timing data from execution data
		const actualData = (executionData as { data: ExecutionData }).data;
		const mergedTimingData = mergeTimingData(actualData.stepStartEndTime as Record<string, unknown>, stepTimingData);

			// Save step data to backend
			await updateProgress({
				id: executionId,
				data: {
					prcAggregatedSteps: mergedAggregatedData,
					stepStartEndTime: mergedTimingData
				}
			}).unwrap();

			// Update current aggregated data state
			setCurrentAggregatedData(mergedAggregatedData);

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
					// All steps completed, show preview screen for sequence steps
					// Extract actual measurement data from the group with context
					const stepGroupData = mergedAggregatedData[currentStep.prcTemplateStepId?.toString() || ''] as Record<string, unknown>;
					const groupData = stepGroupData?.[currentStep.stepGroup?.id.toString() || ''] as Record<string, unknown>;
					
					// Create detailed measurement data with context
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const detailedMeasurements: any[] = [];
					if (groupData) {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						filterMeasurementSteps(groupData).forEach(([stepId, stepData]: [string, any]) => {
								// Find the step definition to get context
								const stepDefinition = currentStep.stepGroup?.steps.find(s => s.id.toString() === stepId);
								detailedMeasurements.push({
									stepId: stepId,
									value: stepData.value || stepData.data,
									parameterDescription: stepDefinition?.parameterDescription || `Step ${stepId}`,
									stepType: stepDefinition?.stepType || 'Unknown',
									evaluationMethod: stepDefinition?.evaluationMethod || 'Unknown',
									uom: stepDefinition?.uom || '',
									notes: stepDefinition?.notes || '',
									ctq: stepDefinition?.ctq || false,
									stepNumber: stepDefinition?.stepNumber || 0
								});
							});
					}
					
					// Load approval state from backend (look inside step group)
					let productionApproved = false;
					let ctqApproved = false;
					let stepCompleted = false;
					
					if (currentStep.prcTemplateStepId && currentStep.stepGroup) {
						const stepGroupData = mergedAggregatedData[currentStep.prcTemplateStepId.toString()] as Record<string, unknown>;
						if (stepGroupData && stepGroupData[currentStep.stepGroup.id.toString()]) {
							const groupData = stepGroupData[currentStep.stepGroup.id.toString()] as Record<string, unknown>;
							productionApproved = groupData.productionApproved === true;
							ctqApproved = groupData.ctqApproved === true;
							stepCompleted = groupData.stepCompleted === true;
						}
					}
					
					const newPreviewData: StepPreviewData = {
						stepNumber: currentStep.stepNumber,
						title: currentStep.title,
						type: currentStep.type,
						ctq: currentStep.ctq,
						data: detailedMeasurements,
						productionApproved: productionApproved,
						ctqApproved: ctqApproved,
						stepCompleted: stepCompleted
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
						ctqApproved = !currentStep.ctq || templateData.ctqApproved === true;
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
				// For raw materials and BOM, go directly to next step
				handleProceedToNext();
			}
		} catch (error) {
			console.error('Failed to save step data:', error);
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
		if (!currentStep || !executionData || !previewData) return;
		
		try {
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
				prcTemplateStepId: currentStep.prcTemplateStepId
			});
			
			if (currentStep.type === 'sequence' && currentStep.prcTemplateStepId && currentStep.stepGroup) {
				// Handle sequence step groups
				// Ensure the structure exists and preserve existing data
				if (!updatedPrcAggregatedSteps[currentStep.prcTemplateStepId.toString()]) {
					updatedPrcAggregatedSteps[currentStep.prcTemplateStepId.toString()] = {};
				}
				
				const stepGroupData = updatedPrcAggregatedSteps[currentStep.prcTemplateStepId.toString()] as Record<string, unknown>;
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
					prcAggregatedSteps: updatedPrcAggregatedSteps
				}
			}).unwrap();

			// Update local state
			setTimelineSteps(updatedSteps);
			setCurrentAggregatedData(updatedPrcAggregatedSteps);
			
			console.log('PRODUCTION approval - Updated currentAggregatedData:', updatedPrcAggregatedSteps);
			
			// Update preview data to reflect the approval
			setPreviewData(prev => prev ? { ...prev, productionApproved: true } : null);
		} catch (error) {
			console.error('Failed to update production approval:', error);
		}
	};

	const handleApproveCTQ = async () => {
		if (!currentStep || !executionData || !previewData) return;
		
		try {
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
				prcTemplateStepId: currentStep.prcTemplateStepId
			});
			
			if (currentStep.type === 'sequence' && currentStep.prcTemplateStepId && currentStep.stepGroup) {
				// Handle sequence step groups
				// Ensure the structure exists and preserve existing data
				if (!updatedPrcAggregatedSteps[currentStep.prcTemplateStepId.toString()]) {
					updatedPrcAggregatedSteps[currentStep.prcTemplateStepId.toString()] = {};
				}
				
				const stepGroupData = updatedPrcAggregatedSteps[currentStep.prcTemplateStepId.toString()] as Record<string, unknown>;
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
					prcAggregatedSteps: updatedPrcAggregatedSteps
				}
			}).unwrap();

			// Update local state
			setTimelineSteps(updatedSteps);
			setCurrentAggregatedData(updatedPrcAggregatedSteps);
			
			console.log('CTQ approval - Updated currentAggregatedData:', updatedPrcAggregatedSteps);
			
			// Update preview data to reflect the approval
			setPreviewData(prev => prev ? { ...prev, ctqApproved: true } : null);
		} catch (error) {
			console.error('Failed to update CTQ approval:', error);
		}
	};

	// Handle proceeding to next step after approvals
	const handleProceedToNext = async () => {
		if (!currentStep || !executionData) return;
		
		try {
			const endTime = new Date().toISOString();
			const startTime = stepStartTimeRef.current || endTime;

			// Build aggregated data for this step
			const stepAggregatedData = previewData ? buildAggregatedData(currentStep, previewData.data as FormData) : {};
			const stepTimingData = buildTimingData(currentStep, startTime, endTime);

			// Merge with existing data using the most current aggregated data
			let mergedAggregatedData = mergeAggregatedData(
				getCurrentAggregatedData(),
				stepAggregatedData
			);
			// Get current timing data from execution data
			const actualData = (executionData as { data: ExecutionData }).data;
			const mergedTimingData = mergeTimingData(actualData.stepStartEndTime as Record<string, unknown>, stepTimingData);

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
				
				// Preserve existing data and add stepCompleted flag
				const existingGroupData = stepGroupData[currentStep.stepGroup.id.toString()] as Record<string, unknown>;
				stepGroupData[currentStep.stepGroup.id.toString()] = {
					...existingGroupData,
					stepCompleted: true
				};
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
				prcAggregatedSteps: mergedAggregatedData,
				stepStartEndTime: mergedTimingData
			});

			// Update backend with completed step data
			await updateProgress({
				id: executionId,
				data: {
					prcAggregatedSteps: mergedAggregatedData,
					stepStartEndTime: mergedTimingData
				}
			}).unwrap();

			// Update local state - rebuild timeline steps with updated data
			const updatedExecutionData = {
				...actualData,
				prcAggregatedSteps: mergedAggregatedData,
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
		if (stepIndex > currentStepIndex) {
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
			const allStepsFilled = areAllStepsInGroupFilled(targetStep);
			
			if (allStepsFilled) {
				// All steps completed, show preview
				setCurrentStepIndex(stepIndex);
				
				// Extract actual measurement data from the group with context
				const stepGroupData = getCurrentAggregatedData()?.[targetStep.prcTemplateStepId?.toString() || ''] as Record<string, unknown>;
				const groupData = stepGroupData?.[targetStep.stepGroup?.id.toString() || ''] as Record<string, unknown>;
				
				// Create detailed measurement data with context
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const detailedMeasurements: any[] = [];
				if (groupData) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					filterMeasurementSteps(groupData).forEach(([stepId, stepData]: [string, any]) => {
							// Find the step definition to get context
							const stepDefinition = targetStep.stepGroup?.steps.find(s => s.id.toString() === stepId);
							detailedMeasurements.push({
								stepId: stepId,
								value: stepData.value || stepData.data,
								parameterDescription: stepDefinition?.parameterDescription || `Step ${stepId}`,
								stepType: stepDefinition?.stepType || 'Unknown',
								evaluationMethod: stepDefinition?.evaluationMethod || 'Unknown',
								uom: stepDefinition?.uom || '',
								notes: stepDefinition?.notes || '',
								ctq: stepDefinition?.ctq || false,
								stepNumber: stepDefinition?.stepNumber || 0
							});
						});
				}
				
				// Load approval state from backend (look inside step group)
				let productionApproved = false;
				let ctqApproved = false;
				let stepCompleted = false;
				
				if (targetStep.prcTemplateStepId && targetStep.stepGroup) {
					const stepGroupData = getCurrentAggregatedData()?.[targetStep.prcTemplateStepId.toString()] as Record<string, unknown>;
					if (stepGroupData && stepGroupData[targetStep.stepGroup.id.toString()]) {
						const groupData = stepGroupData[targetStep.stepGroup.id.toString()] as Record<string, unknown>;
						productionApproved = groupData.productionApproved === true;
						ctqApproved = groupData.ctqApproved === true;
						stepCompleted = groupData.stepCompleted === true;
					}
				}
				
				const newPreviewData: StepPreviewData = {
					stepNumber: targetStep.stepNumber,
					title: targetStep.title,
					type: targetStep.type,
					ctq: targetStep.ctq,
					data: detailedMeasurements,
					productionApproved: productionApproved,
					ctqApproved: ctqApproved,
					stepCompleted: stepCompleted
				};
				
				setPreviewData(newPreviewData);
				setCurrentView('preview');
				return;
			} else {
				// Not all steps completed, go to detail view
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
					ctqApproved = !targetStep.ctq || stepData.ctqApproved === true;
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
		if (targetStep.status === 'completed' || targetStep.status === 'in-progress' || stepIndex === currentStepIndex) {
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
			const ctqApproved = !step.ctq || groupData.ctqApproved === true;
			const stepCompleted = groupData.stepCompleted === true;

			return productionApproved && stepCompleted && ctqApproved;
		} else if (step.type === 'inspection' && step.stepData?.prcTemplateStepId) {
			const stepData = getCurrentAggregatedData()?.[step.stepData.prcTemplateStepId.toString()] as Record<string, unknown>;
			if (!stepData || Object.keys(stepData).length === 0) return false;

			const productionApproved = stepData.productionApproved === true;
			const ctqApproved = !step.ctq || stepData.ctqApproved === true;
			const stepCompleted = stepData.stepCompleted === true;

			return productionApproved && stepCompleted && ctqApproved;
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
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
				<CircularProgress />
			</Box>
		);
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
			<Backdrop
				sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
				open={isExecutionDataLoading || isExecutionDataFetching || isUpdateProgressLoading}
			>
				<CircularProgress color="inherit" />
			</Backdrop>
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
				currentStep={currentStep}
				totalSteps={timelineSteps.length}
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
					/>
				</Box>
						{/* Quick Stats */}
						<Box sx={{ width: '300px', overflowY: 'auto' }}>
							<ExecutionQuickStats
							executionData={actualExecutionData}
								currentStep={currentStep}
								totalSteps={timelineSteps.length}
						/>
					</Box>
				</Box>
				)}

				{currentView === 'detail' && currentStep && (
					<StepDetailView
						step={currentStep}
						executionData={actualExecutionData}
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
							previewData={previewData}
							onBackToStep={handleBackToStep}
							onApproveProduction={handleApproveProduction}
							onApproveCTQ={handleApproveCTQ}
							onProceedToNext={handleProceedToNext}
							onBackToStepGroup={currentStep?.type === 'sequence' ? handleBackToStepGroup : undefined}
						/>
					</Box>
				)}
			</Box>
		</Box>
		</>
	);
};

export default ExecutePrc;
