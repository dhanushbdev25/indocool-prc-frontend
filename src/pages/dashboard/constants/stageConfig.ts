import type { StageKey } from '../../../store/api/business/dashboard/dashboard.validators';

export interface StageConfig {
	key: StageKey;
	label: string;
	/** Stages with a daily trend chart. Top Coat and Anti-skid have none. */
	hasDatewiseChart?: boolean;
}

export const STAGE_CONFIG: StageConfig[] = [
	{ key: 'moulding', label: 'Moulding', hasDatewiseChart: true },
	{ key: 'drilling', label: 'Drilling', hasDatewiseChart: true },
	{ key: 'cutting', label: 'Cutting', hasDatewiseChart: true },
	{ key: 'subAssembly', label: 'Sub-assembly', hasDatewiseChart: true },
	{ key: 'assembly', label: 'Assembly', hasDatewiseChart: true },
	{ key: 'topCoat', label: 'Top Coat' },
	{ key: 'antiskid', label: 'Anti-skid' },
	{ key: 'packaging', label: 'Packing', hasDatewiseChart: true }
];

export const DATEWISE_STAGE_CONFIG = STAGE_CONFIG.filter(s => s.hasDatewiseChart);
