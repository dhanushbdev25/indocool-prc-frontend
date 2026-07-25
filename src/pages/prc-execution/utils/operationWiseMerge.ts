import type { ExecutionData, OperationWiseExecutionRow } from '../types/execution.types';

export interface SequenceStepGroupRow {
	id: string;
	processName: string;
	processDescription: string;
}

function isPlainRecord(v: unknown): v is Record<string, unknown> {
	return v !== null && typeof v === 'object' && !Array.isArray(v);
}

const SKILL_LEVEL_KEYS = ['l1Count', 'l2Count', 'l3Count', 'l4Count'] as const;

function hasSkillLevelFields(raw: Record<string, unknown>): boolean {
	return SKILL_LEVEL_KEYS.some(
		k => k in raw && raw[k] !== undefined && raw[k] !== null && raw[k] !== ''
	);
}

function clampNonNegSkillInt(n: unknown): number {
	const x = Number(n);
	if (!Number.isFinite(x) || x < 0) return 0;
	return Math.floor(x);
}

function parseOptionalLevel(
	raw: Record<string, unknown>,
	key: (typeof SKILL_LEVEL_KEYS)[number]
): number | undefined {
	if (!(key in raw) || raw[key] === null || raw[key] === '') return undefined;
	const x = Number(raw[key]);
	if (!Number.isFinite(x) || x < 0) return undefined;
	return Math.floor(x);
}

/** When any L1–L4 field is set on the row, keep `responsiblePersonCount` equal to their sum (no minimum). */
function syncResponsiblePersonCountFromSkillLevels(
	row: OperationWiseExecutionRow
): OperationWiseExecutionRow {
	const hasAnyLevel = SKILL_LEVEL_KEYS.some(k => row[k] !== undefined);
	if (!hasAnyLevel) return row;
	const sum =
		clampNonNegSkillInt(row.l1Count) +
		clampNonNegSkillInt(row.l2Count) +
		clampNonNegSkillInt(row.l3Count) +
		clampNonNegSkillInt(row.l4Count);
	return {
		...row,
		responsiblePersonCount: sum
	};
}

function expectedHeadcountForDeviation(row: OperationWiseExecutionRow): number {
	const hasAnyLevel = SKILL_LEVEL_KEYS.some(k => row[k] !== undefined);
	if (hasAnyLevel) {
		return (
			clampNonNegSkillInt(row.l1Count) +
			clampNonNegSkillInt(row.l2Count) +
			clampNonNegSkillInt(row.l3Count) +
			clampNonNegSkillInt(row.l4Count)
		);
	}
	return row.responsiblePersonCount ?? 0;
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

	let responsiblePersonCount: number | undefined;
	let l1Count: number | undefined;
	let l2Count: number | undefined;
	let l3Count: number | undefined;
	let l4Count: number | undefined;
	if (hasSkillLevelFields(raw)) {
		l1Count = parseOptionalLevel(raw, 'l1Count');
		l2Count = parseOptionalLevel(raw, 'l2Count');
		l3Count = parseOptionalLevel(raw, 'l3Count');
		l4Count = parseOptionalLevel(raw, 'l4Count');
		const sum = (l1Count ?? 0) + (l2Count ?? 0) + (l3Count ?? 0) + (l4Count ?? 0);
		responsiblePersonCount = sum;
	} else {
		responsiblePersonCount = Number.isFinite(rpc) && rpc >= 0 ? Math.max(0, Math.floor(rpc)) : undefined;
	}

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
		...(hasSkillLevelFields(raw) ? { l1Count, l2Count, l3Count, l4Count } : {}),
		responsiblePersons,
		countDeviated
	};
}

/** Collect sequence step groups (operations) from the PRC template on the execution payload */
export function extractSequenceStepGroupsFromExecution(execution: ExecutionData): SequenceStepGroupRow[] {
	const out: SequenceStepGroupRow[] = [];
	const steps = execution.prcCurrentTemplate?.prcTemplateSteps ?? [];
	const orderedTemplateSteps = [...steps].sort((a, b) => a.sequence - b.sequence);
	for (const ts of orderedTemplateSteps) {
		if (ts.type !== 'sequence' || !ts.data) continue;
		const data = ts.data as {
			stepGroups?: Array<{
				id: number;
				sequence?: number;
				processName: string;
				processDescription?: string;
			}>;
		};
		const stepGroups = data.stepGroups ?? [];
		const hasGroupSequence = stepGroups.every(
			group => typeof group.sequence === 'number' && Number.isFinite(group.sequence)
		);
		const orderedStepGroups = hasGroupSequence
			? [...stepGroups].sort((a, b) => (a.sequence as number) - (b.sequence as number))
			: stepGroups;
		for (const g of orderedStepGroups) {
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
		if (hasSkillLevelFields(val)) {
			const l1Count = parseOptionalLevel(val, 'l1Count');
			const l2Count = parseOptionalLevel(val, 'l2Count');
			const l3Count = parseOptionalLevel(val, 'l3Count');
			const l4Count = parseOptionalLevel(val, 'l4Count');
			const sum = (l1Count ?? 0) + (l2Count ?? 0) + (l3Count ?? 0) + (l4Count ?? 0);
			out.push({
				id: `legacy-${key}`,
				operationID,
				operationName: typeof val.operationName === 'string' ? val.operationName : '',
				l1Count,
				l2Count,
				l3Count,
				l4Count,
				responsiblePersonCount: sum,
				responsiblePersons: undefined
			});
			continue;
		}
		const mc = Number(val.memberCount ?? val.responsiblePersonCount);
		out.push({
			id: `legacy-${key}`,
			operationID,
			operationName: typeof val.operationName === 'string' ? val.operationName : '',
			responsiblePersonCount: Number.isFinite(mc) && mc >= 0 ? Math.max(0, Math.floor(mc)) : undefined,
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
		if (!fromAgg) return syncResponsiblePersonCountFromSkillLevels({ ...base });
		const merged: OperationWiseExecutionRow = {
			...base,
			...fromAgg,
			operationName: base.operationName || fromAgg.operationName,
			l1Count: fromAgg.l1Count ?? base.l1Count,
			l2Count: fromAgg.l2Count ?? base.l2Count,
			l3Count: fromAgg.l3Count ?? base.l3Count,
			l4Count: fromAgg.l4Count ?? base.l4Count,
			responsiblePersons: fromAgg.responsiblePersons ?? base.responsiblePersons,
			countDeviated: fromAgg.countDeviated
		};
		const hasAnyLevel = SKILL_LEVEL_KEYS.some(k => merged[k] !== undefined);
		if (hasAnyLevel) {
			return syncResponsiblePersonCountFromSkillLevels(merged);
		}
		return {
			...merged,
			responsiblePersonCount: base.responsiblePersonCount ?? fromAgg.responsiblePersonCount
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
			.filter((r): r is OperationWiseExecutionRow => r !== undefined)
			.map(syncResponsiblePersonCountFromSkillLevels);
	}
	return existing ?? [];
}

/** Set countDeviated when assigned responsible persons count differs from expected headcount (sum of L1–L4 when set, else `responsiblePersonCount`). */
export function applyCountDeviated(rows: OperationWiseExecutionRow[]): OperationWiseExecutionRow[] {
	return rows.map(row => {
		const synced = syncResponsiblePersonCountFromSkillLevels(row);
		const n = synced.responsiblePersons?.length ?? 0;
		const expected = expectedHeadcountForDeviation(synced);
		return {
			...synced,
			countDeviated: n !== expected
		};
	});
}
