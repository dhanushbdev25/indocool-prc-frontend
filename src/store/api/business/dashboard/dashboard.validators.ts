import dayjs from 'dayjs';

export interface DashboardDateRangeParams {
	from: string;
	to: string;
}

export interface DashboardEntityFilterParams {
	/** Plant codes — sent to the backend as `plantCode`. */
	units?: string[];
	workstation?: string[];
	/** Backend does not yet read `shift` (buildReportFilters never destructures it) — sent for when it does. */
	shift?: string[];
	/** Customer names — sent to the backend as `customer`. */
	projects?: string[];
	sapReferenceNumber?: string[];
	/** Customer variant ids (numeric strings). */
	customerVariantId?: string[];
}

export interface DashboardQueryParams extends DashboardDateRangeParams, DashboardEntityFilterParams {}

export interface DashboardQueryWireParams extends DashboardDateRangeParams {
	plantCode?: string;
	workstation?: string;
	shift?: string;
	customer?: string;
	sapReferenceNumber?: string;
	customerVariantId?: string;
}

const joinFilterValues = (values: string[] | undefined): string | undefined => {
	if (!values?.length) return undefined;
	const joined = values.map(v => v.trim()).filter(Boolean).join(',');
	return joined || undefined;
};

export const buildDashboardQueryParams = (args: DashboardQueryParams): DashboardQueryWireParams => {
	const params: DashboardQueryWireParams = { from: args.from, to: args.to };
	const plantCode = joinFilterValues(args.units);
	const workstation = joinFilterValues(args.workstation);
	const shift = joinFilterValues(args.shift);
	const customer = joinFilterValues(args.projects);
	const sapReferenceNumber = joinFilterValues(args.sapReferenceNumber);
	const customerVariantId = joinFilterValues(args.customerVariantId);
	if (plantCode) params.plantCode = plantCode;
	if (workstation) params.workstation = workstation;
	if (shift) params.shift = shift;
	if (customer) params.customer = customer;
	if (sapReferenceNumber) params.sapReferenceNumber = sapReferenceNumber;
	if (customerVariantId) params.customerVariantId = customerVariantId;
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

export interface DelayReasonItem {
	reasonLabel: string;
	remarks: string;
	count: number;
}

export type StageDelayReasons = Record<StageKey, DelayReasonItem[]>;

export interface MetricsData {
	output: StageMetrics;
	manpower: StageMetrics;
	delayReasons: StageDelayReasons;
}

export interface RangedMetricsData {
	/** Metrics for exactly the applied date range. */
	selectedRange: MetricsData;
	/** Same filters over the applied range widened 90 days into the past — a superset of selectedRange. */
	extendedRange: MetricsData;
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

const coerceDelayReasonItem = (raw: unknown): DelayReasonItem => {
	const o = isRecord(raw) ? raw : {};
	return {
		reasonLabel: typeof o.reasonLabel === 'string' ? o.reasonLabel : '',
		remarks: typeof o.remarks === 'string' ? o.remarks : '',
		count: coerceNumber(o.count)
	};
};

const coerceDelayReasonList = (raw: unknown): DelayReasonItem[] =>
	Array.isArray(raw) ? raw.map(coerceDelayReasonItem) : [];

export const coerceStageDelayReasons = (raw: unknown): StageDelayReasons => {
	const o = isRecord(raw) ? raw : {};
	return STAGE_KEYS.reduce((acc, key) => {
		acc[key] = coerceDelayReasonList(o[key]);
		return acc;
	}, {} as StageDelayReasons);
};

export const coerceMetricsData = (raw: unknown): MetricsData => {
	const o = isRecord(raw) ? raw : {};
	return {
		output: coerceStageMetrics(o.output),
		manpower: coerceStageMetrics(o.manpower),
		delayReasons: coerceStageDelayReasons(o.delayReasons)
	};
};

const isRangedMetricsResponse = (
	response: unknown
): response is { data: { selectedRange: unknown; extendedRange: unknown } } => {
	if (!isRecord(response) || !isRecord(response.data)) return false;
	return isRecord(response.data.selectedRange) && isRecord(response.data.extendedRange);
};

export const parseMetricsResponse = (response: unknown): RangedMetricsData => {
	if (!isRangedMetricsResponse(response)) {
		console.warn('Invalid metrics response structure', response);
		return { selectedRange: coerceMetricsData(null), extendedRange: coerceMetricsData(null) };
	}
	return {
		selectedRange: coerceMetricsData(response.data.selectedRange),
		extendedRange: coerceMetricsData(response.data.extendedRange)
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
