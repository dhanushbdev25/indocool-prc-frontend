import {
	BarChart,
	Bar,
	LineChart,
	Line,
	AreaChart,
	Area,
	PieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend
} from 'recharts';
import type { CSSProperties } from 'react';
import React from 'react';
import type { ChartType } from './types';
import type { ChartDataItem } from '../../../../store/api/business/dashboard/dashboard.validators';

// Types for tooltip payload
interface TooltipPayload {
	value?: number | string;
	name?: string;
	payload?: ChartDataItem;
	[key: string]: unknown;
}

export interface ChartRendererProps<T extends ChartDataItem = ChartDataItem> {
	chartType: ChartType;
	data: T[];
	dataKey: string;
	color?: string | string[] | ((item: T) => string);
	margin?: { top: number; right: number; left: number; bottom: number };
	xAxisConfig?: {
		dataKey?: string;
		angle?: number;
		height?: number;
		interval?: number | 'preserveStartEnd';
		[key: string]: string | number | boolean | object | undefined;
	};
	yAxisConfig?: {
		[key: string]: string | number | boolean | object | undefined;
	};
	tooltipConfig?: {
		formatter?:
			| ((value: number | string, name?: string, props?: unknown) => [string | number, string?])
			| ((value: number) => [number, string]);
		labelFormatter?: (label: string | number, payload?: TooltipPayload[]) => string | React.ReactNode;
		contentStyle?: CSSProperties;
		labelStyle?: CSSProperties;
	};
	// For defect charts with severity-based coloring
	getColor?: (item: T) => string;
	// Custom label key for pie chart
	labelKey?: string;
}

export const ChartRenderer = <T extends ChartDataItem = ChartDataItem>({
	chartType,
	data,
	dataKey,
	color = '#0D5FDC',
	margin = { top: 20, right: 30, left: 20, bottom: 80 },
	xAxisConfig = {},
	yAxisConfig = {},
	tooltipConfig = {},
	getColor,
	labelKey = 'name'
}: ChartRendererProps<T>) => {
	const defaultXAxisConfig = {
		dataKey: xAxisConfig.dataKey || labelKey,
		tick: {
			fontSize: 10,
			fill: '#666',
			textAnchor: 'end' as const,
			dominantBaseline: 'middle' as const
		},
		angle: -60,
		textAnchor: 'end' as const,
		height: 80,
		interval: 0,
		axisLine: { stroke: '#e0e0e0' },
		tickLine: { stroke: '#e0e0e0' },
		...xAxisConfig
	};

	const defaultYAxisConfig = {
		tick: { fontSize: 12, fill: '#666' },
		axisLine: { stroke: '#e0e0e0' },
		tickLine: { stroke: '#e0e0e0' },
		...yAxisConfig
	};

	const defaultTooltipConfig = {
		contentStyle: {
			backgroundColor: 'white',
			border: '1px solid #e0e0e0',
			borderRadius: '8px',
			boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
			fontSize: '14px'
		},
		...tooltipConfig
	};

	const getBarFill = (entry: ChartDataItem, index: number) => {
		if (getColor) {
			return getColor(entry as T);
		}
		if (Array.isArray(color)) {
			return color[index % color.length];
		}
		if (typeof color === 'function') {
			return color(entry as T);
		}
		return color || '#0D5FDC';
	};

	if (chartType === 'pie') {
		// For pie charts, make outer radius responsive to data size
		const outerRadius = data.length > 10 ? 100 : 80;
		const pieMargin = margin || { top: 20, right: 30, left: 20, bottom: 80 };
		return (
			<ResponsiveContainer width="100%" height="100%">
				<PieChart margin={pieMargin}>
					<Pie
						data={data}
						cx="50%"
						cy="50%"
						labelLine={false}
						label={(entry: { name?: string; percent?: number }) => {
							const name = entry.name || '';
							const percent = typeof entry.percent === 'number' ? entry.percent : 0;
							// Truncate long names for better display
							const displayName = name.length > 15 ? `${name.substring(0, 15)}...` : name;
							return `${displayName}: ${(percent * 100).toFixed(0)}%`;
						}}
						outerRadius={outerRadius}
						fill="#8884d8"
						dataKey={dataKey}
					>
						{data.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={getBarFill(entry, index)} />
						))}
					</Pie>
					<Tooltip {...(defaultTooltipConfig as object)} />
					<Legend />
				</PieChart>
			</ResponsiveContainer>
		);
	}

	const commonProps = {
		data,
		margin: margin || { top: 20, right: 30, left: 20, bottom: 80 }
	};

	if (chartType === 'bar') {
		const hasCustomColors = Array.isArray(color) || typeof color === 'function' || getColor;
		return (
			<ResponsiveContainer width="100%" height="100%">
				<BarChart {...commonProps}>
					<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
					<XAxis {...defaultXAxisConfig} />
					<YAxis {...defaultYAxisConfig} />
					<Tooltip {...(defaultTooltipConfig as object)} />
					<Bar
						dataKey={dataKey}
						fill={hasCustomColors ? undefined : typeof color === 'string' ? color : '#0D5FDC'}
						radius={[4, 4, 0, 0]}
						stroke={hasCustomColors ? undefined : typeof color === 'string' ? color : '#0D5FDC'}
						strokeWidth={1}
					>
						{hasCustomColors
							? data.map((entry, index) => (
									<Cell key={`cell-${index}`} fill={getBarFill(entry, index)} stroke={getBarFill(entry, index)} />
								))
							: null}
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		);
	}

	if (chartType === 'line') {
		// For line charts with custom colors, we'll use the first color or a gradient
		const lineColor = getColor && data.length > 0 ? getColor(data[0]) : typeof color === 'string' ? color : '#0D5FDC';
		return (
			<ResponsiveContainer width="100%" height="100%">
				<LineChart {...commonProps}>
					<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
					<XAxis {...defaultXAxisConfig} />
					<YAxis {...defaultYAxisConfig} />
					<Tooltip {...(defaultTooltipConfig as object)} />
					<Line
						type="monotone"
						dataKey={dataKey}
						stroke={lineColor}
						strokeWidth={2}
						dot={{ fill: lineColor, r: 4 }}
						activeDot={{ r: 6 }}
					/>
				</LineChart>
			</ResponsiveContainer>
		);
	}

	if (chartType === 'area') {
		// For area charts with custom colors, we'll use the first color or a gradient
		const areaColor = getColor && data.length > 0 ? getColor(data[0]) : typeof color === 'string' ? color : '#0D5FDC';
		return (
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart {...commonProps}>
					<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
					<XAxis {...defaultXAxisConfig} />
					<YAxis {...defaultYAxisConfig} />
					<Tooltip {...(defaultTooltipConfig as object)} />
					<Area type="monotone" dataKey={dataKey} stroke={areaColor} fill={areaColor} fillOpacity={0.6} />
				</AreaChart>
			</ResponsiveContainer>
		);
	}

	return null;
};
