import { useMemo, memo } from 'react';
import { Box, Chip, IconButton, Typography, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { type MRT_ColumnDef, type MRT_PaginationState, type MRT_Updater } from 'material-react-table';
import {
	MoreVert as MoreVertIcon,
	CheckCircle as CheckCircleIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
	Visibility as ViewIcon
} from '@mui/icons-material';
import { useState } from 'react';
import TableComponent from '../../../../../../components/table/TableComponent';
import { type Catalyst } from '../../../../../../store/api/business/catalyst-master/catalyst.validators';
import { useCurrentRole } from '../../../../../../hooks/useCurrentRole';

// Use the Zod-validated type from the API
export type CatalystData = Catalyst;

interface CatalystTableProps {
	data: CatalystData[];
	onActionClick?: (chartId: string, action: string) => void;
	onEdit?: (catalystId: number) => void;
	onView?: (catalystId: number) => void;
	pagination?: MRT_PaginationState;
	onPaginationChange?: (updaterOrValue: MRT_Updater<MRT_PaginationState>) => void;
}

const CatalystTable = memo(({ data, onActionClick, onEdit, onView, pagination, onPaginationChange }: CatalystTableProps) => {
	const { hasPermission } = useCurrentRole();
	const canEdit = hasPermission('CATALYST_MASTER_EDIT');
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedRow, setSelectedRow] = useState<CatalystData | null>(null);
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'ACTIVE':
				return '#4caf50';
			case 'NEW':
				return '#2196f3';
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

	const handleMenuClick = (event: React.MouseEvent<HTMLElement>, row: CatalystData) => {
		setAnchorEl(event.currentTarget);
		setSelectedRow(row);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
		setSelectedRow(null);
	};

	const handleEdit = () => {
		if (selectedRow && onEdit) {
			onEdit(selectedRow.id);
		}
		handleMenuClose();
	};

	const handleView = () => {
		if (selectedRow && onView) {
			onView(selectedRow.id);
		}
		handleMenuClose();
	};

	const handleDelete = () => {
		if (selectedRow && onActionClick) {
			onActionClick(selectedRow.chartId, 'delete');
		}
		handleMenuClose();
	};

	const columns = useMemo<MRT_ColumnDef<CatalystData>[]>(
		() => [
			{
				accessorKey: 'chartId',
				header: 'Chart ID',
				size: 200,
				Cell: ({ row }) => (
					<Typography variant="body2" sx={{ fontWeight: 500, color: '#333', fontSize: '0.875rem' }}>
						{row.original.chartId}
					</Typography>
				)
			},
			{
				accessorKey: 'chartSupplier',
				header: 'Customer Name',
				size: 220,
				Cell: ({ row }) => (
					<Typography variant="body2" sx={{ color: '#333', fontSize: '0.875rem' }}>
						{row.original.chartSupplier?.trim() ? row.original.chartSupplier : '—'}
					</Typography>
				)
			},
			{
				accessorKey: 'createdAt',
				header: 'Created On',
				size: 120,
				enableColumnFilter: false,
				Cell: ({ row }) => (
					<Typography variant="body2" sx={{ color: '#333', fontSize: '0.875rem' }}>
						{formatDate(row.original.createdAt)}
					</Typography>
				)
			},
			{
				accessorKey: 'status',
				header: 'Status',
				size: 120,
				filterVariant: 'select',
				filterSelectOptions: ['ACTIVE', 'NEW', 'INACTIVE'],
				Cell: ({ row }) => (
					<Chip
						icon={<CheckCircleIcon sx={{ fontSize: '0.875rem' }} />}
						label={row.original.status}
						size="small"
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
				id: 'actions',
				header: 'Actions',
				size: 80,
				enableSorting: false,
				enableColumnFilter: false,
				Cell: ({ row }) => (
					<IconButton size="small" onClick={e => handleMenuClick(e, row.original)}>
						<MoreVertIcon sx={{ color: '#666' }} />
					</IconButton>
				)
			}
		],
		[]
	);

	return (
		<Box sx={{ mt: 0 }}>
			<TableComponent
				data={data}
				tableColumns={columns}
				pagination={pagination}
				onPaginationChange={onPaginationChange}
			/>

			{/* Action Menu */}
			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={handleMenuClose}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'right'
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'right'
				}}
			>
				{[
					<MenuItem key="view" onClick={handleView}>
						<ListItemIcon>
							<ViewIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText>View</ListItemText>
					</MenuItem>,
					canEdit && (
						<MenuItem key="edit" onClick={handleEdit}>
							<ListItemIcon>
								<EditIcon fontSize="small" />
							</ListItemIcon>
							<ListItemText>Edit</ListItemText>
						</MenuItem>
					),
					canEdit && (
						<MenuItem key="delete" onClick={handleDelete} sx={{ color: 'error.main' }}>
							<ListItemIcon>
								<DeleteIcon fontSize="small" color="error" />
							</ListItemIcon>
							<ListItemText>Delete</ListItemText>
						</MenuItem>
					)
				].filter(Boolean)}
			</Menu>
		</Box>
	);
});

export default CatalystTable;
