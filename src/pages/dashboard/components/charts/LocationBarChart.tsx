import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer } from './PartsBarChart';
import type { LocationChartData } from '../../../store/api/business/dashboard/dashboard.validators';

interface LocationBarChartProps {
	data: LocationChartData[];
}

export const LocationBarChart = ({ data }: LocationBarChartProps) => {
	return (
		<ChartContainer
			title="PRC Completion by Location"
			description="Number of completed PRCs across different plant locations"
		>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
					<XAxis 
						dataKey="name" 
						tick={{ 
							fontSize: 10, 
							fill: '#666',
							textAnchor: 'end',
							dominantBaseline: 'middle'
						}}
						angle={-60}
						textAnchor="end"
						height={80}
						interval={0}
					/>
					<YAxis 
						tick={{ fontSize: 12, fill: '#666' }}
						axisLine={{ stroke: '#e0e0e0' }}
						tickLine={{ stroke: '#e0e0e0' }}
					/>
					<Tooltip 
						contentStyle={{
							backgroundColor: 'white',
							border: '1px solid #e0e0e0',
							borderRadius: '8px',
							boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
							fontSize: '14px'
						}}
						formatter={(value: number, name, props) => [
							value, 
							'Completed PRCs'
						]}
						labelFormatter={(label, payload) => {
							if (payload && payload[0] && payload[0].payload) {
								return payload[0].payload.locationName || label;
							}
							return label;
						}}
						labelStyle={{ color: '#333', fontWeight: 600 }}
					/>
					<Bar 
						dataKey="value" 
						fill="#042E70"
						radius={[4, 4, 0, 0]}
						stroke="#042E70"
						strokeWidth={1}
					/>
				</BarChart>
			</ResponsiveContainer>
		</ChartContainer>
	);
};
