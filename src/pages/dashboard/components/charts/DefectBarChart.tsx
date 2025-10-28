import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer } from './PartsBarChart';
import type { DefectChartData } from '../../../store/api/business/dashboard/dashboard.validators';

interface DefectBarChartProps {
	data: DefectChartData[];
}

// Color function based on severity
const getDefectColor = (severity: 'low' | 'medium' | 'high') => {
	switch (severity) {
		case 'high':
			return '#f44336'; // Red for high severity
		case 'medium':
			return '#ff9800'; // Orange for medium severity
		case 'low':
			return '#4caf50'; // Green for low severity
		default:
			return '#9e9e9e'; // Gray for unknown
	}
};

export const DefectBarChart = ({ data }: DefectBarChartProps) => {
	return (
		<ChartContainer
			title="Defect Analysis"
			description="Frequency of defects found during PRC execution"
			height={600}
		>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart 
					data={data} 
					margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
				>
					<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
					<XAxis 
						dataKey="name"
						tick={{ 
							fontSize: 9, 
							fill: '#666',
							textAnchor: 'end',
							dominantBaseline: 'middle'
						}}
						angle={-60}
						textAnchor="end"
						height={100}
						interval={0}
						axisLine={{ stroke: '#e0e0e0' }}
						tickLine={{ stroke: '#e0e0e0' }}
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
							fontSize: '14px',
							maxWidth: '300px'
						}}
						formatter={(value: number, name, props) => [
							value, 
							'Occurrences'
						]}
						labelFormatter={(label, payload) => {
							if (payload && payload[0] && payload[0].payload) {
								const payloadData = payload[0].payload;
								return (
									<div style={{ wordWrap: 'break-word' }}>
										<strong>{payloadData.defectName || label}</strong>
										<br />
										<small style={{ color: '#666' }}>
											Severity: {payloadData.severity?.toUpperCase() || 'UNKNOWN'}
										</small>
									</div>
								);
							}
							return label;
						}}
						labelStyle={{ color: '#333', fontWeight: 600 }}
					/>
					<Bar 
						dataKey="value" 
						fill="#ff6b6b"
						radius={[4, 4, 0, 0]}
						stroke="#ff5252"
						strokeWidth={1}
					/>
				</BarChart>
			</ResponsiveContainer>
		</ChartContainer>
	);
};
