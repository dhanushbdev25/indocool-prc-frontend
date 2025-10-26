import { useState, useMemo } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CatalystHeader from './components/CatalystHeader';
import SummaryCards from './components/SummaryCards';
import ChartManagement from './components/ChartManagement';
import CatalystTable, { CatalystData } from './components/CatalystTable';
import CatalystTableSkeleton from '../../../../../components/common/skeleton/CatalystTableSkeleton';
import {
	useFetchCatalystChartsQuery,
	useDeleteCatalystTaskMutation
} from '../../../../../store/api/business/catalyst-master/catalyst.api';
import { type DeleteCatalystTaskRequest } from '../../../../../store/api/business/catalyst-master/catalyst.validators';

const ListCatalyst = () => {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState('');
	const [activeFilter, setActiveFilter] = useState('All Charts');
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [catalystToDelete, setCatalystToDelete] = useState<CatalystData | null>(null);

	// Fetch all catalyst charts using the API with Zod validation
	const {
		data: catalystChartData,
		isLoading: isCatalystDataLoading,
		refetch: refetchCatalystCharts
	} = useFetchCatalystChartsQuery();

	// Delete task mutation
	const [deleteCatalystTask, { isLoading: isDeleting }] = useDeleteCatalystTaskMutation();

	// Extract catalyst data for table
	const allCatalystData: CatalystData[] = useMemo(() => {
		if (!catalystChartData) return [];
		return catalystChartData.detail.map((item: { catalyst: CatalystData }) => item.catalyst);
	}, [catalystChartData]);

	// Filter and search logic
	const filteredData = useMemo(() => {
		let filtered = allCatalystData;

		// Apply status filter
		if (activeFilter !== 'All Charts') {
			filtered = filtered.filter(catalyst => catalyst.status === activeFilter);
		}

		// Apply search filter
		if (searchTerm) {
			filtered = filtered.filter(
				catalyst =>
					catalyst.chartId.toLowerCase().includes(searchTerm.toLowerCase()) ||
					catalyst.chartSupplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
					catalyst.notes.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		return filtered;
	}, [allCatalystData, activeFilter, searchTerm]);

	const handleSearchChange = (searchValue: string) => {
		setSearchTerm(searchValue);
	};

	const handleFilterChange = (filter: string) => {
		setActiveFilter(filter);
	};

	const handleActionClick = (chartId: string, action: string) => {
		if (action === 'delete') {
			const catalyst = allCatalystData.find(c => c.chartId === chartId);
			if (catalyst) {
				setCatalystToDelete(catalyst);
				setDeleteDialogOpen(true);
			}
		}
	};

	const handleDeleteConfirm = async () => {
		if (!catalystToDelete) return;

		try {
			// Find the full catalyst data from the existing data
			const fullCatalystDetail = catalystChartData?.detail.find(item => item.catalyst.id === catalystToDelete.id);

			if (fullCatalystDetail) {
				const deleteRequest: DeleteCatalystTaskRequest = {
					catalyst: {
						id: catalystToDelete.id,
						version: fullCatalystDetail.catalyst.version,
						status: 'INACTIVE', // This will be overridden by the API
						chartId: fullCatalystDetail.catalyst.chartId,
						chartSupplier: fullCatalystDetail.catalyst.chartSupplier,
						notes: fullCatalystDetail.catalyst.notes,
						mekpDensity: parseFloat(fullCatalystDetail.catalyst.mekpDensity),
						isActive: fullCatalystDetail.catalyst.isActive
					},
					catalystConfiguration: fullCatalystDetail.catalystConfiguration.map(config => ({
						minTemperature: parseFloat(config.minTemperature),
						maxTemperature: parseFloat(config.maxTemperature),
						minHumidity: parseFloat(config.minHumidity),
						maxHumidity: parseFloat(config.maxHumidity),
						minGelcoat: parseFloat(config.minGelcoat),
						maxGelcoat: parseFloat(config.maxGelcoat),
						gelcoatLabel: config.gelcoatLabel,
						minResinDosage: parseFloat(config.minResinDosage),
						maxResinDosage: parseFloat(config.maxResinDosage),
						resinLabel: config.resinLabel,
						blockCatalystMixing: config.blockCatalystMixing,
						requestSupervisorApproval: config.requestSupervisorApproval
					}))
				};

				await deleteCatalystTask(deleteRequest).unwrap();

				// Manually refetch the data to ensure it's updated
				await refetchCatalystCharts();

				setDeleteDialogOpen(false);
				setCatalystToDelete(null);
			}
		} catch (error) {
			console.error('Failed to delete catalyst task:', error);
		}
	};

	const handleDeleteCancel = () => {
		setDeleteDialogOpen(false);
		setCatalystToDelete(null);
	};

	const handleEdit = (catalystId: number) => {
		navigate(`/catalyst-master/edit-catalyst/${catalystId}`);
	};

	const handleView = (catalystId: number) => {
		navigate(`/catalyst-master/view-catalyst/${catalystId}`);
	};

	// Show loading state with skeleton
	if (isCatalystDataLoading) {
		return (
			<Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
				<CatalystHeader />
				<CatalystTableSkeleton />
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
			<CatalystHeader />
			{catalystChartData && <SummaryCards headerData={catalystChartData.header} />}
			<ChartManagement onSearchChange={handleSearchChange} onFilterChange={handleFilterChange} />
			<CatalystTable data={filteredData} onActionClick={handleActionClick} onEdit={handleEdit} onView={handleView} />

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
				<DialogTitle>Delete Catalyst Task</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to delete the catalyst task for <strong>{catalystToDelete?.chartId}</strong>? This
						will set the status to INACTIVE and preserve all remaining data.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleDeleteCancel} disabled={isDeleting}>
						Cancel
					</Button>
					<Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={isDeleting}>
						{isDeleting ? 'Deleting...' : 'Delete Task'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default ListCatalyst;
