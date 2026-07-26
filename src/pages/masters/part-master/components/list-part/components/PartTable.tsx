import { useMemo, memo, useState, useCallback } from 'react';
import { Box, Chip, IconButton, Typography, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { type MRT_ColumnDef, type MRT_PaginationState, type MRT_Updater } from 'material-react-table';
import {
	MoreVert as MoreVertIcon,
	Visibility as ViewIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
	Build as PartIcon,
	CheckCircle as CheckCircleIcon,
	History as HistoryIcon,
	Sync as SyncIcon,
	AccountTree as OperationsIcon
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
	sqM?: number | null;
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
	mouldCodes?: string[];
	variantId?: string;
}

interface PartTableProps {
	data: PartData[];
	onActionClick: (partId: string, action: string) => void;
	onEdit: (partId: number) => void;
	onView: (partId: number) => void;
	onAuditLogs: (part: PartData) => void;
	onSyncBom: (partId: number) => void;
	onSyncOperations: (partId: number) => void;
	isSyncingBom?: boolean;
	isSyncingOperations?: boolean;
	pagination?: MRT_PaginationState;
	onPaginationChange?: (updaterOrValue: MRT_Updater<MRT_PaginationState>) => void;
}

const PartTable = memo(
	({
		data,
		onActionClick,
		onEdit,
		onView,
		onAuditLogs,
		onSyncBom,
		onSyncOperations,
		isSyncingBom = false,
		isSyncingOperations = false,
		pagination,
		onPaginationChange
	}: PartTableProps) => {
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

		const handleAuditLogs = () => {
			if (selectedRow) onAuditLogs(selectedRow);
			handleMenuClose();
		};

		const handleSyncBom = () => {
			if (selectedRow) onSyncBom(selectedRow.id);
			handleMenuClose();
		};

		const handleSyncOperations = () => {
			if (selectedRow) onSyncOperations(selectedRow.id);
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

		const customerLabel = (row: PartData) => {
			const name = (row.customerName ?? '').trim();
			if (name) return name;
			return (row.customer ?? '').trim();
		};

		const columns = useMemo<MRT_ColumnDef<PartData>[]>(
			() => [
				{
					accessorKey: 'sapReferenceNumber',
					header: 'SAP Number',
					size: 150,
					Cell: ({ row }) => (
						<Typography variant="body2" sx={{ color: '#333', fontSize: '0.875rem' }}>
							{row.original.sapReferenceNumber?.trim() ? row.original.sapReferenceNumber : '—'}
						</Typography>
					)
				},
				{
					accessorKey: 'partNumber',
					header: 'Part Number',
					size: 200,
					Cell: ({ row }) => (
						<Typography variant="body2" sx={{ fontWeight: 500, color: '#333', fontSize: '0.875rem' }}>
							{row.original.partNumber}
						</Typography>
					)
				},
				{
					accessorKey: 'description',
					header: 'Part Description',
					size: 220,
					Cell: ({ row }) => (
						<Typography
							variant="body2"
							sx={{
								color: '#333',
								fontSize: '0.875rem',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap'
							}}
						>
							{row.original.description?.trim() ? row.original.description : '—'}
						</Typography>
					)
				},
				{
					id: 'customerName',
					header: 'Customer Name',
					size: 200,
					accessorFn: row => customerLabel(row),
					Cell: ({ row }) => (
						<Typography variant="body2" sx={{ color: '#333', fontSize: '0.875rem' }}>
							{customerLabel(row.original) || '—'}
						</Typography>
					)
				},
				{
					accessorKey: 'variantId',
					header: 'Variant',
					size: 130,
					Cell: ({ row }) => (
						<Typography variant="body2" sx={{ color: '#333', fontSize: '0.875rem' }}>
							{row.original.variantId?.trim() ? row.original.variantId : '—'}
						</Typography>
					)
				},
				{
					id: 'mouldCodes',
					header: 'Moulds',
					size: 180,
					accessorFn: row => (row.mouldCodes ?? []).join(', '),
					Cell: ({ row }) => {
						const codes = row.original.mouldCodes ?? [];
						if (codes.length === 0) {
							return (
								<Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
									—
								</Typography>
							);
						}
						return (
							<Typography variant="body2" sx={{ color: '#333', fontSize: '0.875rem' }}>
								{codes.join(', ')}
							</Typography>
						);
					}
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
					exportTitle="part-master"
				/>

				<Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
					<MenuItem onClick={handleView}>
						<ListItemIcon>
							<ViewIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText>View</ListItemText>
					</MenuItem>
					<MenuItem onClick={handleAuditLogs}>
						<ListItemIcon>
							<HistoryIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText>Audit Logs</ListItemText>
					</MenuItem>
					{canEdit && (
						<MenuItem onClick={handleSyncBom} disabled={isSyncingBom}>
							<ListItemIcon>
								<SyncIcon fontSize="small" />
							</ListItemIcon>
							<ListItemText>Sync SAP BOM</ListItemText>
						</MenuItem>
					)}
					{canEdit && (
						<MenuItem onClick={handleSyncOperations} disabled={isSyncingOperations}>
							<ListItemIcon>
								<OperationsIcon fontSize="small" />
							</ListItemIcon>
							<ListItemText>Sync SAP Operations</ListItemText>
						</MenuItem>
					)}
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
	}
);

PartTable.displayName = 'PartTable';

export default PartTable;
