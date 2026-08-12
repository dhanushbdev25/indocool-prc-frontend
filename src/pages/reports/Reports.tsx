import { useCallback, useMemo, useState } from 'react';
import { Box, LinearProgress, Stack } from '@mui/material';
import {
	useFetchAvailableReportsQuery,
	useLazyFetchReportQuery
} from '../../store/api/business/reports/reports.api';
import type { ReportRequest } from '../../store/api/business/reports/reports.validators';
import { useFetchPlantsQuery } from '../../store/api/business/prc-execution/prc-execution.api';
import { PRC_EXECUTION_STATUSES } from '../../store/api/business/prc-execution/prc-execution.validators';
import { useFetchSapComboQuery, useFetchCustomersQuery } from '../../store/api/business/part-master/part.api';
import {
	useFetchReservationComboQuery,
	useFetchPrcSetIdComboQuery,
	useFetchSapSetIdComboQuery,
	useFetchOrderIdComboQuery
} from '../../store/api/business/customer/customer.api';
import { uniqueSorted, plantCodeOptions } from '../../utils/comboOptionHelpers';
import { useDashboardDateRange } from '../dashboard/hooks/useDashboardDateRange';
import { DashboardErrorBanner } from '../dashboard/components/DashboardErrorBanner';
import { ReportsPageHeader } from './components/ReportsPageHeader';
import { ReportsTabStrip } from './components/ReportsTabStrip';
import { ReportsFilterBar, type ReportFilterKey, type ReportFilters } from './components/ReportsFilterBar';
import { ReportTable } from './components/ReportTable';
import { ReportEmptyPrompt } from './components/ReportEmptyPrompt';
import { ReportsAvailableSkeleton } from './components/ReportsAvailableSkeleton';
import { ReportTableSkeleton } from './components/ReportTableSkeleton';

const EMPTY_REPORT_FILTERS: ReportFilters = {
	plantCode: [],
	customer: [],
	sapReferenceNumber: [],
	status: [],
	orderId: [],
	reservation: [],
	prcSetId: [],
	productionSetId: []
};

const Reports = () => {
	const availableQuery = useFetchAvailableReportsQuery();
	const reports = useMemo(() => availableQuery.data ?? [], [availableQuery.data]);

	// The user's explicit pick — null until they click a tab. The displayed
	// selection is derived: if the picked code is missing (initial load or a
	// list refresh dropped it), fall back to the first available report.
	const [userPickedCode, setUserPickedCode] = useState<string | null>(null);
	const selectedCode = useMemo(() => {
		if (userPickedCode && reports.some(r => r.code === userPickedCode)) return userPickedCode;
		return reports[0]?.code ?? '';
	}, [reports, userPickedCode]);

	const {
		isReady,
		draftPreset,
		draftPresetLabel,
		draftDisplayLabel,
		draftCustomFrom,
		draftCustomTo,
		setDraftPreset,
		setDraftCustomRange,
		applyDraft: applyDateRangeDraft
	} = useDashboardDateRange();

	const [triggerFetchReport, reportQuery] = useLazyFetchReportQuery();

	// Entity filters (multi-select). Generate is the explicit apply, so plain local state suffices.
	const [filters, setFilters] = useState<ReportFilters>(EMPTY_REPORT_FILTERS);
	const handleFilterChange = useCallback((key: ReportFilterKey, values: string[]) => {
		setFilters(prev => ({ ...prev, [key]: values }));
	}, []);
	const handleClearFilters = useCallback(() => {
		setFilters(EMPTY_REPORT_FILTERS);
	}, []);

	// Combo-backed filter options
	const { data: plantsData, isLoading: isPlantsLoading } = useFetchPlantsQuery();
	const { data: customersData, isLoading: isCustomersLoading } = useFetchCustomersQuery();
	const { data: sapComboData, isLoading: isSapComboLoading } = useFetchSapComboQuery();
	const { data: orderIdComboData, isLoading: isOrderIdComboLoading } = useFetchOrderIdComboQuery();
	const { data: reservationComboData, isLoading: isReservationComboLoading } = useFetchReservationComboQuery();
	const { data: prcSetIdComboData, isLoading: isPrcSetIdComboLoading } = useFetchPrcSetIdComboQuery();
	const { data: sapSetIdComboData, isLoading: isSapSetIdComboLoading } = useFetchSapSetIdComboQuery();

	const filterOptions = useMemo<Record<ReportFilterKey, string[]>>(
		() => ({
			plantCode: plantCodeOptions(plantsData),
			// Server filters customers with ILIKE on customerName, so options are the names (labels), not codes.
			customer: uniqueSorted((customersData?.data ?? []).map(r => r.label)),
			sapReferenceNumber: uniqueSorted((sapComboData?.data ?? []).map(r => r.value)),
			status: [...PRC_EXECUTION_STATUSES],
			orderId: uniqueSorted((orderIdComboData?.data ?? []).map(r => r.value)),
			reservation: uniqueSorted((reservationComboData?.data ?? []).map(r => r.value)),
			prcSetId: uniqueSorted((prcSetIdComboData?.data ?? []).map(r => r.value)),
			productionSetId: uniqueSorted((sapSetIdComboData?.data ?? []).map(r => r.value))
		}),
		[plantsData, customersData, sapComboData, orderIdComboData, reservationComboData, prcSetIdComboData, sapSetIdComboData]
	);

	const optionsLoading = useMemo<Partial<Record<ReportFilterKey, boolean>>>(
		() => ({
			plantCode: isPlantsLoading,
			customer: isCustomersLoading,
			sapReferenceNumber: isSapComboLoading,
			orderId: isOrderIdComboLoading,
			reservation: isReservationComboLoading,
			prcSetId: isPrcSetIdComboLoading,
			productionSetId: isSapSetIdComboLoading
		}),
		[
			isPlantsLoading,
			isCustomersLoading,
			isSapComboLoading,
			isOrderIdComboLoading,
			isReservationComboLoading,
			isPrcSetIdComboLoading,
			isSapSetIdComboLoading
		]
	);

	const handleGenerate = useCallback(() => {
		if (!selectedCode || !isReady) return;
		// Use the freshly-applied range — the `from`/`to` in this closure are one apply behind.
		const range = applyDateRangeDraft();
		if (!range) return;
		const request: ReportRequest = { reportType: selectedCode, from: range.from, to: range.to };
		for (const key of Object.keys(filters) as ReportFilterKey[]) {
			const values = filters[key].map(v => v.trim()).filter(Boolean);
			if (values.length) request[key] = values;
		}
		triggerFetchReport(request);
	}, [selectedCode, isReady, applyDateRangeDraft, triggerFetchReport, filters]);

	// The lazy query result represents the most recent trigger. Only render its
	// data when it matches the active tab — otherwise the user is looking at a
	// freshly selected tab they haven't generated yet.
	const activeArgs = reportQuery.originalArgs;
	const isActiveTabResult = activeArgs?.reportType === selectedCode;
	const data = isActiveTabResult ? reportQuery.data : undefined;
	const isInitialLoading = isActiveTabResult && reportQuery.isFetching && !data;
	const isRefetching = isActiveTabResult && reportQuery.isFetching && !!data;
	const isError = isActiveTabResult && reportQuery.isError;

	// Block Generate while a custom draft range is incomplete — committing it would flip isReady off with no recovery path.
	const isDraftRangeReady = draftPreset !== 'custom' || Boolean(draftCustomFrom && draftCustomTo);
	const canGenerate = Boolean(selectedCode) && isReady && isDraftRangeReady && !reportQuery.isFetching;

	const renderContent = () => {
		if (!selectedCode) {
			return (
				<ReportEmptyPrompt
					title="No report selected"
					message="Pick a report tab above to begin."
				/>
			);
		}
		if (isError) {
			return <DashboardErrorBanner onRetry={handleGenerate} />;
		}
		if (isInitialLoading) {
			return <ReportTableSkeleton />;
		}
		if (!data) {
			return <ReportEmptyPrompt />;
		}
		return (
			<Box sx={{ position: 'relative' }}>
				{isRefetching ? (
					<LinearProgress
						sx={{
							position: 'absolute',
							top: -8,
							left: 0,
							right: 0,
							borderRadius: 999,
							height: 3,
							zIndex: 1
						}}
					/>
				) : null}
				<ReportTable
					header={data.header}
					detail={data.detail}
					exportTitle={`report-${selectedCode.toLowerCase().replace(/_/g, '-')}`}
				/>
			</Box>
		);
	};

	const renderTabsOrSkeleton = () => {
		if (availableQuery.isLoading) return <ReportsAvailableSkeleton />;
		if (availableQuery.isError) return <DashboardErrorBanner onRetry={availableQuery.refetch} />;
		if (reports.length === 0) {
			return (
				<ReportEmptyPrompt
					title="No reports available"
					message="Your account doesn't have any reports yet. Contact your administrator if you expected to see some."
				/>
			);
		}
		return (
			<ReportsTabStrip reports={reports} selectedCode={selectedCode} onSelect={setUserPickedCode} />
		);
	};

	return (
		<Box component="article" sx={{ minWidth: 0, pb: { xs: 2, sm: 3 } }}>
			<ReportsPageHeader />
			<Stack>
				{renderTabsOrSkeleton()}

				{reports.length > 0 ? (
					<>
						<ReportsFilterBar
							preset={draftPreset}
							presetLabel={draftPresetLabel}
							displayLabel={draftDisplayLabel}
							customFrom={draftCustomFrom}
							customTo={draftCustomTo}
							onPresetChange={setDraftPreset}
							onCustomRangeChange={setDraftCustomRange}
							filters={filters}
							onFilterChange={handleFilterChange}
							filterOptions={filterOptions}
							optionsLoading={optionsLoading}
							onClearFilters={handleClearFilters}
							onGenerate={handleGenerate}
							canGenerate={canGenerate}
							isFetching={!!isActiveTabResult && reportQuery.isFetching}
						/>
						{renderContent()}
					</>
				) : null}
			</Stack>
		</Box>
	);
};

export default Reports;
