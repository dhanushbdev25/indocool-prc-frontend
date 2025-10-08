import { useState, useMemo } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CatalystHeader from './components/CatalystHeader';
import SummaryCards from './components/SummaryCards';
import ChartManagement from './components/ChartManagement';
import CatalystTable, { CatalystData } from './components/CatalystTable';
import CatalystTableSkeleton from '../../../../../components/common/skeleton/CatalystTableSkeleton';
import { useFetchCatalystChartsQuery } from '../../../../../store/api/business/catalyst-master/catalyst.api';

const ListCatalyst = () => {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState('');
	const [activeFilter, setActiveFilter] = useState('All Charts');

	// Fetch all catalyst charts using the API with Zod validation
	const { data: catalystChartData, isLoading: isCatalystDataLoading } = useFetchCatalystChartsQuery();

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
		console.log(`Action ${action} clicked for chart ${chartId}`);
		// Implement action logic (delete, etc.)
	};

	const handleEdit = (catalystId: number) => {
		navigate(`/catalyst-master/edit-catalyst/${catalystId}`);
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
			<CatalystTable data={filteredData} onActionClick={handleActionClick} onEdit={handleEdit} />
		</Box>
	);
};

export default ListCatalyst;
