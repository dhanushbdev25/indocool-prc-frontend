import { useMemo, memo } from 'react';
import { Box, Chip, Button, Typography, LinearProgress } from '@mui/material';
import { type MRT_ColumnDef } from 'material-react-table';
import { PlayArrow as PlayArrowIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import TableComponent from '../../../../../components/table/TableComponent';
import { type PrcExecution } from '../../../../../store/api/business/prc-execution/prc-execution.validators';

export type PrcExecutionData = PrcExecution;

interface PrcExecutionTableProps {
	data: PrcExecutionData[];
	onExecute: (id: number) => void;
}

const PrcExecutionTable = memo(({ data, onExecute }: PrcExecutionTableProps) => {
	// Safety check for data
	const safeData = data || [];

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'ACTIVE':
				return '#4caf50';
			case 'IN_PROGRESS':
				return '#2196f3';
			case 'COMPLETED':
				return '#4caf50';
			case 'INACTIVE':
				return '#9e9e9e';
			default:
				return '#9e9e9e';
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	const getProgressColor = (progressValue: number) => {
		if (progressValue >= 100) return '#4caf50';
		if (progressValue >= 50) return '#ff9800';
		return '#2196f3';
	};

	const calculateProgress = (execution: PrcExecutionData) => {
		// Use the progress value directly from API response
		const progressValue =
			typeof execution.progress === 'string' ? parseInt(execution.progress) || 0 : execution.progress;

		// Ensure progress is within valid range (0-100)
		return Math.min(100, Math.max(0, progressValue));
	};

	const columns = useMemo<MRT_ColumnDef<PrcExecutionData>[]>(
		() => [
			{
				accessorKey: 'id',
				header: 'ID',
				size: 80,
				Cell: ({ row }) => (
					<Typography
						variant="body2"
						sx={{
							fontWeight: 600,
							color: '#1976d2',
							fontSize: '0.875rem'
						}}
					>
						#{row.original.id}
					</Typography>
				)
			},
			{
				accessorKey: 'partNumber',
				header: 'Part Number',
				size: 200,
				Cell: ({ row }) => (
					<Box>
						<Typography
							variant="body2"
							sx={{
								fontWeight: 500,
								color: '#333',
								fontSize: '0.875rem'
							}}
						>
							{row.original.partNumber}
						</Typography>
						<Typography
							variant="caption"
							sx={{
								color: '#999',
								fontSize: '0.75rem',
								display: 'block'
							}}
						>
							{row.original.updatedAt ? `Updated: ${formatDate(row.original.updatedAt)}` : ''}
						</Typography>
						<Chip
							label={`v${row.original.version}`}
							size="small"
							icon={<PlayArrowIcon sx={{ fontSize: '0.75rem' }} />}
							sx={{
								backgroundColor: '#e3f2fd',
								color: '#1976d2',
								fontSize: '0.625rem',
								height: '20px',
								mt: 0.5
							}}
						/>
					</Box>
				)
			},
			{
				accessorKey: 'customer',
				header: 'Customer',
				size: 150,
				Cell: ({ row }) => (
					<Typography
						variant="body2"
						sx={{
							color: '#666',
							fontSize: '0.875rem'
						}}
					>
						{row.original.customer}
					</Typography>
				)
			},
			{
				accessorKey: 'productionDetails',
				header: 'Production Details',
				size: 200,
				Cell: ({ row }) => (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
						<Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#666' }}>
							Set: {row.original.productionSetId}
						</Typography>
						<Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#666' }}>
							Mould: {row.original.mouldId}
						</Typography>
						<Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#666' }}>
							Shift: {row.original.shift}
						</Typography>
					</Box>
				)
			},
			{
				accessorKey: 'progress',
				header: 'Progress',
				size: 150,
				Cell: ({ row }) => {
					const progressValue = calculateProgress(row.original);
					return (
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<LinearProgress
									variant="determinate"
									value={progressValue}
									sx={{
										flex: 1,
										height: 8,
										borderRadius: 4,
										backgroundColor: '#e0e0e0',
										'& .MuiLinearProgress-bar': {
											backgroundColor: getProgressColor(progressValue),
											borderRadius: 4
										}
									}}
								/>
								<Typography
									variant="caption"
									sx={{
										fontSize: '0.75rem',
										fontWeight: 500,
										color: getProgressColor(progressValue)
									}}
								>
									{progressValue}%
								</Typography>
							</Box>
							<Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#666' }}>
								{row.original.stepsCompleted || 0} of {row.original.totalSteps || 0} steps
							</Typography>
						</Box>
					);
				}
			},
			{
				accessorKey: 'status',
				header: 'Status',
				size: 120,
				Cell: ({ row }) => (
					<Chip
						label={row.original.status}
						icon={<CheckCircleIcon sx={{ fontSize: '0.75rem' }} />}
						sx={{
							backgroundColor: getStatusColor(row.original.status),
							color: 'white',
							fontSize: '0.75rem',
							height: '24px',
							'& .MuiChip-icon': {
								color: 'white'
							}
						}}
					/>
				)
			},
			{
				accessorKey: 'date',
				header: 'Date',
				size: 120,
				Cell: ({ row }) => (
					<Typography
						variant="body2"
						sx={{
							color: '#333',
							fontSize: '0.875rem'
						}}
					>
						{formatDate(row.original.date)}
					</Typography>
				)
			},
			{
				id: 'execute',
				header: 'Execute',
				size: 120,
				enableSorting: false,
				Cell: ({ row }) => (
					<Button
						variant="contained"
						startIcon={<PlayArrowIcon />}
						onClick={() => onExecute(row.original.id)}
						size="small"
						sx={{
							backgroundColor: '#1976d2',
							'&:hover': {
								backgroundColor: '#1565c0'
							}
						}}
					>
						Execute
					</Button>
				)
			}
		],
		[onExecute]
	);

	if (safeData.length === 0) {
		return (
			<Box sx={{ textAlign: 'center', py: 8 }}>
				<PlayArrowIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
				<Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
					No PRC Executions Found
				</Typography>
				<Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
					Create your first PRC execution to get started
				</Typography>
			</Box>
		);
	}

	return <TableComponent tableColumns={columns} data={safeData} />;
});

PrcExecutionTable.displayName = 'PrcExecutionTable';

export default PrcExecutionTable;
