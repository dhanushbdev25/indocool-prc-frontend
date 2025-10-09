import { useMemo, memo } from 'react';
import { Box, Chip, IconButton, Typography, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { type MRT_ColumnDef } from 'material-react-table';
import {
	MoreVert as MoreVertIcon,
	CheckCircle as CheckCircleIcon,
	Business as BusinessIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
	Visibility as ViewIcon
} from '@mui/icons-material';
import { useState } from 'react';
import TableComponent from '../../../../../../components/table/TableComponent';
import { type Catalyst } from '../../../../../../store/api/business/catalyst-master/catalyst.validators';

// Use the Zod-validated type from the API
export type CatalystData = Catalyst;

interface CatalystTableProps {
	data: CatalystData[];
	onActionClick?: (chartId: string, action: string) => void;
	onEdit?: (catalystId: number) => void;
	onView?: (catalystId: number) => void;
}

const CatalystTable = memo(({ data, onActionClick, onEdit, onView }: CatalystTableProps) => {
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
					<Box>
						<Typography
							variant="body2"
							sx={{
								fontWeight: 500,
								color: '#333',
								fontSize: '0.875rem'
							}}
						>
							{row.original.chartId}
						</Typography>
						<Typography
							variant="caption"
							sx={{
								color: '#999',
								fontSize: '0.75rem',
								display: 'block'
							}}
						>
							Updated: {formatDate(row.original.updatedAt)}
						</Typography>
						<Chip
							label={row.original.chartSupplier}
							size="small"
							icon={<BusinessIcon sx={{ fontSize: '0.75rem' }} />}
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
				accessorKey: 'mekpDensity',
				header: 'MEKP Density',
				size: 120,
				Cell: ({ row }) => (
					<Typography
						variant="body2"
						sx={{
							color: '#333',
							fontSize: '0.875rem',
							fontWeight: 500
						}}
					>
						{row.original.mekpDensity} g/cm³
					</Typography>
				)
			},
			{
				accessorKey: 'notes',
				header: 'Notes',
				size: 250,
				Cell: ({ row }) => (
					<Typography
						variant="body2"
						sx={{
							color: '#333',
							fontSize: '0.875rem',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							display: '-webkit-box',
							WebkitLineClamp: 2,
							WebkitBoxOrient: 'vertical'
						}}
					>
						{row.original.notes}
					</Typography>
				)
			},
			{
				accessorKey: 'createdAt',
				header: 'Created',
				size: 120,
				Cell: ({ row }) => (
					<Typography
						variant="body2"
						sx={{
							color: '#333',
							fontSize: '0.875rem'
						}}
					>
						{formatDate(row.original.createdAt)}
					</Typography>
				)
			},
			{
				accessorKey: 'status',
				header: 'Status',
				size: 120,
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
		<Box sx={{ mt: 2 }}>
			<TableComponent data={data} tableColumns={columns} />

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
					<MenuItem key="edit" onClick={handleEdit}>
						<ListItemIcon>
							<EditIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText>Edit</ListItemText>
					</MenuItem>,
					<MenuItem key="delete" onClick={handleDelete} sx={{ color: 'error.main' }}>
						<ListItemIcon>
							<DeleteIcon fontSize="small" color="error" />
						</ListItemIcon>
						<ListItemText>Delete</ListItemText>
					</MenuItem>
				]}
			</Menu>
		</Box>
	);
});

export default CatalystTable;
