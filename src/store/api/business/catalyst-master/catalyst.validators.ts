import { AuditHistoryEntry, hasValidAuditHistory } from '../audit-history/audit-history.validators';

export interface CatalystConfiguration {
	id: number;
	catalystId: number;
	chartId: string;
	version: number;
	isLatest: boolean;
	minTemperature: string;
	maxTemperature: string;
	minHumidity: string;
	maxHumidity: string;
	minGelcoat: string;
	maxGelcoat: string;
	gelcoatLabel: string;
	minResinDosage: string;
	maxResinDosage: string;
	resinLabel: string;
	minTopCoat: string | null;
	maxTopCoat: string | null;
	topCoatLabel: string | null;
	blockCatalystMixing: boolean;
	requestSupervisorApproval: boolean;
	createdAt: string;
	updatedAt: string;
	[key: string]: unknown;
}

export interface Catalyst {
	id: number;
	status: string;
	chartId: string;
	version: number;
	isLatest: boolean;
	chartSupplier: string;
	notes: string;
	mekpDensity: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	[key: string]: unknown;
}

export interface CatalystDetail {
	catalyst: Catalyst;
	catalystConfiguration: CatalystConfiguration[];
	[key: string]: unknown;
}

export interface CatalystHeader {
	ACTIVE: number;
	NEW: number;
	INACTIVE: number;
}

export interface CatalystChartResponse {
	header: CatalystHeader;
	detail: CatalystDetail[];
}

export interface CatalystByIdResponse {
	header: CatalystHeader;
	detail: CatalystDetail;
	history?: AuditHistoryEntry[];
}

export interface CatalystConfigurationRequest {
	minTemperature: number;
	maxTemperature: number;
	minHumidity: number;
	maxHumidity: number;
	minGelcoat: number;
	maxGelcoat: number;
	gelcoatLabel: string;
	minResinDosage: number;
	maxResinDosage: number;
	resinLabel: string;
	minTopCoat: number;
	maxTopCoat: number;
	topCoatLabel: string;
	blockCatalystMixing: boolean;
	requestSupervisorApproval: boolean;
}

export interface CatalystRequest {
	status: string;
	chartId: string;
	chartSupplier: string;
	notes?: string;
	isActive: boolean;
}

export interface CatalystRequestWithId {
	id: number;
	version: number;
	status: string;
	chartId: string;
	chartSupplier: string;
	notes?: string;
	isActive: boolean;
}

export interface CreateCatalystRequest {
	catalyst: CatalystRequest;
	catalystConfiguration: CatalystConfigurationRequest[];
}

export interface UpdateCatalystRequest {
	id: number;
	catalyst: CatalystRequestWithId;
	catalystConfiguration: CatalystConfigurationRequest[];
}

export interface CatalystBasic {
	id: number;
	status: string;
	chartId: string;
	version: number;
	isLatest: boolean;
	chartSupplier: string;
	notes: string;
	mekpDensity: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	[key: string]: unknown;
}

export interface CreateCatalystResponse {
	message: string;
	data: CatalystBasic;
}

export interface UpdateCatalystResponse {
	message: string;
	data: CatalystBasic;
}

export interface DeleteCatalystTaskRequest {
	catalyst: CatalystRequestWithId;
	catalystConfiguration: CatalystConfigurationRequest[];
}

export interface DeleteCatalystTaskResponse {
	message: string;
	data: CatalystBasic;
}

function isCatalystConfiguration(value: unknown): value is CatalystConfiguration {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const c = value as Record<string, unknown>;
	return typeof c.id === 'number' && typeof c.catalystId === 'number' && typeof c.chartId === 'string';
}

function isCatalyst(value: unknown): value is Catalyst {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const c = value as Record<string, unknown>;
	return typeof c.id === 'number' && typeof c.status === 'string' && typeof c.chartId === 'string';
}

function isCatalystDetail(value: unknown): value is CatalystDetail {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const d = value as Record<string, unknown>;
	return (
		isCatalyst(d.catalyst) &&
		Array.isArray(d.catalystConfiguration) &&
		d.catalystConfiguration.every(isCatalystConfiguration)
	);
}

function isCatalystHeader(value: unknown): value is CatalystHeader {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const h = value as Record<string, unknown>;
	return (
		typeof h.ACTIVE === 'number' &&
		typeof h.NEW === 'number' &&
		typeof h.INACTIVE === 'number'
	);
}

export function isCatalystChartResponse(value: unknown): value is CatalystChartResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	if (!isCatalystHeader(o.header) || !Array.isArray(o.detail)) {
		return false;
	}
	return o.detail.every(isCatalystDetail);
}

export function isCatalystByIdResponse(value: unknown): value is CatalystByIdResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	return isCatalystHeader(o.header) && isCatalystDetail(o.detail) && hasValidAuditHistory(o);
}

function isCatalystBasic(value: unknown): value is CatalystBasic {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const b = value as Record<string, unknown>;
	return (
		typeof b.id === 'number' &&
		typeof b.status === 'string' &&
		typeof b.chartId === 'string' &&
		typeof b.version === 'number' &&
		typeof b.createdAt === 'string' &&
		typeof b.updatedAt === 'string'
	);
}

export function isCatalystMutationResponse(
	value: unknown
): value is CreateCatalystResponse | UpdateCatalystResponse | DeleteCatalystTaskResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	return typeof o.message === 'string' && isCatalystBasic(o.data);
}
