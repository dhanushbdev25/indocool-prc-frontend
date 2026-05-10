import {
	Box,
	Typography,
	Card,
	CardContent,
	Chip,
	Divider,
	List,
	ListItem,
	ListItemText,
	CircularProgress
} from '@mui/material';
import { CheckCircle, CloudSync, Schedule, TrendingUp } from '@mui/icons-material';
import { type ExecutionData, type TimelineStep } from '../../../types/execution.types';
import { useLiveExecutionDurationMs } from '../../../hooks/useLiveExecutionDurationMs';
import { formatExecutionDuration } from '../../../utils/formatExecutionDuration';
import { useFetchSapConfirmationLogsQuery } from '../../../../../store/api/business/sap-job-runs/sap-job-runs.api';

interface ExecutionQuickStatsProps {
	executionData: ExecutionData;
	currentStep: TimelineStep | undefined;
}

const ExecutionQuickStats = ({ executionData, currentStep }: ExecutionQuickStatsProps) => {
	const liveDurationMs = useLiveExecutionDurationMs(executionData);
	const durationLabel = formatExecutionDuration(liveDurationMs);

	const skipSapLogs = !executionData.id || executionData.status === 'PREVIEW';
	const {
		data: sapLogs = [],
		isLoading: sapLogsLoading,
		isError: sapLogsError,
		error: sapLogsErr
	} = useFetchSapConfirmationLogsQuery(
		{ prcExecutionId: executionData.id },
		{ skip: skipSapLogs }
	);

	const sapAgg = executionData.prcAggregatedSteps?.sapConfirmations as Record<string, unknown> | undefined;
	const sapStepCompleted = sapAgg?.stepCompleted === true;

	const getSapPushSummary = (): { label: string; chipColor: 'success' | 'error' | 'default' } => {
		if (skipSapLogs) {
			return { label: 'Not available in preview', chipColor: 'default' };
		}
		if (sapLogsLoading) {
			return { label: 'Loading…', chipColor: 'default' };
		}
		if (sapLogsError) {
			return { label: 'Failed to load', chipColor: 'error' };
		}
		if (sapLogs.length === 0) {
			return { label: 'Pending — no confirmations yet', chipColor: 'default' };
		}
		const failed = sapLogs.filter(l => !l.success).length;
		if (failed > 0) {
			const suffix = failed === sapLogs.length ? '' : ` (${failed} failed)`;
			return { label: `Failed${suffix}`, chipColor: 'error' };
		}
		return { label: 'Posted — all succeeded', chipColor: 'success' };
	};

	const sapPushSummary = getSapPushSummary();

	const getProgressColor = (completed: number, total: number) => {
		const percentage = (completed / total) * 100;
		if (percentage >= 100) return '#4caf50';
		if (percentage >= 50) return '#ff9800';
		return '#2196f3';
	};

	return (
		<Box sx={{ p: 2, backgroundColor: 'white' }}>
			<Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 3 }}>
				Quick Stats
			</Typography>
			{/* SAP push status */}
			<Card sx={{ mb: 2 }}>
				<CardContent sx={{ p: 2 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
						<CloudSync sx={{ color: '#666' }} />
						<Typography variant="body2" sx={{ fontWeight: 500 }}>
							SAP push
						</Typography>
					</Box>
					{!skipSapLogs && sapLogsLoading ? (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
							<CircularProgress size={22} />
							<Typography variant="caption" sx={{ color: '#666' }}>
								Loading confirmation logs…
							</Typography>
						</Box>
					) : (
						<>
							<Chip
								size="small"
								label={sapPushSummary.label}
								color={sapPushSummary.chipColor === 'default' ? undefined : sapPushSummary.chipColor}
								variant={sapPushSummary.chipColor === 'success' ? 'filled' : 'outlined'}
								sx={
									sapPushSummary.chipColor === 'default'
										? { bgcolor: '#f5f5f5', color: '#666', borderColor: 'divider' }
										: undefined
								}
							/>
							{!skipSapLogs && !sapLogsLoading && sapLogsError && (
								<Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
									{sapLogsErr && typeof sapLogsErr === 'object' && 'data' in sapLogsErr
										? String((sapLogsErr as { data?: unknown }).data)
										: 'Could not load SAP confirmation logs.'}
								</Typography>
							)}
							{sapStepCompleted && (
								<Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 1 }}>
									SAP step marked complete in this execution
								</Typography>
							)}
						</>
					)}
				</CardContent>
			</Card>
			{/* Steps Completed */}
			<Card sx={{ mb: 2 }}>
				<CardContent sx={{ p: 2 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
						<CheckCircle sx={{ color: getProgressColor(executionData.stepsCompleted, executionData.totalSteps) }} />
						<Typography variant="body2" sx={{ fontWeight: 500 }}>
							Steps Completed
						</Typography>
					</Box>
					<Typography
						variant="h4"
						sx={{ fontWeight: 600, color: getProgressColor(executionData.stepsCompleted, executionData.totalSteps) }}
					>
						{executionData.stepsCompleted}
					</Typography>
					<Typography variant="caption" sx={{ color: '#666' }}>
						of {executionData.totalSteps} total steps
					</Typography>
				</CardContent>
			</Card>
			{/* CTQs Passed */}
			<Card sx={{ mb: 2 }}>
				<CardContent sx={{ p: 2 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
						<TrendingUp sx={{ color: executionData.completedCtq === executionData.totalCtq ? '#4caf50' : '#ff9800' }} />
						<Typography variant="body2" sx={{ fontWeight: 500 }}>
							CTQs Passed
						</Typography>
					</Box>
					<Typography
						variant="h4"
						sx={{
							fontWeight: 600,
							color: executionData.completedCtq === executionData.totalCtq ? '#4caf50' : '#ff9800'
						}}
					>
						{executionData.completedCtq}
					</Typography>
					<Typography variant="caption" sx={{ color: '#666' }}>
						of {executionData.totalCtq} total CTQs
					</Typography>
				</CardContent>
			</Card>
			{/* Current Step */}
			<Card sx={{ mb: 2 }}>
				<CardContent sx={{ p: 2 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
						<Schedule sx={{ color: '#2196f3' }} />
						<Typography variant="body2" sx={{ fontWeight: 500 }}>
							Current Step
						</Typography>
					</Box>
					<Typography variant="h4" sx={{ fontWeight: 600, color: '#2196f3' }}>
						{currentStep ? currentStep.stepNumber : 0}
					</Typography>
					<Typography variant="caption" sx={{ color: '#666' }}>
						{currentStep ? currentStep.title : 'No active step'}
					</Typography>
				</CardContent>
			</Card>
			{/* Duration */}
			<Card sx={{ mb: 2 }}>
				<CardContent sx={{ p: 2 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
						<Schedule sx={{ color: '#666' }} />
						<Typography variant="body2" sx={{ fontWeight: 500 }}>
							Total Duration
						</Typography>
					</Box>
					<Typography variant="h4" sx={{ fontWeight: 600, color: '#666' }}>
						{durationLabel}
					</Typography>
				</CardContent>
			</Card>
			<Divider sx={{ my: 2 }} />
			Recent Activity
			<Box>
				<Typography variant="body2" sx={{ fontWeight: 600, color: '#333', mb: 2 }}>
					Recent Activity
				</Typography>
				<List dense>
					<ListItem sx={{ px: 0 }}>
						<ListItemText
							primary="PRC Execution Started"
							secondary={new Date(executionData.createdAt).toLocaleString()}
							primaryTypographyProps={{ fontSize: '0.875rem' }}
							secondaryTypographyProps={{ fontSize: '0.75rem' }}
						/>
					</ListItem>
					{executionData.updatedAt !== executionData.createdAt && (
						<ListItem sx={{ px: 0 }}>
							<ListItemText
								primary="Last Updated"
								secondary={new Date(executionData.updatedAt).toLocaleString()}
								primaryTypographyProps={{ fontSize: '0.875rem' }}
								secondaryTypographyProps={{ fontSize: '0.75rem' }}
							/>
						</ListItem>
					)}
					{currentStep && (
						<ListItem sx={{ px: 0 }}>
							<ListItemText
								primary={`Step ${currentStep.stepNumber} - ${currentStep.title}`}
								secondary="Currently in progress"
								primaryTypographyProps={{ fontSize: '0.875rem' }}
								secondaryTypographyProps={{ fontSize: '0.75rem' }}
							/>
						</ListItem>
					)}
				</List>
			</Box>
			{/* Status Summary */}
			<Box sx={{ mt: 3 }}>
				<Typography variant="body2" sx={{ fontWeight: 600, color: '#333', mb: 2 }}>
					Status Summary
				</Typography>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
					<Chip
						label={`${executionData.stepsCompleted}/${executionData.totalSteps} Steps`}
						size="small"
						sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
					/>
					<Chip
						label={`${executionData.completedCtq}/${executionData.totalCtq} CTQs`}
						size="small"
						sx={{
							backgroundColor: executionData.completedCtq === executionData.totalCtq ? '#e8f5e8' : '#fff3e0',
							color: executionData.completedCtq === executionData.totalCtq ? '#2e7d32' : '#f57c00'
						}}
					/>
					<Chip label={executionData.status} size="small" sx={{ backgroundColor: '#f5f5f5', color: '#666' }} />
				</Box>
			</Box>
		</Box>
	);
};

export default ExecutionQuickStats;
