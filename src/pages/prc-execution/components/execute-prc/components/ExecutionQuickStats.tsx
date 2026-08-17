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
	CircularProgress,
	Stack,
	Tooltip
} from '@mui/material';
import { CheckCircle, CloudSync, FactCheck, Schedule, TrendingUp } from '@mui/icons-material';
import { type ExecutionData, type TimelineStep } from '../../../types/execution.types';
import { useLiveExecutionDurationMs } from '../../../hooks/useLiveExecutionDurationMs';
import { formatExecutionDuration } from '../../../utils/formatExecutionDuration';
import { useFetchSapConfirmationLogsQuery } from '../../../../../store/api/business/sap-job-runs/sap-job-runs.api';
import { type SapConfirmationLogItem } from '../../../../../store/api/business/sap-job-runs/sap-job-runs.validators';
import { parsePrcExecutionOperationStatusList } from '../../../../../store/api/business/prc-execution/prc-execution.validators';
import { formatDisplayDateTime } from '../../../../../utils/formatDisplayDate';

function operationStatusChipBorderColor(prcStatus: boolean, sapStatus: boolean) {
	if (prcStatus && sapStatus) return '#2e7d32';
	if (!prcStatus && !sapStatus) return '#9e9e9e';
	return '#ed6c02';
}

function SapConfirmationLogCompact({ log }: { log: SapConfirmationLogItem }) {
	const line = [log.operationId, log.operationText].filter(Boolean).join(' · ');
	return (
		<Box
			sx={{
				py: 1,
				borderBottom: '1px solid',
				borderColor: 'divider',
				'&:last-of-type': { borderBottom: 'none', pb: 0 }
			}}
		>
			<Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
				<Typography variant="body2" sx={{ minWidth: 0, flex: 1 }} noWrap title={line}>
					{line || '—'}
				</Typography>
				<Chip
					size="small"
					label={log.success ? 'OK' : 'Fail'}
					color={log.success ? 'success' : 'error'}
					variant={log.success ? 'filled' : 'outlined'}
					sx={{ flexShrink: 0 }}
				/>
			</Stack>
		</Box>
	);
}

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

	const sapFailedCount = sapLogs.filter(l => !l.success).length;
	const sapOverallLabel =
		skipSapLogs || sapLogsLoading
			? null
			: sapLogsError
				? 'Load failed'
				: sapLogs.length === 0
					? 'None yet'
					: sapFailedCount > 0
						? `${sapFailedCount} of ${sapLogs.length} failed`
						: `All ${sapLogs.length} ok`;

	const operationRows = parsePrcExecutionOperationStatusList(
		(executionData as Record<string, unknown>).operationStatus ??
			(executionData as Record<string, unknown>).operation_status
	);

	const getProgressColor = (completed: number, total: number) => {
		const percentage = (completed / total) * 100;
		if (percentage >= 100) return '#4caf50';
		if (percentage >= 50) return '#ff9800';
		return '#2196f3';
	};

	return (
		<Box sx={{ p: 2, backgroundColor: 'white' }}>
			<Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 2 }}>
				Quick Stats
			</Typography>

			{/* Operation status (same source as execution list) */}
			<Card sx={{ mb: 2 }}>
				<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
						<FactCheck sx={{ color: '#666', fontSize: 20 }} />
						<Typography variant="body2" sx={{ fontWeight: 500 }}>
							Operation status
						</Typography>
					</Box>
					{operationRows.length === 0 ? (
						<Typography variant="caption" sx={{ color: '#999' }}>
							—
						</Typography>
					) : (
						<Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.5} sx={{ gap: 0.5 }}>
							{operationRows.map(op => {
								const label = (op.operationText ?? '').trim() || op.operationId || `Op ${op.id}`;
								const border = operationStatusChipBorderColor(op.prcStatus, op.sapStatus);
								const tip = `PRC: ${op.prcStatus ? 'complete' : 'pending'} · SAP: ${op.sapStatus ? 'complete' : 'pending'}`;
								return (
									<Tooltip key={op.id} title={tip}>
										<Chip
											label={label}
											size="small"
											variant="outlined"
											sx={{
												borderColor: border,
												color: border,
												backgroundColor: `${border}12`,
												fontSize: '0.7rem',
												height: 22,
												maxWidth: '100%',
												'& .MuiChip-label': { px: 0.75, overflow: 'hidden', textOverflow: 'ellipsis' }
											}}
										/>
									</Tooltip>
								);
							})}
						</Stack>
					)}
				</CardContent>
			</Card>

			{/* SAP push */}
			<Card sx={{ mb: 2 }}>
				<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
						<CloudSync sx={{ color: '#666' }} />
						<Typography variant="body2" sx={{ fontWeight: 500 }}>
							SAP push
						</Typography>
						{sapOverallLabel && !skipSapLogs && !sapLogsLoading && (
							<Chip
								size="small"
								label={sapOverallLabel}
								color={
									sapLogsError
										? 'error'
										: sapLogs.length === 0
											? 'default'
											: sapFailedCount > 0
												? 'error'
												: 'success'
								}
								variant={sapLogs.length > 0 && !sapLogsError && sapFailedCount === 0 ? 'filled' : 'outlined'}
								sx={
									sapLogs.length === 0 && !sapLogsError
										? { bgcolor: '#f5f5f5', color: '#666', borderColor: 'divider' }
										: undefined
								}
							/>
						)}
					</Box>
					{skipSapLogs ? (
						<Typography variant="caption" sx={{ color: '#666' }}>
							N/A in preview
						</Typography>
					) : sapLogsLoading ? (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
							<CircularProgress size={22} />
							<Typography variant="caption" sx={{ color: '#666' }}>
								Loading…
							</Typography>
						</Box>
					) : sapLogsError ? (
						<Typography variant="caption" color="error" sx={{ display: 'block' }}>
							{sapLogsErr && typeof sapLogsErr === 'object' && 'data' in sapLogsErr
								? String((sapLogsErr as { data?: unknown }).data)
								: 'Could not load logs'}
						</Typography>
					) : sapLogs.length === 0 ? (
						<Typography variant="caption" sx={{ color: '#666' }}>
							No confirmations yet.
						</Typography>
					) : (
						<>
							{sapLogs.map(log => (
								<SapConfirmationLogCompact key={log.id} log={log} />
							))}
						</>
					)}
					{sapStepCompleted && (
						<Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 1 }}>
							SAP step completed.
						</Typography>
					)}
				</CardContent>
			</Card>

			{/* Recent Activity */}
			<Box sx={{ mb: 2 }}>
				<Typography variant="body2" sx={{ fontWeight: 600, color: '#333', mb: 1.5 }}>
					Recent Activity
				</Typography>
				<List dense disablePadding>
					<ListItem sx={{ px: 0 }}>
						<ListItemText
							primary="Started"
							secondary={formatDisplayDateTime(executionData.createdAt)}
							primaryTypographyProps={{ fontSize: '0.875rem' }}
							secondaryTypographyProps={{ fontSize: '0.75rem' }}
						/>
					</ListItem>
					{executionData.updatedAt !== executionData.createdAt && (
						<ListItem sx={{ px: 0 }}>
							<ListItemText
								primary="Updated"
								secondary={formatDisplayDateTime(executionData.updatedAt)}
								primaryTypographyProps={{ fontSize: '0.875rem' }}
								secondaryTypographyProps={{ fontSize: '0.75rem' }}
							/>
						</ListItem>
					)}
					{currentStep && (
						<ListItem sx={{ px: 0 }}>
							<ListItemText
								primary={`Step ${currentStep.stepNumber}: ${currentStep.title}`}
								secondary="In progress"
								primaryTypographyProps={{ fontSize: '0.875rem' }}
								secondaryTypographyProps={{ fontSize: '0.75rem' }}
							/>
						</ListItem>
					)}
				</List>
			</Box>

			<Divider sx={{ my: 2 }} />

			{/* Steps Completed */}
			<Card sx={{ mb: 2 }}>
				<CardContent sx={{ p: 2 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
						<CheckCircle sx={{ color: getProgressColor(executionData.stepsCompleted, executionData.totalSteps) }} />
						<Typography variant="body2" sx={{ fontWeight: 500 }}>
							Steps completed
						</Typography>
					</Box>
					<Typography
						variant="h4"
						sx={{ fontWeight: 600, color: getProgressColor(executionData.stepsCompleted, executionData.totalSteps) }}
					>
						{executionData.stepsCompleted}
					</Typography>
					<Typography variant="caption" sx={{ color: '#666' }}>
						of {executionData.totalSteps}
					</Typography>
				</CardContent>
			</Card>
			{/* CTQs Passed */}
			<Card sx={{ mb: 2 }}>
				<CardContent sx={{ p: 2 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
						<TrendingUp sx={{ color: executionData.completedCtq === executionData.totalCtq ? '#4caf50' : '#ff9800' }} />
						<Typography variant="body2" sx={{ fontWeight: 500 }}>
							CTQs passed
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
						of {executionData.totalCtq}
					</Typography>
				</CardContent>
			</Card>
			{/* Current Step */}
			<Card sx={{ mb: 2 }}>
				<CardContent sx={{ p: 2 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
						<Schedule sx={{ color: '#2196f3' }} />
						<Typography variant="body2" sx={{ fontWeight: 500 }}>
							Current step
						</Typography>
					</Box>
					<Typography variant="h4" sx={{ fontWeight: 600, color: '#2196f3' }}>
						{currentStep ? currentStep.stepNumber : 0}
					</Typography>
					<Typography variant="caption" sx={{ color: '#666' }}>
						{currentStep ? currentStep.title : '—'}
					</Typography>
				</CardContent>
			</Card>
			{/* Duration */}
			<Card sx={{ mb: 2 }}>
				<CardContent sx={{ p: 2 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
						<Schedule sx={{ color: '#666' }} />
						<Typography variant="body2" sx={{ fontWeight: 500 }}>
							Duration
						</Typography>
					</Box>
					<Typography variant="h4" sx={{ fontWeight: 600, color: '#666' }}>
						{durationLabel}
					</Typography>
				</CardContent>
			</Card>
			{/* Status Summary */}
			<Box sx={{ mt: 1 }}>
				<Typography variant="body2" sx={{ fontWeight: 600, color: '#333', mb: 1.5 }}>
					Status
				</Typography>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
					<Chip
						label={`${executionData.stepsCompleted}/${executionData.totalSteps} steps`}
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
