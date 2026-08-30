/**
 * Response shapes for the three DPMO endpoints:
 *   GET dashboard/metrics/dpmometrics/summary
 *   GET dashboard/metrics/dpmometrics/breakdown
 *   GET dashboard/metrics/dpmometrics/trends
 *
 * All three take the same query params as the analytics dashboard, so callers
 * pass `DashboardQueryParams` and the api slice serialises them with
 * `buildDashboardQueryParams`.
 */

/** Backend groups by nullable columns (shift, workStation, employeeCode) — nulls become this. */
export const UNASSIGNED_LABEL = 'Unassigned';

// ─── summary ────────────────────────────────────────────────────────────────

export interface DpmoTopDefect {
	issueType: string;
	count: number;
}

export interface DpmoTopOperator {
	employeeName: string;
	employeeCode: string;
	count: number;
}

export interface DpmoMonthlyYield {
	month: string;
	total: number;
	passed: number;
	percentage: number;
}

export interface DpmoShiftDefects {
	shift: string;
	gateDefects: number;
	nonGateDefects: number;
	totalDefects: number;
}

export interface DpmoShiftYield {
	shift: string;
	total: number;
	passed: number;
	percentage: number;
}

export interface DpmoGateDefectDay {
	date: string;
	gateDefectQty: number;
}

export interface DpmoSummaryData {
	topDefects: DpmoTopDefect[];
	topOperators: DpmoTopOperator[];
	monthlyFirstPassYield: DpmoMonthlyYield[];
	shiftWiseDefects: DpmoShiftDefects[];
	shiftWiseFirstPassYield: DpmoShiftYield[];
	gateDefectDatewise: DpmoGateDefectDay[];
}

// ─── breakdown ──────────────────────────────────────────────────────────────

export interface DpmoProjectYield {
	project: string;
	total: number;
	passed: number;
	percentage: number;
}

export interface DpmoProjectDefects {
	project: string;
	gateDefects: number;
	nonGateDefects: number;
	totalDefects: number;
}

export interface DpmoWorkstationYield {
	workStation: string;
	total: number;
	passed: number;
	percentage: number;
}

export interface DpmoWorkstationDefects {
	workStation: string;
	gateDefects: number;
	nonGateDefects: number;
	totalDefects: number;
}

export interface DpmoDefectsPerSqmProject {
	project: string;
	totalDefects: number;
	totalSqm: number;
	defectsPerSqm: number;
}

export interface DpmoBreakdownData {
	projectWiseFirstPassYield: DpmoProjectYield[];
	projectWiseDefects: DpmoProjectDefects[];
	workstationWiseFirstPassYield: DpmoWorkstationYield[];
	workstationWiseDefects: DpmoWorkstationDefects[];
	defectPerSqmProjectWise: DpmoDefectsPerSqmProject[];
}

// ─── trends ─────────────────────────────────────────────────────────────────

export interface DpmoWorkstationDay {
	workStation: string;
	date: string;
	totalDefects: number;
}

export interface DpmoOperatorDay {
	employeeName: string;
	employeeCode: string;
	date: string;
	count: number;
}

export interface DpmoDefectsPerSqmDay {
	date: string;
	totalDefects: number;
	totalSqm: number;
	defectsPerSqm: number;
}

export interface DpmoTrendsData {
	workstationDaywiseDefects: DpmoWorkstationDay[];
	operatorDaywiseDefects: DpmoOperatorDay[];
	defectPerSqmDatewise: DpmoDefectsPerSqmDay[];
}

// ─── parsing helpers ────────────────────────────────────────────────────────

const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

const coerceNumber = (v: unknown, fallback = 0): number => {
	if (typeof v === 'number' && Number.isFinite(v)) return v;
	if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
	return fallback;
};

/** Category keys can be null (unassigned shift / workstation / employee code). */
const coerceLabel = (v: unknown, fallback = UNASSIGNED_LABEL): string =>
	typeof v === 'string' && v.trim() ? v.trim() : fallback;

const unwrapData = (response: unknown): Record<string, unknown> => {
	if (isRecord(response) && isRecord(response.data)) return response.data;
	if (isRecord(response)) return response;
	return {};
};

/** Maps an array field to typed rows, tolerating a missing or non-array payload. */
const parseRows = <T>(raw: unknown, toRow: (row: Record<string, unknown>, index: number) => T): T[] => {
	if (!Array.isArray(raw)) return [];
	return raw.map((row, index) => toRow(isRecord(row) ? row : {}, index));
};

// ─── parsers ────────────────────────────────────────────────────────────────

export const parseDpmoSummary = (response: unknown): DpmoSummaryData => {
	const payload = unwrapData(response);
	return {
		topDefects: parseRows(payload.topDefects, (r, i) => ({
			issueType: coerceLabel(r.issueType, `Defect ${i + 1}`),
			count: coerceNumber(r.count)
		})),
		topOperators: parseRows(payload.topOperators, (r, i) => ({
			employeeName: coerceLabel(r.employeeName, `Operator ${i + 1}`),
			employeeCode: coerceLabel(r.employeeCode, ''),
			count: coerceNumber(r.count)
		})),
		monthlyFirstPassYield: parseRows(payload.monthlyFirstPassYield, (r, i) => ({
			month: coerceLabel(r.month, `Month ${i + 1}`),
			total: coerceNumber(r.total),
			passed: coerceNumber(r.passed),
			percentage: coerceNumber(r.percentage)
		})),
		shiftWiseDefects: parseRows(payload.shiftWiseDefects, r => ({
			shift: coerceLabel(r.shift),
			gateDefects: coerceNumber(r.gateDefects),
			nonGateDefects: coerceNumber(r.nonGateDefects),
			totalDefects: coerceNumber(r.totalDefects)
		})),
		shiftWiseFirstPassYield: parseRows(payload.shiftWiseFirstPassYield, r => ({
			shift: coerceLabel(r.shift),
			total: coerceNumber(r.total),
			passed: coerceNumber(r.passed),
			percentage: coerceNumber(r.percentage)
		})),
		gateDefectDatewise: parseRows(payload.gateDefectDatewise, (r, i) => ({
			date: coerceLabel(r.date, `day-${i}`),
			gateDefectQty: coerceNumber(r.gateDefectQty)
		}))
	};
};

export const parseDpmoBreakdown = (response: unknown): DpmoBreakdownData => {
	const payload = unwrapData(response);
	return {
		projectWiseFirstPassYield: parseRows(payload.projectWiseFirstPassYield, r => ({
			project: coerceLabel(r.project),
			total: coerceNumber(r.total),
			passed: coerceNumber(r.passed),
			percentage: coerceNumber(r.percentage)
		})),
		projectWiseDefects: parseRows(payload.projectWiseDefects, r => ({
			project: coerceLabel(r.project),
			gateDefects: coerceNumber(r.gateDefects),
			nonGateDefects: coerceNumber(r.nonGateDefects),
			totalDefects: coerceNumber(r.totalDefects)
		})),
		workstationWiseFirstPassYield: parseRows(payload.workstationWiseFirstPassYield, r => ({
			workStation: coerceLabel(r.workStation),
			total: coerceNumber(r.total),
			passed: coerceNumber(r.passed),
			percentage: coerceNumber(r.percentage)
		})),
		workstationWiseDefects: parseRows(payload.workstationWiseDefects, r => ({
			workStation: coerceLabel(r.workStation),
			gateDefects: coerceNumber(r.gateDefects),
			nonGateDefects: coerceNumber(r.nonGateDefects),
			totalDefects: coerceNumber(r.totalDefects)
		})),
		defectPerSqmProjectWise: parseRows(payload.defectPerSqmProjectWise, r => ({
			project: coerceLabel(r.project),
			totalDefects: coerceNumber(r.totalDefects),
			totalSqm: coerceNumber(r.totalSqm),
			defectsPerSqm: coerceNumber(r.defectsPerSqm)
		}))
	};
};

export const parseDpmoTrends = (response: unknown): DpmoTrendsData => {
	const payload = unwrapData(response);
	return {
		workstationDaywiseDefects: parseRows(payload.workstationDaywiseDefects, (r, i) => ({
			workStation: coerceLabel(r.workStation),
			date: coerceLabel(r.date, `day-${i}`),
			totalDefects: coerceNumber(r.totalDefects)
		})),
		operatorDaywiseDefects: parseRows(payload.operatorDaywiseDefects, (r, i) => ({
			employeeName: coerceLabel(r.employeeName),
			employeeCode: coerceLabel(r.employeeCode, ''),
			date: coerceLabel(r.date, `day-${i}`),
			count: coerceNumber(r.count)
		})),
		defectPerSqmDatewise: parseRows(payload.defectPerSqmDatewise, (r, i) => ({
			date: coerceLabel(r.date, `day-${i}`),
			totalDefects: coerceNumber(r.totalDefects),
			totalSqm: coerceNumber(r.totalSqm),
			defectsPerSqm: coerceNumber(r.defectsPerSqm)
		}))
	};
};
