import {
	toDatewiseChartData,
	type DatewiseMetricsItem,
	type StageKey
} from '../../../../store/api/business/dashboard/dashboard.validators';
import type { DatewiseChartType } from '../../constants/stageConfig';
import { DashboardChartCard } from '../DashboardSection';
import { DashboardChart } from '../charts/DashboardChart';

interface DatewiseOutputChartProps {
	title: string;
	data: DatewiseMetricsItem[];
	stageKey: StageKey;
	chartType: DatewiseChartType;
}

export const DatewiseOutputChart = ({ title, data, stageKey, chartType }: DatewiseOutputChartProps) => (
	<DashboardChartCard title={title}>
		<DashboardChart type={chartType} data={toDatewiseChartData(data, stageKey)} xAxisAngle={-45} />
	</DashboardChartCard>
);
