import { DashboardChartCard } from '../../../dashboard/components/DashboardSection';
import { DashboardChart } from '../../../dashboard/components/charts/DashboardChart';
import { toFpyChartData, type DpmoFpyPoint } from '../../../../store/api/business/dpmo/dpmo.validators';

interface DpmoFpyLineChartProps {
	data: DpmoFpyPoint[];
	title?: string;
}

export const DpmoFpyLineChart = ({ data, title = 'First Pass Yield (%)' }: DpmoFpyLineChartProps) => (
	<DashboardChartCard title={title}>
		<DashboardChart data={toFpyChartData(data)} valueFormatter={v => `${v.toFixed(2)}%`} />
	</DashboardChartCard>
);
