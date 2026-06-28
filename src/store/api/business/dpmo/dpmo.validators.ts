import dayjs from 'dayjs';
import type { ChartDataPoint } from '../../../../pages/dashboard/components/charts/chartTypes';

export interface DpmoQueryParams {
	from: string;
	to: string;
	/** Comma-joined on the wire; pass an array. Backend uses ILIKE for matching. */
	customer?: string[];
	plantCode?: string[];
	workstation?: string[];
}

interface DpmoWireParams {
	from: string;
	to: string;
	customer?: string;
	plantCode?: string;
	workstation?: string;
}

const joinFilterValues = (values: string[] | undefined): string | undefined => {
	if (!values?.length) return undefined;
	const joined = values.map(v => v.trim()).filter(Boolean).join(',');
	return joined || undefined;
};

export const buildDpmoQueryParams = (args: DpmoQueryParams): DpmoWireParams => {
	const params: DpmoWireParams = { from: args.from, to: args.to };
	const customer = joinFilterValues(args.customer);
	const plantCode = joinFilterValues(args.plantCode);
	const workstation = joinFilterValues(args.workstation);
	if (customer) params.customer = customer;
	if (plantCode) params.plantCode = plantCode;
	if (workstation) params.workstation = workstation;
	return params;
};

export type KpiFormat = 'number' | 'decimal' | 'percentage' | 'currency';

export type DpmoKpi =
	| {
			kind: 'single';
			key: string;
			label: string;
			value: number | null;
			format: KpiFormat;
	  }
	| {
			kind: 'split';
			key: string;
			label: string;
			items: { label: string; value: number }[];
			format: KpiFormat;
	  };

export interface DpmoFpyPoint {
	date: string;
	percentage: number;
}

export interface DpmoProductDefectPoint {
	product: string;
	quantity: number;
}

export interface DpmoDefectGateSplit {
	gate: number;
	nonGate: number;
}

export interface DpmoTotals {
	totalCount: number;
	totalSqm: number;
}

export interface DpmoFirstPassYield {
	total: number;
	passed: number;
	percentage: number;
}

export interface DpmoDefects {
	gate: number;
	nonGate: number;
	total: number;
}

export interface DpmoData {
	totals: DpmoTotals;
	firstPassYield: DpmoFirstPassYield;
	defects: DpmoDefects;
	fpyByDay: DpmoFpyPoint[];
	productDefects: DpmoProductDefectPoint[];
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
	v !== null && typeof v === 'object' && !Array.isArray(v);

const coerceNumber = (v: unknown, fallback = 0): number => {
	if (typeof v === 'number' && Number.isFinite(v)) return v;
	if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
	return fallback;
};

const unwrapData = (response: unknown): Record<string, unknown> => {
	if (isRecord(response) && isRecord(response.data)) return response.data;
	if (isRecord(response)) return response;
	return {};
};

const parseTotals = (raw: unknown): DpmoTotals => {
	const o = isRecord(raw) ? raw : {};
	return {
		totalCount: coerceNumber(o.totalCount),
		totalSqm: coerceNumber(o.totalSqm)
	};
};

const parseFirstPassYield = (raw: unknown): DpmoFirstPassYield => {
	const o = isRecord(raw) ? raw : {};
	return {
		total: coerceNumber(o.total),
		passed: coerceNumber(o.passed),
		percentage: coerceNumber(o.percentage)
	};
};

interface ParsedDefects {
	gate: number;
	nonGate: number;
	total: number;
	sapWise: { sapReferenceNumber: string; totalDefects: number }[];
}

const parseDefects = (raw: unknown): ParsedDefects => {
	const o = isRecord(raw) ? raw : {};
	const sapWiseRaw = Array.isArray(o.sapWise) ? o.sapWise : [];
	return {
		gate: coerceNumber(o.gateDefects),
		nonGate: coerceNumber(o.nonGateDefects),
		total: coerceNumber(o.totalDefects),
		sapWise: sapWiseRaw.map((row, index) => {
			const r = isRecord(row) ? row : {};
			return {
				sapReferenceNumber:
					typeof r.sapReferenceNumber === 'string' && r.sapReferenceNumber.trim()
						? r.sapReferenceNumber
						: `Item ${index + 1}`,
				totalDefects: coerceNumber(r.totalDefects)
			};
		})
	};
};

const parseDatewise = (raw: unknown): DpmoFpyPoint[] => {
	if (!Array.isArray(raw)) return [];
	return raw.map((row, index) => {
		const r = isRecord(row) ? row : {};
		const fpy = isRecord(r.firstPassYield) ? r.firstPassYield : {};
		return {
			date: typeof r.date === 'string' ? r.date : `day-${index}`,
			percentage: coerceNumber(fpy.percentage)
		};
	});
};

export const parseDpmoResponse = (response: unknown): DpmoData => {
	const payload = unwrapData(response);
	const totals = parseTotals(payload.totals);
	const firstPassYield = parseFirstPassYield(payload.firstPassYield);
	const defects = parseDefects(payload.defects);
	const fpyByDay = parseDatewise(payload.datewise);

	return {
		totals,
		firstPassYield,
		defects: { gate: defects.gate, nonGate: defects.nonGate, total: defects.total },
		fpyByDay,
		productDefects: defects.sapWise.map(item => ({
			product: item.sapReferenceNumber,
			quantity: item.totalDefects
		}))
	};
};

const formatDayLabel = (iso: string): string =>
	dayjs(iso).isValid() ? dayjs(iso).format('DD-MM') : iso;

export const toFpyChartData = (items: DpmoFpyPoint[]): ChartDataPoint[] =>
	items.map(item => ({ name: formatDayLabel(item.date), value: item.percentage }));

export const toProductDefectChartData = (items: DpmoProductDefectPoint[]): ChartDataPoint[] =>
	items.map(item => ({ name: item.product, value: item.quantity }));

const formatNumber = (n: number) => n.toLocaleString('en-IN');
const formatDecimal = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatKpiNumber = (value: number, format: KpiFormat): string => {
	switch (format) {
		case 'percentage':
			return `${value.toFixed(2)}%`;
		case 'currency':
			return `₹ ${formatNumber(value)}`;
		case 'decimal':
			return formatDecimal(value);
		default:
			return formatNumber(value);
	}
};

export const EMPTY_DPMO_DATA: DpmoData = {
	totals: { totalCount: 0, totalSqm: 0 },
	firstPassYield: { total: 0, passed: 0, percentage: 0 },
	defects: { gate: 0, nonGate: 0, total: 0 },
	fpyByDay: [],
	productDefects: []
};

export const buildOverallKpis = (data: DpmoData | undefined): DpmoKpi[] => {
	const d = data ?? EMPTY_DPMO_DATA;
	return [
		{ kind: 'single', key: 'totalPanels', label: 'Total Panels (Nos)', value: d.totals.totalCount, format: 'number' },
		{ kind: 'single', key: 'totalPanelsSize', label: 'Total Panels Size (Sq.m)', value: d.totals.totalSqm, format: 'decimal' },
		{ kind: 'single', key: 'totalDefects', label: 'Total Defects (Nos)', value: d.defects.total, format: 'number' },
		{ kind: 'single', key: 'totalCoPQ', label: 'Total CoPQ (Rs.)', value: 0, format: 'currency' },
		{ kind: 'single', key: 'firstPassYield', label: 'First Pass Yield (%)', value: d.firstPassYield.percentage, format: 'percentage' }
	];
};

export const buildProjectWiseKpis = (data: DpmoData | undefined): DpmoKpi[] => {
	const d = data ?? EMPTY_DPMO_DATA;
	return [
		{ kind: 'single', key: 'totalPanels', label: 'Total Panels (Nos)', value: d.totals.totalCount, format: 'number' },
		{ kind: 'single', key: 'totalPanelsSize', label: 'Total Panels Size (Sq.m)', value: d.totals.totalSqm, format: 'decimal' },
		{
			kind: 'split',
			key: 'defects',
			label: 'Defects (Nos)',
			format: 'number',
			items: [
				{ label: 'Gate', value: d.defects.gate },
				{ label: 'Non-Gate', value: d.defects.nonGate }
			]
		},
		{ kind: 'single', key: 'firstPassYield', label: 'First Pass Yield (%)', value: d.firstPassYield.percentage, format: 'percentage' }
	];
};
