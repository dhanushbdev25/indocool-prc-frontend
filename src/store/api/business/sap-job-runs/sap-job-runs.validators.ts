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
