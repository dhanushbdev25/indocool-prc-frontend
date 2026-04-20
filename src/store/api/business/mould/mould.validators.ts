/** Raw item from GET /mould */
export interface MouldApiItem {
	id: number;
	partId: number;
	partCode: string;
	/** Backend may send mouldCode and/or mouldId */
	mouldCode?: string;
	mouldId?: string;
	reconciliationCount: number;
	currentCount: number | null;
	totalCount?: number | null;
	lastReconciled?: string | null;
	reconcileNowFlag: boolean;
	createdAt?: string;
	updatedAt?: string;
	[key: string]: unknown;
}

/** Row shape for the mould reconciliation table */
export interface MouldReconciliationRow {
	id: number;
	partId: number;
	partNumber: string;
	mouldCode: string;
	reconciliationCount: number;
	currentCount: number;
	lastReconciledAt?: string | null;
	reconcileNowFlag: boolean;
}

export const mapMouldApiItemToRow = (item: MouldApiItem): MouldReconciliationRow => ({
	id: item.id,
	partId: item.partId,
	partNumber: item.partCode,
	mouldCode: item.mouldCode ?? item.mouldId ?? '',
	reconciliationCount: item.reconciliationCount,
	currentCount: item.currentCount ?? 0,
	lastReconciledAt: item.lastReconciled ?? null,
	reconcileNowFlag: item.reconcileNowFlag
});

/** Normalize GET /mould body to an array (raw array or `{ data }`); empty if unrecognized. */
export function extractMouldListArray(response: unknown): unknown[] {
	if (Array.isArray(response)) {
		return response;
	}
	if (response !== null && typeof response === 'object' && !Array.isArray(response)) {
		const data = (response as Record<string, unknown>).data;
		if (Array.isArray(data)) {
			return data;
		}
	}
	return [];
}

/** Best-effort parse so list views never throw on backend shape drift. */
export function coerceMouldApiItem(raw: unknown, fallbackIndex: number): MouldApiItem {
	const o = raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
	const id = typeof o.id === 'number' ? o.id : fallbackIndex;
	const partId = typeof o.partId === 'number' ? o.partId : 0;
	const partCode = typeof o.partCode === 'string' ? o.partCode : '';
	const mouldCode = typeof o.mouldCode === 'string' ? o.mouldCode : undefined;
	const mouldId = typeof o.mouldId === 'string' ? o.mouldId : undefined;
	const reconciliationCount = typeof o.reconciliationCount === 'number' ? o.reconciliationCount : 0;
	const currentCount =
		o.currentCount === null || typeof o.currentCount === 'number' ? (o.currentCount as number | null) : null;
	const totalCount =
		o.totalCount === null || typeof o.totalCount === 'number' ? (o.totalCount as number | null | undefined) : undefined;
	const lastReconciled =
		o.lastReconciled === null || typeof o.lastReconciled === 'string'
			? (o.lastReconciled as string | null)
			: undefined;
	const reconcileNowFlag = o.reconcileNowFlag === true;
	return {
		id,
		partId,
		partCode,
		mouldCode,
		mouldId,
		reconciliationCount,
		currentCount,
		totalCount,
		lastReconciled,
		reconcileNowFlag
	};
}

export const isMouldDueForReconciliation = (row: MouldReconciliationRow): boolean =>
	row.reconcileNowFlag || row.currentCount >= row.reconciliationCount;

/** GET /mould/combo?partId= — comboFormatter formatComboData */
export interface MouldComboData {
	mouldId?: string;
	mouldCode?: string;
	partCode?: string;
	reconciliationCount?: number;
	currentCount?: number;
	totalCount?: number;
	[key: string]: unknown;
}

export interface MouldComboItem {
	label: string;
	value: number | string;
	data: MouldComboData;
}

export interface MouldComboResponse {
	data: MouldComboItem[];
}

export function isMouldComboResponse(value: unknown): value is MouldComboResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	if (!Array.isArray(o.data)) {
		return false;
	}
	for (const item of o.data) {
		if (!isMouldComboItem(item)) {
			return false;
		}
	}
	return true;
}

function isMouldComboItem(value: unknown): value is MouldComboItem {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	if (typeof o.label !== 'string' || (typeof o.value !== 'number' && typeof o.value !== 'string')) {
		return false;
	}
	if (o.data === null || typeof o.data !== 'object' || Array.isArray(o.data)) {
		return false;
	}
	const d = o.data as Record<string, unknown>;
	return typeof d.mouldId === 'string' || typeof d.mouldCode === 'string';
}
