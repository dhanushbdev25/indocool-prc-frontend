import { Box, Grid, Stack } from '@mui/material';
import {
	useFetchMetricsQuery,
	useFetchDatewiseMetricsQuery,
	useFetchMouldingAnalysisQuery
} from '../../store/api/business/dashboard/dashboard.api';
import { analyticsPageGap } from './constants/dashboardTokens';
import { DATEWISE_STAGE_CONFIG } from './constants/stageConfig';
import { useDashboardDateRange } from './hooks/useDashboardDateRange';
import { DashboardPageHeader } from './components/DashboardPageHeader';
import { DashboardSection } from './components/DashboardSection';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { MetricsKpiGrid } from './components/kpi/MetricsKpiGrid';
import { ProjectOutputChart } from './components/moulding/ProjectOutputChart';
import { ProjectLossChart } from './components/moulding/ProjectLossChart';
import { WorkstationOutputChart } from './components/moulding/WorkstationOutputChart';
import { DatewiseOutputChart } from './components/trends/DatewiseOutputChart';
import { DashboardErrorBanner } from './components/DashboardErrorBanner';

const Dashboard = () => {
	const {
		from,
		to,
		preset,
		presetLabel,
		setPreset,
		setCustomRange,
		displayLabel,
		isReady,
		customFrom,
		customTo
	} = useDashboardDateRange();

	const queryArgs = { from, to };
	const skip = !isReady;

	const metricsQuery = useFetchMetricsQuery(queryArgs, { skip });
	const datewiseQuery = useFetchDatewiseMetricsQuery(queryArgs, { skip });
	const mouldingQuery = useFetchMouldingAnalysisQuery(queryArgs, { skip });

	const isLoading =
		!skip && (metricsQuery.isLoading || datewiseQuery.isLoading || mouldingQuery.isLoading);
	const hasError = metricsQuery.isError || datewiseQuery.isError || mouldingQuery.isError;

	const refetchAll = () => {
		metricsQuery.refetch();
		datewiseQuery.refetch();
		mouldingQuery.refetch();
	};

	const datewiseData = datewiseQuery.data;

	if (isLoading && !metricsQuery.data) {
		return <DashboardSkeleton />;
	}

	return (
		<Box component="article" sx={{ minWidth: 0, pb: { xs: 2, sm: 3 } }}>
			<DashboardPageHeader
				preset={preset}
				presetLabel={presetLabel}
				displayLabel={displayLabel}
				onPresetChange={setPreset}
				onCustomRangeChange={setCustomRange}
				customFrom={customFrom}
				customTo={customTo}
			/>

			<Stack spacing={analyticsPageGap}>
				{hasError ? <DashboardErrorBanner onRetry={refetchAll} /> : null}

				{metricsQuery.data ? <MetricsKpiGrid data={metricsQuery.data} /> : null}

				{mouldingQuery.data ? (
					<DashboardSection
						title="Moulding analysis"
						subtitle="Project output, loss minutes, and workstation performance"
					>
						<Grid container spacing={2}>
							<Grid size={{ xs: 12, lg: 4 }}>
								<ProjectOutputChart data={mouldingQuery.data.projectWise} />
							</Grid>
							<Grid size={{ xs: 12, lg: 4 }}>
								<ProjectLossChart data={mouldingQuery.data.projectLoss} />
							</Grid>
							<Grid size={{ xs: 12, lg: 4 }}>
								<WorkstationOutputChart data={mouldingQuery.data.workstationWise} />
							</Grid>
						</Grid>
					</DashboardSection>
				) : null}

				{datewiseData ? (
					<DashboardSection
						title="Daily output trends"
						subtitle="Stage-wise output percentage across the selected date range"
					>
						<Grid container spacing={2}>
							{DATEWISE_STAGE_CONFIG.map(stage => (
								<Grid key={stage.key} size={{ xs: 12, md: 6, xl: 4 }}>
									<DatewiseOutputChart
										title={`${stage.label} output (%)`}
										data={datewiseData}
										stageKey={stage.key}
										chartType={stage.datewiseChartType!}
									/>
								</Grid>
							))}
						</Grid>
					</DashboardSection>
				) : null}
			</Stack>
		</Box>
	);
};

export default Dashboard;
