/** Per-operation row nested on list GET `/prcExecution` (camelCase); backend may alias as `operation_status`. */
export interface PrcExecutionOperationStatusRow {
	id: number;
	prcExecutionId?: number;
	operationId: string;
	operationText: string;
	prcStatus: boolean;
	sapStatus: boolean;
	metadata?: unknown | null;
	createdAt?: string;
	updatedAt?: string;
}

/** Normalize list/detail `operationStatus` arrays from the API into typed rows (ignores invalid entries). */
export function parsePrcExecutionOperationStatusList(value: unknown): PrcExecutionOperationStatusRow[] {
	if (!Array.isArray(value)) return [];
	const out: PrcExecutionOperationStatusRow[] = [];
	for (const item of value) {
		if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
		const o = item as Record<string, unknown>;
		const id = typeof o.id === 'number' ? o.id : Number(o.id);
		if (!Number.isFinite(id)) continue;
		const prcExeIdRaw = o.prcExecutionId;
		const prcExecutionId =
			typeof prcExeIdRaw === 'number'
				? prcExeIdRaw
				: prcExeIdRaw != null && String(prcExeIdRaw).trim() !== ''
					? Number(prcExeIdRaw)
					: undefined;

		out.push({
			id,
			prcExecutionId:
				prcExecutionId !== undefined && Number.isFinite(prcExecutionId) ? prcExecutionId : undefined,
			operationId: o.operationId != null ? String(o.operationId) : '',
			operationText:
				typeof o.operationText === 'string'
					? o.operationText
					: o.operationText != null
						? String(o.operationText)
						: '',
			prcStatus: Boolean(o.prcStatus),
			sapStatus: Boolean(o.sapStatus),
			metadata: o.metadata ?? null,
			createdAt: typeof o.createdAt === 'string' ? o.createdAt : undefined,
			updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : undefined
		});
	}
	return out;
}

/** At least one operation and every row has both PRC and SAP complete. */
export function executionOperationsAllComplete(
	ops: PrcExecutionOperationStatusRow[] | undefined
): boolean {
	const list = ops ?? [];
	return list.length > 0 && list.every(op => op.prcStatus && op.sapStatus);
}

/** At least one operation exists and at least one row is missing PRC or SAP completion. */
export function executionOperationsHasIncomplete(
	ops: PrcExecutionOperationStatusRow[] | undefined
): boolean {
	const list = ops ?? [];
	return list.length > 0 && list.some(op => !op.prcStatus || !op.sapStatus);
}

/** List row for PRC execution table (GET /prcExecution list) */
export interface PrcExecution {
	id: number;
	orderId?: string | number | null;
	partNumber: string;
	partDescription?: string | null;
	updatedAt?: string;
	version: number;
	customer: string;
	productionSetId: string;
	mouldId?: string | null;
	shift?: string | null;
	sapSync?: boolean;
	customerName?: string | null;
	customerVariantName?: string | null;
	sapReferenceNumber?: string | null;
	reservation?: string | null;
	progress: string | number;
	stepsCompleted?: number;
	totalSteps?: number;
	status: string;
	/** Per-operation PRC/SAP completion flags when the API returns nested rows. */
	operationStatus?: PrcExecutionOperationStatusRow[];
	date: string;
	/** Plant code (server-side column `plant`). */
	plant?: string | null;
}

/** GET /web/combo?type=... — comboFormatter formatComboData */

export interface WebComboItem {
	label: string;
	value: number | string;
	data?: Record<string, unknown>;
}

export interface WebComboResponse {
	data: WebComboItem[];
}

function isWebComboItem(value: unknown): value is WebComboItem {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	if (typeof o.label !== 'string' || (typeof o.value !== 'number' && typeof o.value !== 'string')) {
		return false;
	}
	if (o.data !== undefined) {
		if (o.data === null || typeof o.data !== 'object' || Array.isArray(o.data)) {
			return false;
		}
	}
	return true;
}

export function isWebComboResponse(value: unknown): value is WebComboResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	if (!Array.isArray(o.data)) {
		return false;
	}
	for (const item of o.data) {
		if (!isWebComboItem(item)) {
			return false;
		}
	}
	return true;
}

/** Nested `data` on GET /combo?type=OPERATIONDELAYREASON items */

export interface OperationDelayReasonComboItemData {
	id: number;
	type: string;
	sequence: number;
}

export interface OperationDelayReasonComboItem {
	label: string;
	/** Business code persisted as timingExceededReasonCode (e.g. RM, FG, WIP) */
	value: string;
	data: OperationDelayReasonComboItemData;
}

/** API row or a minimal hydrated `{ label, value }` when restoring from saved execution without combo loaded */
export type OperationDelayReasonComboOption = OperationDelayReasonComboItem | { label: string; value: string };

export interface OperationDelayReasonComboResponse {
	data: OperationDelayReasonComboItem[];
}

function isOperationDelayReasonComboItemData(value: unknown): value is OperationDelayReasonComboItemData {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	return (
		typeof o.id === 'number' &&
		typeof o.type === 'string' &&
		typeof o.sequence === 'number'
	);
}

function isOperationDelayReasonComboItem(value: unknown): value is OperationDelayReasonComboItem {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	if (typeof o.label !== 'string' || typeof o.value !== 'string') {
		return false;
	}
	return isOperationDelayReasonComboItemData(o.data);
}

export function isOperationDelayReasonComboResponse(
	value: unknown
): value is OperationDelayReasonComboResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	if (!Array.isArray(o.data)) {
		return false;
	}
	for (const item of o.data) {
		if (!isOperationDelayReasonComboItem(item)) {
			return false;
		}
	}
	return true;
}
