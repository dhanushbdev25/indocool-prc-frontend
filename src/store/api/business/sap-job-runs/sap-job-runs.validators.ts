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

function extractListArray(value: unknown): unknown[] {
	if (Array.isArray(value)) {
		return value;
	}
	if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
		const data = (value as Record<string, unknown>).data;
		if (Array.isArray(data)) {
			return data;
		}
	}
	throw new Error('Invalid SAP job list response structure');
}

function isSapJobConfigApiItem(value: unknown): value is SapJobConfigItem {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	return (
		typeof o.id === 'number' &&
		typeof o.jobKey === 'string' &&
		typeof o.cronExpression === 'string' &&
		typeof o.endpoint === 'string' &&
		typeof o.enabled === 'boolean' &&
		typeof o.createdAt === 'string' &&
		typeof o.updatedAt === 'string'
	);
}

function isSapJobRunApiItem(value: unknown): value is SapJobRunItem {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	const err = o.errorMessage;
	const runEnd = o.runEnd;
	const endpointUrl = o.endpointUrl;
	const csrfToken = o.csrfToken;
	return (
		typeof o.id === 'number' &&
		typeof o.jobKey === 'string' &&
		typeof o.runStart === 'string' &&
		(runEnd === null || typeof runEnd === 'string') &&
		typeof o.status === 'string' &&
		typeof o.recordsProcessed === 'number' &&
		(endpointUrl === null || typeof endpointUrl === 'string') &&
		(csrfToken === null || typeof csrfToken === 'string') &&
		(err === null || typeof err === 'string')
	);
}

export function parseSapJobConfigsResponse(response: unknown): SapJobConfigItem[] {
	let arr: unknown[];
	try {
		arr = extractListArray(response);
	} catch {
		console.error('Invalid SAP job configs response structure', response);
		throw new Error('Invalid SAP job configs response structure');
	}
	const out: SapJobConfigItem[] = [];
	for (const item of arr) {
		if (!isSapJobConfigApiItem(item)) {
			console.error('Invalid SAP job config item', item);
			throw new Error('Invalid SAP job configs response structure');
		}
		out.push(item);
	}
	return out;
}

export function parseSapJobRunsResponse(response: unknown): SapJobRunItem[] {
	let arr: unknown[];
	try {
		arr = extractListArray(response);
	} catch {
		console.error('Invalid SAP job runs response structure', response);
		throw new Error('Invalid SAP job runs response structure');
	}
	const out: SapJobRunItem[] = [];
	for (const item of arr) {
		if (!isSapJobRunApiItem(item)) {
			console.error('Invalid SAP job run item', item);
			throw new Error('Invalid SAP job runs response structure');
		}
		out.push(item);
	}
	return out;
}

/** GET sapJobRuns/confirmationLogs/:prcExecutionId — { data: SapConfirmationLogItem[] } */

export interface SapConfirmationLogItem {
	id: number;
	prcExecutionId: number;
	operationId: string;
	operationText: string;
	requestUrl: string;
	requestBody: Record<string, unknown>;
	httpStatus: number;
	success: boolean;
	errorMessage: string | null;
	triggeredAt: string;
	[key: string]: unknown;
}

function isSapConfirmationLogItem(value: unknown): value is SapConfirmationLogItem {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	const rb = o.requestBody;
	if (rb === null || typeof rb !== 'object' || Array.isArray(rb)) {
		return false;
	}
	const err = o.errorMessage;
	return (
		typeof o.id === 'number' &&
		typeof o.prcExecutionId === 'number' &&
		typeof o.operationId === 'string' &&
		typeof o.operationText === 'string' &&
		typeof o.requestUrl === 'string' &&
		typeof o.httpStatus === 'number' &&
		typeof o.success === 'boolean' &&
		(err === null || typeof err === 'string') &&
		typeof o.triggeredAt === 'string'
	);
}

export function parseSapConfirmationLogsResponse(response: unknown): SapConfirmationLogItem[] {
	let arr: unknown[];
	try {
		arr = extractListArray(response);
	} catch {
		console.error('Invalid SAP confirmation logs response structure', response);
		throw new Error('Invalid SAP confirmation logs response structure');
	}
	const out: SapConfirmationLogItem[] = [];
	for (const item of arr) {
		if (!isSapConfirmationLogItem(item)) {
			console.error('Invalid SAP confirmation log item', item);
			throw new Error('Invalid SAP confirmation logs response structure');
		}
		out.push(item);
	}
	return out;
}

/** POST sapJobRuns/fetch-rm/:orderId — fresh SAP-backed raw materials list */

export interface RawMaterialItem {
	id: number;
	uom: string;
	quantity: string;
	materialCode: string;
	materialName: string;
	materialGroup: string;
	[key: string]: unknown;
}

export interface FetchRmResponse {
	message: string;
	orderId: string;
	prcExecutionId: number;
	rawMaterials: RawMaterialItem[];
}

function isRawMaterialApiItem(value: unknown): value is RawMaterialItem {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	// Only validate fields the UI renders so the popup tolerates SAP-side variance.
	return (
		typeof o.id === 'number' &&
		typeof o.materialCode === 'string' &&
		typeof o.materialName === 'string' &&
		typeof o.materialGroup === 'string' &&
		typeof o.quantity === 'string' &&
		typeof o.uom === 'string'
	);
}

export function parseFetchRmResponse(response: unknown): FetchRmResponse {
	if (response === null || typeof response !== 'object' || Array.isArray(response)) {
		console.error('Invalid fetch-rm response structure', response);
		throw new Error('Invalid fetch-rm response structure');
	}
	const o = response as Record<string, unknown>;
	const rawMaterials = o.rawMaterials;
	if (!Array.isArray(rawMaterials)) {
		console.error('Invalid fetch-rm response structure', response);
		throw new Error('Invalid fetch-rm response structure');
	}
	const out: RawMaterialItem[] = [];
	for (const item of rawMaterials) {
		if (!isRawMaterialApiItem(item)) {
			console.error('Invalid raw material item', item);
			throw new Error('Invalid fetch-rm response structure');
		}
		out.push(item);
	}
	return {
		message: typeof o.message === 'string' ? o.message : '',
		orderId: o.orderId != null ? String(o.orderId) : '',
		prcExecutionId: typeof o.prcExecutionId === 'number' ? o.prcExecutionId : 0,
		rawMaterials: out
	};
}
