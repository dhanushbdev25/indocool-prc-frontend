import type { StageKey } from '../../../store/api/business/dashboard/dashboard.validators';

export type DatewiseChartType = 'bar' | 'line';

export interface StageConfig {
	key: StageKey;
	label: string;
	datewiseChartType?: DatewiseChartType;
}

export const STAGE_CONFIG: StageConfig[] = [
	{ key: 'moulding', label: 'Moulding', datewiseChartType: 'bar' },
	{ key: 'drilling', label: 'Drilling', datewiseChartType: 'bar' },
	{ key: 'cutting', label: 'Cutting', datewiseChartType: 'bar' },
	{ key: 'subAssembly', label: 'Sub-assembly', datewiseChartType: 'line' },
	{ key: 'assembly', label: 'Assembly', datewiseChartType: 'line' },
	{ key: 'topCoat', label: 'Top Coat' },
	{ key: 'antiskid', label: 'Anti-skid' },
	{ key: 'packaging', label: 'Packing', datewiseChartType: 'bar' }
];

export const DATEWISE_STAGE_CONFIG = STAGE_CONFIG.filter(s => s.datewiseChartType != null);

export const CHART_HEIGHT = 280;
