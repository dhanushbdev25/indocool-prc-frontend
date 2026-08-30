import { Box } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
	CartesianGrid,
	LabelList,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis
} from 'recharts';
import { analyticsChartHeight, chartSeriesColors } from '../../constants/dashboardTokens';
import { hasChartData, hasMultiSeriesData } from '../../utils/chartHelpers';
import { DashboardChartEmptyState } from './DashboardChartEmptyState';
import type { ChartDataPoint, ChartSeries, MultiSeriesPoint } from './chartTypes';

export type { ChartDataPoint } from './chartTypes';

interface DashboardChartProps {
	/** `ChartDataPoint[]` in single-series mode, `MultiSeriesPoint[]` when `series` is set. */
	data: ChartDataPoint[] | MultiSeriesPoint[];
	/** Supplying this switches the chart to multi-series mode: one line per entry, plus a legend. */
	series?: ChartSeries[];
	height?: number;
	valueFormatter?: (value: number) => string;
	xAxisAngle?: number;
	/** Shortens long category labels (e.g. workstation names) on the X axis. */
	xTickFormatter?: (value: string) => string;
}

const defaultMargin = { top: 28, right: 8, left: 0, bottom: 0 };

export const DashboardChart = ({
	data,
	series,
	height = analyticsChartHeight,
	valueFormatter = v => v.toFixed(2),
	xAxisAngle = -40,
	xTickFormatter
}: DashboardChartProps) => {
	const theme = useTheme();
	const chartColor = theme.palette.primary.main;
	const isMultiSeries = series != null && series.length > 0;

	const hasData = isMultiSeries
		? hasMultiSeriesData(data as MultiSeriesPoint[], series)
		: hasChartData(data as ChartDataPoint[]);
	if (!hasData) {
		return <DashboardChartEmptyState height={height} />;
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
		dy: 8,
		...(xTickFormatter ? { tickFormatter: (value: string) => xTickFormatter(String(value)) } : {})
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
	const seriesColors = chartSeriesColors(theme);

	// Multi-series mode drops the per-point labels — several overlapping lines make them unreadable.
	const chart = (
		<LineChart data={data} margin={defaultMargin}>
			<CartesianGrid strokeDasharray="4 4" stroke={gridStroke} vertical={false} />
			<XAxis {...xAxisProps} />
			<YAxis {...yAxisProps} />
			{isMultiSeries ? (
				<Tooltip {...tooltipStyle} formatter={(v: number) => valueFormatter(v)} />
			) : (
				<Tooltip {...tooltipStyle} formatter={(v: number) => [valueFormatter(v), 'Value']} />
			)}
			{isMultiSeries ? (
				<Legend
					verticalAlign="bottom"
					height={28}
					iconType="plainline"
					iconSize={14}
					wrapperStyle={{ fontSize: 11, color: theme.palette.text.secondary }}
				/>
			) : null}
			{isMultiSeries ? (
				series.map((s, index) => {
					const color = seriesColors[index % seriesColors.length];
					return (
						<Line
							key={s.key}
							type="monotone"
							dataKey={s.key}
							name={s.label}
							stroke={color}
							strokeWidth={2}
							dot={{ fill: color, r: 2.5, strokeWidth: 0 }}
							activeDot={{ r: 4.5, strokeWidth: 0 }}
						/>
					);
				})
			) : (
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
			)}
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
