import { useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box } from '@mui/material';
import CatalystTableSkeleton from '../../../../components/common/skeleton/CatalystTableSkeleton';
import { useFetchSapJobConfigsQuery } from '../../../../store/api/business/sap-job-runs/sap-job-runs.api';
import type { SapJobConfigItem } from '../../../../store/api/business/sap-job-runs/sap-job-runs.validators';
import SapJobsHeader from './components/SapJobsHeader';
import SapJobsManagement from './components/SapJobsManagement';
import SapJobConfigsTable from './components/SapJobConfigsTable';

const ListSapJobs = () => {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState('');

	const { data: configs = [], isLoading, isFetching, isError, error, refetch } = useFetchSapJobConfigsQuery();

	const filteredData = useMemo(() => {
		if (!searchTerm.trim()) return configs;
		const needle = searchTerm.trim().toLowerCase();
		return configs.filter(row => {
			const idMatch = String(row.id).includes(needle);
			const cron = row.cronExpression.toLowerCase();
			return idMatch || row.jobKey.toLowerCase().includes(needle) || cron.includes(needle);
		});
	}, [configs, searchTerm]);

	const handleViewHistory = useCallback(
		(row: SapJobConfigItem) => {
			navigate(`/sap-jobs/history/${encodeURIComponent(row.jobKey)}`);
		},
		[navigate]
	);

	const listErrorMessage =
		isError && error && typeof error === 'object' && 'data' in error
			? String((error as { data?: { message?: string } }).data?.message || 'Unable to load SAP job configurations.')
			: isError
				? 'Unable to load SAP job configurations. Please try again.'
				: null;

	if (isLoading) {
		return (
			<Box sx={{ p: 3, minHeight: '100vh' }}>
				<SapJobsHeader />
				<CatalystTableSkeleton />
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3, minHeight: '100vh' }}>
			<SapJobsHeader onRefresh={() => void refetch()} isRefreshing={isFetching && !isLoading} />

			<SapJobsManagement searchTerm={searchTerm} onSearchChange={setSearchTerm} />

			{listErrorMessage && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{listErrorMessage}
				</Alert>
			)}

			<Box
				sx={{
					backgroundColor: 'white',
					borderRadius: '12px',
					boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
					overflow: 'hidden'
				}}
			>
				<SapJobConfigsTable data={filteredData} onViewHistory={handleViewHistory} />
			</Box>
		</Box>
	);
};

export default ListSapJobs;
