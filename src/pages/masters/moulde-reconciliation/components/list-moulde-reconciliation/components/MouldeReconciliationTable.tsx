import { memo, useMemo } from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import { type MRT_ColumnDef } from 'material-react-table';
import TableComponent from '../../../../../../components/table/TableComponent';
import { PartMouldeMapping } from '../../../../../../../mocks/moulde-reconciliation.mock';

interface MouldeReconciliationTableProps {
	data: PartMouldeMapping[];
	reconcilingKey: string | null;
	onReconcile: (row: PartMouldeMapping) => void;
}

const getRowKey = (row: PartMouldeMapping) => `${row.partNumber}__${row.mouldeCode}`;

const MouldeReconciliationTable = memo(({ data, reconcilingKey, onReconcile }: MouldeReconciliationTableProps) => {
	const columns = useMemo<MRT_ColumnDef<PartMouldeMapping>[]>(
		() => [
			{
				accessorKey: 'partNumber',
				header: 'Part Number',
				size: 180
			},
			{
				accessorKey: 'mouldeCode',
				header: 'Moulde Code',
				size: 160
			},
			{
				accessorKey: 'reconciliationCount',
				header: 'Reconciliation Count',
				size: 170
			},
			{
				accessorKey: 'currentCount',
				header: 'Current Count',
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
				accessorKey: 'lastReconciledAt',
				header: 'Last Reconciled',
				size: 180,
				Cell: ({ row }) => (
					<Typography variant="body2">
						{row.original.lastReconciledAt ? new Date(row.original.lastReconciledAt).toLocaleString() : 'Not yet'}
					</Typography>
				)
			},
			{
				id: 'actions',
				header: 'Actions',
				size: 140,
				enableSorting: false,
				Cell: ({ row }) => {
					const rowKey = getRowKey(row.original);
					const isLoading = reconcilingKey === rowKey;
					return (
						<Button variant="contained" size="small" onClick={() => onReconcile(row.original)} disabled={isLoading}>
							{isLoading ? 'Reconciling...' : 'Reconcile'}
						</Button>
					);
				}
			}
		],
		[onReconcile, reconcilingKey]
	);

	if (!data.length) {
		return (
			<Box sx={{ textAlign: 'center', py: 8 }}>
				<Typography variant="h6" sx={{ color: '#666' }}>
					No mouldes due for reconciliation
				</Typography>
			</Box>
		);
	}

	return <TableComponent tableColumns={columns} data={data} />;
});

MouldeReconciliationTable.displayName = 'MouldeReconciliationTable';

export default MouldeReconciliationTable;
