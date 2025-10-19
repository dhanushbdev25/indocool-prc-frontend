import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Alert, CircularProgress } from '@mui/material';
import {
	useFetchPrcExecutionDetailsQuery,
	useUpdatePrcExecutionProgressMutation
} from '../../../../store/api/business/prc-execution/prc-execution.api';
import { buildTimelineSteps } from '../../utils/buildTimelineSteps';
import { buildAggregatedData, buildTimingData, mergeAggregatedData, mergeTimingData } from '../../utils/dataBuilders';
import { type TimelineStep, type ExecutionData, type FormData } from '../../types/execution.types';
import ExecutionHeader from './components/ExecutionHeader';
import ExecutionTimeline from './components/ExecutionTimeline';
import ExecutionStepContent from './components/ExecutionStepContent';
import ExecutionQuickStats from './components/ExecutionQuickStats';

const ExecutePrc = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const executionId = id ? parseInt(id, 10) : 0;

	// State management
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [stepStartTime, setStepStartTime] = useState<string | null>(null);

	// API hooks
	const {
		data: executionData,
		isLoading: isExecutionDataLoading,
		error: executionDataError
	} = useFetchPrcExecutionDetailsQuery(executionId);

	const [updateProgress] = useUpdatePrcExecutionProgressMutation();

	// Build timeline steps from API data
	const timelineSteps: TimelineStep[] = useMemo(() => {
		if (!executionData) return [];
		// Extract the actual data from the API response wrapper
		const actualData = (executionData as { data: ExecutionData }).data;
		return buildTimelineSteps(actualData);
	}, [executionData]);

	// Current step
	const currentStep = timelineSteps[currentStepIndex];

	// Initialize step start time when step changes
	useEffect(() => {
		if (currentStep && currentStep.status === 'in-progress') {
			const startTime = new Date().toISOString();
			// Use setTimeout to avoid setState in effect
			setTimeout(() => setStepStartTime(startTime), 0);
		}
	}, [currentStep]);

	// Handle step completion
	const handleStepComplete = async (stepFormData: FormData) => {
		if (!currentStep || !executionData) return;

		const endTime = new Date().toISOString();
		const startTime = stepStartTime || endTime;

		// Build aggregated data for this step
		const stepAggregatedData = buildAggregatedData(currentStep, stepFormData);
		const stepTimingData = buildTimingData(currentStep, startTime, endTime);

		// Merge with existing data
		const actualData = (executionData as { data: ExecutionData }).data;
		const mergedAggregatedData = mergeAggregatedData(
			actualData.prcAggregatedSteps as Record<string, unknown>,
			stepAggregatedData
		);
		const mergedTimingData = mergeTimingData(actualData.stepStartEndTime as Record<string, unknown>, stepTimingData);

		// Update backend
		try {
			await updateProgress({
				id: executionId,
				data: {
					prcAggregatedSteps: mergedAggregatedData,
					stepStartEndTime: mergedTimingData
				}
			}).unwrap();

			// Form data is handled by individual step components

			// Move to next step
			if (currentStepIndex < timelineSteps.length - 1) {
				setCurrentStepIndex(prev => prev + 1);
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
		// Only allow navigation to completed steps or current step
		const targetStep = timelineSteps[stepIndex];
		if (targetStep && (targetStep.status === 'completed' || targetStep.status === 'in-progress')) {
			setCurrentStepIndex(stepIndex);
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
			<Box sx={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
				{/* Left Sidebar - Timeline */}
				<Box
					sx={{
						width: '22%',
						height: '100%',
						overflowY: 'auto',
						borderRight: '1px solid #e0e0e0',
						flexShrink: 0,
						'&::-webkit-scrollbar': {
							width: '6px'
						},
						'&::-webkit-scrollbar-track': {
							backgroundColor: '#f1f1f1'
						},
						'&::-webkit-scrollbar-thumb': {
							backgroundColor: '#c1c1c1',
							borderRadius: '3px'
						},
						'&::-webkit-scrollbar-thumb:hover': {
							backgroundColor: '#a8a8a8'
						}
					}}
				>
					<ExecutionTimeline
						steps={timelineSteps}
						currentStepIndex={currentStepIndex}
						onStepClick={handleStepNavigation}
					/>
				</Box>

				{/* Center Content - Step Details */}
				<Box
					sx={{
						flex: 1,
						height: '100%',
						overflowY: 'auto',
						backgroundColor: '#f9f9f9',
						display: 'flex',
						flexDirection: 'column',
						'&::-webkit-scrollbar': {
							width: '6px'
						},
						'&::-webkit-scrollbar-track': {
							backgroundColor: '#f1f1f1'
						},
						'&::-webkit-scrollbar-thumb': {
							backgroundColor: '#c1c1c1',
							borderRadius: '3px'
						},
						'&::-webkit-scrollbar-thumb:hover': {
							backgroundColor: '#a8a8a8'
						}
					}}
				>
					<Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
						<ExecutionStepContent
							step={currentStep}
							executionData={actualExecutionData}
							onStepComplete={handleStepComplete}
						/>
					</Box>
				</Box>

				{/* Right Sidebar - Quick Stats */}
				<Box
					sx={{
						width: '18%',
						height: '100%',
						overflowY: 'auto',
						borderLeft: '1px solid #e0e0e0',
						flexShrink: 0,
						'&::-webkit-scrollbar': {
							width: '6px'
						},
						'&::-webkit-scrollbar-track': {
							backgroundColor: '#f1f1f1'
						},
						'&::-webkit-scrollbar-thumb': {
							backgroundColor: '#c1c1c1',
							borderRadius: '3px'
						},
						'&::-webkit-scrollbar-thumb:hover': {
							backgroundColor: '#a8a8a8'
						}
					}}
				>
					<ExecutionQuickStats
						executionData={actualExecutionData}
						currentStep={currentStep}
						totalSteps={timelineSteps.length}
					/>
				</Box>
			</Box>
		</Box>
	);
};

export default ExecutePrc;
