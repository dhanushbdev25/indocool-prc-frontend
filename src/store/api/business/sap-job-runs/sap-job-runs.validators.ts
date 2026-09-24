/*
 * SAP-backed payloads are not a contract we control: most log columns are
 * nullable, SAP itself varies field casing/typing between endpoints, and new
 * fields appear without notice. So nothing in this file rejects a row — every
 * parser coerces what it gets into something renderable and warns on the
 * console. A single odd row must never blank out a whole screen.
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toStr(value: unknown, fallback = ''): string {
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	if (value === null || value === undefined) return fallback;
	try {
		return JSON.stringify(value);
	} catch {
		return fallback;
	}
}

function toNullableStr(value: unknown): string | null {
	if (value === null || value === undefined) return null;
	const str = toStr(value);
	return str === '' ? null : str;
}

function toNum(value: unknown, fallback: number): number {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) return parsed;
	}
	return fallback;
}

function toNullableNum(value: unknown): number | null {
	if (value === null || value === undefined || value === '') return null;
	const parsed = toNum(value, Number.NaN);
	return Number.isFinite(parsed) ? parsed : null;
}

function toBool(value: unknown): boolean {
	if (typeof value === 'boolean') return value;
	if (typeof value === 'number') return value === 1;
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		return normalized === 'true' || normalized === '1' || normalized === 'y' || normalized === 'x';
	}
	return false;
}

/**
 * Pulls the list out of whatever envelope arrived: a bare array, `{ data }`,
 * or one of the OData-ish wrappers SAP hands back. Anything else yields an
 * empty list plus a warning rather than an exception.
 */
function extractListArray(value: unknown, label: string): unknown[] {
	if (Array.isArray(value)) return value;
	if (isPlainObject(value)) {
		for (const key of ['data', 'items', 'results', 'value', 'logs'] as const) {
			const nested = value[key];
			if (Array.isArray(nested)) return nested;
		}
		const d = value.d;
		if (isPlainObject(d) && Array.isArray(d.results)) return d.results;
	}
	if (value !== null && value !== undefined) {
		console.warn(`Unexpected ${label} response structure — rendering an empty list`, value);
	}
	return [];
}

/** Keeps only the objects; anything else in the list is dropped with a warning. */
function objectRows(value: unknown, label: string): Record<string, unknown>[] {
	return extractListArray(value, label).filter((item): item is Record<string, unknown> => {
		if (isPlainObject(item)) return true;
		console.warn(`Skipping non-object ${label} entry`, item);
		return false;
	});
}

/** GET sapJobRuns/configs — { data: SapJobConfigItem[] } */

export interface SapJobConfigItem {
	id: number;
	jobKey: string;
	cronExpression: string;
	endpoint: string;
	enabled: boolean;
	createdAt: string;
	updatedAt: string;
	[key: string]: unknown;
}

export function parseSapJobConfigsResponse(response: unknown): SapJobConfigItem[] {
	return objectRows(response, 'SAP job configs').map((o, index) => ({
		...o,
		id: toNum(o.id, -(index + 1)),
		jobKey: toStr(o.jobKey),
		cronExpression: toStr(o.cronExpression),
		endpoint: toStr(o.endpoint),
		enabled: toBool(o.enabled),
		createdAt: toStr(o.createdAt),
		updatedAt: toStr(o.updatedAt)
	}));
}

/** GET sapJobRuns?jobKey= — { data: SapJobRunItem[] } */

export interface SapJobRunItem {
	id: number;
	jobKey: string;
	runStart: string;
	runEnd: string | null;
	status: string;
	recordsProcessed: number;
	endpointUrl: string | null;
	csrfToken: string | null;
	errorMessage: string | null;
	[key: string]: unknown;
}

export function parseSapJobRunsResponse(response: unknown): SapJobRunItem[] {
	return objectRows(response, 'SAP job runs').map((o, index) => ({
		...o,
		id: toNum(o.id, -(index + 1)),
		jobKey: toStr(o.jobKey),
		runStart: toStr(o.runStart),
		runEnd: toNullableStr(o.runEnd),
		status: toStr(o.status),
		recordsProcessed: toNum(o.recordsProcessed, 0),
		endpointUrl: toNullableStr(o.endpointUrl),
		csrfToken: toNullableStr(o.csrfToken),
		errorMessage: toNullableStr(o.errorMessage)
	}));
}

/** GET sapJobRuns/confirmationLogs/:prcExecutionId — { data: SapConfirmationLogItem[] } */

export interface SapConfirmationLogItem {
	id: number;
	prcExecutionId: number;
	operationId: string;
	operationText: string;
	requestUrl: string;
	/** Whatever SAP was sent — object, array, raw string. Rendered as JSON. */
	requestBody: unknown;
	/** Null when the call never reached a response (timeout, transport error). */
	httpStatus: number | null;
	success: boolean;
	errorMessage: string | null;
	errorDescription?: unknown;
	triggeredAt: string;
	[key: string]: unknown;
}

/** A JSON string round-trips into an object so the payload viewer can pretty-print it. */
function normalizeRequestBody(value: unknown): unknown {
	if (typeof value === 'string') {
		const trimmed = value.trim();
		if (!trimmed) return null;
		try {
			return JSON.parse(trimmed);
		} catch {
			return trimmed;
		}
	}
	return value ?? null;
}

export function parseSapConfirmationLogsResponse(response: unknown): SapConfirmationLogItem[] {
	return objectRows(response, 'SAP confirmation logs').map((o, index) => ({
		...o,
		id: toNum(o.id, -(index + 1)),
		prcExecutionId: toNum(o.prcExecutionId, 0),
		operationId: toStr(o.operationId),
		operationText: toStr(o.operationText),
		requestUrl: toStr(o.requestUrl),
		requestBody: normalizeRequestBody(o.requestBody),
		httpStatus: toNullableNum(o.httpStatus),
		success: toBool(o.success),
		errorMessage: toNullableStr(o.errorMessage),
		errorDescription: o.errorDescription ?? null,
		triggeredAt: toStr(o.triggeredAt)
	}));
}

/** POST sapJobRuns/fetch-rm/:orderId — fresh SAP-backed raw materials list */

export interface RawMaterialItem {
	id: number;
	uom: string;
	quantity: string;
	materialCode: string;
	materialName: string;
	materialGroup: string;
	/** Optional — SAP may not always include these per row */
	actualQuantity?: string | number | null;
	actualUom?: string | null;
	batchNumber?: string | null;
	expiryDate?: string | null;
	[key: string]: unknown;
}

export interface FetchRmResponse {
	message: string;
	orderId: string;
	prcExecutionId: number;
	rawMaterials: RawMaterialItem[];
}

export function parseFetchRmResponse(response: unknown): FetchRmResponse {
	if (!isPlainObject(response)) {
		console.error('Invalid fetch-rm response structure', response);
		throw new Error('Invalid fetch-rm response structure');
	}
	const rawMaterials = objectRows(response.rawMaterials ?? response, 'fetch-rm raw materials').map((o, index) => ({
		...o,
		id: toNum(o.id, -(index + 1)),
		materialCode: toStr(o.materialCode),
		materialName: toStr(o.materialName),
		materialGroup: toStr(o.materialGroup),
		quantity: toStr(o.quantity),
		uom: toStr(o.uom)
	}));
	return {
		message: toStr(response.message),
		orderId: toStr(response.orderId),
		prcExecutionId: toNum(response.prcExecutionId, 0),
		rawMaterials
	};
}
