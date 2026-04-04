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
import MouldHeader from './components/MouldHeader';
import MouldSummaryCards from './components/MouldSummaryCards';
import MouldManagement from './components/MouldManagement';
import MouldReconciliationTable from './components/MouldReconciliationTable';

const getRowKey = (row: MouldReconciliationRow) => String(row.id);

const ListMouldReconciliation = () => {
	const { data: rows = [], isLoading, isFetching, isError, error, refetch } = useFetchMouldsQuery();
	const [reconcileMould, { isLoading: isReconciling }] = useReconcileMouldMutation();

	const [searchTerm, setSearchTerm] = useState('');
	const [activeFilter, setActiveFilter] = useState('All Moulds');
	const [reconcilingKey, setReconcilingKey] = useState<string | null>(null);
	const [selectedRow, setSelectedRow] = useState<MouldReconciliationRow | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);

	const summary = useMemo(() => {
		const dueCount = rows.filter(isMouldDueForReconciliation).length;
		return {
			totalMoulds: rows.length,
			dueCount,
			notDueCount: rows.length - dueCount
		};
	}, [rows]);

	const filteredData = useMemo(() => {
		let list = rows;

		if (searchTerm.trim()) {
			const needle = searchTerm.trim().toLowerCase();
			list = list.filter(
				item => item.partNumber.toLowerCase().includes(needle) || item.mouldCode.toLowerCase().includes(needle)
			);
		}

		if (activeFilter === 'Due') {
			list = list.filter(isMouldDueForReconciliation);
		} else if (activeFilter === 'Not due') {
			list = list.filter(row => !isMouldDueForReconciliation(row));
		}

		return list;
	}, [rows, searchTerm, activeFilter]);

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
			<Box sx={{ p: 3, minHeight: '100vh' }}>
				<MouldHeader />
				<CatalystTableSkeleton />
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3, minHeight: '100vh' }}>
			<MouldHeader onRefresh={() => refetch()} isRefreshing={isFetching && !isLoading} />
			<MouldSummaryCards
				totalMoulds={summary.totalMoulds}
				dueCount={summary.dueCount}
				notDueCount={summary.notDueCount}
			/>

			<MouldManagement
				searchTerm={searchTerm}
				activeFilter={activeFilter}
				onSearchChange={setSearchTerm}
				onFilterChange={setActiveFilter}
			/>

			{listErrorMessage && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{listErrorMessage}
				</Alert>
			)}

			<Box
				sx={{
					backgroundColor: 'white',
					borderRadius: '12px',
					boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
					overflow: 'hidden'
				}}
			>
				<MouldReconciliationTable
					data={filteredData}
					reconcilingKey={reconcilingKey}
					onReconcile={handleRequestReconcile}
				/>
			</Box>

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
					<Button onClick={handleConfirmClose} disabled={isReconciling}>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleConfirmReconcile}
						disabled={!selectedRow || reconcilingKey === getRowKey(selectedRow) || isReconciling}
					>
						{selectedRow && (reconcilingKey === getRowKey(selectedRow) || isReconciling)
							? 'Reconciling...'
							: 'Reconcile'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default ListMouldReconciliation;
