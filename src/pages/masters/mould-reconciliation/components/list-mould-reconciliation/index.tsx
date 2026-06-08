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
	Tooltip,
	Typography
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import {
	useFetchMouldsQuery,
	useReconcileMouldMutation
} from '../../../../../store/api/business/mould/mould.api';
import {
	type MouldReconciliationRow,
	isMouldDueForReconciliation
} from '../../../../../store/api/business/mould/mould.validators';
import CatalystTableSkeleton from '../../../../../components/common/skeleton/CatalystTableSkeleton';
import {
	deriveOptions,
	MasterFilterToolbar,
	MasterListLandingPage,
	masterListTableFrame,
	matchesMulti,
	type FilterFieldConfig,
	type FilterValue
} from '../../../../../components/masters';
import { useListView } from '../../../../../hooks/useListView';
import MouldHeader from './components/MouldHeader';
import MouldReconciliationTable from './components/MouldReconciliationTable';
import { FullScreenFormSavingOverlay } from '../../../../../components/common/FullScreenFormSavingOverlay';

const SEARCH_PLACEHOLDER = 'Part number, mould code, SAP reference';

const getRowKey = (row: MouldReconciliationRow) => String(row.id);

const ListMouldReconciliation = () => {
	const { data: rows = [], isLoading, isFetching, isError, error, refetch } = useFetchMouldsQuery();
	const [reconcileMould, { isLoading: isReconciling }] = useReconcileMouldMutation();

	const { searchTerm, filters, pagination, setSearchTerm, setFilters, setPagination } = useListView('mould');
	const [reconcilingKey, setReconcilingKey] = useState<string | null>(null);
	const [selectedRow, setSelectedRow] = useState<MouldReconciliationRow | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);

	const isReconcileBusy = reconcilingKey !== null || isReconciling;

	const fields = useMemo<FilterFieldConfig[]>(
		() => [
			{
				kind: 'autocomplete',
				key: 'partNumber',
				label: 'Part Number',
				options: deriveOptions(rows, r => r.partNumber)
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
			if (!matchesMulti(r.partNumber, filters.partNumber)) return false;
			if (!matchesMulti(r.mouldCode, filters.mouldCode)) return false;
			const due = isMouldDueForReconciliation(r);
			if (!matchesMulti(due ? 'Due' : 'Not due', filters.status)) return false;
			if (!term) return true;
			return (
				r.partNumber.toLowerCase().includes(term) ||
				r.mouldCode.toLowerCase().includes(term) ||
				(r.sapReferenceNumber ?? '').toLowerCase().includes(term)
			);
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
		setSelectedRow(row);
		setConfirmOpen(true);
		setActionError(null);
	};

	const handleConfirmClose = () => {
		setConfirmOpen(false);
		setSelectedRow(null);
	};

	const handleConfirmReconcile = async () => {
		if (!selectedRow) return;
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
				header={<MouldHeader />}
				toolbar={
					<MasterFilterToolbar
						title="Filter"
						searchPlaceholder={SEARCH_PLACEHOLDER}
						searchTerm={searchTerm}
						fields={fields}
						values={filters}
						onSearchChange={handleSearchChange}
						onFiltersChange={handleFiltersChange}
						actions={
							<Tooltip title="Refresh list">
								<span>
									<IconButton
										onClick={() => refetch()}
										disabled={isFetching && !isLoading}
										size="small"
										aria-label="Refresh list"
										sx={{ width: 26, height: 26, color: 'text.secondary' }}
									>
										<RefreshIcon sx={{ fontSize: '1rem' }} />
									</IconButton>
								</span>
							</Tooltip>
						}
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
						Reconcile mould <strong>{selectedRow?.mouldCode}</strong> for part{' '}
						<strong>{selectedRow?.partNumber}</strong>? This should reset the current count on the server.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleConfirmClose} disabled={isReconcileBusy}>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleConfirmReconcile}
						disabled={!selectedRow || isReconcileBusy}
					>
						Reconcile
					</Button>
				</DialogActions>
			</Dialog>

			<FullScreenFormSavingOverlay open={isReconcileBusy} message="Reconciling…" />
		</>
	);
};

export default ListMouldReconciliation;
