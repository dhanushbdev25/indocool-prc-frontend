export interface PrcTemplateStep {
	id?: number;
	templateId?: number;
	version: number;
	isLatest: boolean;
	sequence: number;
	sequenceId?: number | null;
	inspectionId?: number | null;
	type: string;
	blockCatalystMixing: boolean;
	requestSupervisorApproval: boolean;
	stepId: number | null;
	/** Operation group code (e.g. combo value); legacy may use `group` */
	operationID?: string;
	group?: string;
	operationText?: string;
	createdAt?: string;
	updatedAt?: string;
	data?: unknown;
	[key: string]: unknown;
}

export interface PrcTemplate {
	id?: number;
	status: string;
	templateId: string;
	templateName: string;
	notes?: string;
	version: number;
	isLatest: boolean;
	isActive: boolean;
	createdBy?: number | null;
	updatedBy?: number | null;
	createdAt?: string;
	updatedAt?: string;
	[key: string]: unknown;
}

export interface PrcTemplateDetail {
	prcTemplate: PrcTemplate;
	prcTemplateSteps: PrcTemplateStep[];
	[key: string]: unknown;
}

export interface PrcTemplateHeader {
	ACTIVE: number;
	NEW: number;
	INACTIVE: number;
}

export interface PrcTemplateListResponse {
	header: PrcTemplateHeader;
	detail: PrcTemplateDetail[];
}

export interface PrcTemplateByIdResponse {
	header: PrcTemplateHeader;
	detail: PrcTemplateDetail;
}

export interface PrcTemplateInspectionsResponse {
	detail: PrcTemplateDetail;
}

export interface PrcTemplateStepRequest {
	version: number;
	isLatest: boolean;
	sequence: number;
	stepId: number | null;
	type: string;
	blockCatalystMixing?: boolean;
	requestSupervisorApproval?: boolean;
	/** Operation group id from operations combo (e.g. "40") */
	operationID?: string;
	operationText?: string;
}

export interface PrcTemplateRequest {
	status: string;
	templateId: string;
	templateName: string;
	notes?: string;
	version: number;
	isLatest: boolean;
	isActive: boolean;
}

export interface CreatePrcTemplateRequest {
	prcTemplate: PrcTemplateRequest;
	prcTemplateSteps: PrcTemplateStepRequest[];
}

export interface UpdatePrcTemplateRequest {
	id: number;
	prcTemplate: PrcTemplateRequest;
	prcTemplateSteps: PrcTemplateStepRequest[];
}

export interface DeletePrcTemplateTaskRequest {
	prcTemplate: PrcTemplateRequest & { id: number };
	prcTemplateSteps: PrcTemplateStepRequest[];
}

/** Mutation responses: `data` may be full detail, template only, or empty. */
export interface CreatePrcTemplateResponse {
	message: string;
	data?: PrcTemplateDetail | PrcTemplate | Record<string, unknown>;
}

export interface UpdatePrcTemplateResponse {
	message: string;
	data?: PrcTemplateDetail | PrcTemplate | Record<string, unknown>;
}

export interface DeletePrcTemplateTaskResponse {
	message: string;
	data?: PrcTemplateDetail | PrcTemplate | Record<string, unknown>;
}

/** Response from POST prcTemplate/resolveTemplate — hydrated template for execution-style preview */
export interface ResolvePrcTemplateResponse {
	message?: string;
	data: PrcTemplateDetail;
}

export interface OperationsComboItem {
	label: string;
	value: string;
	data: {
		operation: string;
		operationText: string;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

export interface OperationsComboResponse {
	data: OperationsComboItem[];
}

export interface PlantComboItem {
	label: string;
	value: string;
	data?: Record<string, unknown>;
	[key: string]: unknown;
}

export interface PlantComboResponse {
	data: PlantComboItem[];
}

function isPrcTemplate(value: unknown): value is PrcTemplate {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	return (
		typeof o.status === 'string' &&
		typeof o.templateId === 'string' &&
		typeof o.templateName === 'string' &&
		typeof o.version === 'number' &&
		typeof o.isLatest === 'boolean' &&
		typeof o.isActive === 'boolean'
	);
}

function isPrcTemplateStep(value: unknown): value is PrcTemplateStep {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	return (
		typeof o.version === 'number' &&
		typeof o.isLatest === 'boolean' &&
		typeof o.sequence === 'number' &&
		typeof o.type === 'string' &&
		typeof o.blockCatalystMixing === 'boolean' &&
		typeof o.requestSupervisorApproval === 'boolean' &&
		(o.stepId === null || typeof o.stepId === 'number')
	);
}

function isPrcTemplateDetail(value: unknown): value is PrcTemplateDetail {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const d = value as Record<string, unknown>;
	return isPrcTemplate(d.prcTemplate) && Array.isArray(d.prcTemplateSteps) && d.prcTemplateSteps.every(isPrcTemplateStep);
}

function isPrcTemplateHeader(value: unknown): value is PrcTemplateHeader {
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

export function isPrcTemplateListResponse(value: unknown): value is PrcTemplateListResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	if (!isPrcTemplateHeader(o.header) || !Array.isArray(o.detail)) {
		return false;
	}
	return o.detail.every(isPrcTemplateDetail);
}

export function isPrcTemplateByIdResponse(value: unknown): value is PrcTemplateByIdResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	return isPrcTemplateHeader(o.header) && isPrcTemplateDetail(o.detail);
}

export function isPrcTemplateInspectionsResponse(value: unknown): value is PrcTemplateInspectionsResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	return isPrcTemplateDetail(o.detail);
}

export function isPrcTemplateMutationResponse(
	value: unknown
): value is CreatePrcTemplateResponse | UpdatePrcTemplateResponse | DeletePrcTemplateTaskResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	if (typeof o.message !== 'string') {
		return false;
	}
	if (o.data === undefined) {
		return true;
	}
	if (o.data === null || typeof o.data !== 'object' || Array.isArray(o.data)) {
		return false;
	}
	return true;
}

export function isResolvePrcTemplateResponse(value: unknown): value is ResolvePrcTemplateResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	if (o.data === undefined || o.data === null || typeof o.data !== 'object' || Array.isArray(o.data)) {
		return false;
	}
	return isPrcTemplateDetail(o.data);
}

export function isOperationsComboResponse(value: unknown): value is OperationsComboResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	if (!Array.isArray(o.data)) {
		return false;
	}
	return o.data.every(item => {
		if (item === null || typeof item !== 'object' || Array.isArray(item)) {
			return false;
		}
		const row = item as Record<string, unknown>;
		if (typeof row.label !== 'string' || typeof row.value !== 'string') {
			return false;
		}
		const data = row.data;
		if (data === null || typeof data !== 'object' || Array.isArray(data)) {
			return false;
		}
		const d = data as Record<string, unknown>;
		return typeof d.operation === 'string' && typeof d.operationText === 'string';
	});
}

export function isPlantComboResponse(value: unknown): value is PlantComboResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	if (!Array.isArray(o.data)) {
		return false;
	}
	return o.data.every(item => {
		if (item === null || typeof item !== 'object' || Array.isArray(item)) {
			return false;
		}
		const row = item as Record<string, unknown>;
		return typeof row.label === 'string' && typeof row.value === 'string';
	});
}
