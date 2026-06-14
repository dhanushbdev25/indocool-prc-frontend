import { useState, useMemo, useCallback } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
	deriveOptions,
	MasterFilterToolbar,
	MasterListLandingPage,
	masterListTableFrame,
	matchesMulti,
	ToolbarAddButton,
	type FilterFieldConfig,
	type FilterValue
} from '../../../../../components/masters';
import { useListView } from '../../../../../hooks/useListView';
import InspectionHeader from './components/InspectionHeader';
import InspectionTable, { InspectionData } from './components/InspectionTable';
import CatalystTableSkeleton from '../../../../../components/common/skeleton/CatalystTableSkeleton';
import {
	useFetchInspectionsQuery,
	useDeleteInspectionTaskMutation
} from '../../../../../store/api/business/inspection-master/inspection.api';
import { FullScreenFormSavingOverlay } from '../../../../../components/common/FullScreenFormSavingOverlay';
import { type DeleteInspectionTaskRequest } from '../../../../../store/api/business/inspection-master/inspection.validators';
import { useCurrentRole } from '../../../../../hooks/useCurrentRole';

const SEARCH_PLACEHOLDER = 'Inspection ID, name, or type';

const ListInspection = () => {
	const navigate = useNavigate();
	const { hasPermission } = useCurrentRole();
	const canCreate = hasPermission('INSPECTION_MASTER_CREATE');
	const { searchTerm, filters, pagination, setSearchTerm, setFilters, setPagination } = useListView('inspection');
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [inspectionToDelete, setInspectionToDelete] = useState<InspectionData | null>(null);

	const {
		data: inspectionData,
		isLoading: isInspectionDataLoading,
		refetch: refetchInspections
	} = useFetchInspectionsQuery();

	const [deleteInspectionTask, { isLoading: isDeleting }] = useDeleteInspectionTaskMutation();

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

	const fields = useMemo<FilterFieldConfig[]>(
		() => [
			{
				kind: 'autocomplete',
				key: 'inspectionId',
				label: 'Inspection ID',
				options: deriveOptions(allInspectionData, r => r.inspectionId)
			},
			{
				kind: 'autocomplete',
				key: 'inspectionName',
				label: 'Inspection Name',
				options: deriveOptions(allInspectionData, r => r.inspectionName)
			},
			{
				kind: 'autocomplete',
				key: 'type',
				label: 'Type',
				options: deriveOptions(allInspectionData, r => r.type)
			},
			{
				kind: 'autocomplete',
				key: 'approveByProduction',
				label: 'Approve By Production',
				options: ['Yes', 'No']
			},
			{
				kind: 'dateRange',
				key: 'createdAt',
				label: 'Created On'
			},
			{
				kind: 'autocomplete',
				key: 'status',
				label: 'Status',
				options: ['ACTIVE', 'INACTIVE']
			}
		],
		[allInspectionData]
	);

	const filteredData = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();
		return allInspectionData.filter(i => {
			if (!matchesMulti(i.inspectionId, filters.inspectionId)) return false;
			if (!matchesMulti(i.inspectionName, filters.inspectionName)) return false;
			if (!matchesMulti(i.type, filters.type)) return false;
			if (!matchesMulti(i.status, filters.status)) return false;
			if (!matchesMulti(i.approveByProduction ? 'Yes' : 'No', filters.approveByProduction)) return false;
			if (!term) return true;
			return (
				i.inspectionId.toLowerCase().includes(term) ||
				i.inspectionName.toLowerCase().includes(term) ||
				i.type.toLowerCase().includes(term)
			);
		});
	}, [allInspectionData, filters, searchTerm]);

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
			const fullInspectionDetail = inspectionData?.detail.find(item => item.inspection.id === inspectionToDelete.id);

			if (fullInspectionDetail) {
				const deleteRequest: DeleteInspectionTaskRequest = {
					inspection: {
						id: inspectionToDelete.id,
						version: fullInspectionDetail.inspection.version,
						status: 'INACTIVE',
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
							canCreate ? (
								<ToolbarAddButton
									label="Add Inspection"
									onClick={() => navigate('/inspection-master/create-inspection')}
								/>
							) : null
						}
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
							pagination={pagination}
							onPaginationChange={setPagination}
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
						Delete Task
					</Button>
				</DialogActions>
			</Dialog>
			<FullScreenFormSavingOverlay open={isDeleting} message="Deleting…" />
		</>
	);
};

export default ListInspection;
