import { memo, useMemo } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';
import { type MRT_ColumnDef } from 'material-react-table';
import TableComponent from '../../../../../components/table/TableComponent';
import type { SapJobRunItem } from '../../../../../store/api/business/sap-job-runs/sap-job-runs.validators';

const formatDt = (iso: string | null): string => {
	if (iso === null || iso === '') return '—';
	try {
		return new Date(iso).toLocaleString();
	} catch {
		return iso;
	}
};

const statusChipColor = (
	status: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
	const u = status.toUpperCase();
	if (u === 'SUCCESS') return 'success';
	if (u === 'FAILED' || u === 'ERROR' || u === 'FAILURE') return 'error';
	if (u === 'RUNNING' || u === 'IN_PROGRESS') return 'info';
	return 'default';
};

interface SapJobRunsTableProps {
	data: SapJobRunItem[];
}

const SapJobRunsTable = memo(({ data }: SapJobRunsTableProps) => {
	const columns = useMemo<MRT_ColumnDef<SapJobRunItem>[]>(
		() => [
			{
				accessorKey: 'id',
				header: 'Run ID',
				size: 88
			},
			{
				id: 'runStart',
				header: 'Run start',
				size: 168,
				accessorFn: row => formatDt(row.runStart),
				enableColumnFilter: false,
				sortingFn: (rowA, rowB) =>
					new Date(rowA.original.runStart).getTime() - new Date(rowB.original.runStart).getTime()
			},
			{
				id: 'runEnd',
				header: 'Run end',
				size: 168,
				accessorFn: row => formatDt(row.runEnd),
				enableColumnFilter: false,
				sortingFn: (rowA, rowB) => {
					const tA = rowA.original.runEnd ? new Date(rowA.original.runEnd).getTime() : 0;
					const tB = rowB.original.runEnd ? new Date(rowB.original.runEnd).getTime() : 0;
					return tA - tB;
				}
			},
			{
				accessorKey: 'status',
				header: 'Status',
				size: 112,
				Cell: ({ row }) => (
					<Chip label={row.original.status} color={statusChipColor(row.original.status)} size="small" />
				)
			},
			{
				accessorKey: 'recordsProcessed',
				header: 'Records processed',
				size: 140
			},
			{
				accessorKey: 'endpointUrl',
				header: 'Request URL',
				size: 360,
				Cell: ({ row }) => (
					<Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>
						{row.original.endpointUrl ?? '—'}
					</Typography>
				)
			},
			{
				id: 'errorMessage',
				header: 'Error message',
				size: 220,
				accessorFn: row => row.errorMessage ?? '—',
				Cell: ({ row }) => (
					<Typography
						variant="body2"
						sx={{
							whiteSpace: 'pre-wrap',
							wordBreak: 'break-word',
							color: row.original.errorMessage ? 'error.main' : 'text.primary'
						}}
					>
						{row.original.errorMessage ?? '—'}
					</Typography>
				)
			}
		],
		[]
	);

	if (!data.length) {
		return (
			<Box sx={{ textAlign: 'center', py: 8 }}>
				<HistoryIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
				<Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
					No recorded runs for this job
				</Typography>
				<Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
					Executions will appear here after the integration job has run on the server.
				</Typography>
			</Box>
		);
	}

	return <TableComponent tableColumns={columns} data={data} />;
});

SapJobRunsTable.displayName = 'SapJobRunsTable';

export default SapJobRunsTable;
