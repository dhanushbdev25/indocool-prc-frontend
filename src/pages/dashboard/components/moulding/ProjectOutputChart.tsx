import {
	toProjectChartData,
	type ProjectWiseItem
} from '../../../../store/api/business/dashboard/dashboard.validators';
import { DashboardChartCard } from '../DashboardSection';
import { DashboardChart } from '../charts/DashboardChart';

interface ProjectOutputChartProps {
	data: ProjectWiseItem[];
}

export const ProjectOutputChart = ({ data }: ProjectOutputChartProps) => (
	<DashboardChartCard title="Project-wise Moulding Output (%)">
		<DashboardChart type="line" data={toProjectChartData(data)} xAxisAngle={-35} />
	</DashboardChartCard>
);
