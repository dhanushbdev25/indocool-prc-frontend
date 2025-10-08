import { useState, useMemo } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SequenceHeader from './components/SequenceHeader';
import SummaryCards from './components/SummaryCards';
import SequenceManagement from './components/SequenceManagement';
import SequenceTable, { SequenceData } from './components/SequenceTable';
import CatalystTableSkeleton from '../../../../../components/common/skeleton/CatalystTableSkeleton';
import { useFetchProcessSequencesQuery } from '../../../../../store/api/business/sequence-master/sequence.api';

const ListSequence = () => {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState('');
	const [activeFilter, setActiveFilter] = useState('All Sequences');
	const [activeTypeFilter, setActiveTypeFilter] = useState('All Types');

	// Fetch all process sequences using the API with Zod validation
	const { data: sequenceData, isLoading: isSequenceDataLoading } = useFetchProcessSequencesQuery();

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
		console.log(`Action ${action} clicked for sequence ${sequenceId}`);
		// Implement action logic (delete, etc.)
	};

	const handleEdit = (sequenceId: number) => {
		navigate(`/sequence-master/edit-sequence/${sequenceId}`);
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
			<SequenceTable data={filteredData} onActionClick={handleActionClick} onEdit={handleEdit} />
		</Box>
	);
};

export default ListSequence;
