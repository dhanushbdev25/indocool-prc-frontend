import { useState, useMemo, useCallback } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
	deriveOptions,
	InlineFilterBar,
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
import { MasterAuditHistoryDialog, type MasterAuditTarget } from '../../../../../components/common/auditHistory';
import { toInspectionParameterFormValues, toInspectionParameterRequests } from '../../utils/inspectionParameterPayload';

const SEARCH_PLACEHOLDER = 'Inspection ID, name, or type';

const ListInspection = () => {
	const navigate = useNavigate();
	const { hasPermission } = useCurrentRole();
	const canCreate = hasPermission('INSPECTION_MASTER_CREATE');
	const { searchTerm, filters, pagination, setSearchTerm, setFilters, setPagination } = useListView('inspection');
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [inspectionToDelete, setInspectionToDelete] = useState<InspectionData | null>(null);
	const [auditTarget, setAuditTarget] = useState<MasterAuditTarget | null>(null);

	const {
		data: inspectionData,
		isLoading: isInspectionDataLoading,
		isFetching: isInspectionDataFetching,
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

	// Match on the row's own id, never on inspectionId: the list returns every row for a
	// business code, so matching on the code always resolves to the newest one and deletes
	// a record the user did not pick.
	const handleActionClick = (id: number, action: string) => {
		if (action === 'delete') {
			const inspection = allInspectionData.find(i => i.id === id);
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
					// Deactivating reuses the update endpoint, which re-inserts every parameter
					// row. Go through the shared mapping so the ids (and tableConfig /
					// getInstrumentId) survive a status change.
					inspectionParameters: toInspectionParameterRequests(
						toInspectionParameterFormValues(fullInspectionDetail.inspectionParameters)
					)
				};

				await deleteInspectionTask(deleteRequest).unwrap();
				setDeleteDialogOpen(false);
				await refetchInspections();

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
				header={
					<InspectionHeader
						action={
							canCreate ? (
								<ToolbarAddButton
									label="Add Inspection"
									onClick={() => navigate('/inspection-master/create-inspection')}
								/>
							) : null
						}
					/>
				}
				toolbar={
					<InlineFilterBar
						title="Filter"
						searchPlaceholder={SEARCH_PLACEHOLDER}
						searchTerm={searchTerm}
						fields={fields}
						values={filters}
						onSearchChange={handleSearchChange}
						onApply={({ values }) => handleFiltersChange(values)}
						onReset={() => {
							setSearchTerm('');
							setFilters({});
							setPagination(prev => ({ ...prev, pageIndex: 0 }));
						}}
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
							onAuditLogs={inspection =>
								setAuditTarget({
									domain: 'inspection',
									id: inspection.id,
									label: inspection.inspectionId
								})
							}
							pagination={pagination}
							onPaginationChange={setPagination}
						/>
					</Box>
				}
			/>

			<MasterAuditHistoryDialog target={auditTarget} onClose={() => setAuditTarget(null)} />
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
			<FullScreenFormSavingOverlay open={isDeleting || isInspectionDataFetching} message="Deleting…" />
		</>
	);
};

export default ListInspection;
