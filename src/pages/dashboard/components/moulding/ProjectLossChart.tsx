import {
	toProjectLossChartData,
	type ProjectLossItem
} from '../../../../store/api/business/dashboard/dashboard.validators';
import { DashboardChartCard } from '../DashboardSection';
import { DashboardChart } from '../charts/DashboardChart';

interface ProjectLossChartProps {
	data: ProjectLossItem[];
}

export const ProjectLossChart = ({ data }: ProjectLossChartProps) => (
	<DashboardChartCard title="Loss (Mins)">
		<DashboardChart
			type="bar"
			data={toProjectLossChartData(data)}
			valueFormatter={v => String(Math.round(v))}
			xAxisAngle={-35}
		/>
	</DashboardChartCard>
);
