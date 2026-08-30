import dayjs from 'dayjs';
import type { ChartDataPoint, ChartSeries, MultiSeriesPoint } from '../../dashboard/components/charts/chartTypes';
import { sortChartDataDesc } from '../../dashboard/utils/chartHelpers';
import type {
	DpmoDefectsPerSqmDay,
	DpmoDefectsPerSqmProject,
	DpmoGateDefectDay,
	DpmoMonthlyYield,
	DpmoOperatorDay,
	DpmoProjectDefects,
	DpmoProjectYield,
	DpmoShiftDefects,
	DpmoShiftYield,
	DpmoTopDefect,
	DpmoTopOperator,
	DpmoWorkstationDay,
	DpmoWorkstationDefects,
	DpmoWorkstationYield
} from '../../../store/api/business/dpmo/dpmo.validators';

/** Number of operators plotted on the day-wise operator trend — the API returns ~190. */
export const OPERATOR_TREND_LIMIT = 8;

/** Gate / non-gate is the same two-line split on three different charts. */
export const GATE_SPLIT_SERIES: ChartSeries[] = [
	{ key: 'gate', label: 'Gate' },
	{ key: 'nonGate', label: 'Non-gate' }
];

const formatDayLabel = (iso: string): string => (dayjs(iso).isValid() ? dayjs(iso).format('DD-MM') : iso);

/** Backend sends `YYYY-MM`; append a day so it parses without the customParseFormat plugin. */
const formatMonthLabel = (month: string): string => {
	const parsed = dayjs(`${month}-01`);
	return parsed.isValid() ? parsed.format('MMM YY') : month;
};

/**
 * Pivots long-format rows (one row per category × date) into the wide format recharts
 * needs: one row per date, one key per category. Categories absent on a date get 0 so
 * `type="monotone"` draws a continuous line instead of breaking.
 */
const pivotByDate = <T>(
	rows: T[],
	getDate: (row: T) => string,
	getCategory: (row: T) => string,
	getValue: (row: T) => number
): { data: MultiSeriesPoint[]; series: ChartSeries[] } => {
	const categories = [...new Set(rows.map(getCategory))];
	const dates = [...new Set(rows.map(getDate))].sort();

	const byDate = new Map<string, Map<string, number>>();
	for (const row of rows) {
		const date = getDate(row);
		if (!byDate.has(date)) byDate.set(date, new Map());
		const bucket = byDate.get(date)!;
		const category = getCategory(row);
		bucket.set(category, (bucket.get(category) ?? 0) + getValue(row));
	}

	const data: MultiSeriesPoint[] = dates.map(date => {
		const bucket = byDate.get(date);
		const point: MultiSeriesPoint = { name: formatDayLabel(date) };
		for (const category of categories) {
			point[category] = bucket?.get(category) ?? 0;
		}
		return point;
	});

	return { data, series: categories.map(category => ({ key: category, label: category })) };
};

// ─── summary ────────────────────────────────────────────────────────────────

export const toTopDefectsChart = (rows: DpmoTopDefect[]): ChartDataPoint[] =>
	sortChartDataDesc(rows.map(r => ({ name: r.issueType, value: r.count })));

export const toTopOperatorsChart = (rows: DpmoTopOperator[]): ChartDataPoint[] =>
	sortChartDataDesc(rows.map(r => ({ name: r.employeeName, value: r.count })));

export const toMonthlyYieldChart = (rows: DpmoMonthlyYield[]): ChartDataPoint[] =>
	rows.map(r => ({ name: formatMonthLabel(r.month), value: r.percentage }));

export const toShiftDefectsChart = (rows: DpmoShiftDefects[]): MultiSeriesPoint[] =>
	rows.map(r => ({ name: r.shift, gate: r.gateDefects, nonGate: r.nonGateDefects }));

export const toShiftYieldChart = (rows: DpmoShiftYield[]): ChartDataPoint[] =>
	rows.map(r => ({ name: r.shift, value: r.percentage }));

export const toGateDefectDatewiseChart = (rows: DpmoGateDefectDay[]): ChartDataPoint[] =>
	rows.map(r => ({ name: formatDayLabel(r.date), value: r.gateDefectQty }));

// ─── breakdown ──────────────────────────────────────────────────────────────

export const toProjectYieldChart = (rows: DpmoProjectYield[]): ChartDataPoint[] =>
	rows.map(r => ({ name: r.project, value: r.percentage }));

export const toProjectDefectsChart = (rows: DpmoProjectDefects[]): MultiSeriesPoint[] =>
	rows.map(r => ({ name: r.project, gate: r.gateDefects, nonGate: r.nonGateDefects }));

export const toWorkstationYieldChart = (rows: DpmoWorkstationYield[]): ChartDataPoint[] =>
	rows.map(r => ({ name: r.workStation, value: r.percentage }));

export const toWorkstationDefectsChart = (rows: DpmoWorkstationDefects[]): MultiSeriesPoint[] =>
	rows.map(r => ({ name: r.workStation, gate: r.gateDefects, nonGate: r.nonGateDefects }));

export const toDefectsPerSqmProjectChart = (rows: DpmoDefectsPerSqmProject[]): ChartDataPoint[] =>
	rows.map(r => ({ name: r.project, value: r.defectsPerSqm }));

// ─── trends ─────────────────────────────────────────────────────────────────

export const toWorkstationDaywiseChart = (rows: DpmoWorkstationDay[]) =>
	pivotByDate(
		rows,
		r => r.date,
		r => r.workStation,
		r => r.totalDefects
	);

/**
 * Same pivot as above, but the operator list is trimmed to the top N by total defects
 * before pivoting — the API returns one series per operator, far too many to plot.
 * Returns `totalOperators` so the caller can label the truncation.
 */
export const toOperatorDaywiseChart = (rows: DpmoOperatorDay[]) => {
	const totalsByOperator = new Map<string, number>();
	for (const row of rows) {
		totalsByOperator.set(row.employeeName, (totalsByOperator.get(row.employeeName) ?? 0) + row.count);
	}

	const topOperators = new Set(
		[...totalsByOperator.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, OPERATOR_TREND_LIMIT)
			.map(([name]) => name)
	);

	const pivoted = pivotByDate(
		rows.filter(r => topOperators.has(r.employeeName)),
		r => r.date,
		r => r.employeeName,
		r => r.count
	);

	return { ...pivoted, totalOperators: totalsByOperator.size };
};

export const toDefectsPerSqmDatewiseChart = (rows: DpmoDefectsPerSqmDay[]): ChartDataPoint[] =>
	rows.map(r => ({ name: formatDayLabel(r.date), value: r.defectsPerSqm }));
