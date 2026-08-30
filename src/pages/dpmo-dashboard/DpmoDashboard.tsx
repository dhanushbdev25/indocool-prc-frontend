import { useCallback, useMemo } from 'react';
import { Box, Grid, Stack } from '@mui/material';
import {
	useFetchDpmoBreakdownQuery,
	useFetchDpmoSummaryQuery,
	useFetchDpmoTrendsQuery
} from '../../store/api/business/dpmo/dpmo.api';
import { useFetchSapComboQuery } from '../../store/api/business/part-master/part.api';
import { useCustomerVariantOptions } from '../../hooks/useCustomerVariantOptions';
import { sapComboOptions } from '../../utils/comboOptionHelpers';
import { analyticsPageGap } from '../dashboard/constants/dashboardTokens';
import { useDashboardDateRange } from '../dashboard/hooks/useDashboardDateRange';
import { useDashboardEntityFilters } from '../dashboard/hooks/useDashboardEntityFilters';
import { useDashboardFilterOptions } from '../dashboard/hooks/useDashboardFilterOptions';
import { DashboardChart } from '../dashboard/components/charts/DashboardChart';
import { DashboardErrorBanner } from '../dashboard/components/DashboardErrorBanner';
import { DashboardChartCard, DashboardSection } from '../dashboard/components/DashboardSection';
import { truncateAxisLabel } from '../dashboard/utils/chartHelpers';
import { FullScreenFormSavingOverlay } from '../../components/common/FullScreenFormSavingOverlay';
import { DpmoPageHeader } from './components/DpmoPageHeader';
import { DpmoSkeleton } from './components/DpmoSkeleton';
import {
	GATE_SPLIT_SERIES,
	toDefectsPerSqmDatewiseChart,
	toDefectsPerSqmProjectChart,
	toGateDefectDatewiseChart,
	toMonthlyYieldChart,
	toOperatorDaywiseChart,
	toProjectDefectsChart,
	toProjectYieldChart,
	toShiftDefectsChart,
	toShiftYieldChart,
	toTopDefectsChart,
	toTopOperatorsChart,
	toWorkstationDaywiseChart,
	toWorkstationDefectsChart,
	toWorkstationYieldChart
} from './utils/dpmoChartData';

const formatCount = (value: number) => value.toLocaleString('en-IN');
const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
const formatRate = (value: number) => value.toFixed(2);

const DpmoDashboard = () => {
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

	const summaryQuery = useFetchDpmoSummaryQuery(queryArgs, { skip });
	const breakdownQuery = useFetchDpmoBreakdownQuery(queryArgs, { skip });
	const trendsQuery = useFetchDpmoTrendsQuery(queryArgs, { skip });

	const isLoading = !skip && (summaryQuery.isLoading || breakdownQuery.isLoading || trendsQuery.isLoading);
	const isRefreshing = !skip && (summaryQuery.isFetching || breakdownQuery.isFetching || trendsQuery.isFetching);
	const hasError = summaryQuery.isError || breakdownQuery.isError || trendsQuery.isError;

	const refetchAll = () => {
		summaryQuery.refetch();
		breakdownQuery.refetch();
		trendsQuery.refetch();
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

	const summary = summaryQuery.data;
	const breakdown = breakdownQuery.data;
	const trends = trendsQuery.data;

	const workstationTrend = useMemo(() => toWorkstationDaywiseChart(trends?.workstationDaywiseDefects ?? []), [trends]);
	const operatorTrend = useMemo(() => toOperatorDaywiseChart(trends?.operatorDaywiseDefects ?? []), [trends]);

	const operatorTrendTitle =
		operatorTrend.series.length > 0 && operatorTrend.totalOperators > operatorTrend.series.length
			? `Operator day-wise defects — top ${operatorTrend.series.length} of ${operatorTrend.totalOperators}`
			: 'Operator day-wise defects';

	if (isLoading && !summary) {
		return <DpmoSkeleton />;
	}

	return (
		<Box component="article" sx={{ minWidth: 0, pb: { xs: 2, sm: 3 } }}>
			<DpmoPageHeader
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

				<DashboardSection
					title="Summary"
					subtitle="Leading defects and operators, monthly yield, and shift-level performance"
				>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, md: 6, xl: 4 }}>
							<DashboardChartCard title="Top defects">
								<DashboardChart
									data={toTopDefectsChart(summary?.topDefects ?? [])}
									valueFormatter={formatCount}
									xTickFormatter={truncateAxisLabel}
								/>
							</DashboardChartCard>
						</Grid>
						<Grid size={{ xs: 12, md: 6, xl: 4 }}>
							<DashboardChartCard title="Top operators by defects">
								<DashboardChart
									data={toTopOperatorsChart(summary?.topOperators ?? [])}
									valueFormatter={formatCount}
									xTickFormatter={truncateAxisLabel}
								/>
							</DashboardChartCard>
						</Grid>
						<Grid size={{ xs: 12, md: 6, xl: 4 }}>
							<DashboardChartCard title="Monthly first pass yield (%)">
								<DashboardChart
									data={toMonthlyYieldChart(summary?.monthlyFirstPassYield ?? [])}
									valueFormatter={formatPercentage}
								/>
							</DashboardChartCard>
						</Grid>
						<Grid size={{ xs: 12, md: 6, xl: 4 }}>
							<DashboardChartCard title="Defects by shift">
								<DashboardChart
									data={toShiftDefectsChart(summary?.shiftWiseDefects ?? [])}
									series={GATE_SPLIT_SERIES}
									valueFormatter={formatCount}
								/>
							</DashboardChartCard>
						</Grid>
						<Grid size={{ xs: 12, md: 6, xl: 4 }}>
							<DashboardChartCard title="First pass yield by shift (%)">
								<DashboardChart
									data={toShiftYieldChart(summary?.shiftWiseFirstPassYield ?? [])}
									valueFormatter={formatPercentage}
								/>
							</DashboardChartCard>
						</Grid>
						<Grid size={{ xs: 12, md: 6, xl: 4 }}>
							<DashboardChartCard title="Gate defects by date">
								<DashboardChart
									data={toGateDefectDatewiseChart(summary?.gateDefectDatewise ?? [])}
									valueFormatter={formatCount}
								/>
							</DashboardChartCard>
						</Grid>
					</Grid>
				</DashboardSection>

				<DashboardSection title="Breakdown" subtitle="Yield and defects split by project and workstation">
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, md: 6, xl: 4 }}>
							<DashboardChartCard title="First pass yield by project (%)">
								<DashboardChart
									data={toProjectYieldChart(breakdown?.projectWiseFirstPassYield ?? [])}
									valueFormatter={formatPercentage}
									xTickFormatter={truncateAxisLabel}
								/>
							</DashboardChartCard>
						</Grid>
						<Grid size={{ xs: 12, md: 6, xl: 4 }}>
							<DashboardChartCard title="Defects by project">
								<DashboardChart
									data={toProjectDefectsChart(breakdown?.projectWiseDefects ?? [])}
									series={GATE_SPLIT_SERIES}
									valueFormatter={formatCount}
									xTickFormatter={truncateAxisLabel}
								/>
							</DashboardChartCard>
						</Grid>
						<Grid size={{ xs: 12, md: 6, xl: 4 }}>
							<DashboardChartCard title="First pass yield by workstation (%)">
								<DashboardChart
									data={toWorkstationYieldChart(breakdown?.workstationWiseFirstPassYield ?? [])}
									valueFormatter={formatPercentage}
									xTickFormatter={truncateAxisLabel}
								/>
							</DashboardChartCard>
						</Grid>
						<Grid size={{ xs: 12, md: 6, xl: 4 }}>
							<DashboardChartCard title="Defects by workstation">
								<DashboardChart
									data={toWorkstationDefectsChart(breakdown?.workstationWiseDefects ?? [])}
									series={GATE_SPLIT_SERIES}
									valueFormatter={formatCount}
									xTickFormatter={truncateAxisLabel}
								/>
							</DashboardChartCard>
						</Grid>
						<Grid size={{ xs: 12, md: 6, xl: 4 }}>
							<DashboardChartCard title="Defects per sq.m by project">
								<DashboardChart
									data={toDefectsPerSqmProjectChart(breakdown?.defectPerSqmProjectWise ?? [])}
									valueFormatter={formatRate}
									xTickFormatter={truncateAxisLabel}
								/>
							</DashboardChartCard>
						</Grid>
					</Grid>
				</DashboardSection>

				<DashboardSection title="Trends" subtitle="Day-wise defect movement by workstation and operator">
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, lg: 6 }}>
							<DashboardChartCard title="Workstation day-wise defects">
								<DashboardChart
									data={workstationTrend.data}
									series={workstationTrend.series}
									valueFormatter={formatCount}
								/>
							</DashboardChartCard>
						</Grid>
						<Grid size={{ xs: 12, lg: 6 }}>
							<DashboardChartCard title={operatorTrendTitle}>
								<DashboardChart data={operatorTrend.data} series={operatorTrend.series} valueFormatter={formatCount} />
							</DashboardChartCard>
						</Grid>
						<Grid size={{ xs: 12, lg: 6 }}>
							<DashboardChartCard title="Defects per sq.m by date">
								<DashboardChart
									data={toDefectsPerSqmDatewiseChart(trends?.defectPerSqmDatewise ?? [])}
									valueFormatter={formatRate}
								/>
							</DashboardChartCard>
						</Grid>
					</Grid>
				</DashboardSection>
			</Stack>

			<FullScreenFormSavingOverlay open={isRefreshing && !isLoading} message="Refreshing dashboard…" />
		</Box>
	);
};

export default DpmoDashboard;
