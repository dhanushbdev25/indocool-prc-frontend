import { useCallback } from 'react';
import { Box, Grid, LinearProgress, Stack } from '@mui/material';
import { useFetchDpmoMetricsQuery } from '../../../../store/api/business/dpmo/dpmo.api';
import { buildProjectWiseKpis } from '../../../../store/api/business/dpmo/dpmo.validators';
import { useDashboardDateRange } from '../../../dashboard/hooks/useDashboardDateRange';
import { useDashboardFilterOptions } from '../../../dashboard/hooks/useDashboardFilterOptions';
import { analyticsPageGap } from '../../../dashboard/constants/dashboardTokens';
import { DashboardErrorBanner } from '../../../dashboard/components/DashboardErrorBanner';
import { useDpmoProjectFilter } from '../../hooks/useDpmoProjectFilter';
import { DpmoFilterBar } from '../DpmoFilterBar';
import { DpmoKpiStrip } from '../kpi/DpmoKpiStrip';
import { DpmoFpyLineChart } from '../charts/DpmoFpyLineChart';
import { DpmoDefectDonut } from '../charts/DpmoDefectDonut';
import { DpmoTabSkeleton } from '../DpmoTabSkeleton';

export const DpmoProjectWiseTab = () => {
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
		appliedProject,
		draftProject,
		setDraftProject,
		applyDraft: applyProjectDraft,
		clearAll: clearAllProject,
		isDirty: isProjectDirty,
		hasActiveFilters
	} = useDpmoProjectFilter();

	const { projectOptions } = useDashboardFilterOptions({ selectedUnits: [] });

	const skip = !isReady || !appliedProject;
	const metricsQuery = useFetchDpmoMetricsQuery(
		{ from, to, customer: appliedProject ? [appliedProject] : undefined },
		{ skip }
	);

	const isDirty = isDateRangeDirty || isProjectDirty;

	const handleApply = useCallback(() => {
		if (!isDirty) return;
		applyDateRangeDraft();
		applyProjectDraft();
	}, [isDirty, applyDateRangeDraft, applyProjectDraft]);

	const handleReset = useCallback(() => {
		clearAllDateRange();
		clearAllProject();
	}, [clearAllDateRange, clearAllProject]);

	const data = metricsQuery.data;
	const isInitialLoading = metricsQuery.isLoading && !data;
	const isRefetching = metricsQuery.isFetching && !!data;

	return (
		<Stack spacing={analyticsPageGap}>
			<DpmoFilterBar
				variant="projectWise"
				dateRange={{
					preset: draftPreset,
					presetLabel: draftPresetLabel,
					displayLabel: draftDisplayLabel,
					customFrom: draftCustomFrom,
					customTo: draftCustomTo,
					onPresetChange: setDraftPreset,
					onCustomRangeChange: setDraftCustomRange
				}}
				draftProject={draftProject}
				onDraftProjectChange={setDraftProject}
				projectOptions={projectOptions}
				onApply={handleApply}
				onReset={handleReset}
				isDirty={isDirty}
				hasActiveFilters={hasActiveFilters || isDateRangeDirty}
				disabled={!isReady}
			/>

			{metricsQuery.isError ? <DashboardErrorBanner onRetry={metricsQuery.refetch} /> : null}

			{isInitialLoading ? (
				<DpmoTabSkeleton variant="projectWise" />
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
						<DpmoKpiStrip kpis={buildProjectWiseKpis(data)} />
					</Box>

					<Grid container spacing={2}>
						<Grid size={{ xs: 12, md: 5 }}>
							<DpmoDefectDonut
								title="Defects (Gate vs Non-Gate)"
								data={data?.defects ?? { gate: 0, nonGate: 0 }}
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 7 }}>
							<DpmoFpyLineChart data={data?.fpyByDay ?? []} />
						</Grid>
					</Grid>
				</Stack>
			)}
		</Stack>
	);
};
