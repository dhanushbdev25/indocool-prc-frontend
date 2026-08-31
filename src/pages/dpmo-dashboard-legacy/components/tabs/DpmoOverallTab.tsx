import { useCallback } from 'react';
import { Box, LinearProgress, Stack } from '@mui/material';
import { useFetchDpmoMetricsQuery } from '../../../../store/api/business/dpmo/dpmo.api';
import { buildOverallKpis } from '../../../../store/api/business/dpmo/dpmo.legacy.validators';
import { useDashboardDateRange } from '../../../dashboard/hooks/useDashboardDateRange';
import { useDashboardEntityFilters } from '../../../dashboard/hooks/useDashboardEntityFilters';
import { useDashboardFilterOptions } from '../../../dashboard/hooks/useDashboardFilterOptions';
import { analyticsPageGap } from '../../../dashboard/constants/dashboardTokens';
import { DashboardErrorBanner } from '../../../dashboard/components/DashboardErrorBanner';
import { DpmoFilterBar } from '../DpmoFilterBar';
import { DpmoKpiStrip } from '../kpi/DpmoKpiStrip';
import { DpmoFpyLineChart } from '../charts/DpmoFpyLineChart';
import { DpmoProductDefectChart } from '../charts/DpmoProductDefectChart';
import { DpmoTabSkeleton } from '../DpmoTabSkeleton';

export const DpmoOverallTab = () => {
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

	const { unitOptions, workstationOptions, projectOptions } = useDashboardFilterOptions({
		selectedUnits: draftFilters.units
	});

	const skip = !isReady;
	const metricsQuery = useFetchDpmoMetricsQuery(
		{
			from,
			to,
			plantCode: appliedFilters.units,
			workstation: appliedFilters.workstation,
			customer: appliedFilters.projects
		},
		{ skip }
	);

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

	const data = metricsQuery.data;
	const isInitialLoading = metricsQuery.isLoading && !data;
	const isRefetching = metricsQuery.isFetching && !!data;

	return (
		<Stack spacing={analyticsPageGap}>
			<DpmoFilterBar
				variant="overall"
				dateRange={{
					preset: draftPreset,
					presetLabel: draftPresetLabel,
					displayLabel: draftDisplayLabel,
					customFrom: draftCustomFrom,
					customTo: draftCustomTo,
					onPresetChange: setDraftPreset,
					onCustomRangeChange: setDraftCustomRange
				}}
				draftFilters={draftFilters}
				onDraftFilterChange={setDraftFilter}
				unitOptions={unitOptions}
				workstationOptions={workstationOptions}
				projectOptions={projectOptions}
				onApply={handleApply}
				onReset={handleReset}
				isDirty={isDirty}
				hasActiveFilters={hasActiveFilters || isDateRangeDirty}
				disabled={!isReady}
			/>

			{metricsQuery.isError ? <DashboardErrorBanner onRetry={metricsQuery.refetch} /> : null}

			{isInitialLoading ? (
				<DpmoTabSkeleton variant="overall" />
			) : (
				<Stack spacing={analyticsPageGap}>
					<Box sx={{ position: 'relative' }}>
						{isRefetching ? (
							<LinearProgress
								sx={{
									position: 'absolute',
									top: -8,
									left: 0,
									right: 0,
									borderRadius: 999,
									height: 3
								}}
							/>
						) : null}
						<DpmoKpiStrip kpis={buildOverallKpis(data)} />
					</Box>

					<DpmoFpyLineChart data={data?.fpyByDay ?? []} />

					<DpmoProductDefectChart data={data?.productDefects ?? []} />
				</Stack>
			)}
		</Stack>
	);
};
