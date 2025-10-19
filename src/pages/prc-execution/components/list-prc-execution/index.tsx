import { useState, useMemo } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PrcExecutionHeader from './components/PrcExecutionHeader';
import SummaryCards from './components/SummaryCards';
import PrcExecutionManagement from './components/PrcExecutionManagement';
import PrcExecutionTable, { PrcExecutionData } from './components/PrcExecutionTable';
import CreatePrcExecutionModal from './components/CreatePrcExecutionModal';
import CatalystTableSkeleton from '../../../../components/common/skeleton/CatalystTableSkeleton';
import { useFetchPrcExecutionsQuery } from '../../../../store/api/business/prc-execution/prc-execution.api';

const ListPrcExecution = () => {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState('');
	const [activeFilter, setActiveFilter] = useState('All Executions');
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [executionToDelete, setExecutionToDelete] = useState<PrcExecutionData | null>(null);
	const [createModalOpen, setCreateModalOpen] = useState(false);

	// Fetch all PRC executions using the API
	const {
		data: prcExecutionData,
		isLoading: isPrcExecutionDataLoading,
		refetch: refetchPrcExecutions
	} = useFetchPrcExecutionsQuery();

	// Extract execution data for table
	const allExecutionData: PrcExecutionData[] = useMemo(() => {
		if (!prcExecutionData) return [];
		return (prcExecutionData as { data?: PrcExecutionData[] })?.data || [];
	}, [prcExecutionData]);

	// Filter and search logic
	const filteredData = useMemo(() => {
		let filtered = allExecutionData;

		// Apply status filter
		if (activeFilter !== 'All Executions') {
			if (activeFilter === 'Active') {
				filtered = filtered.filter(execution => execution.status === 'ACTIVE');
			} else if (activeFilter === 'In Progress') {
				filtered = filtered.filter(execution => execution.status === 'IN_PROGRESS');
			} else if (activeFilter === 'Completed') {
				filtered = filtered.filter(execution => execution.status === 'COMPLETED');
			} else if (activeFilter === 'Inactive') {
				filtered = filtered.filter(execution => execution.status === 'INACTIVE');
			}
		}

		// Apply search filter
		if (searchTerm) {
			filtered = filtered.filter(
				execution =>
					execution.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
					execution.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
					execution.productionSetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
					execution.mouldId.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		return filtered;
	}, [allExecutionData, activeFilter, searchTerm]);

	const handleSearchChange = (searchValue: string) => {
		setSearchTerm(searchValue);
	};

	const handleFilterChange = (filter: string) => {
		setActiveFilter(filter);
	};

	const handleCreateClick = () => {
		setCreateModalOpen(true);
	};

	const handleCreateSuccess = () => {
		refetchPrcExecutions();
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

	// Mock header data for summary cards (replace with actual API data when available)
	const mockHeaderData = {
		ACTIVE: allExecutionData.filter(e => e.status === 'ACTIVE').length,
		INACTIVE: allExecutionData.filter(e => e.status === 'INACTIVE').length,
		IN_PROGRESS: allExecutionData.filter(e => e.status === 'IN_PROGRESS').length,
		COMPLETED: allExecutionData.filter(e => e.status === 'COMPLETED').length
	};

	// Show loading state with skeleton
	if (isPrcExecutionDataLoading) {
		return (
			<Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
				<PrcExecutionHeader onCreateClick={handleCreateClick} />
				<CatalystTableSkeleton />
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
			<PrcExecutionHeader onCreateClick={handleCreateClick} />
			<SummaryCards headerData={mockHeaderData} />
			<PrcExecutionManagement onSearchChange={handleSearchChange} onFilterChange={handleFilterChange} />
			<PrcExecutionTable data={filteredData} onExecute={handleExecute} />

			{/* Create Modal */}
			<CreatePrcExecutionModal
				open={createModalOpen}
				onClose={() => setCreateModalOpen(false)}
				onSuccess={handleCreateSuccess}
			/>

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
