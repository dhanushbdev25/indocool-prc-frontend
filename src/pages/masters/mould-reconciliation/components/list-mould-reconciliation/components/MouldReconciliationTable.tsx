import { memo, useMemo } from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import { Build as MouldIcon } from '@mui/icons-material';
import { type MRT_ColumnDef, type MRT_PaginationState, type MRT_Updater } from 'material-react-table';
import TableComponent from '../../../../../../components/table/TableComponent';
import {
	type MouldReconciliationRow,
	canReconcileMouldRow,
	isMouldDueForReconciliation
} from '../../../../../../store/api/business/mould/mould.validators';
import { useCurrentRole } from '../../../../../../hooks/useCurrentRole';

interface MouldReconciliationTableProps {
	data: MouldReconciliationRow[];
	reconcilingKey: string | null;
	onReconcile: (row: MouldReconciliationRow) => void;
	pagination?: MRT_PaginationState;
	onPaginationChange?: (updaterOrValue: MRT_Updater<MRT_PaginationState>) => void;
}

const getRowKey = (row: MouldReconciliationRow) => String(row.id);

const MouldReconciliationTable = memo(({ data, reconcilingKey, onReconcile, pagination, onPaginationChange }: MouldReconciliationTableProps) => {
	const { hasPermission } = useCurrentRole();
	const reconcilePermissions = {
		canCreate: hasPermission('MOULD_RECONCILIATION_CREATE'),
		canEdit: hasPermission('MOULD_RECONCILIATION_EDIT')
	};
	const columns = useMemo<MRT_ColumnDef<MouldReconciliationRow>[]>(
		() => [
			{
				accessorKey: 'partNumber',
				header: 'Part code',
				size: 180
			},
			{
				accessorKey: 'sapReferenceNumber',
				header: 'SAP reference',
				size: 160,
				Cell: ({ row }) => (
					<Typography variant="body2">
						{row.original.sapReferenceNumber?.trim() ? row.original.sapReferenceNumber : '—'}
					</Typography>
				)
			},
			{
				accessorKey: 'mouldCode',
				header: 'Mould ID',
				size: 160
			},
			{
				accessorKey: 'reconciliationCount',
				header: 'Reconciliation count',
				size: 170
			},
			{
				accessorKey: 'currentCount',
				header: 'Current count',
				size: 140,
				Cell: ({ row }) => (
					<Chip
						label={row.original.currentCount}
						color={row.original.currentCount >= row.original.reconciliationCount ? 'warning' : 'default'}
						size="small"
					/>
				)
			},
			{
				accessorKey: 'totalCount',
				header: 'Total count',
				size: 140
			},
			{
				id: 'due',
				accessorFn: row => (isMouldDueForReconciliation(row) ? 'Yes' : 'No'),
				header: 'Due',
				size: 100,
				filterVariant: 'select',
				filterSelectOptions: ['Yes', 'No'],
				Cell: ({ row }) => {
					const due = isMouldDueForReconciliation(row.original);
					return (
						<Chip
							label={due ? 'Yes' : 'No'}
							color={due ? 'warning' : 'default'}
							size="small"
							variant={due ? 'filled' : 'outlined'}
						/>
					);
				}
			},
			{
				accessorKey: 'lastReconciledAt',
				header: 'Last reconciled',
				size: 180,
				enableColumnFilter: false,
				Cell: ({ row }) => (
					<Typography variant="body2">
						{row.original.lastReconciledAt ? new Date(row.original.lastReconciledAt).toLocaleString() : '—'}
					</Typography>
				)
			},
			{
				id: 'actions',
				header: 'Actions',
				size: 140,
				enableSorting: false,
				enableColumnFilter: false,
				Cell: ({ row }) => {
					const rowKey = getRowKey(row.original);
					const isLoading = reconcilingKey === rowKey;
					const { showAction, isDue } = canReconcileMouldRow(row.original, reconcilePermissions);
					if (!showAction) {
						return null;
					}
					return (
						<Button
							variant="contained"
							size="small"
							onClick={() => onReconcile(row.original)}
							disabled={isLoading}
							title={!isDue ? 'Reconcile mould (not yet due by count)' : undefined}
						>
							Reconcile
						</Button>
					);
				}
			}
		],
		[onReconcile, reconcilingKey, reconcilePermissions.canCreate, reconcilePermissions.canEdit]
	);

	if (!data.length) {
		return (
			<Box sx={{ textAlign: 'center', py: 8 }}>
				<MouldIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
				<Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
					No moulds found
				</Typography>
				<Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
					Try adjusting search or filters, or refresh the list
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

MouldReconciliationTable.displayName = 'MouldReconciliationTable';

export default MouldReconciliationTable;
