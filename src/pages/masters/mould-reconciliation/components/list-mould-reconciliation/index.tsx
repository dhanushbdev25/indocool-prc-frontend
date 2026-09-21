import { useMemo, useState, useCallback } from 'react';
import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	TextField,
	Tooltip,
	Typography
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import {
	useFetchMouldsQuery,
	useReconcileMouldMutation,
	useUpdateMouldMutation
} from '../../../../../store/api/business/mould/mould.api';
import {
	type MouldReconciliationRow,
	isMouldDueForReconciliation
} from '../../../../../store/api/business/mould/mould.validators';
import CatalystTableSkeleton from '../../../../../components/common/skeleton/CatalystTableSkeleton';
import {
	deriveOptions,
	InlineFilterBar,
	MasterListLandingPage,
	masterListTableFrame,
	matchesMulti,
	type FilterFieldConfig,
	type FilterValue
} from '../../../../../components/masters';
import { useListView } from '../../../../../hooks/useListView';
import { useCurrentRole } from '../../../../../hooks/useCurrentRole';
import MouldHeader from './components/MouldHeader';
import MouldReconciliationTable from './components/MouldReconciliationTable';
import { FullScreenFormSavingOverlay } from '../../../../../components/common/FullScreenFormSavingOverlay';

const SEARCH_PLACEHOLDER = 'SAP number, mould code';

const getRowKey = (row: MouldReconciliationRow) => String(row.id);

const ListMouldReconciliation = () => {
	const { hasPermission } = useCurrentRole();
	const canReconcileAction = hasPermission('MOULD_RECONCILIATION_CREATE') || hasPermission('MOULD_RECONCILIATION_EDIT');
	const canUpdateMould = hasPermission('MOULD_UPDATE');
	const { data: rows = [], isLoading, isFetching, isError, error, refetch } = useFetchMouldsQuery();
	const [reconcileMould, { isLoading: isReconciling }] = useReconcileMouldMutation();
	const [updateMould, { isLoading: isUpdatingMould }] = useUpdateMouldMutation();

	const { searchTerm, filters, pagination, setSearchTerm, setFilters, setPagination } = useListView('mould');
	const [reconcilingKey, setReconcilingKey] = useState<string | null>(null);
	const [selectedRow, setSelectedRow] = useState<MouldReconciliationRow | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const [editRow, setEditRow] = useState<MouldReconciliationRow | null>(null);
	const [editOpen, setEditOpen] = useState(false);
	const [editValue, setEditValue] = useState('');
	const [editError, setEditError] = useState<string | null>(null);

	const isReconcileBusy = reconcilingKey !== null || isReconciling;

	const fields = useMemo<FilterFieldConfig[]>(
		() => [
			{
				kind: 'autocomplete',
				key: 'sapReferenceNumber',
				label: 'SAP Number',
				options: deriveOptions(rows, r => r.sapReferenceNumber)
			},
			{
				kind: 'autocomplete',
				key: 'mouldCode',
				label: 'Mould Code',
				options: deriveOptions(rows, r => r.mouldCode)
			},
			{
				kind: 'autocomplete',
				key: 'status',
				label: 'Reconciliation Status',
				options: ['Due', 'Not due']
			}
		],
		[rows]
	);

	const filteredData = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();
		return rows.filter(r => {
			if (!matchesMulti(r.sapReferenceNumber, filters.sapReferenceNumber)) return false;
			if (!matchesMulti(r.mouldCode, filters.mouldCode)) return false;
			const due = isMouldDueForReconciliation(r);
			if (!matchesMulti(due ? 'Due' : 'Not due', filters.status)) return false;
			if (!term) return true;
			return (r.sapReferenceNumber ?? '').toLowerCase().includes(term) || r.mouldCode.toLowerCase().includes(term);
		});
	}, [rows, filters, searchTerm]);

	const handleFiltersChange = useCallback(
		(next: Record<string, FilterValue>) => {
			setFilters(next);
			setPagination(prev => ({ ...prev, pageIndex: 0 }));
		},
		[setFilters, setPagination]
	);

	const handleSearchChange = useCallback(
		(term: string) => {
			setSearchTerm(term);
			setPagination(prev => ({ ...prev, pageIndex: 0 }));
		},
		[setSearchTerm, setPagination]
	);

	const handleRequestReconcile = (row: MouldReconciliationRow) => {
		if (!canReconcileAction) return;
		setSelectedRow(row);
		setConfirmOpen(true);
		setActionError(null);
	};

	const handleConfirmClose = () => {
		setConfirmOpen(false);
		setSelectedRow(null);
	};

	const handleConfirmReconcile = async () => {
		if (!selectedRow || !canReconcileAction) return;
		const rowKey = getRowKey(selectedRow);
		setReconcilingKey(rowKey);
		setActionError(null);
		try {
			await reconcileMould(selectedRow.id).unwrap();
			handleConfirmClose();
		} catch {
			setActionError('Failed to reconcile. Check that the reconcile API path matches your backend.');
		} finally {
			setReconcilingKey(null);
		}
	};

	const handleRequestEdit = (row: MouldReconciliationRow) => {
		if (!canUpdateMould) return;
		setEditRow(row);
		setEditValue(String(row.totalCount ?? 0));
		setEditError(null);
		setEditOpen(true);
	};

	const handleEditClose = () => {
		setEditOpen(false);
		setEditRow(null);
		setEditValue('');
		setEditError(null);
	};

	const parsedEditValue = Number(editValue.trim());
	const isEditValueValid = editValue.trim().length > 0 && Number.isInteger(parsedEditValue) && parsedEditValue >= 0;
	const isEditValueChanged = isEditValueValid && parsedEditValue !== (editRow?.totalCount ?? 0);

	const handleConfirmEdit = async () => {
		if (!editRow || !canUpdateMould || !isEditValueValid || !isEditValueChanged) return;
		const sapReferenceNumber = editRow.sapReferenceNumber?.trim() || '';
		if (!sapReferenceNumber || !editRow.mouldCode) {
			setEditError('This mould has no SAP number or mould code, so it cannot be updated.');
			return;
		}
		setEditError(null);
		try {
			await updateMould({ sapReferenceNumber, mouldCode: editRow.mouldCode, totalCount: parsedEditValue }).unwrap();
			handleEditClose();
		} catch {
			setEditError('Failed to update the total count. Please try again.');
		}
	};

	const listErrorMessage =
		isError && error && typeof error === 'object' && 'data' in error
			? String((error as { data?: { message?: string } }).data?.message || 'Failed to load moulds.')
			: isError
				? 'Failed to load moulds. Please try again.'
				: null;

	if (isLoading) {
		return (
			<Box sx={{ minWidth: 0 }}>
				<MouldHeader />
				<CatalystTableSkeleton />
			</Box>
		);
	}

	return (
		<>
			<MasterListLandingPage
				header={
					<MouldHeader
						action={
							<Tooltip title="Refresh list">
								<span>
									<IconButton
										onClick={() => refetch()}
										disabled={isFetching && !isLoading}
										size="small"
										aria-label="Refresh list"
										sx={{
											width: 40,
											height: 40,
											borderRadius: '10px',
											border: 1,
											borderColor: 'divider',
											color: 'text.secondary',
											'&:hover': { borderColor: 'text.secondary', color: 'text.primary' }
										}}
									>
										<RefreshIcon sx={{ fontSize: '1.125rem' }} />
									</IconButton>
								</span>
							</Tooltip>
						}
					/>
				}
				toolbar={
					<InlineFilterBar
						title="Filter"
						searchPlaceholder={SEARCH_PLACEHOLDER}
						searchTerm={searchTerm}
						fields={fields}
						values={filters}
						onSearchChange={handleSearchChange}
						onApply={({ values }) => handleFiltersChange(values)}
						onReset={() => {
							setSearchTerm('');
							setFilters({});
							setPagination(prev => ({ ...prev, pageIndex: 0 }));
						}}
					/>
				}
				alerts={
					listErrorMessage ? (
						<Alert severity="error" sx={{ width: '100%' }}>
							{listErrorMessage}
						</Alert>
					) : null
				}
				table={
					<Box sx={masterListTableFrame}>
						<MouldReconciliationTable
							data={filteredData}
							reconcilingKey={reconcilingKey}
							onReconcile={handleRequestReconcile}
							onEdit={handleRequestEdit}
							pagination={pagination}
							onPaginationChange={setPagination}
						/>
					</Box>
				}
			/>

			<Dialog open={confirmOpen} onClose={handleConfirmClose} maxWidth="xs" fullWidth>
				<DialogTitle>Confirm reconciliation</DialogTitle>
				<DialogContent>
					{actionError && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{actionError}
						</Alert>
					)}
					<Typography variant="body2">
						Reconcile mould <strong>{selectedRow?.mouldCode}</strong> for SAP number{' '}
						<strong>{selectedRow?.sapReferenceNumber?.trim() || '—'}</strong>? This should reset the current count on
						the server.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleConfirmClose} disabled={isReconcileBusy}>
						Cancel
					</Button>
					<Button variant="contained" onClick={handleConfirmReconcile} disabled={!selectedRow || isReconcileBusy}>
						Reconcile
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog open={editOpen} onClose={handleEditClose} maxWidth="xs" fullWidth>
				<DialogTitle>Edit total count</DialogTitle>
				<DialogContent>
					{editError && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{editError}
						</Alert>
					)}
					<Typography variant="body2" sx={{ mb: 2 }}>
						Mould <strong>{editRow?.mouldCode}</strong> for SAP number{' '}
						<strong>{editRow?.sapReferenceNumber?.trim() || '—'}</strong>
					</Typography>
					<TextField
						fullWidth
						autoFocus
						type="number"
						label="Total count"
						value={editValue}
						onChange={e => setEditValue(e.target.value)}
						disabled={isUpdatingMould}
						error={editValue.trim().length > 0 && !isEditValueValid}
						helperText={editValue.trim().length > 0 && !isEditValueValid ? 'Enter a whole number of 0 or more' : ' '}
						slotProps={{ htmlInput: { min: 0, step: 1 } }}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleEditClose} disabled={isUpdatingMould}>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleConfirmEdit}
						disabled={!isEditValueValid || !isEditValueChanged || isUpdatingMould}
					>
						Save
					</Button>
				</DialogActions>
			</Dialog>

			<FullScreenFormSavingOverlay open={isUpdatingMould} message="Saving…" />
			<FullScreenFormSavingOverlay open={isReconcileBusy} message="Reconciling…" />
			<FullScreenFormSavingOverlay
				open={isFetching && !isLoading && !isReconcileBusy && !isUpdatingMould}
				message="Refreshing…"
			/>
		</>
	);
};

export default ListMouldReconciliation;
