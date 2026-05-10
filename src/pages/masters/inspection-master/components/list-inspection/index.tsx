import { useState, useMemo } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatFilteredListSummary, MasterListLandingPage, masterListTableFrame } from '../../../../../components/masters';
import InspectionHeader from './components/InspectionHeader';
import SummaryCards from './components/SummaryCards';
import InspectionManagement, {
	INSPECTION_ALL_APPROVE,
	INSPECTION_ALL_TYPES
} from './components/InspectionManagement';
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
	const [activeTypeFilter, setActiveTypeFilter] = useState(INSPECTION_ALL_TYPES);
	const [activeApproveByProductionFilter, setActiveApproveByProductionFilter] = useState(INSPECTION_ALL_APPROVE);
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
		return inspectionData.detail.map((item: Record<string, unknown>) => {
			const inspection = item.inspection as InspectionData;
			return {
				...inspection,
				ctqParameters: (item.inspectionParameters as Record<string, unknown>[]).filter(
					(param: Record<string, unknown>) => param.ctq
				).length,
				totalParameters: (item.inspectionParameters as Record<string, unknown>[]).length
			};
		});
	}, [inspectionData]);

	const typeOptions = useMemo(() => {
		const s = new Set<string>();
		for (const i of allInspectionData) {
			const t = (i.type ?? '').trim();
			if (t) s.add(t);
		}
		return [...s].sort((a, b) => a.localeCompare(b));
	}, [allInspectionData]);

	// Filter and search logic
	const filteredData = useMemo(() => {
		let filtered = allInspectionData;

		// Apply status filter
		if (activeFilter !== 'All Inspections') {
			filtered = filtered.filter(inspection => inspection.status === activeFilter);
		}

		if (activeTypeFilter !== INSPECTION_ALL_TYPES) {
			filtered = filtered.filter(inspection => (inspection.type ?? '').trim() === activeTypeFilter);
		}

		if (activeApproveByProductionFilter === 'Yes') {
			filtered = filtered.filter(inspection => inspection.approveByProduction === true);
		} else if (activeApproveByProductionFilter === 'No') {
			filtered = filtered.filter(inspection => inspection.approveByProduction !== true);
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
	}, [allInspectionData, activeFilter, activeTypeFilter, activeApproveByProductionFilter, searchTerm]);

	const listSummary = useMemo(
		() => formatFilteredListSummary(filteredData.length, allInspectionData.length, 'inspections'),
		[filteredData.length, allInspectionData.length]
	);

	const handleSearchChange = (searchValue: string) => {
		setSearchTerm(searchValue);
	};

	const handleFilterChange = (filter: string) => {
		setActiveFilter(filter);
	};

	const handleTypeFilterChange = (typeFilter: string) => {
		setActiveTypeFilter(typeFilter);
	};

	const handleApproveByProductionFilterChange = (value: string) => {
		setActiveApproveByProductionFilter(value);
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
						showPartImages: fullInspectionDetail.inspection.showPartImages ?? false,
						partImages: fullInspectionDetail.inspection.partImages ?? [],
						createdBy: fullInspectionDetail.inspection.createdBy,
						updatedBy: fullInspectionDetail.inspection.updatedBy
					},
					inspectionParameters: fullInspectionDetail.inspectionParameters.map((param, index) => ({
						order: param.order ?? index + 1,
						parameterName: param.parameterName,
						specification: param.specification,
						minimumAcceptanceValue: param.minimumAcceptanceValue,
						maximumAcceptanceValue: param.maximumAcceptanceValue,
						type: param.type,
						files: param.files || {},
						columns: param.columns.map(col => ({
							name: col.name,
							type: col.type,
							defaultValue: col.defaultValue || '',
							minimumAcceptanceValue: col.minimumAcceptanceValue || '',
							maximumAcceptanceValue: col.maximumAcceptanceValue || ''
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

	const handleClone = (inspectionId: number) => {
		navigate(`/inspection-master/clone-inspection/${inspectionId}`);
	};

	// Show loading state with skeleton
	if (isInspectionDataLoading) {
		return (
			<Box sx={{ minWidth: 0 }}>
				<InspectionHeader />
				<CatalystTableSkeleton />
			</Box>
		);
	}

	return (
		<>
			<MasterListLandingPage
				header={<InspectionHeader />}
				metrics={inspectionData ? <SummaryCards headerData={inspectionData.header} /> : null}
				toolbar={
					<InspectionManagement
						appliedSearchTerm={searchTerm}
						searchAriaLabel="Search inspections"
						listSummary={listSummary}
						onSearchChange={handleSearchChange}
						onFilterChange={handleFilterChange}
						onTypeFilterChange={handleTypeFilterChange}
						onApproveByProductionFilterChange={handleApproveByProductionFilterChange}
						typeOptions={typeOptions}
					/>
				}
				table={
					<Box sx={masterListTableFrame}>
						<InspectionTable
							data={filteredData}
							onActionClick={handleActionClick}
							onEdit={handleEdit}
							onView={handleView}
							onClone={handleClone}
						/>
					</Box>
				}
			/>

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
		</>
	);
};

export default ListInspection;
