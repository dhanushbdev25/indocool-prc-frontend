import { Box } from '@mui/material';
import type { MetricsData } from '../../../../store/api/business/dashboard/dashboard.validators';
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
	data: MetricsData;
}

interface KpiPanelProps {
	title: string;
	subtitle: string;
	metrics: MetricsData['output'];
	suffix: 'Output (%)' | 'Manpower %';
}

const KpiPanel = ({ title, subtitle, metrics, suffix }: KpiPanelProps) => (
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
						metric={metrics[stage.key]}
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
			subtitle="Completed vs planned output by manufacturing stage"
			metrics={data.output}
			suffix="Output (%)"
		/>
		<KpiPanel
			title="Manpower utilization"
			subtitle="Actual vs planned manpower allocation by stage"
			metrics={data.manpower}
			suffix="Manpower %"
		/>
	</Box>
);
