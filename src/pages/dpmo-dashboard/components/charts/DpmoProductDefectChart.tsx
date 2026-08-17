import { DashboardChartCard } from '../../../dashboard/components/DashboardSection';
import { DashboardChart } from '../../../dashboard/components/charts/DashboardChart';
import {
	toProductDefectChartData,
	type DpmoProductDefectPoint
} from '../../../../store/api/business/dpmo/dpmo.validators';

interface DpmoProductDefectChartProps {
	data: DpmoProductDefectPoint[];
	title?: string;
}

export const DpmoProductDefectChart = ({
	data,
	title = 'Product-wise defects (Qty)'
}: DpmoProductDefectChartProps) => (
	<DashboardChartCard title={title} height={360}>
		<DashboardChart
			data={toProductDefectChartData(data)}
			height={360}
			valueFormatter={v => v.toLocaleString('en-IN')}
		/>
	</DashboardChartCard>
);
