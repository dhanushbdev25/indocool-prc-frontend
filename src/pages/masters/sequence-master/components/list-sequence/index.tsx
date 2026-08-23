import { useState, useMemo, useCallback } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
	deriveOptions,
	InlineFilterBar,
	MasterListLandingPage,
	masterListTableFrame,
	matchesDateRange,
	matchesMulti,
	ToolbarAddButton,
	type FilterFieldConfig,
	type FilterValue
} from '../../../../../components/masters';
import { useListView } from '../../../../../hooks/useListView';
import SequenceHeader from './components/SequenceHeader';
import SequenceTable, { SequenceData } from './components/SequenceTable';
import CatalystTableSkeleton from '../../../../../components/common/skeleton/CatalystTableSkeleton';
import {
	useFetchProcessSequencesQuery,
	useDeleteSequenceTaskMutation
} from '../../../../../store/api/business/sequence-master/sequence.api';
import { FullScreenFormSavingOverlay } from '../../../../../components/common/FullScreenFormSavingOverlay';
import { type DeleteSequenceTaskRequest } from '../../../../../store/api/business/sequence-master/sequence.validators';
import { useCurrentRole } from '../../../../../hooks/useCurrentRole';
import { MasterAuditHistoryDialog, type MasterAuditTarget } from '../../../../../components/common/auditHistory';
import { toProcessStepGroupRequestsFromDetail } from '../../utils/processStepGroupPayload';

const SEARCH_PLACEHOLDER = 'Sequence ID, name, category, item, type, or notes';

const ListSequence = () => {
	const navigate = useNavigate();
	const { hasPermission } = useCurrentRole();
	const canCreate = hasPermission('SEQUENCE_MASTER_CREATE');
	const { searchTerm, filters, pagination, setSearchTerm, setFilters, setPagination } = useListView('sequence');
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [sequenceToDelete, setSequenceToDelete] = useState<SequenceData | null>(null);
	const [auditTarget, setAuditTarget] = useState<MasterAuditTarget | null>(null);

	const {
		data: sequenceData,
		isLoading: isSequenceDataLoading,
		refetch: refetchProcessSequences
	} = useFetchProcessSequencesQuery();

	const [deleteSequenceTask, { isLoading: isDeleting }] = useDeleteSequenceTaskMutation();

	const allSequenceData: SequenceData[] = useMemo(() => sequenceData?.detail ?? [], [sequenceData]);

	const fields = useMemo<FilterFieldConfig[]>(
		() => [
			{
				kind: 'autocomplete',
				key: 'sequenceId',
				label: 'Sequence ID',
				options: deriveOptions(allSequenceData, r => r.sequenceId)
			},
			{
				kind: 'autocomplete',
				key: 'sequenceName',
				label: 'Sequence Name',
				options: deriveOptions(allSequenceData, r => r.sequenceName)
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
		[allSequenceData]
	);

	const filteredData = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();
		return allSequenceData.filter(seq => {
			if (!matchesMulti(seq.sequenceId, filters.sequenceId)) return false;
			if (!matchesMulti(seq.sequenceName, filters.sequenceName)) return false;
			if (!matchesDateRange(seq.createdAt, filters.createdAt)) return false;
			if (!matchesMulti(seq.status, filters.status)) return false;
			if (!term) return true;
			return (
				seq.sequenceId.toLowerCase().includes(term) ||
				seq.sequenceName.toLowerCase().includes(term) ||
				seq.category.toLowerCase().includes(term) ||
				seq.type.toLowerCase().includes(term) ||
				(seq.item ?? '').toLowerCase().includes(term) ||
				(seq.notes ?? '').toLowerCase().includes(term)
			);
		});
	}, [allSequenceData, filters, searchTerm]);

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

	// Match on the row's own id, never on sequenceId — see the note in list-inspection.
	const handleActionClick = (id: number, action: string) => {
		if (action === 'delete') {
			const sequence = allSequenceData.find(s => s.id === id);
			if (sequence) {
				setSequenceToDelete(sequence);
				setDeleteDialogOpen(true);
			}
		}
	};

	const handleDeleteConfirm = async () => {
		if (!sequenceToDelete) return;

		try {
			const fullSequenceDetail = sequenceData?.detail.find(item => item.id === sequenceToDelete.id);

			if (fullSequenceDetail) {
				const deleteRequest: DeleteSequenceTaskRequest = {
					id: sequenceToDelete.id,
					data: {
						processSequence: {
							status: 'INACTIVE',
							sequenceId: fullSequenceDetail.sequenceId,
							sequenceName: fullSequenceDetail.sequenceName,
							version: fullSequenceDetail.version,
							isLatest: fullSequenceDetail.isLatest,
							category: fullSequenceDetail.category,
							type: fullSequenceDetail.type,
							notes: fullSequenceDetail.notes ?? '',
							totalSteps: fullSequenceDetail.totalSteps,
							ctqSteps: fullSequenceDetail.ctqSteps
						},
						// Deactivating reuses the update endpoint, which re-inserts every group
						// and step. Go through the shared mapping so the ids (and shift,
						// pfdNumber, tableConfig) survive a status change.
						processStepGroups: toProcessStepGroupRequestsFromDetail(fullSequenceDetail.stepGroups)
					}
				};

				await deleteSequenceTask(deleteRequest).unwrap();

				await refetchProcessSequences();

				setDeleteDialogOpen(false);
				setSequenceToDelete(null);
			}
		} catch (error) {
			console.error('Failed to delete sequence task:', error);
		}
	};

	const handleDeleteCancel = () => {
		setDeleteDialogOpen(false);
		setSequenceToDelete(null);
	};

	const handleEdit = (sequenceId: number) => {
		navigate(`/sequence-master/edit-sequence/${sequenceId}`);
	};

	const handleView = (sequenceId: number) => {
		navigate(`/sequence-master/view-sequence/${sequenceId}`);
	};

	const handleClone = (sequenceId: number) => {
		navigate(`/sequence-master/clone-sequence/${sequenceId}`);
	};

	if (isSequenceDataLoading) {
		return (
			<Box sx={{ minWidth: 0 }}>
				<SequenceHeader />
				<CatalystTableSkeleton />
			</Box>
		);
	}

	return (
		<>
			<MasterListLandingPage
				header={
					<SequenceHeader
						action={
							canCreate ? (
								<ToolbarAddButton label="Add Sequence" onClick={() => navigate('/sequence-master/create-sequence')} />
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
						<SequenceTable
							data={filteredData}
							onActionClick={handleActionClick}
							onEdit={handleEdit}
							onView={handleView}
							onClone={handleClone}
							onAuditLogs={sequence =>
								setAuditTarget({
									domain: 'sequence',
									id: sequence.id,
									label: sequence.sequenceId
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
				<DialogTitle>Delete Sequence Task</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to delete the sequence task for <strong>{sequenceToDelete?.sequenceId}</strong>? This
						will set the status to INACTIVE and preserve all remaining data.
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

export default ListSequence;
