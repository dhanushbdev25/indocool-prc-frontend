import dayjs from 'dayjs';

export interface DashboardDateRangeParams {
	from: string;
	to: string;
}

export interface DashboardEntityFilterParams {
	units?: string[];
	workstation?: string[];
	shift?: string[];
	projects?: string[];
}

export interface DashboardQueryParams extends DashboardDateRangeParams, DashboardEntityFilterParams {}

export interface DashboardQueryWireParams extends DashboardDateRangeParams {
	units?: string;
	workstation?: string;
	shift?: string;
	projects?: string;
}

const joinFilterValues = (values: string[] | undefined): string | undefined => {
	if (!values?.length) return undefined;
	const joined = values.map(v => v.trim()).filter(Boolean).join(',');
	return joined || undefined;
};

export const buildDashboardQueryParams = (args: DashboardQueryParams): DashboardQueryWireParams => {
	const params: DashboardQueryWireParams = { from: args.from, to: args.to };
	const units = joinFilterValues(args.units);
	const workstation = joinFilterValues(args.workstation);
	const shift = joinFilterValues(args.shift);
	const projects = joinFilterValues(args.projects);
	if (units) params.units = units;
	if (workstation) params.workstation = workstation;
	if (shift) params.shift = shift;
	if (projects) params.projects = projects;
	return params;
};

export interface MetricBlock {
	total: number;
	completed: number;
	percentage: number;
}

export type StageKey =
	| 'moulding'
	| 'drilling'
	| 'cutting'
	| 'subAssembly'
	| 'assembly'
	| 'topCoat'
	| 'antiskid'
	| 'packaging';

export const STAGE_KEYS: StageKey[] = [
	'moulding',
	'drilling',
	'cutting',
	'subAssembly',
	'assembly',
	'topCoat',
	'antiskid',
	'packaging'
];

export interface StageMetrics {
	moulding: MetricBlock;
	drilling: MetricBlock;
	cutting: MetricBlock;
	subAssembly: MetricBlock;
	assembly: MetricBlock;
	topCoat: MetricBlock;
	antiskid: MetricBlock;
	packaging: MetricBlock;
}

export interface MetricsData {
	output: StageMetrics;
	manpower: StageMetrics;
}

export interface MetricsResponse {
	data: MetricsData;
}

export interface ProjectWiseItem {
	project: string;
	total: number;
	completed: number;
	percentage: number;
}

export interface WorkstationWiseItem {
	workCenter: string;
	total: number;
	completed: number;
	percentage: number;
}

export interface ProjectLossItem {
	project: string;
	lossMinutes: number;
}

export interface MouldingAnalysisData {
	projectWise: ProjectWiseItem[];
	workstationWise: WorkstationWiseItem[];
	projectLoss: ProjectLossItem[];
}

export interface MouldingAnalysisResponse {
	data: MouldingAnalysisData;
}

export interface DatewiseMetricsItem {
	date: string;
	output: StageMetrics;
	manpower: StageMetrics;
}

export interface DatewiseMetricsResponse {
	data: DatewiseMetricsItem[];
}

export interface ChartDataPoint {
	name: string;
	value: number;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
	v !== null && typeof v === 'object' && !Array.isArray(v);

const coerceNumber = (v: unknown, fallback = 0): number =>
	typeof v === 'number' && Number.isFinite(v) ? v : fallback;

export const coerceMetricBlock = (raw: unknown): MetricBlock => {
	const o = isRecord(raw) ? raw : {};
	return {
		total: coerceNumber(o.total),
		completed: coerceNumber(o.completed),
		percentage: coerceNumber(o.percentage)
	};
};

export const coerceStageMetrics = (raw: unknown): StageMetrics => {
	const o = isRecord(raw) ? raw : {};
	return {
		moulding: coerceMetricBlock(o.moulding),
		drilling: coerceMetricBlock(o.drilling),
		cutting: coerceMetricBlock(o.cutting),
		subAssembly: coerceMetricBlock(o.subAssembly),
		assembly: coerceMetricBlock(o.assembly),
		topCoat: coerceMetricBlock(o.topCoat),
		antiskid: coerceMetricBlock(o.antiskid),
		packaging: coerceMetricBlock(o.packaging)
	};
};

export const isMetricsResponse = (response: unknown): response is MetricsResponse => {
	if (!isRecord(response) || !isRecord(response.data)) return false;
	const { output, manpower } = response.data;
	return isRecord(output) && isRecord(manpower);
};

export const parseMetricsResponse = (response: unknown): MetricsData => {
	if (!isMetricsResponse(response)) {
		console.warn('Invalid metrics response structure', response);
		return {
			output: coerceStageMetrics(null),
			manpower: coerceStageMetrics(null)
		};
	}
	return {
		output: coerceStageMetrics(response.data.output),
		manpower: coerceStageMetrics(response.data.manpower)
	};
};

const coerceProjectWiseItem = (raw: unknown, index: number): ProjectWiseItem => {
	const o = isRecord(raw) ? raw : {};
	return {
		project: typeof o.project === 'string' ? o.project : `Project ${index + 1}`,
		total: coerceNumber(o.total),
		completed: coerceNumber(o.completed),
		percentage: coerceNumber(o.percentage)
	};
};

const coerceWorkstationWiseItem = (raw: unknown, index: number): WorkstationWiseItem => {
	const o = isRecord(raw) ? raw : {};
	return {
		workCenter: typeof o.workCenter === 'string' ? o.workCenter : `WS ${index + 1}`,
		total: coerceNumber(o.total),
		completed: coerceNumber(o.completed),
		percentage: coerceNumber(o.percentage)
	};
};

const coerceProjectLossItem = (raw: unknown, index: number): ProjectLossItem => {
	const o = isRecord(raw) ? raw : {};
	return {
		project: typeof o.project === 'string' ? o.project : `Project ${index + 1}`,
		lossMinutes: coerceNumber(o.lossMinutes)
	};
};

export const isMouldingAnalysisResponse = (response: unknown): response is MouldingAnalysisResponse => {
	if (!isRecord(response) || !isRecord(response.data)) return false;
	const { projectWise, workstationWise, projectLoss } = response.data;
	return Array.isArray(projectWise) && Array.isArray(workstationWise) && Array.isArray(projectLoss);
};

export const parseMouldingAnalysisResponse = (response: unknown): MouldingAnalysisData => {
	if (!isMouldingAnalysisResponse(response)) {
		console.warn('Invalid moulding analysis response structure', response);
		return { projectWise: [], workstationWise: [], projectLoss: [] };
	}
	return {
		projectWise: response.data.projectWise.map(coerceProjectWiseItem),
		workstationWise: response.data.workstationWise.map(coerceWorkstationWiseItem),
		projectLoss: response.data.projectLoss.map(coerceProjectLossItem)
	};
};

export const isDatewiseMetricsResponse = (response: unknown): response is DatewiseMetricsResponse => {
	if (!isRecord(response)) return false;
	return Array.isArray(response.data);
};

export const parseDatewiseMetricsResponse = (response: unknown): DatewiseMetricsItem[] => {
	if (!isDatewiseMetricsResponse(response)) {
		console.warn('Invalid datewise metrics response structure', response);
		return [];
	}
	return response.data.map((item: unknown, index) => {
		const o: Record<string, unknown> = isRecord(item) ? item : {};
		return {
			date: typeof o.date === 'string' ? o.date : `day-${index}`,
			output: coerceStageMetrics(o.output),
			manpower: coerceStageMetrics(o.manpower)
		};
	});
};

export const formatMetricFraction = (completed: number, total: number): string => {
	const fmt = (n: number) => n.toLocaleString('en-IN');
	return `${fmt(completed)} / ${fmt(total)}`;
};

export const formatPercentage = (value: number): string =>
	Number.isFinite(value) ? value.toFixed(2) : '—';

export const toProjectChartData = (items: ProjectWiseItem[]): ChartDataPoint[] =>
	items.map(item => ({ name: item.project, value: item.percentage }));

export const toWorkstationChartData = (items: WorkstationWiseItem[]): ChartDataPoint[] =>
	items.map(item => ({ name: item.workCenter, value: item.percentage }));

export const toProjectLossChartData = (items: ProjectLossItem[]): ChartDataPoint[] =>
	items.map(item => ({ name: item.project, value: item.lossMinutes }));

export const toDatewiseChartData = (
	items: DatewiseMetricsItem[],
	stageKey: StageKey
): ChartDataPoint[] =>
	items.map(item => ({
		name: dayjs(item.date).isValid() ? dayjs(item.date).format('DD-MM') : item.date,
		value: item.output[stageKey].percentage
	}));
