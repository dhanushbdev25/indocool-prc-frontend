import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis
} from 'recharts';
import {
	toWorkstationChartData,
	type WorkstationWiseItem
} from '../../../../store/api/business/dashboard/dashboard.validators';
import { analyticsChartHeight } from '../../constants/dashboardTokens';
import { hasChartData, sortChartDataDesc, truncateAxisLabel } from '../../utils/chartHelpers';
import { DashboardChartEmptyState } from '../charts/DashboardChartEmptyState';
import { DashboardChartCard } from '../DashboardSection';

interface WorkstationOutputChartProps {
	data: WorkstationWiseItem[];
}

const ROW_HEIGHT = 26;
const Y_AXIS_WIDTH = 96;
const VIEWPORT_HEIGHT = analyticsChartHeight;

export const WorkstationOutputChart = ({ data }: WorkstationOutputChartProps) => {
	const theme = useTheme();

	const chartData = useMemo(
		() => sortChartDataDesc(toWorkstationChartData(data)),
		[data]
	);

	const showScrollHint = chartData.length > 10;
	const hintHeight = showScrollHint ? 22 : 0;
	const chartAreaHeight = Math.max(VIEWPORT_HEIGHT - 16, chartData.length * ROW_HEIGHT + 16);
	const contentHeight = hintHeight + chartAreaHeight;

	if (!hasChartData(chartData)) {
		return (
			<DashboardChartCard title="Workstation wise Moulding Output (%)">
				<DashboardChartEmptyState chartType="bar" height={VIEWPORT_HEIGHT} />
			</DashboardChartCard>
		);
	}

	const tooltipStyle = {
		contentStyle: {
			backgroundColor: theme.palette.background.paper,
			border: `1px solid ${theme.palette.divider}`,
			borderRadius: '10px',
			boxShadow: theme.shadows[4],
			fontSize: '12px',
			padding: '8px 12px'
		},
		labelStyle: { fontWeight: 600, marginBottom: 4 }
	};

	return (
		<DashboardChartCard
			title="Workstation wise Moulding Output (%)"
			height={VIEWPORT_HEIGHT}
			scrollContentHeight={contentHeight}
		>
			{showScrollHint ? (
				<Typography
					variant="caption"
					color="text.secondary"
					sx={{ display: 'block', mb: 0.5, px: 0.5, fontSize: '0.6875rem', height: hintHeight }}
				>
					Sorted by output · scroll to view all {chartData.length} workstations
				</Typography>
			) : null}
			<Box sx={{ width: '100%', height: chartAreaHeight, minHeight: chartAreaHeight }}>
				<ResponsiveContainer width="100%" height={chartAreaHeight}>
					<BarChart
						layout="vertical"
						data={chartData}
						margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
						barCategoryGap="20%"
					>
						<CartesianGrid strokeDasharray="4 4" stroke={alpha(theme.palette.divider, 0.8)} horizontal={false} />
						<XAxis
							type="number"
							tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
							axisLine={false}
							tickLine={false}
							domain={[0, 'auto']}
							tickFormatter={v => `${v}%`}
						/>
						<YAxis
							type="category"
							dataKey="name"
							width={Y_AXIS_WIDTH}
							tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
							axisLine={false}
							tickLine={false}
							tickFormatter={value => truncateAxisLabel(String(value))}
						/>
						<Tooltip
							{...tooltipStyle}
							formatter={(v: number) => [`${v.toFixed(2)}%`, 'Output']}
							labelFormatter={label => String(label)}
							cursor={{ fill: alpha(theme.palette.primary.main, 0.06) }}
						/>
						<Bar
							dataKey="value"
							fill={theme.palette.primary.main}
							radius={[0, 4, 4, 0]}
							maxBarSize={14}
							isAnimationActive={false}
						/>
					</BarChart>
				</ResponsiveContainer>
			</Box>
		</DashboardChartCard>
	);
};
