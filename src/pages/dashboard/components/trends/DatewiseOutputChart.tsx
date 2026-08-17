import {
	toDatewiseChartData,
	type DatewiseMetricsItem,
	type StageKey
} from '../../../../store/api/business/dashboard/dashboard.validators';
import { DashboardChartCard } from '../DashboardSection';
import { DashboardChart } from '../charts/DashboardChart';

interface DatewiseOutputChartProps {
	title: string;
	data: DatewiseMetricsItem[];
	stageKey: StageKey;
}

export const DatewiseOutputChart = ({ title, data, stageKey }: DatewiseOutputChartProps) => (
	<DashboardChartCard title={title}>
		<DashboardChart data={toDatewiseChartData(data, stageKey)} xAxisAngle={-45} />
	</DashboardChartCard>
);
