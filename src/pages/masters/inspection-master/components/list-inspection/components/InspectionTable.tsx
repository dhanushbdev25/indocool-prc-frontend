import { useMemo, memo } from 'react';
import { Box, Chip, IconButton, Typography, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { type MRT_ColumnDef } from 'material-react-table';
import {
	MoreVert as MoreVertIcon,
	CheckCircle as CheckCircleIcon,
	Assignment as AssignmentIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
	Visibility as ViewIcon,
	Warning as WarningIcon
} from '@mui/icons-material';
import { useState } from 'react';
import TableComponent from '../../../../../../components/table/TableComponent';

// Use the Zod-validated type from the API
export interface InspectionData {
	id: number;
	inspectionId: string;
	inspectionName: string;
	type: string;
	status: string;
	version: number;
	ctqParameters: number;
	totalParameters: number;
	createdAt?: string;
	updatedAt?: string;
}

interface InspectionTableProps {
	data: InspectionData[];
	onActionClick?: (inspectionId: string, action: string) => void;
	onEdit?: (inspectionId: number) => void;
	onView?: (inspectionId: number) => void;
}

const InspectionTable = memo(({ data, onActionClick, onEdit, onView }: InspectionTableProps) => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedRow, setSelectedRow] = useState<InspectionData | null>(null);

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

	const handleMenuClick = (event: React.MouseEvent<HTMLElement>, row: InspectionData) => {
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
			onActionClick(selectedRow.inspectionId, 'delete');
		}
		handleMenuClose();
	};

	const columns = useMemo<MRT_ColumnDef<InspectionData>[]>(
		() => [
			{
				accessorKey: 'inspectionId',
				header: 'Inspection ID',
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
							{row.original.inspectionId}
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
							label={row.original.type}
							size="small"
							icon={<AssignmentIcon sx={{ fontSize: '0.75rem' }} />}
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
				accessorKey: 'inspectionName',
				header: 'Inspection Name',
				size: 250,
				Cell: ({ row }) => (
					<Typography
						variant="body2"
						sx={{
							color: '#333',
							fontSize: '0.875rem',
							fontWeight: 500,
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							display: '-webkit-box',
							WebkitLineClamp: 2,
							WebkitBoxOrient: 'vertical'
						}}
					>
						{row.original.inspectionName}
					</Typography>
				)
			},
			{
				accessorKey: 'version',
				header: 'Version',
				size: 100,
				Cell: ({ row }) => (
					<Typography
						variant="body2"
						sx={{
							color: '#333',
							fontSize: '0.875rem',
							fontWeight: 500
						}}
					>
						v{row.original.version}
					</Typography>
				)
			},
			{
				accessorKey: 'ctqParameters',
				header: 'CTQ Parameters',
				size: 120,
				Cell: ({ row }) => (
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<Chip
							icon={<WarningIcon sx={{ fontSize: '0.75rem' }} />}
							label={row.original.ctqParameters}
							size="small"
							sx={{
								backgroundColor: '#fff3e0',
								color: '#f57c00',
								fontSize: '0.625rem',
								height: '20px',
								'& .MuiChip-icon': {
									color: '#f57c00'
								}
							}}
						/>
					</Box>
				)
			},
			{
				accessorKey: 'totalParameters',
				header: 'Total Parameters',
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
						{row.original.totalParameters}
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
						{row.original.createdAt ? formatDate(row.original.createdAt) : '-'}
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

export default InspectionTable;
