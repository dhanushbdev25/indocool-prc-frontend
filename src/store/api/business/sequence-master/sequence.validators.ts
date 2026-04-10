import { TableConfig } from '../../../../types/table-config.types';

export interface ProcessStep {
	id: number;
	processStepGroupId: number;
	version: number;
	isLatest: boolean;
	parameterDescription: string;
	stepNumber: number;
	stepType: string;
	evaluationMethod: string;
	targetValueType: string;
	minimumAcceptanceValue: string | null;
	maximumAcceptanceValue: string | null;
	multipleMeasurements: boolean;
	multipleMeasurementMaxCount: number | null;
	tableConfig?: TableConfig | null;
	uom?: string;
	ctq: boolean;
	allowAttachments: boolean;
	responsiblePerson?: boolean | null;
	notes: string;
	createdAt: string;
	updatedAt: string;
	[key: string]: unknown;
}

export interface ProcessStepGroup {
	id: number;
	processSequenceId: number;
	version: number;
	isLatest: boolean;
	processName: string;
	processDescription: string;
	sequenceTiming: number;
	createdAt: string;
	updatedAt: string;
	steps: ProcessStep[];
	[key: string]: unknown;
}

export interface ProcessSequence {
	id: number;
	status: string;
	sequenceId: string;
	sequenceName: string;
	version: number;
	isLatest: boolean;
	category: string;
	type: string;
	notes: string | null;
	totalSteps: number;
	ctqSteps: number;
	createdAt: string;
	updatedAt: string;
	stepGroups: ProcessStepGroup[];
	[key: string]: unknown;
}

export interface SequenceHeader {
	ACTIVE: number;
	INACTIVE: number;
}

export interface SequenceListResponse {
	header: SequenceHeader;
	detail: ProcessSequence[];
}

export interface SequenceByIdResponse {
	header: SequenceHeader;
	detail: ProcessSequence;
}

export interface ProcessStepRequest {
	parameterDescription: string;
	stepNumber: number;
	stepType: string;
	evaluationMethod: string;
	targetValueType: string;
	minimumAcceptanceValue: number | null;
	maximumAcceptanceValue: number | null;
	multipleMeasurements: boolean;
	multipleMeasurementMaxCount: number | null;
	tableConfig?: TableConfig | null;
	uom?: string;
	ctq: boolean;
	allowAttachments: boolean;
	responsiblePerson?: boolean | null;
	notes: string;
}

export interface ProcessStepGroupRequest {
	processName: string;
	processDescription: string;
	sequenceTiming: number;
	processSteps: ProcessStepRequest[];
}

export interface ProcessSequenceRequest {
	status: string;
	sequenceId: string;
	sequenceName: string;
	version: number;
	isLatest: boolean;
	category: string;
	type: string;
	notes: string;
	totalSteps: number;
	ctqSteps: number;
}

export interface CreateSequenceRequest {
	data: {
		processSequence: ProcessSequenceRequest;
		processStepGroups: ProcessStepGroupRequest[];
	};
}

export interface UpdateSequenceRequest {
	id: number;
	data: {
		processSequence: ProcessSequenceRequest;
		processStepGroups: ProcessStepGroupRequest[];
	};
}

export interface ProcessSequenceBasic {
	id: number;
	status: string;
	sequenceId: string;
	sequenceName: string;
	version: number;
	isLatest: boolean;
	category: string;
	type: string;
	notes: string | null;
	totalSteps: number;
	ctqSteps: number;
	createdAt: string;
	updatedAt: string;
	[key: string]: unknown;
}

export interface CreateSequenceResponse {
	message: string;
	data: ProcessSequenceBasic;
}

export interface UpdateSequenceResponse {
	message: string;
	data: ProcessSequenceBasic;
}

export interface DeleteSequenceTaskRequest {
	id: number;
	data: {
		processSequence: ProcessSequenceRequest;
		processStepGroups: ProcessStepGroupRequest[];
	};
}

export interface DeleteSequenceTaskResponse {
	message: string;
	data: ProcessSequenceBasic;
}

function isProcessStep(value: unknown): value is ProcessStep {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const s = value as Record<string, unknown>;
	return (
		typeof s.id === 'number' &&
		typeof s.processStepGroupId === 'number' &&
		typeof s.version === 'number' &&
		typeof s.isLatest === 'boolean' &&
		typeof s.parameterDescription === 'string' &&
		typeof s.stepNumber === 'number'
	);
}

function isProcessStepGroup(value: unknown): value is ProcessStepGroup {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const g = value as Record<string, unknown>;
	return (
		typeof g.id === 'number' &&
		typeof g.processSequenceId === 'number' &&
		typeof g.processName === 'string' &&
		Array.isArray(g.steps) &&
		g.steps.every(isProcessStep)
	);
}

function isProcessSequence(value: unknown): value is ProcessSequence {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const p = value as Record<string, unknown>;
	return (
		typeof p.id === 'number' &&
		typeof p.status === 'string' &&
		typeof p.sequenceId === 'string' &&
		typeof p.sequenceName === 'string' &&
		Array.isArray(p.stepGroups) &&
		p.stepGroups.every(isProcessStepGroup)
	);
}

function isSequenceHeader(value: unknown): value is SequenceHeader {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const h = value as Record<string, unknown>;
	return typeof h.ACTIVE === 'number' && typeof h.INACTIVE === 'number';
}

export function isSequenceListResponse(value: unknown): value is SequenceListResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	if (!isSequenceHeader(o.header) || !Array.isArray(o.detail)) {
		return false;
	}
	return o.detail.every(isProcessSequence);
}

export function isSequenceByIdResponse(value: unknown): value is SequenceByIdResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	return isSequenceHeader(o.header) && isProcessSequence(o.detail);
}

function isProcessSequenceBasic(value: unknown): value is ProcessSequenceBasic {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const b = value as Record<string, unknown>;
	return (
		typeof b.id === 'number' &&
		typeof b.status === 'string' &&
		typeof b.sequenceId === 'string' &&
		typeof b.sequenceName === 'string' &&
		typeof b.createdAt === 'string' &&
		typeof b.updatedAt === 'string'
	);
}

export function isSequenceMutationResponse(
	value: unknown
): value is CreateSequenceResponse | UpdateSequenceResponse | DeleteSequenceTaskResponse {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	return typeof o.message === 'string' && isProcessSequenceBasic(o.data);
}
