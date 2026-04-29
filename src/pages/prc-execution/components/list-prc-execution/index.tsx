import { useState, useMemo } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PrcExecutionHeader from './components/PrcExecutionHeader';
import PrcExecutionManagement from './components/PrcExecutionManagement';
import PrcExecutionTable, { PrcExecutionData } from './components/PrcExecutionTable';
import CatalystTableSkeleton from '../../../../components/common/skeleton/CatalystTableSkeleton';
import { useFetchPrcExecutionsQuery } from '../../../../store/api/business/prc-execution/prc-execution.api';

const ListPrcExecution = () => {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState('');
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [executionToDelete, setExecutionToDelete] = useState<PrcExecutionData | null>(null);
	// Fetch all PRC executions using the API
	const {
		data: prcExecutionData,
		isLoading: isPrcExecutionDataLoading,
		isFetching: isPrcExecutionDataFetching
	} = useFetchPrcExecutionsQuery();

	// Extract execution data for table
	const allExecutionData: PrcExecutionData[] = useMemo(() => {
		if (!prcExecutionData) return [];
		return (prcExecutionData as { data?: PrcExecutionData[] })?.data || [];
	}, [prcExecutionData]);

	// Filter and search logic
	const filteredData = useMemo(() => {
		let filtered = allExecutionData;

		// Apply search filter
		if (searchTerm) {
			const q = searchTerm.toLowerCase();
			filtered = filtered.filter(execution => {
				const idStr = String(execution.id ?? '').toLowerCase();
				const orderId = String((execution as { orderId?: string | number | null }).orderId ?? '').toLowerCase();
				const partNumber = (execution.partNumber ?? '').toLowerCase();
				const productionSetId = (execution.productionSetId ?? '').toLowerCase();
				const mould = (execution.mouldId ?? '').toLowerCase();
				const customerName = (execution.customerName ?? '').toLowerCase();
				const sapRef = (execution.sapReferenceNumber ?? '').toLowerCase();
				return (
					idStr.includes(q) ||
					orderId.includes(q) ||
					partNumber.includes(q) ||
					productionSetId.includes(q) ||
					mould.includes(q) ||
					customerName.includes(q) ||
					sapRef.includes(q)
				);
			});
		}

		return filtered;
	}, [allExecutionData, searchTerm]);

	const handleSearchChange = (searchValue: string) => {
		setSearchTerm(searchValue);
	};

	const handleExecute = (executionId: number) => {
		navigate(`/prc-execution/execute/${executionId}`);
	};

	const handleDeleteConfirm = async () => {
		// TODO: Implement delete functionality when API is available
		// For now, just close the dialog
		setDeleteDialogOpen(false);
		setExecutionToDelete(null);
	};

	const handleDeleteCancel = () => {
		setDeleteDialogOpen(false);
		setExecutionToDelete(null);
	};

	// Show loading state with skeleton
	if (isPrcExecutionDataLoading || isPrcExecutionDataFetching) {
		return (
			<Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
				<PrcExecutionHeader />
				<CatalystTableSkeleton />
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
			<PrcExecutionHeader />
			<PrcExecutionManagement onSearchChange={handleSearchChange} />
			<PrcExecutionTable data={filteredData} onExecute={handleExecute} />

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
				<DialogTitle>Delete PRC Execution</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to delete the PRC execution for <strong>{executionToDelete?.partNumber}</strong>? This
						will set the status to INACTIVE and preserve all remaining data.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleDeleteCancel}>Cancel</Button>
					<Button onClick={handleDeleteConfirm} color="error" variant="contained">
						Delete Execution
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default ListPrcExecution;
