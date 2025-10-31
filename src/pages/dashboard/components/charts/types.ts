export type ChartType = 'bar' | 'line' | 'area' | 'pie';

export interface ChartTypeOption {
	value: ChartType;
	label: string;
}

export const CHART_TYPE_OPTIONS: ChartTypeOption[] = [
	{ value: 'bar', label: 'Bar Chart' },
	{ value: 'line', label: 'Line Chart' },
	{ value: 'area', label: 'Area Chart' },
	{ value: 'pie', label: 'Pie Chart' }
];

/**
 * Load chart type from localStorage
 * @param storageKey - The key to use in localStorage
 * @param defaultValue - Default chart type if not found
 * @returns The chart type from localStorage or default
 */
export const loadChartType = (storageKey: string, defaultValue: ChartType = 'bar'): ChartType => {
	if (typeof window === 'undefined') {
		return defaultValue;
	}

	try {
		const saved = localStorage.getItem(storageKey);
		if (saved && ['bar', 'line', 'area', 'pie'].includes(saved)) {
			return saved as ChartType;
		}
	} catch (error) {
		console.warn(`Failed to load chart type from localStorage: ${error}`);
	}

	return defaultValue;
};

/**
 * Save chart type to localStorage
 * @param storageKey - The key to use in localStorage
 * @param chartType - The chart type to save
 */
export const saveChartType = (storageKey: string, chartType: ChartType): void => {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		localStorage.setItem(storageKey, chartType);
	} catch (error) {
		console.warn(`Failed to save chart type to localStorage: ${error}`);
	}
};

// Storage keys for different charts
export const CHART_STORAGE_KEYS = {
	PARTS: 'dashboard-chart-type-parts',
	LOCATION: 'dashboard-chart-type-location',
	DEFECT: 'dashboard-chart-type-defect'
} as const;
