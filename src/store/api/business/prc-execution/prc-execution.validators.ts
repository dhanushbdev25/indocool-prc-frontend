/** List row for PRC execution table (GET /prcExecution list) */
export interface PrcExecution {
	id: number;
	orderId?: string | number | null;
	partNumber: string;
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
	progress: string | number;
	stepsCompleted?: number;
	totalSteps?: number;
	status: string;
	date: string;
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
