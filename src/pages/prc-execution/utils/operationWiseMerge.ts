import type { ExecutionData, OperationWiseExecutionRow } from '../types/execution.types';

export interface SequenceStepGroupRow {
	id: string;
	processName: string;
	processDescription: string;
}

function isPlainRecord(v: unknown): v is Record<string, unknown> {
	return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function normalizeExecutionRow(raw: unknown): OperationWiseExecutionRow | null {
	if (!isPlainRecord(raw)) return null;
	const operationID = Number(raw.operationID);
	if (!Number.isFinite(operationID)) return null;
	const idRaw = raw.id;
	const id =
		typeof idRaw === 'string' || typeof idRaw === 'number' ? idRaw : `op-${operationID}`;
	const operationName = typeof raw.operationName === 'string' ? raw.operationName : '';
	const rpc = Number(raw.responsiblePersonCount);
	const responsiblePersonCount = Number.isFinite(rpc) && rpc >= 1 ? Math.floor(rpc) : 1;
	let responsiblePersons: OperationWiseExecutionRow['responsiblePersons'];
	if (Array.isArray(raw.responsiblePersons)) {
		responsiblePersons = raw.responsiblePersons.map((p, i) => {
			if (!isPlainRecord(p)) {
				return {
					employeeId: '',
					employeeName: '',
					workstation: ''
				};
			}
			return {
				id: typeof p.id === 'string' ? p.id : `rp-${i}`,
				employeeId: typeof p.employeeId === 'string' ? p.employeeId : String(p.employeeId ?? ''),
				employeeName: typeof p.employeeName === 'string' ? p.employeeName : String(p.employeeName ?? ''),
				workstation: typeof p.workstation === 'string' ? p.workstation : String(p.workstation ?? '')
			};
		});
	}
	const countDeviated = typeof raw.countDeviated === 'boolean' ? raw.countDeviated : undefined;
	return {
		id,
		operationID,
		operationName,
		responsiblePersonCount,
		responsiblePersons,
		countDeviated
	};
}

/** Collect sequence step groups (operations) from the PRC template on the execution payload */
export function extractSequenceStepGroupsFromExecution(execution: ExecutionData): SequenceStepGroupRow[] {
	const out: SequenceStepGroupRow[] = [];
	const steps = execution.prcCurrentTemplate?.prcTemplateSteps ?? [];
	for (const ts of steps) {
		if (ts.type !== 'sequence' || !ts.data) continue;
		const data = ts.data as {
			stepGroups?: Array<{
				id: number;
				processName: string;
				processDescription?: string;
			}>;
		};
		for (const g of data.stepGroups ?? []) {
			out.push({
				id: String(g.id),
				processName: g.processName,
				processDescription: g.processDescription ?? ''
			});
		}
	}
	return out;
}

export function normalizeOperationWiseToArray(value: unknown): OperationWiseExecutionRow[] {
	if (Array.isArray(value)) {
		return value.map(normalizeExecutionRow).filter((r): r is OperationWiseExecutionRow => r !== null);
	}
	if (isPlainRecord(value)) {
		return legacyRecordToRows(value);
	}
	return [];
}

function legacyRecordToRows(rec: Record<string, unknown>): OperationWiseExecutionRow[] {
	const out: OperationWiseExecutionRow[] = [];
	for (const [key, val] of Object.entries(rec)) {
		const operationID = Number(key);
		if (!Number.isFinite(operationID)) continue;
		if (!isPlainRecord(val)) continue;
		const mc = Number(val.memberCount ?? val.responsiblePersonCount);
		out.push({
			id: `legacy-${key}`,
			operationID,
			operationName: typeof val.operationName === 'string' ? val.operationName : '',
			responsiblePersonCount: Number.isFinite(mc) && mc >= 1 ? Math.floor(mc) : 1,
			responsiblePersons: undefined
		});
	}
	return out;
}

/**
 * Merge root GET operationWiseData[] with saved prcAggregatedSteps.operationWiseData[].
 * Order follows **root** array; aggregated values win per operationID.
 */
export function mergeOperationWiseForRead(
	root: ExecutionData['operationWiseData'] | Record<string, unknown> | undefined,
	aggregated: Record<string, unknown> | undefined
): OperationWiseExecutionRow[] {
	const aggRaw = aggregated?.operationWiseData;
	let aggArr: OperationWiseExecutionRow[] = [];
	if (Array.isArray(aggRaw)) {
		aggArr = (aggRaw as unknown[])
			.map(normalizeExecutionRow)
			.filter((r): r is OperationWiseExecutionRow => r !== null);
	} else if (isPlainRecord(aggRaw)) {
		aggArr = legacyRecordToRows(aggRaw as Record<string, unknown>);
	}
	const aggById = new Map(aggArr.map(r => [r.operationID, r]));

	let rootArr: OperationWiseExecutionRow[] = [];
	if (Array.isArray(root)) {
		rootArr = root.map(normalizeExecutionRow).filter((r): r is OperationWiseExecutionRow => r !== null);
	} else if (root && typeof root === 'object' && !Array.isArray(root)) {
		rootArr = legacyRecordToRows(root as Record<string, unknown>);
	}

	if (rootArr.length === 0 && aggArr.length > 0) {
		return aggArr;
	}

	return rootArr.map(base => {
		const fromAgg = aggById.get(base.operationID);
		if (!fromAgg) return { ...base };
		return {
			...base,
			...fromAgg,
			operationName: base.operationName || fromAgg.operationName,
			responsiblePersonCount: base.responsiblePersonCount ?? fromAgg.responsiblePersonCount,
			responsiblePersons: fromAgg.responsiblePersons ?? base.responsiblePersons,
			countDeviated: fromAgg.countDeviated
		};
	});
}

/** Merge two operation-wise arrays for aggregated PUT state (by operationID). */
export function mergeOperationWiseExecutionArrays(
	existing: OperationWiseExecutionRow[] | undefined,
	incoming: OperationWiseExecutionRow[]
): OperationWiseExecutionRow[] {
	const map = new Map((existing ?? []).map(r => [r.operationID, { ...r }]));
	for (const inc of incoming) {
		const prev = map.get(inc.operationID);
		map.set(inc.operationID, {
			...(prev ?? inc),
			...inc,
			responsiblePersons: inc.responsiblePersons ?? prev?.responsiblePersons
		});
	}
	if (incoming.length > 0) {
		return incoming
			.map(inc => map.get(inc.operationID))
			.filter((r): r is OperationWiseExecutionRow => r !== undefined);
	}
	return existing ?? [];
}

/** Set countDeviated when responsiblePersons.length !== responsiblePersonCount */
export function applyCountDeviated(rows: OperationWiseExecutionRow[]): OperationWiseExecutionRow[] {
	return rows.map(row => {
		const n = row.responsiblePersons?.length ?? 0;
		const expected = row.responsiblePersonCount;
		return {
			...row,
			countDeviated: n !== expected
		};
	});
}
