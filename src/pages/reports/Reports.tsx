import { useCallback, useMemo, useState } from 'react';
import { Box, LinearProgress, Stack } from '@mui/material';
import {
	useFetchAvailableReportsQuery,
	useLazyFetchReportQuery
} from '../../store/api/business/reports/reports.api';
import dayjs from 'dayjs';
import type { ReportRequest } from '../../store/api/business/reports/reports.validators';
import { useFetchPlantsQuery, useFetchPrcStatusComboQuery } from '../../store/api/business/prc-execution/prc-execution.api';
import { useFetchSapComboQuery, useFetchCustomersQuery } from '../../store/api/business/part-master/part.api';
import {
	useFetchReservationComboQuery,
	useFetchPrcSetIdComboQuery,
	useFetchSapSetIdComboQuery,
	useFetchOrderIdComboQuery
} from '../../store/api/business/customer/customer.api';
import { useCustomerVariantOptions } from '../../hooks/useCustomerVariantOptions';
import { uniqueSorted, plantCodeOptions, sapComboOptions } from '../../utils/comboOptionHelpers';
import {
	EMPTY_DATE_RANGE,
	type DateRangeFilterValue,
	type FilterComboOption
} from '../../components/masters/filters/types';
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
	customerVariantId: [],
	sapReferenceNumber: [],
	status: [],
	orderId: [],
	reservation: [],
	prcSetId: [],
	productionSetId: []
};

/** FilterDateRange stores full ISO strings; the API expects YYYY-MM-DD. */
const toIsoDate = (value: string | null): string | null => {
	if (!value) return null;
	const d = dayjs(value);
	return d.isValid() ? d.format('YYYY-MM-DD') : null;
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

	// PRC date starts empty: a report needs either a PRC range or a complete SAP range, not both.
	const {
		draftPreset,
		draftPresetLabel,
		draftDisplayLabel,
		draftCustomFrom,
		draftCustomTo,
		setDraftPreset,
		setDraftCustomRange,
		applyDraft: applyDateRangeDraft,
		clearAll: clearAllDateRange
	} = useDashboardDateRange({ initialPreset: null });

	const [triggerFetchReport, reportQuery] = useLazyFetchReportQuery();

	// Entity filters (multi-select). Generate is the explicit apply, so plain local state suffices.
	const [filters, setFilters] = useState<ReportFilters>(EMPTY_REPORT_FILTERS);
	// SAP date range — optional second date filter (sapFrom/sapTo, backend support pending).
	const [sapDateRange, setSapDateRange] = useState<DateRangeFilterValue>(EMPTY_DATE_RANGE);
	const handleFilterChange = useCallback((key: ReportFilterKey, values: string[]) => {
		setFilters(prev => {
			// A variant selection only makes sense for the customer it was loaded for.
			if (key === 'customer') return { ...prev, customer: values, customerVariantId: [] };
			return { ...prev, [key]: values };
		});
	}, []);
	const handleClearFilters = useCallback(() => {
		setFilters(EMPTY_REPORT_FILTERS);
		setSapDateRange(EMPTY_DATE_RANGE);
		clearAllDateRange();
	}, [clearAllDateRange]);

	// Combo-backed filter options
	const { data: plantsData, isLoading: isPlantsLoading } = useFetchPlantsQuery();
	const { data: customersData, isLoading: isCustomersLoading } = useFetchCustomersQuery();
	const { data: sapComboData, isLoading: isSapComboLoading } = useFetchSapComboQuery();
	const { data: orderIdComboData, isLoading: isOrderIdComboLoading } = useFetchOrderIdComboQuery();
	const { data: reservationComboData, isLoading: isReservationComboLoading } = useFetchReservationComboQuery();
	const { data: prcSetIdComboData, isLoading: isPrcSetIdComboLoading } = useFetchPrcSetIdComboQuery();
	const { data: sapSetIdComboData, isLoading: isSapSetIdComboLoading } = useFetchSapSetIdComboQuery();
	const { data: statusComboData, isLoading: isStatusComboLoading } = useFetchPrcStatusComboQuery();

	// Variant depends on exactly one selected customer (variantCombo takes a single customerCode).
	const {
		options: variantOptions,
		disabled: isVariantDisabled,
		placeholder: variantPlaceholder
	} = useCustomerVariantOptions({ selectedCustomers: filters.customer, mode: 'name' });

	const filterOptions = useMemo<Record<ReportFilterKey, string[] | FilterComboOption[]>>(
		() => ({
			plantCode: plantCodeOptions(plantsData),
			// Server filters customers with ILIKE on customerName, so options are the names (labels), not codes.
			customer: uniqueSorted((customersData?.data ?? []).map(r => r.label)),
			customerVariantId: variantOptions,
			sapReferenceNumber: sapComboOptions(sapComboData?.data),
			status: (statusComboData ?? []).map(item => ({ label: item.label, value: String(item.value) })),
			orderId: uniqueSorted((orderIdComboData?.data ?? []).map(r => r.value)),
			reservation: uniqueSorted((reservationComboData?.data ?? []).map(r => r.value)),
			prcSetId: uniqueSorted((prcSetIdComboData?.data ?? []).map(r => r.value)),
			productionSetId: uniqueSorted((sapSetIdComboData?.data ?? []).map(r => r.value))
		}),
		[
			plantsData,
			customersData,
			variantOptions,
			sapComboData,
			statusComboData,
			orderIdComboData,
			reservationComboData,
			prcSetIdComboData,
			sapSetIdComboData
		]
	);

	const optionsLoading = useMemo<Partial<Record<ReportFilterKey, boolean>>>(
		() => ({
			plantCode: isPlantsLoading,
			customer: isCustomersLoading,
			sapReferenceNumber: isSapComboLoading,
			status: isStatusComboLoading,
			orderId: isOrderIdComboLoading,
			reservation: isReservationComboLoading,
			prcSetId: isPrcSetIdComboLoading,
			productionSetId: isSapSetIdComboLoading
		}),
		[
			isPlantsLoading,
			isCustomersLoading,
			isSapComboLoading,
			isStatusComboLoading,
			isOrderIdComboLoading,
			isReservationComboLoading,
			isPrcSetIdComboLoading,
			isSapSetIdComboLoading
		]
	);

	const optionsDisabled = useMemo<Partial<Record<ReportFilterKey, boolean>>>(
		() => ({ customerVariantId: isVariantDisabled }),
		[isVariantDisabled]
	);
	const optionsPlaceholder = useMemo<Partial<Record<ReportFilterKey, string | undefined>>>(
		() => ({ customerVariantId: variantPlaceholder }),
		[variantPlaceholder]
	);

	const sapFromIso = toIsoDate(sapDateRange.from);
	const sapToIso = toIsoDate(sapDateRange.to);
	/** Server needs both SAP bounds; one alone is not a usable range. */
	const hasSapRange = Boolean(sapFromIso && sapToIso);
	/** A custom PRC preset is only usable once both ends are picked. */
	const hasPrcRange = draftPreset !== null && (draftPreset !== 'custom' || Boolean(draftCustomFrom && draftCustomTo));

	const handleGenerate = useCallback(() => {
		if (!selectedCode || (!hasPrcRange && !hasSapRange)) return;
		const request: ReportRequest = { reportType: selectedCode };
		// Commit the draft range so applied state matches what was sent. Returns null when no PRC range is set,
		// which is valid here — the SAP range alone is enough for the server.
		const range = applyDateRangeDraft();
		if (range) {
			request.from = range.from;
			request.to = range.to;
		}
		for (const key of Object.keys(filters) as ReportFilterKey[]) {
			const values = filters[key].map(v => v.trim()).filter(Boolean);
			if (values.length) request[key] = values;
		}
		if (sapFromIso && sapToIso) {
			request.sapFrom = sapFromIso;
			request.sapTo = sapToIso;
		}
		triggerFetchReport(request);
	}, [
		selectedCode,
		hasPrcRange,
		hasSapRange,
		applyDateRangeDraft,
		triggerFetchReport,
		filters,
		sapFromIso,
		sapToIso
	]);

	// The lazy query result represents the most recent trigger. Only render its
	// data when it matches the active tab — otherwise the user is looking at a
	// freshly selected tab they haven't generated yet.
	const activeArgs = reportQuery.originalArgs;
	const isActiveTabResult = activeArgs?.reportType === selectedCode;
	const data = isActiveTabResult ? reportQuery.data : undefined;
	const isInitialLoading = isActiveTabResult && reportQuery.isFetching && !data;
	const isRefetching = isActiveTabResult && reportQuery.isFetching && !!data;
	const isError = isActiveTabResult && reportQuery.isError;

	// A report needs at least one usable date range before it can run.
	const canGenerate = Boolean(selectedCode) && (hasPrcRange || hasSapRange) && !reportQuery.isFetching;
	const validationMessage =
		hasPrcRange || hasSapRange
			? undefined
			: 'Select a PRC date range or a complete SAP date range to run this report.';

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
							sapDateRange={sapDateRange}
							onSapDateRangeChange={setSapDateRange}
							filters={filters}
							onFilterChange={handleFilterChange}
							filterOptions={filterOptions}
							optionsLoading={optionsLoading}
							optionsDisabled={optionsDisabled}
							optionsPlaceholder={optionsPlaceholder}
							onClearFilters={handleClearFilters}
							onGenerate={handleGenerate}
							canGenerate={canGenerate}
							validationMessage={validationMessage}
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
