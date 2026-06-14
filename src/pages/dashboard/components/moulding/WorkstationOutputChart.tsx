import {
	toWorkstationChartData,
	type WorkstationWiseItem
} from '../../../../store/api/business/dashboard/dashboard.validators';
import { DashboardChartCard } from '../DashboardSection';
import { DashboardChart } from '../charts/DashboardChart';

interface WorkstationOutputChartProps {
	data: WorkstationWiseItem[];
}

export const WorkstationOutputChart = ({ data }: WorkstationOutputChartProps) => (
	<DashboardChartCard title="Workstation wise Moulding Output (%)">
		<DashboardChart type="line" data={toWorkstationChartData(data)} xAxisAngle={-45} />
	</DashboardChartCard>
);
