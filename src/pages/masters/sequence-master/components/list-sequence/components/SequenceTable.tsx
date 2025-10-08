import { useMemo, memo } from 'react';
import { Box, Chip, IconButton, Typography, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { type MRT_ColumnDef } from 'material-react-table';
import {
	MoreVert as MoreVertIcon,
	CheckCircle as CheckCircleIcon,
	Category as CategoryIcon,
	Edit as EditIcon,
	Delete as DeleteIcon
} from '@mui/icons-material';
import { useState } from 'react';
import TableComponent from '../../../../../../components/table/TableComponent';
import { type ProcessSequence } from '../../../../../../store/api/business/sequence-master/sequence.validators';

// Use the Zod-validated type from the API
export type SequenceData = ProcessSequence;

interface SequenceTableProps {
	data: SequenceData[];
	onActionClick?: (sequenceId: string, action: string) => void;
	onEdit?: (sequenceId: number) => void;
}

const SequenceTable = memo(({ data, onActionClick, onEdit }: SequenceTableProps) => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedRow, setSelectedRow] = useState<SequenceData | null>(null);

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'ACTIVE':
				return '#4caf50';
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

	const handleMenuClick = (event: React.MouseEvent<HTMLElement>, row: SequenceData) => {
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

	const handleDelete = () => {
		if (selectedRow && onActionClick) {
			onActionClick(selectedRow.sequenceId, 'delete');
		}
		handleMenuClose();
	};

	const columns = useMemo<MRT_ColumnDef<SequenceData>[]>(
		() => [
			{
				accessorKey: 'sequenceId',
				header: 'Sequence ID',
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
							{row.original.sequenceId}
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
							label={row.original.category}
							size="small"
							icon={<CategoryIcon sx={{ fontSize: '0.75rem' }} />}
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
				accessorKey: 'sequenceName',
				header: 'Sequence Name',
				size: 250,
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
							{row.original.sequenceName}
						</Typography>
						<Typography
							variant="caption"
							sx={{
								color: '#666',
								fontSize: '0.75rem'
							}}
						>
							Type: {row.original.type}
						</Typography>
					</Box>
				)
			},
			{
				accessorKey: 'totalSteps',
				header: 'Steps',
				size: 120,
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
							{row.original.totalSteps} Total
						</Typography>
						<Typography
							variant="caption"
							sx={{
								color: '#f44336',
								fontSize: '0.75rem',
								fontWeight: 500
							}}
						>
							{row.original.ctqSteps} CTQ
						</Typography>
					</Box>
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

export default SequenceTable;
