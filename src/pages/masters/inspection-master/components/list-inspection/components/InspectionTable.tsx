import { useMemo, memo } from 'react';
import { Box, Chip, IconButton, Typography, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { type MRT_ColumnDef, type MRT_PaginationState, type MRT_Updater } from 'material-react-table';
import {
	MoreVert as MoreVertIcon,
	CheckCircle as CheckCircleIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
	Visibility as ViewIcon,
	ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { useState } from 'react';
import TableComponent from '../../../../../../components/table/TableComponent';
import { useCurrentRole } from '../../../../../../hooks/useCurrentRole';

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
	approveByProduction?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

const approveLabel = (v: boolean | undefined) => (v === true ? 'Yes' : 'No');

interface InspectionTableProps {
	data: InspectionData[];
	onActionClick?: (inspectionId: string, action: string) => void;
	onEdit?: (inspectionId: number) => void;
	onView?: (inspectionId: number) => void;
	onClone?: (inspectionId: number) => void;
	pagination?: MRT_PaginationState;
	onPaginationChange?: (updaterOrValue: MRT_Updater<MRT_PaginationState>) => void;
}

const InspectionTable = memo(({ data, onActionClick, onEdit, onView, onClone, pagination, onPaginationChange }: InspectionTableProps) => {
	const { hasPermission } = useCurrentRole();
	const canEdit = hasPermission('INSPECTION_MASTER_EDIT');
	const canCreate = hasPermission('INSPECTION_MASTER_CREATE');
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

	const handleClone = () => {
		if (selectedRow && onClone) {
			onClone(selectedRow.id);
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
					<Typography variant="body2" sx={{ fontWeight: 500, color: '#333', fontSize: '0.875rem' }}>
						{row.original.inspectionId}
					</Typography>
				)
			},
			{
				accessorKey: 'inspectionName',
				header: 'Inspection Name',
				size: 220,
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
				accessorKey: 'type',
				header: 'Type',
				size: 140
			},
			{
				id: 'approveByProduction',
				accessorFn: row => approveLabel(row.approveByProduction),
				header: 'Approve By Production',
				size: 170,
				filterVariant: 'select',
				filterSelectOptions: ['Yes', 'No'],
				Cell: ({ row }) => (
					<Chip
						label={approveLabel(row.original.approveByProduction)}
						size="small"
						color={row.original.approveByProduction === true ? 'success' : 'default'}
						variant={row.original.approveByProduction === true ? 'filled' : 'outlined'}
					/>
				)
			},
			{
				accessorKey: 'createdAt',
				header: 'Created On',
				size: 120,
				enableColumnFilter: false,
				Cell: ({ row }) => (
					<Typography variant="body2" sx={{ color: '#333', fontSize: '0.875rem' }}>
						{row.original.createdAt ? formatDate(row.original.createdAt) : '—'}
					</Typography>
				)
			},
			{
				accessorKey: 'status',
				header: 'Status',
				size: 120,
				filterVariant: 'select',
				filterSelectOptions: ['ACTIVE', 'INACTIVE'],
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
				exportTitle="inspection-master"
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
					canCreate && (
						<MenuItem key="clone" onClick={handleClone}>
							<ListItemIcon>
								<ContentCopyIcon fontSize="small" />
							</ListItemIcon>
							<ListItemText>Clone</ListItemText>
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

export default InspectionTable;
