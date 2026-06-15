import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box } from '@mui/material';
import CatalystTableSkeleton from '../../../../components/common/skeleton/CatalystTableSkeleton';
import { useFetchSapJobConfigsQuery } from '../../../../store/api/business/sap-job-runs/sap-job-runs.api';
import type { SapJobConfigItem } from '../../../../store/api/business/sap-job-runs/sap-job-runs.validators';
import { useListView } from '../../../../hooks/useListView';
import { useCurrentRole } from '../../../../hooks/useCurrentRole';
import SapJobsHeader from './components/SapJobsHeader';
import SapJobsManagement, {
	SAP_JOBS_ALL_ENABLED,
	SAP_JOBS_ALL_KEYS
} from './components/SapJobsManagement';
import SapJobConfigsTable from './components/SapJobConfigsTable';

const ListSapJobs = () => {
	const navigate = useNavigate();
	const { hasPermission } = useCurrentRole();
	const canCreate = hasPermission('SAP_INTEGRATION_JOBS_CREATE');
	const { searchTerm, filters, pagination, setSearchTerm, setFilter, setPagination } = useListView('sapJobs');
	const jobKeyFilter = typeof filters.jobKey === 'string' ? filters.jobKey : SAP_JOBS_ALL_KEYS;
	const enabledFilter = typeof filters.enabled === 'string' ? filters.enabled : SAP_JOBS_ALL_ENABLED;

	const { data: configs = [], isLoading, isFetching, isError, error, refetch } = useFetchSapJobConfigsQuery();

	const jobKeyOptions = useMemo(() => {
		const s = new Set<string>();
		for (const c of configs) {
			if (c.jobKey?.trim()) s.add(c.jobKey);
		}
		return [...s].sort((a, b) => a.localeCompare(b));
	}, [configs]);

	const filteredData = useMemo(() => {
		let list = configs;

		if (jobKeyFilter !== SAP_JOBS_ALL_KEYS) {
			list = list.filter(row => row.jobKey === jobKeyFilter);
		}

		if (enabledFilter === 'Enabled only') {
			list = list.filter(row => row.enabled);
		} else if (enabledFilter === 'Disabled only') {
			list = list.filter(row => !row.enabled);
		}

		if (!searchTerm.trim()) return list;
		const needle = searchTerm.trim().toLowerCase();
		return list.filter(row => {
			const idMatch = String(row.id).includes(needle);
			const cron = row.cronExpression.toLowerCase();
			return idMatch || row.jobKey.toLowerCase().includes(needle) || cron.includes(needle);
		});
	}, [configs, searchTerm, jobKeyFilter, enabledFilter]);

	const handleViewHistory = useCallback(
		(row: SapJobConfigItem) => {
			if (!canCreate) return;
			navigate(`/sap-jobs/history/${encodeURIComponent(row.jobKey)}`);
		},
		[navigate, canCreate]
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

			<SapJobsManagement
				searchTerm={searchTerm}
				onSearchChange={setSearchTerm}
				jobKeyFilter={jobKeyFilter}
				onJobKeyFilterChange={value => setFilter('jobKey', value)}
				enabledFilter={enabledFilter}
				onEnabledFilterChange={value => setFilter('enabled', value)}
				jobKeyOptions={jobKeyOptions}
			/>

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
				<SapJobConfigsTable
					data={filteredData}
					onViewHistory={handleViewHistory}
					pagination={pagination}
					onPaginationChange={setPagination}
				/>
			</Box>
		</Box>
	);
};

export default ListSapJobs;
