import { useState, useMemo } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SequenceHeader from './components/SequenceHeader';
import SummaryCards from './components/SummaryCards';
import SequenceManagement from './components/SequenceManagement';
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

	// Filter and search logic
	const filteredData = useMemo(() => {
		let filtered = allSequenceData;

		// Apply status filter
		if (activeFilter !== 'All Sequences') {
			filtered = filtered.filter(sequence => sequence.status === activeFilter);
		}

		// Apply type filter
		if (activeTypeFilter !== 'All Types') {
			filtered = filtered.filter(sequence => sequence.type === activeTypeFilter);
		}

		// Apply search filter
		if (searchTerm) {
			filtered = filtered.filter(
				sequence =>
					sequence.sequenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
					sequence.sequenceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
					sequence.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
					sequence.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
					sequence.notes.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		return filtered;
	}, [allSequenceData, activeFilter, activeTypeFilter, searchTerm]);

	const handleSearchChange = (searchValue: string) => {
		setSearchTerm(searchValue);
	};

	const handleFilterChange = (filter: string) => {
		setActiveFilter(filter);
	};

	const handleTypeFilterChange = (typeFilter: string) => {
		setActiveTypeFilter(typeFilter);
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
							notes: fullSequenceDetail.notes,
							totalSteps: fullSequenceDetail.totalSteps,
							ctqSteps: fullSequenceDetail.ctqSteps
						},
						processStepGroups: fullSequenceDetail.stepGroups.map(stepGroup => ({
							processName: stepGroup.processName,
							processDescription: stepGroup.processDescription,
							processSteps: stepGroup.steps.map(step => ({
								parameterDescription: step.parameterDescription,
								stepNumber: step.stepNumber,
								stepType: step.stepType,
								evaluationMethod: step.evaluationMethod,
								targetValueType: step.targetValueType,
								minimumAcceptanceValue: step.minimumAcceptanceValue ? parseFloat(step.minimumAcceptanceValue) : null,
								maximumAcceptanceValue: step.maximumAcceptanceValue ? parseFloat(step.maximumAcceptanceValue) : null,
								multipleMeasurements: step.multipleMeasurements,
								multipleMeasurementMaxCount: step.multipleMeasurementMaxCount,
								uom: step.uom,
								ctq: step.ctq,
								allowAttachments: step.allowAttachments,
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

	// Show loading state with skeleton
	if (isSequenceDataLoading) {
		return (
			<Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
				<SequenceHeader />
				<CatalystTableSkeleton />
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
			<SequenceHeader />
			{sequenceData && <SummaryCards headerData={sequenceData.header} />}
			<SequenceManagement
				onSearchChange={handleSearchChange}
				onFilterChange={handleFilterChange}
				onTypeFilterChange={handleTypeFilterChange}
			/>
			<SequenceTable data={filteredData} onActionClick={handleActionClick} onEdit={handleEdit} onView={handleView} />

			{/* Delete Confirmation Dialog */}
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
		</Box>
	);
};

export default ListSequence;
