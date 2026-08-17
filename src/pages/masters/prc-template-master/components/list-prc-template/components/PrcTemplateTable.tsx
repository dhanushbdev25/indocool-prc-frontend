import { useMemo, memo } from 'react';
import { Box, Chip, IconButton, Typography, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { type MRT_ColumnDef, type MRT_PaginationState, type MRT_Updater } from 'material-react-table';
import {
	MoreVert as MoreVertIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
	Visibility as ViewIcon,
	CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useState } from 'react';
import TableComponent from '../../../../../../components/table/TableComponent';
import { formatDisplayDate } from '../../../../../../utils/formatDisplayDate';

export interface PrcTemplateData {
	id: number;
	templateId: string;
	templateName: string;
	status: string;
	version: number;
	totalSteps: number;
	notes?: string;
	createdAt: string;
	updatedAt: string;
	/** Mirrors API `prcTemplate.isActive` (in customer catalogue). */
	isActive: boolean;
}

interface PrcTemplateTableProps {
	data: PrcTemplateData[];
	onActionClick: (templateId: string, action: string) => void;
	onEdit: (templateId: number) => void;
	onView: (templateId: number) => void;
	pagination?: MRT_PaginationState;
	onPaginationChange?: (updaterOrValue: MRT_Updater<MRT_PaginationState>) => void;
}

const PrcTemplateTable = memo(({ data, onActionClick, onEdit, onView, pagination, onPaginationChange }: PrcTemplateTableProps) => {
	// Safety check for data
	const safeData = data || [];
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedRow, setSelectedRow] = useState<PrcTemplateData | null>(null);

	const handleMenuClick = (event: React.MouseEvent<HTMLElement>, row: PrcTemplateData) => {
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
			onActionClick(selectedRow.templateId, 'delete');
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

	const columns = useMemo<MRT_ColumnDef<PrcTemplateData>[]>(
		() => [
			{
				accessorKey: 'templateId',
				header: 'Template ID',
				size: 200,
				Cell: ({ row }) => (
					<Typography variant="body2" sx={{ fontWeight: 500, color: '#333', fontSize: '0.875rem' }}>
						{row.original.templateId}
					</Typography>
				)
			},
			{
				accessorKey: 'templateName',
				header: 'Template Name',
				size: 250,
				Cell: ({ row }) => (
					<Typography variant="body2" sx={{ color: '#333', fontSize: '0.875rem', fontWeight: 500 }}>
						{row.original.templateName}
					</Typography>
				)
			},
			{
				id: 'catalogue',
				header: 'Catalogue',
				size: 150,
				accessorFn: row => (row.isActive ? 'In catalogue' : 'Out of catalogue'),
				Cell: ({ row }) => (
					<Chip
						label={row.original.isActive ? 'In catalogue' : 'Out of catalogue'}
						size="small"
						color={row.original.isActive ? 'success' : 'default'}
						variant={row.original.isActive ? 'filled' : 'outlined'}
					/>
				)
			},
			{
				accessorKey: 'createdAt',
				header: 'Created On',
				size: 150,
				enableColumnFilter: false,
				Cell: ({ row }) => (
					<Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
						{formatDisplayDate(row.original.createdAt)}
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
				id: 'actions',
				header: 'Actions',
				size: 80,
				enableSorting: false,
				enableColumnFilter: false,
				Cell: ({ row }) => (
					<Box>
						<IconButton size="small" onClick={e => handleMenuClick(e, row.original)} sx={{ color: '#666' }}>
							<MoreVertIcon />
						</IconButton>
					</Box>
				)
			}
		],
		[]
	);

	if (safeData.length === 0) {
		return (
			<Box sx={{ p: 4, textAlign: 'center' }}>
				<Typography variant="h6" color="textSecondary">
					No PRC templates found
				</Typography>
				<Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
					Create your first PRC template to get started
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
				exportTitle="prc-template-master"
			/>

			{/* Action Menu */}
			<Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
				<MenuItem onClick={handleView}>
					<ListItemIcon>
						<ViewIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>View</ListItemText>
				</MenuItem>
				<MenuItem onClick={handleEdit}>
					<ListItemIcon>
						<EditIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>Edit</ListItemText>
				</MenuItem>
				<MenuItem onClick={handleDelete} sx={{ color: '#f44336' }}>
					<ListItemIcon>
						<DeleteIcon fontSize="small" sx={{ color: '#f44336' }} />
					</ListItemIcon>
					<ListItemText>Delete</ListItemText>
				</MenuItem>
			</Menu>
		</>
	);
});

PrcTemplateTable.displayName = 'PrcTemplateTable';

export default PrcTemplateTable;
