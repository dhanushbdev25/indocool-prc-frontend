import { useMemo, memo } from 'react';
import { Box, Chip, Button, Typography, Tooltip, Stack, IconButton } from '@mui/material';
import { type MRT_ColumnDef, type MRT_PaginationState, type MRT_Updater } from 'material-react-table';
import {
	PlayArrow as PlayArrowIcon,
	Visibility as VisibilityIcon,
	CheckCircle as CheckCircleIcon,
	PictureAsPdf as PictureAsPdfIcon
} from '@mui/icons-material';
import TableComponent from '../../../../../components/table/TableComponent';
import { type PrcExecution } from '../../../../../store/api/business/prc-execution/prc-execution.validators';
import { useCurrentRole } from '../../../../../hooks/useCurrentRole';

export type PrcExecutionData = PrcExecution;

interface PrcExecutionTableProps {
	data: PrcExecutionData[];
	onExecute: (id: number) => void;
	onView: (id: number) => void;
	/** Opens consolidated report for print / Save as PDF */
	onOpenReport: (id: number) => void;
	pagination?: MRT_PaginationState;
	onPaginationChange?: (updaterOrValue: MRT_Updater<MRT_PaginationState>) => void;
}

const getDescription = (row: PrcExecutionData): string => {
	const desc = (row as unknown as Record<string, unknown>).description;
	return typeof desc === 'string' ? desc : '';
};

const PrcExecutionTable = memo(({ data, onExecute, onView, onOpenReport, pagination, onPaginationChange }: PrcExecutionTableProps) => {
	const { hasPermission } = useCurrentRole();
	const canExecute = hasPermission('PRC_EXECUTION_EDIT');
	const canView = hasPermission('PRC_EXECUTION_VIEW');
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

	const opChipColors = (prcStatus: boolean, sapStatus: boolean) => {
		if (prcStatus && sapStatus) return '#2e7d32';
		if (!prcStatus && !sapStatus) return '#9e9e9e';
		return '#ed6c02';
	};

	const columns = useMemo<MRT_ColumnDef<PrcExecutionData>[]>(
		() => [
			{
				id: 'orderId',
				header: 'Order No',
				size: 140,
				accessorFn: row => {
					const v = row.orderId;
					return v != null && String(v).trim() ? String(v) : '';
				},
				Cell: ({ row }) => {
					const orderId = row.original.orderId;
					return (
						<Typography variant="body2" sx={{ color: '#333', fontSize: '0.875rem' }}>
							{orderId != null && String(orderId).trim() ? String(orderId) : '—'}
						</Typography>
					);
				}
			},
			{
				accessorKey: 'sapReferenceNumber',
				header: 'SAP Number',
				size: 150,
				Cell: ({ row }) => (
					<Typography variant="body2" sx={{ color: '#333', fontSize: '0.875rem' }}>
						{row.original.sapReferenceNumber?.trim() ? row.original.sapReferenceNumber : '—'}
					</Typography>
				)
			},
			{
				accessorKey: 'partNumber',
				header: 'Part Number',
				size: 170,
				Cell: ({ row }) => (
					<Typography variant="body2" sx={{ color: '#333', fontSize: '0.875rem', fontWeight: 500 }}>
						{row.original.partNumber?.trim() ? row.original.partNumber : '—'}
					</Typography>
				)
			},
			{
				id: 'description',
				header: 'Part Description',
				size: 220,
				accessorFn: row => getDescription(row),
				Cell: ({ row }) => (
					<Typography
						variant="body2"
						sx={{
							color: '#333',
							fontSize: '0.875rem',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap'
						}}
					>
						{getDescription(row.original) || '—'}
					</Typography>
				)
			},
			{
				accessorKey: 'productionSetId',
				header: 'Serial Number',
				size: 150,
				Cell: ({ row }) => (
					<Typography variant="body2" sx={{ color: '#333', fontSize: '0.875rem' }}>
						{row.original.productionSetId?.trim() ? row.original.productionSetId : '—'}
					</Typography>
				)
			},
			{
				accessorKey: 'customerName',
				header: 'Customer Name',
				size: 200,
				Cell: ({ row }) => (
					<Typography variant="body2" sx={{ color: '#333', fontSize: '0.875rem' }}>
						{row.original.customerName?.trim() ? row.original.customerName : '—'}
					</Typography>
				)
			},
			{
				accessorKey: 'customerVariantName',
				header: 'Variant',
				size: 160,
				Cell: ({ row }) => (
					<Typography variant="body2" sx={{ color: '#333', fontSize: '0.875rem' }}>
						{row.original.customerVariantName?.trim() ? row.original.customerVariantName : '—'}
					</Typography>
				)
			},
			{
				id: 'operation',
				header: 'Operation',
				size: 300,
				enableColumnFilter: false,
				accessorFn: row =>
					(row.operationStatus ?? []).map(op => (op.operationText ?? '').trim()).filter(Boolean).join(' | ') || '',
				Cell: ({ row }) => {
					const ops = row.original.operationStatus ?? [];
					if (ops.length === 0) {
						return (
							<Typography variant="body2" sx={{ color: '#999', fontSize: '0.875rem' }}>
								—
							</Typography>
						);
					}
					return (
						<Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.5} sx={{ gap: 0.5 }}>
							{ops.map(op => {
								const label = (op.operationText ?? '').trim() || op.operationId || `Op ${op.id}`;
								const tip = `Op ${op.operationId} · PRC: ${op.prcStatus ? 'complete' : 'pending'} · SAP: ${op.sapStatus ? 'complete' : 'pending'}`;
								const bg = opChipColors(op.prcStatus, op.sapStatus);
								return (
									<Tooltip key={op.id} title={tip}>
										<Chip
											label={label}
											size="small"
											variant="outlined"
											sx={{
												borderColor: bg,
												color: bg,
												backgroundColor: `${bg}12`,
												fontSize: '0.7rem',
												height: 22,
												maxWidth: 200,
												'& .MuiChip-label': { px: 0.75 }
											}}
										/>
									</Tooltip>
								);
							})}
						</Stack>
					);
				}
			},
			{
				accessorKey: 'status',
				header: 'Status',
				size: 140,
				filterVariant: 'select',
				filterSelectOptions: ['ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'INACTIVE'],
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
				id: 'execute',
				header: 'Actions',
				size: 168,
				enableSorting: false,
				enableColumnFilter: false,
				Cell: ({ row }) => (
					<Stack direction="row" spacing={0.5} alignItems="center" flexWrap="nowrap">
						{canExecute && (
							<Button
								variant="contained"
								startIcon={<PlayArrowIcon />}
								onClick={() => onExecute(row.original.id)}
								size="small"
								sx={{
									backgroundColor: '#1976d2',
									minWidth: 0,
									px: 1,
									'&:hover': {
										backgroundColor: '#1565c0'
									}
								}}
							>
								Execute
							</Button>
						)}
						{canView && !canExecute && (
							<Button
								variant="outlined"
								startIcon={<VisibilityIcon />}
								onClick={() => onView(row.original.id)}
								size="small"
								sx={{ minWidth: 0, px: 1 }}
							>
								View
							</Button>
						)}
						<Tooltip title="Consolidated report — print or save as PDF">
							<IconButton
								size="small"
								color="primary"
								onClick={() => onOpenReport(row.original.id)}
								aria-label={`PDF report for PRC ${row.original.id}`}
							>
								<PictureAsPdfIcon fontSize="small" />
							</IconButton>
						</Tooltip>
					</Stack>
				)
			}
		],
		[onExecute, onView, onOpenReport, canExecute, canView]
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

	return (
		<TableComponent
			tableColumns={columns}
			data={safeData}
			pagination={pagination}
			onPaginationChange={onPaginationChange}
		/>
	);
});

PrcExecutionTable.displayName = 'PrcExecutionTable';

export default PrcExecutionTable;
