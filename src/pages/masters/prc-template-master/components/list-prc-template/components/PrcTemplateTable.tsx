import { useMemo, memo } from 'react';
import { Box, Chip, IconButton, Typography, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { type MRT_ColumnDef } from 'material-react-table';
import {
	MoreVert as MoreVertIcon,
	Assignment as AssignmentIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
	Visibility as ViewIcon,
	CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useState } from 'react';
import TableComponent from '../../../../../../components/table/TableComponent';

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
}

interface PrcTemplateTableProps {
	data: PrcTemplateData[];
	onActionClick: (templateId: string, action: string) => void;
	onEdit: (templateId: number) => void;
	onView: (templateId: number) => void;
}

const PrcTemplateTable = memo(({ data, onActionClick, onEdit, onView }: PrcTemplateTableProps) => {
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

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	const columns = useMemo<MRT_ColumnDef<PrcTemplateData>[]>(
		() => [
			{
				accessorKey: 'templateId',
				header: 'Template ID',
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
							{row.original.templateId}
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
				accessorKey: 'templateName',
				header: 'Template Name',
				size: 250,
				Cell: ({ row }) => (
					<Box>
						<Typography
							variant="body2"
							sx={{
								color: '#333',
								fontSize: '0.875rem',
								fontWeight: 500
							}}
						>
							{row.original.templateName}
						</Typography>
						<Typography
							variant="caption"
							sx={{
								color: '#999',
								fontSize: '0.75rem',
								display: 'block',
								mt: 0.5
							}}
						>
							{row.original.notes || 'No description available'}
						</Typography>
					</Box>
				)
			},
			{
				accessorKey: 'totalSteps',
				header: 'Steps',
				size: 100,
				Cell: ({ row }) => (
					<Box sx={{ textAlign: 'center' }}>
						<Typography
							variant="h6"
							sx={{
								color: '#333',
								fontSize: '1.25rem',
								fontWeight: 600
							}}
						>
							{row.original.totalSteps}
						</Typography>
						<Typography
							variant="caption"
							sx={{
								color: '#999',
								fontSize: '0.75rem'
							}}
						>
							steps
						</Typography>
					</Box>
				)
			},
			{
				accessorKey: 'status',
				header: 'Status',
				size: 120,
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
				accessorKey: 'createdAt',
				header: 'Created',
				size: 150,
				Cell: ({ row }) => (
					<Typography
						variant="body2"
						sx={{
							color: '#666',
							fontSize: '0.875rem'
						}}
					>
						{row.original.createdAt ? formatDate(row.original.createdAt) : 'N/A'}
					</Typography>
				)
			},
			{
				id: 'actions',
				header: 'Actions',
				size: 80,
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
			<TableComponent tableColumns={columns} data={safeData} />

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
