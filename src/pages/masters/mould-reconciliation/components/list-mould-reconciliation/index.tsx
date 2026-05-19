import { useMemo, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Typography
} from '@mui/material';
import {
	useFetchMouldsQuery,
	useReconcileMouldMutation
} from '../../../../../store/api/business/mould/mould.api';
import {
	type MouldReconciliationRow,
	isMouldDueForReconciliation
} from '../../../../../store/api/business/mould/mould.validators';
import CatalystTableSkeleton from '../../../../../components/common/skeleton/CatalystTableSkeleton';
import { formatFilteredListSummary, MasterListLandingPage, masterListTableFrame } from '../../../../../components/masters';
import MouldHeader from './components/MouldHeader';
import MouldSummaryCards from './components/MouldSummaryCards';
import MouldManagement, { MOULD_ALL_PART_NUMBERS } from './components/MouldManagement';
import MouldReconciliationTable from './components/MouldReconciliationTable';
import { FullScreenFormSavingOverlay } from '../../../../../components/common/FullScreenFormSavingOverlay';

const getRowKey = (row: MouldReconciliationRow) => String(row.id);

const ListMouldReconciliation = () => {
	const { data: rows = [], isLoading, isFetching, isError, error, refetch } = useFetchMouldsQuery();
	const [reconcileMould, { isLoading: isReconciling }] = useReconcileMouldMutation();

	const [searchTerm, setSearchTerm] = useState('');
	const [activeFilter, setActiveFilter] = useState('All Moulds');
	const [activePartFilter, setActivePartFilter] = useState(MOULD_ALL_PART_NUMBERS);
	const [reconcilingKey, setReconcilingKey] = useState<string | null>(null);
	const [selectedRow, setSelectedRow] = useState<MouldReconciliationRow | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);

	const isReconcileBusy = reconcilingKey !== null || isReconciling;

	const summary = useMemo(() => {
		const dueCount = rows.filter(isMouldDueForReconciliation).length;
		return {
			totalMoulds: rows.length,
			dueCount,
			notDueCount: rows.length - dueCount
		};
	}, [rows]);

	const partNumberOptions = useMemo(() => {
		const s = new Set<string>();
		for (const r of rows) {
			const p = (r.partNumber ?? '').trim();
			if (p) s.add(p);
		}
		return [...s].sort((a, b) => a.localeCompare(b));
	}, [rows]);

	const filteredData = useMemo(() => {
		let list = rows;

		if (activePartFilter !== MOULD_ALL_PART_NUMBERS) {
			list = list.filter(item => item.partNumber === activePartFilter);
		}

		if (searchTerm.trim()) {
			const needle = searchTerm.trim().toLowerCase();
			list = list.filter(
				item =>
					item.partNumber.toLowerCase().includes(needle) ||
					item.mouldCode.toLowerCase().includes(needle) ||
					(item.sapReferenceNumber ?? '').toLowerCase().includes(needle)
			);
		}

		if (activeFilter === 'Due') {
			list = list.filter(isMouldDueForReconciliation);
		} else if (activeFilter === 'Not due') {
			list = list.filter(row => !isMouldDueForReconciliation(row));
		}

		return list;
	}, [rows, searchTerm, activeFilter, activePartFilter]);

	const listSummary = useMemo(
		() => formatFilteredListSummary(filteredData.length, rows.length, 'moulds'),
		[filteredData.length, rows.length]
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
				header={<MouldHeader onRefresh={() => refetch()} isRefreshing={isFetching && !isLoading} />}
				metrics={
					<MouldSummaryCards totalMoulds={summary.totalMoulds} dueCount={summary.dueCount} notDueCount={summary.notDueCount} />
				}
				toolbar={
					<MouldManagement
						appliedSearchTerm={searchTerm}
						searchAriaLabel="Search moulds"
						listSummary={listSummary}
						activeFilter={activeFilter}
						partNumberFilter={activePartFilter}
						partNumberOptions={partNumberOptions}
						onSearchChange={setSearchTerm}
						onFilterChange={setActiveFilter}
						onPartNumberFilterChange={setActivePartFilter}
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
