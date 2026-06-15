import type { ChartDataPoint } from '../components/charts/chartTypes';

/** True when there is at least one finite, non-zero value to plot. */
export const hasChartData = (data: ChartDataPoint[]): boolean =>
	data.length > 0 && data.some(point => Number.isFinite(point.value) && point.value !== 0);

export const sortChartDataDesc = (data: ChartDataPoint[]): ChartDataPoint[] =>
	[...data].sort((a, b) => b.value - a.value);

export const truncateAxisLabel = (label: string, maxLength = 14): string =>
	label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
