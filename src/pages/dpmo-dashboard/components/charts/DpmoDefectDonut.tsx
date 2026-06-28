import { Box, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardChartCard } from '../../../dashboard/components/DashboardSection';
import { DashboardChartEmptyState } from '../../../dashboard/components/charts/DashboardChartEmptyState';
interface DpmoDefectDonutProps {
	title: string;
	data: { gate: number; nonGate: number };
}

const formatNumber = (n: number) => n.toLocaleString('en-IN');

const Legend = ({ swatchColor, label, value }: { swatchColor: string; label: string; value: string }) => (
	<Stack direction="row" alignItems="center" spacing={1}>
		<Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: swatchColor, flexShrink: 0 }} />
		<Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
			{label}
		</Typography>
		<Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
			{value}
		</Typography>
	</Stack>
);

export const DpmoDefectDonut = ({ title, data }: DpmoDefectDonutProps) => {
	const theme = useTheme();
	const total = data.gate + data.nonGate;

	if (total <= 0) {
		return (
			<DashboardChartCard title={title}>
				<DashboardChartEmptyState chartType="bar" />
			</DashboardChartCard>
		);
	}

	const chartData = [
		{ name: 'Gate', value: data.gate },
		{ name: 'Non-Gate', value: data.nonGate }
	];

	const gateColor = theme.palette.primary.main;
	const nonGateColor = alpha(theme.palette.primary.main, 0.45);
	const colors = [gateColor, nonGateColor];

	const tooltipStyle = {
		contentStyle: {
			backgroundColor: theme.palette.background.paper,
			border: `1px solid ${theme.palette.divider}`,
			borderRadius: '10px',
			boxShadow: theme.shadows[4],
			fontSize: '12px',
			padding: '8px 12px'
		},
		labelStyle: { fontWeight: 600 }
	};

	return (
		<DashboardChartCard title={title}>
			<Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
				<Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Tooltip {...tooltipStyle} formatter={(v: number, n: string) => [formatNumber(v), n]} />
							<Pie
								data={chartData}
								cx="50%"
								cy="50%"
								innerRadius="58%"
								outerRadius="88%"
								startAngle={90}
								endAngle={-270}
								dataKey="value"
								stroke="none"
							>
								{chartData.map((_, i) => (
									<Cell key={i} fill={colors[i]} />
								))}
							</Pie>
						</PieChart>
					</ResponsiveContainer>
					<Box
						sx={{
							position: 'absolute',
							inset: 0,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							pointerEvents: 'none'
						}}
					>
						<Typography
							sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}
						>
							Total
						</Typography>
						<Typography
							sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.5rem', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}
						>
							{formatNumber(total)}
						</Typography>
					</Box>
				</Box>
				<Stack direction="row" justifyContent="center" spacing={3} sx={{ mt: 1.5 }}>
					<Legend swatchColor={gateColor} label="Gate" value={formatNumber(data.gate)} />
					<Legend swatchColor={nonGateColor} label="Non-Gate" value={formatNumber(data.nonGate)} />
				</Stack>
			</Box>
		</DashboardChartCard>
	);
};
