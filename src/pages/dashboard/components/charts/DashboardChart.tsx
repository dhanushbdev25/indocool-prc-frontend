import { Box } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
	Bar,
	BarChart,
	CartesianGrid,
	LabelList,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis
} from 'recharts';
import { analyticsChartHeight } from '../../constants/dashboardTokens';
import { hasChartData } from '../../utils/chartHelpers';
import { DashboardChartEmptyState } from './DashboardChartEmptyState';
import type { DashboardChartType, ChartDataPoint } from './chartTypes';

export type { DashboardChartType, ChartDataPoint } from './chartTypes';

interface DashboardChartProps {
	type: DashboardChartType;
	data: ChartDataPoint[];
	height?: number;
	valueFormatter?: (value: number) => string;
	xAxisAngle?: number;
}

const defaultMargin = { top: 28, right: 8, left: 0, bottom: 0 };

export const DashboardChart = ({
	type,
	data,
	height = analyticsChartHeight,
	valueFormatter = v => v.toFixed(2),
	xAxisAngle = -40
}: DashboardChartProps) => {
	const theme = useTheme();
	const chartColor = theme.palette.primary.main;

	if (!hasChartData(data)) {
		return <DashboardChartEmptyState chartType={type} height={height} />;
	}

	const xAxisProps = {
		dataKey: 'name' as const,
		tick: { fontSize: 11, fill: theme.palette.text.secondary },
		angle: xAxisAngle,
		textAnchor: 'end' as const,
		height: xAxisAngle !== 0 ? 64 : 28,
		interval: 0 as const,
		axisLine: false,
		tickLine: false,
		dy: 8
	};

	const yAxisProps = {
		tick: { fontSize: 11, fill: theme.palette.text.secondary },
		axisLine: false,
		tickLine: false,
		width: 40,
		domain: [0, 'auto'] as [number, 'auto']
	};

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

	const labelProps = {
		position: 'top' as const,
		fontSize: 10,
		fill: theme.palette.text.secondary,
		offset: 8,
		formatter: (v: unknown) => (typeof v === 'number' ? valueFormatter(v) : '')
	};

	const gridStroke = alpha(theme.palette.divider, 0.8);

	const chart = type === 'bar' ? (
		<BarChart data={data} margin={defaultMargin} barCategoryGap="18%">
			<CartesianGrid strokeDasharray="4 4" stroke={gridStroke} vertical={false} />
			<XAxis {...xAxisProps} />
			<YAxis {...yAxisProps} />
			<Tooltip {...tooltipStyle} formatter={(v: number) => [valueFormatter(v), 'Value']} cursor={{ fill: alpha(chartColor, 0.06) }} />
			<Bar dataKey="value" fill={chartColor} radius={[6, 6, 0, 0]} maxBarSize={40}>
				<LabelList dataKey="value" {...labelProps} />
			</Bar>
		</BarChart>
	) : (
		<LineChart data={data} margin={defaultMargin}>
			<CartesianGrid strokeDasharray="4 4" stroke={gridStroke} vertical={false} />
			<XAxis {...xAxisProps} />
			<YAxis {...yAxisProps} />
			<Tooltip {...tooltipStyle} formatter={(v: number) => [valueFormatter(v), 'Value']} />
			<Line
				type="monotone"
				dataKey="value"
				stroke={chartColor}
				strokeWidth={2.5}
				dot={{ fill: chartColor, r: 3.5, strokeWidth: 2, stroke: theme.palette.background.paper }}
				activeDot={{ r: 5, strokeWidth: 0 }}
			>
				<LabelList dataKey="value" {...labelProps} />
			</Line>
		</LineChart>
	);

	return (
		<Box sx={{ width: '100%', height, minHeight: height }}>
			<ResponsiveContainer width="100%" height={height}>
				{chart}
			</ResponsiveContainer>
		</Box>
	);
};
