import { useState, useMemo } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatFilteredListSummary, MasterListLandingPage, masterListTableFrame } from '../../../../../components/masters';
import SequenceHeader from './components/SequenceHeader';
import SummaryCards from './components/SummaryCards';
import SequenceManagement, { SEQUENCE_ALL_ITEMS } from './components/SequenceManagement';
import SequenceTable, { SequenceData } from './components/SequenceTable';
import CatalystTableSkeleton from '../../../../../components/common/skeleton/CatalystTableSkeleton';
import {
	useFetchProcessSequencesQuery,
	useDeleteSequenceTaskMutation
} from '../../../../../store/api/business/sequence-master/sequence.api';
import { type DeleteSequenceTaskRequest } from '../../../../../store/api/business/sequence-master/sequence.validators';

const ListSequence = () => {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState('');
	const [activeFilter, setActiveFilter] = useState('All Sequences');
	const [activeTypeFilter, setActiveTypeFilter] = useState('All Types');
	const [activeCategoryFilter, setActiveCategoryFilter] = useState('All categories');
	const [activeItemFilter, setActiveItemFilter] = useState(SEQUENCE_ALL_ITEMS);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [sequenceToDelete, setSequenceToDelete] = useState<SequenceData | null>(null);

	// Fetch all process sequences using the API with Zod validation
	const {
		data: sequenceData,
		isLoading: isSequenceDataLoading,
		refetch: refetchProcessSequences
	} = useFetchProcessSequencesQuery();

	// Delete task mutation
	const [deleteSequenceTask, { isLoading: isDeleting }] = useDeleteSequenceTaskMutation();

	// Extract sequence data for table
	const allSequenceData: SequenceData[] = useMemo(() => {
		if (!sequenceData) return [];
		return sequenceData.detail;
	}, [sequenceData]);

	const categoryOptions = useMemo(() => {
		const set = new Set<string>();
		for (const s of allSequenceData) {
			const c = s.category?.trim();
			if (c) set.add(c);
		}
		return [...set].sort((a, b) => a.localeCompare(b));
	}, [allSequenceData]);

	const itemOptions = useMemo(() => {
		const set = new Set<string>();
		for (const s of allSequenceData) {
			const it = (s.item ?? '').trim();
			if (it) set.add(it);
		}
		return [...set].sort((a, b) => a.localeCompare(b));
	}, [allSequenceData]);

	// Filter and search logic
	const filteredData = useMemo(() => {
		let filtered = allSequenceData;

		// Apply status filter
		if (activeFilter !== 'All Sequences') {
			filtered = filtered.filter(sequence => sequence.status === activeFilter);
		}

		// Category filter (toolbar)
		if (activeCategoryFilter !== 'All categories') {
			filtered = filtered.filter(sequence => sequence.category === activeCategoryFilter);
		}

		// Apply type filter
		if (activeTypeFilter !== 'All Types') {
			filtered = filtered.filter(sequence => sequence.type === activeTypeFilter);
		}

		if (activeItemFilter !== SEQUENCE_ALL_ITEMS) {
			filtered = filtered.filter(sequence => (sequence.item ?? '').trim() === activeItemFilter);
		}

		// Apply search filter
		if (searchTerm) {
			filtered = filtered.filter(
				sequence =>
					sequence.sequenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
					sequence.sequenceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
					sequence.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
					sequence.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
					(sequence.item ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
					(sequence.notes ?? '').toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		return filtered;
	}, [allSequenceData, activeFilter, activeTypeFilter, activeCategoryFilter, activeItemFilter, searchTerm]);

	const listSummary = useMemo(
		() => formatFilteredListSummary(filteredData.length, allSequenceData.length, 'sequences'),
		[filteredData.length, allSequenceData.length]
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

	const handleCategoryFilterChange = (category: string) => {
		setActiveCategoryFilter(category);
	};

	const handleItemFilterChange = (item: string) => {
		setActiveItemFilter(item);
	};

	const handleActionClick = (sequenceId: string, action: string) => {
		if (action === 'delete') {
			const sequence = allSequenceData.find(s => s.sequenceId === sequenceId);
			if (sequence) {
				setSequenceToDelete(sequence);
				setDeleteDialogOpen(true);
			}
		}
	};

	const handleDeleteConfirm = async () => {
		if (!sequenceToDelete) return;

		try {
			// Find the full sequence data from the existing data
			const fullSequenceDetail = sequenceData?.detail.find(item => item.id === sequenceToDelete.id);

			if (fullSequenceDetail) {
				const deleteRequest: DeleteSequenceTaskRequest = {
					id: sequenceToDelete.id,
					data: {
						processSequence: {
							status: 'INACTIVE', // This will be overridden by the API
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
						processStepGroups: fullSequenceDetail.stepGroups.map(stepGroup => ({
							processName: stepGroup.processName,
							processDescription: stepGroup.processDescription,
							sequenceTiming: stepGroup.sequenceTiming || 0,
							processSteps: stepGroup.steps.map(step => ({
								parameterDescription: step.parameterDescription,
								stepNumber: step.stepNumber,
								evaluationMethod: step.evaluationMethod,
								targetValueType: step.targetValueType,
								minimumAcceptanceValue: step.minimumAcceptanceValue ? parseFloat(step.minimumAcceptanceValue) : null,
								maximumAcceptanceValue: step.maximumAcceptanceValue ? parseFloat(step.maximumAcceptanceValue) : null,
								multipleMeasurements: step.multipleMeasurements,
								multipleMeasurementMaxCount: step.multipleMeasurementMaxCount,
								uom: step.uom,
								ctq: step.ctq,
								allowAttachments: step.allowAttachments,
								responsiblePerson: step.responsiblePerson || false,
								getInstrumentId: step.getInstrumentId || false,
								notes: step.notes
							}))
						}))
					}
				};

				await deleteSequenceTask(deleteRequest).unwrap();

				// Manually refetch the data to ensure it's updated
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

	// Show loading state with skeleton
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
				header={<SequenceHeader />}
				metrics={sequenceData ? <SummaryCards headerData={sequenceData.header} /> : null}
				toolbar={
					<SequenceManagement
						appliedSearchTerm={searchTerm}
						searchAriaLabel="Search sequences"
						listSummary={listSummary}
						onSearchChange={handleSearchChange}
						onFilterChange={handleFilterChange}
						onTypeFilterChange={handleTypeFilterChange}
						onCategoryFilterChange={handleCategoryFilterChange}
						onItemFilterChange={handleItemFilterChange}
						categoryOptions={categoryOptions}
						itemOptions={itemOptions}
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
						/>
					</Box>
				}
			/>

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
						{isDeleting ? 'Deleting...' : 'Delete Task'}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default ListSequence;
