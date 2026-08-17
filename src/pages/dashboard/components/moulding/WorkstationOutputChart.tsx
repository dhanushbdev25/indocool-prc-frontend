import {
	toWorkstationChartData,
	type WorkstationWiseItem
} from '../../../../store/api/business/dashboard/dashboard.validators';
import { sortChartDataDesc, truncateAxisLabel } from '../../utils/chartHelpers';
import { DashboardChartCard } from '../DashboardSection';
import { DashboardChart } from '../charts/DashboardChart';

interface WorkstationOutputChartProps {
	data: WorkstationWiseItem[];
}

export const WorkstationOutputChart = ({ data }: WorkstationOutputChartProps) => {
	// Sorted high-to-low so the strongest workstations read first along the axis.
	const chartData = sortChartDataDesc(toWorkstationChartData(data));

	return (
		<DashboardChartCard title="Workstation wise Moulding Output (%)">
			<DashboardChart
				data={chartData}
				valueFormatter={v => `${v.toFixed(2)}%`}
				xAxisAngle={-45}
				xTickFormatter={truncateAxisLabel}
			/>
		</DashboardChartCard>
	);
};
