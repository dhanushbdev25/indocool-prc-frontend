import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Paper,
	TextField,
	Typography
} from '@mui/material';
import {
	getDueMouldes,
	PartMouldeMapping,
	reconcileMoulde
} from '../../../../../mocks/moulde-reconciliation.mock';
import MouldeReconciliationTable from './components/MouldeReconciliationTable';

const getRowKey = (row: PartMouldeMapping) => `${row.partNumber}__${row.mouldeCode}`;

const ListMouldeReconciliation = () => {
	const [allDueData, setAllDueData] = useState<PartMouldeMapping[]>([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reconcilingKey, setReconcilingKey] = useState<string | null>(null);
	const [selectedRow, setSelectedRow] = useState<PartMouldeMapping | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);

	const loadDueMouldes = useCallback(async () => {
		setError(null);
		setIsLoading(true);
		try {
			const data = await getDueMouldes();
			setAllDueData(data);
		} catch {
			setError('Failed to load due mouldes. Please try again.');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadDueMouldes();
	}, [loadDueMouldes]);

	const filteredData = useMemo(() => {
		if (!searchTerm.trim()) return allDueData;
		const needle = searchTerm.trim().toLowerCase();
		return allDueData.filter(
			item => item.partNumber.toLowerCase().includes(needle) || item.mouldeCode.toLowerCase().includes(needle)
		);
	}, [allDueData, searchTerm]);

	const handleRequestReconcile = (row: PartMouldeMapping) => {
		setSelectedRow(row);
		setConfirmOpen(true);
	};

	const handleConfirmClose = () => {
		setConfirmOpen(false);
		setSelectedRow(null);
	};

	const handleConfirmReconcile = async () => {
		if (!selectedRow) return;
		const rowKey = getRowKey(selectedRow);
		setReconcilingKey(rowKey);
		setError(null);
		try {
			await reconcileMoulde(selectedRow.partNumber, selectedRow.mouldeCode);
			await loadDueMouldes();
			handleConfirmClose();
		} catch {
			setError('Failed to reconcile selected moulde. Please retry.');
		} finally {
			setReconcilingKey(null);
		}
	};

	return (
		<Box sx={{ p: 3, minHeight: '100vh' }}>
			<Paper sx={{ p: 3, borderRadius: 2 }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
					<Typography variant="h5" sx={{ fontWeight: 600 }}>
						Moulde Reconciliation
					</Typography>
					<TextField
						size="small"
						label="Search Part / Moulde"
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
					/>
				</Box>

				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}

				{isLoading ? (
					<Typography variant="body2">Loading due mouldes...</Typography>
				) : (
					<MouldeReconciliationTable
						data={filteredData}
						reconcilingKey={reconcilingKey}
						onReconcile={handleRequestReconcile}
					/>
				)}
			</Paper>

			<Dialog open={confirmOpen} onClose={handleConfirmClose} maxWidth="xs" fullWidth>
				<DialogTitle>Confirm Reconciliation</DialogTitle>
				<DialogContent>
					<Typography variant="body2">
						Reconcile moulde <strong>{selectedRow?.mouldeCode}</strong> for part <strong>{selectedRow?.partNumber}</strong>?
						This will reset the current count to 0.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleConfirmClose}>Cancel</Button>
					<Button
						variant="contained"
						onClick={handleConfirmReconcile}
						disabled={!selectedRow || reconcilingKey === getRowKey(selectedRow)}
					>
						{selectedRow && reconcilingKey === getRowKey(selectedRow) ? 'Reconciling...' : 'Reconcile'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default ListMouldeReconciliation;
