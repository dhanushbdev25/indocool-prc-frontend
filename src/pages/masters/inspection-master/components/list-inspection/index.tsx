import { useState, useMemo } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import InspectionHeader from './components/InspectionHeader';
import SummaryCards from './components/SummaryCards';
import InspectionManagement from './components/InspectionManagement';
import InspectionTable, { InspectionData } from './components/InspectionTable';
import CatalystTableSkeleton from '../../../../../components/common/skeleton/CatalystTableSkeleton';
import {
	useFetchInspectionsQuery,
	useDeleteInspectionTaskMutation
} from '../../../../../store/api/business/inspection-master/inspection.api';
import { type DeleteInspectionTaskRequest } from '../../../../../store/api/business/inspection-master/inspection.validators';

const ListInspection = () => {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState('');
	const [activeFilter, setActiveFilter] = useState('All Inspections');
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [inspectionToDelete, setInspectionToDelete] = useState<InspectionData | null>(null);

	// Fetch all inspections using the API with Zod validation
	const {
		data: inspectionData,
		isLoading: isInspectionDataLoading,
		refetch: refetchInspections
	} = useFetchInspectionsQuery();

	// Delete task mutation
	const [deleteInspectionTask, { isLoading: isDeleting }] = useDeleteInspectionTaskMutation();

	// Extract inspection data for table
	const allInspectionData: InspectionData[] = useMemo(() => {
		if (!inspectionData) return [];
		return inspectionData.detail.map((item: Record<string, unknown>) => ({
			...(item.inspection as InspectionData),
			ctqParameters: (item.inspectionParameters as Record<string, unknown>[]).filter(
				(param: Record<string, unknown>) => param.ctq
			).length,
			totalParameters: (item.inspectionParameters as Record<string, unknown>[]).length
		}));
	}, [inspectionData]);

	// Filter and search logic
	const filteredData = useMemo(() => {
		let filtered = allInspectionData;

		// Apply status filter
		if (activeFilter !== 'All Inspections') {
			filtered = filtered.filter(inspection => inspection.status === activeFilter);
		}

		// Apply search filter
		if (searchTerm) {
			filtered = filtered.filter(
				inspection =>
					inspection.inspectionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
					inspection.inspectionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
					inspection.type.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		return filtered;
	}, [allInspectionData, activeFilter, searchTerm]);

	const handleSearchChange = (searchValue: string) => {
		setSearchTerm(searchValue);
	};

	const handleFilterChange = (filter: string) => {
		setActiveFilter(filter);
	};

	const handleActionClick = (inspectionId: string, action: string) => {
		if (action === 'delete') {
			const inspection = allInspectionData.find(i => i.inspectionId === inspectionId);
			if (inspection) {
				setInspectionToDelete(inspection);
				setDeleteDialogOpen(true);
			}
		}
	};

	const handleDeleteConfirm = async () => {
		if (!inspectionToDelete) return;

		try {
			// Find the full inspection data from the existing data
			const fullInspectionDetail = inspectionData?.detail.find(item => item.inspection.id === inspectionToDelete.id);

			if (fullInspectionDetail) {
				const deleteRequest: DeleteInspectionTaskRequest = {
					inspection: {
						id: inspectionToDelete.id,
						version: fullInspectionDetail.inspection.version,
						status: 'INACTIVE', // This will be overridden by the API
						inspectionName: fullInspectionDetail.inspection.inspectionName,
						inspectionId: fullInspectionDetail.inspection.inspectionId,
						type: fullInspectionDetail.inspection.type,
						isLatest: fullInspectionDetail.inspection.isLatest,
						showPartImages: fullInspectionDetail.inspection.showPartImages,
						partImages: fullInspectionDetail.inspection.partImages,
						createdBy: fullInspectionDetail.inspection.createdBy,
						updatedBy: fullInspectionDetail.inspection.updatedBy
					},
					inspectionParameters: fullInspectionDetail.inspectionParameters.map(param => ({
						order: param.order,
						parameterName: param.parameterName,
						specification: param.specification,
						tolerance: param.tolerance,
						type: param.type,
						files: param.files || {},
						columns: param.columns.map(col => ({
							name: col.name,
							type: col.type,
							defaultValue: col.defaultValue || '',
							tolerance: col.tolerance || ''
						})),
						role: param.role,
						ctq: param.ctq
					}))
				};

				await deleteInspectionTask(deleteRequest).unwrap();

				// Manually refetch the data to ensure it's updated
				await refetchInspections();

				setDeleteDialogOpen(false);
				setInspectionToDelete(null);
			}
		} catch (error) {
			console.error('Failed to delete inspection task:', error);
		}
	};

	const handleDeleteCancel = () => {
		setDeleteDialogOpen(false);
		setInspectionToDelete(null);
	};

	const handleEdit = (inspectionId: number) => {
		navigate(`/inspection-master/edit-inspection/${inspectionId}`);
	};

	const handleView = (inspectionId: number) => {
		navigate(`/inspection-master/view-inspection/${inspectionId}`);
	};

	// Show loading state with skeleton
	if (isInspectionDataLoading) {
		return (
			<Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
				<InspectionHeader />
				<CatalystTableSkeleton />
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
			<InspectionHeader />
			{inspectionData && <SummaryCards headerData={inspectionData.header} />}
			<InspectionManagement onSearchChange={handleSearchChange} onFilterChange={handleFilterChange} />
			<InspectionTable data={filteredData} onActionClick={handleActionClick} onEdit={handleEdit} onView={handleView} />

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
				<DialogTitle>Delete Inspection Task</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to delete the inspection task for <strong>{inspectionToDelete?.inspectionId}</strong>?
						This will set the status to INACTIVE and preserve all remaining data.
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

export default ListInspection;
