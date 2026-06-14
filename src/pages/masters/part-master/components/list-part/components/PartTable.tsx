import { useMemo, memo, useState, useCallback } from 'react';
import { Box, Chip, IconButton, Typography, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { type MRT_ColumnDef, type MRT_PaginationState, type MRT_Updater } from 'material-react-table';
import {
	MoreVert as MoreVertIcon,
	Visibility as ViewIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
	Build as PartIcon,
	CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import TableComponent from '../../../../../../components/table/TableComponent';
import { useCurrentRole } from '../../../../../../hooks/useCurrentRole';

export interface PartData {
	id: number;
	partNumber: string;
	drawingNumber: string;
	status: string;
	customer: string;
	customerName: string;
	description: string;
	sapReferenceNumber?: string;
	layupType?: string | null;
	model?: string | null;
	version: number;
	totalRawMaterials: number;
	totalDrilling: number;
	totalCutting: number;
	totalMoulds?: number;
	dueMoulds?: number;
	createdAt: string;
	updatedAt: string;
}

interface PartTableProps {
	data: PartData[];
	onActionClick: (partId: string, action: string) => void;
	onEdit: (partId: number) => void;
	onView: (partId: number) => void;
	pagination?: MRT_PaginationState;
	onPaginationChange?: (updaterOrValue: MRT_Updater<MRT_PaginationState>) => void;
}

const PartTable = memo(({ data, onActionClick, onEdit, onView, pagination, onPaginationChange }: PartTableProps) => {
	const { hasPermission } = useCurrentRole();
	const canEdit = hasPermission('PART_MASTER_EDIT');
	const safeData = data || [];
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedRow, setSelectedRow] = useState<PartData | null>(null);

	const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>, row: PartData) => {
		setAnchorEl(event.currentTarget);
		setSelectedRow(row);
	}, []);

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
			onActionClick(selectedRow.partNumber, 'delete');
		}
		handleMenuClose();
	};

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

	const columns = useMemo<MRT_ColumnDef<PartData>[]>(
		() => [
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
							icon={<PartIcon sx={{ fontSize: '0.75rem' }} />}
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
				accessorKey: 'drawingNumber',
				header: 'Drawing Number',
				size: 150,
				Cell: ({ row }) => (
					<Typography
						variant="body2"
						sx={{
							color: '#333',
							fontSize: '0.875rem',
							fontWeight: 500
						}}
					>
						{row.original.drawingNumber}
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
						label={row.original.status}
						icon={<CheckCircleIcon sx={{ fontSize: '0.875rem' }} />}
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
				id: 'customerDisplay',
				accessorFn: row => row.customerName || row.customer,
				header: 'Customer',
				size: 200,
				Cell: ({ row }) => (
					<Typography
						variant="body2"
						sx={{
							color: '#666',
							fontSize: '0.875rem'
						}}
					>
						{row.original.customerName || row.original.customer}
					</Typography>
				)
			},
			{
				accessorKey: 'sapReferenceNumber',
				header: 'SAP reference',
				size: 150,
				Cell: ({ row }) => (
					<Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
						{row.original.sapReferenceNumber?.trim() ? row.original.sapReferenceNumber : '—'}
					</Typography>
				)
			},
			{
				accessorKey: 'layupType',
				header: 'Layup type',
				size: 130,
				Cell: ({ row }) => (
					<Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
						{row.original.layupType?.trim() ? row.original.layupType : '—'}
					</Typography>
				)
			},
			{
				accessorKey: 'model',
				header: 'Model',
				size: 130,
				Cell: ({ row }) => (
					<Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
						{row.original.model?.trim() ? row.original.model : '—'}
					</Typography>
				)
			},
			{
				accessorKey: 'description',
				header: 'Description',
				size: 220,
				Cell: ({ row }) => (
					<Typography
						variant="body2"
						sx={{
							color: '#666',
							fontSize: '0.875rem',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap'
						}}
					>
						{row.original.description}
					</Typography>
				)
			},
			{
				id: 'componentsSummary',
				accessorFn: row =>
					`RM ${row.totalRawMaterials} Drill ${row.totalDrilling} Cut ${row.totalCutting}`,
				header: 'Components',
				size: 180,
				enableColumnFilter: false,
				Cell: ({ row }) => (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
						<Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#666' }}>
							RM: {row.original.totalRawMaterials}
						</Typography>
						<Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#666' }}>
							Drill: {row.original.totalDrilling} | Cut: {row.original.totalCutting}
						</Typography>
					</Box>
				)
			},
			{
				id: 'mouldsSummary',
				accessorFn: row => `Total ${row.totalMoulds ?? 0} Due ${row.dueMoulds ?? 0}`,
				header: 'Moulds',
				size: 140,
				enableColumnFilter: false,
				Cell: ({ row }) => (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
						<Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#666' }}>
							Total: {row.original.totalMoulds || 0}
						</Typography>
						<Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>
							Due: {row.original.dueMoulds || 0}
						</Typography>
					</Box>
				)
			},
			{
				id: 'actions',
				header: 'Actions',
				size: 80,
				enableSorting: false,
				enableColumnFilter: false,
				Cell: ({ row }) => (
					<IconButton size="small" onClick={e => handleMenuClick(e, row.original)} sx={{ color: '#666' }}>
						<MoreVertIcon fontSize="small" />
					</IconButton>
				)
			}
		],
		[handleMenuClick]
	);

	if (safeData.length === 0) {
		return (
			<Box sx={{ textAlign: 'center', py: 8 }}>
				<PartIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
				<Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
					No Parts Found
				</Typography>
				<Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
					Create your first part to get started
				</Typography>
			</Box>
		);
	}

	return (
		<>
			<TableComponent
				tableColumns={columns}
				data={safeData}
				pagination={pagination}
				onPaginationChange={onPaginationChange}
			/>

			<Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
				<MenuItem onClick={handleView}>
					<ListItemIcon>
						<ViewIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>View</ListItemText>
				</MenuItem>
				{canEdit && (
					<MenuItem onClick={handleEdit}>
						<ListItemIcon>
							<EditIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText>Edit</ListItemText>
					</MenuItem>
				)}
				{canEdit && (
					<MenuItem onClick={handleDelete} sx={{ color: '#f44336' }}>
						<ListItemIcon>
							<DeleteIcon fontSize="small" sx={{ color: '#f44336' }} />
						</ListItemIcon>
						<ListItemText>Delete</ListItemText>
					</MenuItem>
				)}
			</Menu>
		</>
	);
});

PartTable.displayName = 'PartTable';

export default PartTable;
