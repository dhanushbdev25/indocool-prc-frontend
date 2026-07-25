import { TableConfig } from '../../../../types/table-config.types';
import { AuditHistoryEntry, hasValidAuditHistory } from '../audit-history/audit-history.validators';

export interface Column {
	name: string;
	type: string;
	defaultValue?: string | number;
	minimumAcceptanceValue?: string | number;
	maximumAcceptanceValue?: string | number;
	[key: string]: unknown;
}

export interface PartImage {
	name: string;
	url: string;
	[key: string]: unknown;
}

export type Files = Record<string, string> | undefined;

export interface RowImageAnnotation {
	imageFileName: string;
	imageUrl: string;
	regions: unknown[];
}

export interface FixedTableRowAnnotation {
	rowIndex: number;
	annotations: RowImageAnnotation[];
}

export interface InspectionParameter {
	id?: number;
	inspectionId?: number;
	order: number | null;
	version?: number;
	isLatest?: boolean;
	parameterName: string;
	specification?: string;
	minimumAcceptanceValue?: string | number;
	maximumAcceptanceValue?: string | number;
	type: string;
	files?: Files;
	rowAnnotations?: FixedTableRowAnnotation[];
	columns: Column[];
	tableConfig?: TableConfig | null;
	role: string;
	ctq: boolean;
	getInstrumentId?: boolean | null;
	createdAt?: string;
	updatedAt?: string;
	[key: string]: unknown;
}

export interface Inspection {
	id?: number;
	inspectionName: string;
	status: string;
	inspectionId: string;
	type: string;
	version: number;
	isLatest: boolean;
	showPartImages?: boolean;
	partImages?: PartImage[];
	approveByProduction?: boolean;
	approveByQuality?: boolean;
	inspectionTiming?: number;
	createdBy?: number | null;
	updatedBy?: number | null;
	createdAt?: string;
	updatedAt?: string;
	[key: string]: unknown;
}

export interface InspectionDetail {
	inspection: Inspection;
	inspectionParameters: InspectionParameter[];
	[key: string]: unknown;
}

export interface InspectionHeader {
	ACTIVE: number;
	NEW?: number;
	INACTIVE: number;
}

export interface InspectionListResponse {
	header: InspectionHeader;
	detail: InspectionDetail[];
}

export interface InspectionByIdResponse {
	header: InspectionHeader;
	detail: InspectionDetail;
	history?: AuditHistoryEntry[];
}

export interface ColumnRequest {
	name: string;
	type: string;
	defaultValue?: string | number;
	minimumAcceptanceValue?: string | number;
	maximumAcceptanceValue?: string | number;
}

export interface InspectionParameterRequest {
	order: number;
	parameterName: string;
	specification?: string;
	minimumAcceptanceValue?: string | number;
	maximumAcceptanceValue?: string | number;
	type: string;
	files?: Files;
	rowAnnotations?: FixedTableRowAnnotation[];
	columns: ColumnRequest[];
	tableConfig?: TableConfig | null;
	role: string;
	ctq: boolean;
	getInstrumentId?: boolean | null;
}

export interface InspectionRequest {
	inspectionName: string;
	status: string;
	inspectionId: string;
	type: string;
	version: number;
	isLatest: boolean;
	showPartImages?: boolean;
	partImages?: PartImage[];
	approveByProduction?: boolean;
	approveByQuality?: boolean;
	inspectionTiming?: number;
	createdBy?: number | null;
	updatedBy?: number | null;
}

export interface InspectionRequestWithId extends InspectionRequest {
	id: number;
}

export interface CreateInspectionRequest {
	inspection: InspectionRequest;
	inspectionParameters: InspectionParameterRequest[];
}

export interface UpdateInspectionRequest {
	id: number;
	inspection: InspectionRequestWithId;
	inspectionParameters: InspectionParameterRequest[];
}

export interface InspectionBasic {
	id: number;
	inspectionName: string;
	status: string;
	inspectionId: string;
	type: string;
	version: number;
	isLatest: boolean;
	showPartImages?: boolean;
	partImages?: PartImage[];
	approveByProduction?: boolean;
	approveByQuality?: boolean;
	inspectionTiming?: number;
	createdBy?: number | null;
	updatedBy?: number | null;
	createdAt: string;
	updatedAt: string;
	[key: string]: unknown;
}

export interface CreateInspectionResponse {
	message: string;
	data: InspectionBasic;
}

export interface UpdateInspectionResponse {
	message: string;
	data: InspectionBasic;
}

export interface DeleteInspectionTaskRequest {
	inspection: InspectionRequestWithId;
	inspectionParameters: InspectionParameterRequest[];
}

export interface DeleteInspectionTaskResponse {
	message: string;
	data: InspectionBasic;
}

function isColumn(value: unknown): value is Column {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const c = value as Record<string, unknown>;
	return typeof c.name === 'string' && typeof c.type === 'string';
}

function isInspectionParameter(value: unknown): value is InspectionParameter {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const p = value as Record<string, unknown>;
	return (
		typeof p.parameterName === 'string' &&
		typeof p.type === 'string' &&
		typeof p.role === 'string' &&
		typeof p.ctq === 'boolean' &&
		(p.order === null || typeof p.order === 'number') &&
		Array.isArray(p.columns) &&
		p.columns.every(isColumn)
	);
}

function isInspection(value: unknown): value is Inspection {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const i = value as Record<string, unknown>;
	return (
		typeof i.inspectionName === 'string' &&
		typeof i.status === 'string' &&
		typeof i.inspectionId === 'string' &&
		typeof i.type === 'string' &&
		typeof i.version === 'number' &&
		typeof i.isLatest === 'boolean'
	);
}

function isInspectionDetail(value: unknown): value is InspectionDetail {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const d = value as Record<string, unknown>;
	return isInspection(d.inspection) && Array.isArray(d.inspectionParameters) && d.inspectionParameters.every(isInspectionParameter);
}

function isInspectionHeader(value: unknown): value is InspectionHeader {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const h = value as Record<string, unknown>;
	return (
		typeof h.ACTIVE === 'number' &&
		typeof h.INACTIVE === 'number' &&
		(h.NEW === undefined || typeof h.NEW === 'number')
	);
}

export function isInspectionListResponse(value: unknown): value is InspectionListResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	if (!isInspectionHeader(o.header) || !Array.isArray(o.detail)) {
		return false;
	}
	return o.detail.every(isInspectionDetail);
}

export function isInspectionByIdResponse(value: unknown): value is InspectionByIdResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	return isInspectionHeader(o.header) && isInspectionDetail(o.detail) && hasValidAuditHistory(o);
}

function isInspectionBasic(value: unknown): value is InspectionBasic {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const b = value as Record<string, unknown>;
	return (
		typeof b.id === 'number' &&
		typeof b.inspectionName === 'string' &&
		typeof b.status === 'string' &&
		typeof b.inspectionId === 'string' &&
		typeof b.type === 'string' &&
		typeof b.version === 'number' &&
		typeof b.isLatest === 'boolean' &&
		typeof b.createdAt === 'string' &&
		typeof b.updatedAt === 'string'
	);
}

export function isInspectionMutationResponse(
	value: unknown
): value is CreateInspectionResponse | UpdateInspectionResponse | DeleteInspectionTaskResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	return typeof o.message === 'string' && isInspectionBasic(o.data);
}
