/** Raw item from GET /mould */
export interface MouldApiItem {
	id: number;
	partId: number;
	partCode: string;
	mouldId: string;
	reconciliationCount: number;
	currentCount: number;
	totalCount?: number;
	lastReconciled?: string | null;
	reconcileNowFlag: boolean;
	createdAt?: string;
	updatedAt?: string;
	[key: string]: unknown;
}

export interface MouldListResponse {
	data: MouldApiItem[];
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
	mouldCode: item.mouldId,
	reconciliationCount: item.reconciliationCount,
	currentCount: item.currentCount,
	lastReconciledAt: item.lastReconciled ?? null,
	reconcileNowFlag: item.reconcileNowFlag
});

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

export function isMouldListResponse(value: unknown): value is MouldListResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	if (!Array.isArray(o.data)) {
		return false;
	}
	for (const item of o.data) {
		if (!isMouldApiItem(item)) {
			return false;
		}
	}
	return true;
}

function isMouldApiItem(value: unknown): value is MouldApiItem {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	return (
		typeof o.id === 'number' &&
		typeof o.partId === 'number' &&
		typeof o.partCode === 'string' &&
		typeof o.mouldId === 'string' &&
		typeof o.reconciliationCount === 'number' &&
		typeof o.currentCount === 'number' &&
		typeof o.reconcileNowFlag === 'boolean'
	);
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
