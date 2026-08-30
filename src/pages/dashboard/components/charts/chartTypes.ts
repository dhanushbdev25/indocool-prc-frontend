export interface ChartDataPoint {
	name: string;
	value: number;
}

/**
 * A row in a multi-series chart: the category on `name`, then one numeric entry
 * per series keyed by `ChartSeries.key`.
 */
export interface MultiSeriesPoint {
	name: string;
	[seriesKey: string]: string | number;
}

/** One line in a multi-series chart. `key` indexes into `MultiSeriesPoint`. */
export interface ChartSeries {
	key: string;
	label: string;
}
