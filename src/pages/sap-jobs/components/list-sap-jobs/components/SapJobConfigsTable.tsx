import { memo, useMemo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { CloudSync as SapIcon } from '@mui/icons-material';
import { type MRT_ColumnDef, type MRT_PaginationState, type MRT_Updater } from 'material-react-table';
import TableComponent from '../../../../../components/table/TableComponent';
import type { SapJobConfigItem } from '../../../../../store/api/business/sap-job-runs/sap-job-runs.validators';
import { useCurrentRole } from '../../../../../hooks/useCurrentRole';

const formatDt = (iso: string): string => {
	try {
		return new Date(iso).toLocaleString();
	} catch {
		return iso;
	}
};

interface SapJobConfigsTableProps {
	data: SapJobConfigItem[];
	onViewHistory: (row: SapJobConfigItem) => void;
	pagination?: MRT_PaginationState;
	onPaginationChange?: (updaterOrValue: MRT_Updater<MRT_PaginationState>) => void;
}

const SapJobConfigsTable = memo(({ data, onViewHistory, pagination, onPaginationChange }: SapJobConfigsTableProps) => {
	const { hasPermission } = useCurrentRole();
	const canCreate = hasPermission('SAP_INTEGRATION_JOBS_CREATE');
	const columns = useMemo<MRT_ColumnDef<SapJobConfigItem>[]>(
		() => [
			{
				accessorKey: 'id',
				header: 'ID',
				size: 72
			},
			{
				accessorKey: 'jobKey',
				header: 'Job key',
				size: 200
			},
			{
				accessorKey: 'cronExpression',
				header: 'Cron expression',
				size: 130
			},
			{
				id: 'enabled',
				header: 'Enabled',
				size: 96,
				accessorFn: row => (row.enabled ? 'Yes' : 'No'),
				filterVariant: 'select',
				filterSelectOptions: ['Yes', 'No'],
			},
			{
				id: 'updatedAt',
				header: 'Last updated',
				size: 180,
				accessorFn: row => formatDt(row.updatedAt),
				enableColumnFilter: false,
				sortingFn: (rowA, rowB) =>
					new Date(rowA.original.updatedAt).getTime() - new Date(rowB.original.updatedAt).getTime()
			},
			...(canCreate
				? [
						{
							id: 'actions',
							header: 'Actions',
							size: 160,
							enableSorting: false,
							enableColumnFilter: false,
							Cell: ({ row }: { row: { original: SapJobConfigItem } }) => (
								<Button variant="contained" size="small" onClick={() => onViewHistory(row.original)}>
									View run history
								</Button>
							)
						} satisfies MRT_ColumnDef<SapJobConfigItem>
					]
				: [])
		],
		[onViewHistory, canCreate]
	);

	if (!data.length) {
		return (
			<Box sx={{ textAlign: 'center', py: 8 }}>
				<SapIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
				<Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
					No job configurations match your criteria
				</Typography>
				<Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
					Adjust the search terms or refresh the list to reload from the server.
				</Typography>
			</Box>
		);
	}

	return (
		<TableComponent
			tableColumns={columns}
			data={data}
			pagination={pagination}
			onPaginationChange={onPaginationChange}
		/>
	);
});

SapJobConfigsTable.displayName = 'SapJobConfigsTable';

export default SapJobConfigsTable;
