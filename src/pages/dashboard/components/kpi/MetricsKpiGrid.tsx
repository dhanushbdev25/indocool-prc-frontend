import { Box } from '@mui/material';
import type { MetricsData, RangedMetricsData } from '../../../../store/api/business/dashboard/dashboard.validators';
import {
	analyticsMetricGrid,
	analyticsPanel,
	analyticsPanelBody,
	analyticsPanelHeader,
	analyticsSectionSubtitle,
	analyticsSectionTitle
} from '../../constants/dashboardTokens';
import { STAGE_CONFIG } from '../../constants/stageConfig';
import { TruncatedTextWithTooltip } from '../TruncatedTextWithTooltip';
import { MetricDonutCard } from './MetricDonutCard';

interface MetricsKpiGridProps {
	data: RangedMetricsData;
}

interface KpiPanelProps {
	title: string;
	subtitle: string;
	selectedMetrics: MetricsData['output'];
	extendedMetrics: MetricsData['output'];
	suffix: 'Output (%)' | 'Manpower %';
}

const KpiPanel = ({ title, subtitle, selectedMetrics, extendedMetrics, suffix }: KpiPanelProps) => (
	<Box sx={analyticsPanel}>
		<Box sx={analyticsPanelHeader}>
			<Box sx={{ minWidth: 0, flex: 1 }}>
				<TruncatedTextWithTooltip text={title} sx={analyticsSectionTitle} />
				<TruncatedTextWithTooltip text={subtitle} lineClamp={2} sx={[analyticsSectionSubtitle, { mt: 0.25 }]} />
			</Box>
		</Box>
		<Box sx={analyticsPanelBody}>
			<Box sx={analyticsMetricGrid}>
				{STAGE_CONFIG.map(stage => (
					<MetricDonutCard
						key={`${stage.key}-${suffix}`}
						title={`${stage.label} ${suffix}`}
						selected={selectedMetrics[stage.key]}
						extended={extendedMetrics[stage.key]}
					/>
				))}
			</Box>
		</Box>
	</Box>
);

export const MetricsKpiGrid = ({ data }: MetricsKpiGridProps) => (
	<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
		<KpiPanel
			title="Production output"
			subtitle="Completed vs planned output by manufacturing stage — selected range against the 90-day extended range"
			selectedMetrics={data.selectedRange.output}
			extendedMetrics={data.extendedRange.output}
			suffix="Output (%)"
		/>
		<KpiPanel
			title="Manpower utilization"
			subtitle="Actual vs planned manpower allocation by stage — selected range against the 90-day extended range"
			selectedMetrics={data.selectedRange.manpower}
			extendedMetrics={data.extendedRange.manpower}
			suffix="Manpower %"
		/>
	</Box>
);
