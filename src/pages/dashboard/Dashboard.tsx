import { useCallback, useMemo } from 'react';
import { Box, Grid, Stack } from '@mui/material';
import {
	useFetchMetricsQuery,
	useFetchDatewiseMetricsQuery,
	useFetchMouldingAnalysisQuery
} from '../../store/api/business/dashboard/dashboard.api';
import { analyticsPageGap } from './constants/dashboardTokens';
import { DATEWISE_STAGE_CONFIG } from './constants/stageConfig';
import { useDashboardDateRange } from './hooks/useDashboardDateRange';
import { useDashboardEntityFilters } from './hooks/useDashboardEntityFilters';
import { useDashboardFilterOptions } from './hooks/useDashboardFilterOptions';
import { useCustomerVariantOptions } from '../../hooks/useCustomerVariantOptions';
import { useFetchSapComboQuery } from '../../store/api/business/part-master/part.api';
import { sapComboOptions } from '../../utils/comboOptionHelpers';
import { DashboardPageHeader } from './components/DashboardPageHeader';
import { DashboardSection } from './components/DashboardSection';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { MetricsKpiGrid } from './components/kpi/MetricsKpiGrid';
import { ProjectOutputChart } from './components/moulding/ProjectOutputChart';
import { ProjectLossChart } from './components/moulding/ProjectLossChart';
import { WorkstationOutputChart } from './components/moulding/WorkstationOutputChart';
import { DatewiseOutputChart } from './components/trends/DatewiseOutputChart';
import { DelayReasonsSection } from './components/delay-reasons/DelayReasonsSection';
import { DashboardErrorBanner } from './components/DashboardErrorBanner';
import { FullScreenFormSavingOverlay } from '../../components/common/FullScreenFormSavingOverlay';

const Dashboard = () => {
	const {
		from,
		to,
		isReady,
		draftPreset,
		draftPresetLabel,
		draftDisplayLabel,
		draftCustomFrom,
		draftCustomTo,
		setDraftPreset,
		setDraftCustomRange,
		applyDraft: applyDateRangeDraft,
		clearAll: clearAllDateRange,
		isDirty: isDateRangeDirty
	} = useDashboardDateRange();

	const {
		appliedFilters,
		draftFilters,
		setDraftFilter,
		applyDraft: applyEntityDraft,
		clearAll: clearAllEntityFilters,
		isDirty: areEntityFiltersDirty,
		hasActiveFilters
	} = useDashboardEntityFilters();

	// Options follow draft.units so the workstation list refreshes as the user edits the selection.
	const { unitOptions, workstationOptions, shiftOptions, projectOptions } = useDashboardFilterOptions({
		selectedUnits: draftFilters.units
	});

	// SAP product + variant options are dashboard-only — fetched here rather than in the
	// shared useDashboardFilterOptions so the DPMO tabs don't fire these queries.
	const { data: sapComboData } = useFetchSapComboQuery();
	const sapProductOptions = useMemo(() => sapComboOptions(sapComboData?.data), [sapComboData]);
	const {
		options: variantOptions,
		disabled: variantDisabled,
		placeholder: variantPlaceholder
	} = useCustomerVariantOptions({ selectedCustomers: draftFilters.projects, mode: 'code' });

	const queryArgs = {
		from,
		to,
		units: appliedFilters.units,
		workstation: appliedFilters.workstation,
		shift: appliedFilters.shift,
		projects: appliedFilters.projects,
		sapReferenceNumber: appliedFilters.sapReferenceNumber,
		customerVariantId: appliedFilters.customerVariantId
	};
	const skip = !isReady;

	const metricsQuery = useFetchMetricsQuery(queryArgs, { skip });
	const datewiseQuery = useFetchDatewiseMetricsQuery(queryArgs, { skip });
	const mouldingQuery = useFetchMouldingAnalysisQuery(queryArgs, { skip });

	const isLoading = !skip && (metricsQuery.isLoading || datewiseQuery.isLoading || mouldingQuery.isLoading);
	const isRefreshing =
		!skip && (metricsQuery.isFetching || datewiseQuery.isFetching || mouldingQuery.isFetching);
	const hasError = metricsQuery.isError || datewiseQuery.isError || mouldingQuery.isError;

	const refetchAll = () => {
		metricsQuery.refetch();
		datewiseQuery.refetch();
		mouldingQuery.refetch();
	};

	const isDirty = isDateRangeDirty || areEntityFiltersDirty;

	const handleApply = useCallback(() => {
		if (!isDirty) return;
		applyDateRangeDraft();
		applyEntityDraft();
	}, [isDirty, applyDateRangeDraft, applyEntityDraft]);

	const handleReset = useCallback(() => {
		clearAllDateRange();
		clearAllEntityFilters();
	}, [clearAllDateRange, clearAllEntityFilters]);

	const datewiseData = datewiseQuery.data;

	if (isLoading && !metricsQuery.data) {
		return <DashboardSkeleton />;
	}

	return (
		<Box component="article" sx={{ minWidth: 0, pb: { xs: 2, sm: 3 } }}>
			<DashboardPageHeader
				draftPreset={draftPreset}
				draftPresetLabel={draftPresetLabel}
				draftDisplayLabel={draftDisplayLabel}
				onDraftPresetChange={setDraftPreset}
				onDraftCustomRangeChange={setDraftCustomRange}
				draftCustomFrom={draftCustomFrom}
				draftCustomTo={draftCustomTo}
				draftFilters={draftFilters}
				onDraftFilterChange={setDraftFilter}
				onApply={handleApply}
				onReset={handleReset}
				isDirty={isDirty}
				hasActiveFilters={hasActiveFilters}
				unitOptions={unitOptions}
				workstationOptions={workstationOptions}
				shiftOptions={shiftOptions}
				projectOptions={projectOptions}
				sapProductOptions={sapProductOptions}
				variantOptions={variantOptions}
				variantDisabled={variantDisabled}
				variantPlaceholder={variantPlaceholder}
				filtersDisabled={!isReady}
			/>

			<Stack spacing={analyticsPageGap}>
				{hasError ? <DashboardErrorBanner onRetry={refetchAll} /> : null}

				{metricsQuery.data ? <MetricsKpiGrid data={metricsQuery.data} /> : null}

				<DashboardSection
					title="Moulding analysis"
					subtitle="Project output, loss minutes, and workstation performance"
				>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, lg: 4 }}>
							<ProjectOutputChart data={mouldingQuery.data?.projectWise ?? []} />
						</Grid>
						<Grid size={{ xs: 12, lg: 4 }}>
							<ProjectLossChart data={mouldingQuery.data?.projectLoss ?? []} />
						</Grid>
						<Grid size={{ xs: 12, lg: 4 }}>
							<WorkstationOutputChart data={mouldingQuery.data?.workstationWise ?? []} />
						</Grid>
					</Grid>
				</DashboardSection>

				<DashboardSection
					title="Daily output trends"
					subtitle="Stage-wise output percentage across the selected date range"
				>
					<Grid container spacing={2}>
						{DATEWISE_STAGE_CONFIG.map(stage => (
							<Grid key={stage.key} size={{ xs: 12, md: 6, xl: 4 }}>
								<DatewiseOutputChart
									title={`${stage.label} output (%)`}
									data={datewiseData ?? []}
									stageKey={stage.key}
								/>
							</Grid>
						))}
					</Grid>
				</DashboardSection>

				{metricsQuery.data ? (
					<DashboardSection
						title="Delay reasons"
						subtitle="Reported reasons for production delays by manufacturing stage"
					>
						<DelayReasonsSection data={metricsQuery.data.selectedRange.delayReasons} />
					</DashboardSection>
				) : null}
			</Stack>

			<FullScreenFormSavingOverlay open={isRefreshing && !isLoading} message="Refreshing dashboard…" />
		</Box>
	);
};

export default Dashboard;
