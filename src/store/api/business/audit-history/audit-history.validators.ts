export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VERSIONED';
export type AuditFieldChangeType = 'ADDED' | 'MODIFIED' | 'DELETED';
export type AuditNestedChangeType = AuditFieldChangeType | 'REORDERED';

export interface AuditFieldChange {
	field: string;
	type: AuditFieldChangeType;
	oldValue: unknown;
	newValue: unknown;
}

export interface AuditNestedFieldChange {
	field: string;
	oldValue: unknown;
	newValue: unknown;
}

export interface AuditStructuredChange {
	changeType: AuditNestedChangeType;
	details?: AuditNestedFieldChange[] | null;
	stepChanges?: AuditStructuredChange[] | null;
	[key: string]: unknown;
}

export interface AuditHistoryEntry {
	id: number;
	version: number;
	changeType: AuditAction;
	changedAt: string;
	changedBy: number;
	changedByName: string;
	changes: AuditFieldChange[];
	stepChanges?: AuditStructuredChange[];
	stepGroupChanges?: AuditStructuredChange[];
	parameterChanges?: AuditStructuredChange[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isAuditAction(value: unknown): value is AuditAction {
	return value === 'CREATE' || value === 'UPDATE' || value === 'DELETE' || value === 'VERSIONED';
}

function isAuditFieldChangeType(value: unknown): value is AuditFieldChangeType {
	return value === 'ADDED' || value === 'MODIFIED' || value === 'DELETED';
}

function isAuditNestedChangeType(value: unknown): value is AuditNestedChangeType {
	return isAuditFieldChangeType(value) || value === 'REORDERED';
}

function isAuditFieldChange(value: unknown): value is AuditFieldChange {
	if (!isRecord(value)) {
		return false;
	}
	return typeof value.field === 'string' && isAuditFieldChangeType(value.type);
}

function isAuditNestedFieldChange(value: unknown): value is AuditNestedFieldChange {
	return isRecord(value) && typeof value.field === 'string';
}

function isAuditStructuredChange(value: unknown): value is AuditStructuredChange {
	if (!isRecord(value) || !isAuditNestedChangeType(value.changeType)) {
		return false;
	}
	const detailsValid =
		value.details === undefined ||
		value.details === null ||
		(Array.isArray(value.details) && value.details.every(isAuditNestedFieldChange));
	const stepChangesValid =
		value.stepChanges === undefined ||
		value.stepChanges === null ||
		(Array.isArray(value.stepChanges) && value.stepChanges.every(isAuditStructuredChange));
	return detailsValid && stepChangesValid;
}

export function isAuditHistoryEntry(value: unknown): value is AuditHistoryEntry {
	if (!isRecord(value)) {
		return false;
	}
	const structuredKeys = ['stepChanges', 'stepGroupChanges', 'parameterChanges'] as const;
	return (
		typeof value.id === 'number' &&
		typeof value.version === 'number' &&
		isAuditAction(value.changeType) &&
		typeof value.changedAt === 'string' &&
		typeof value.changedBy === 'number' &&
		typeof value.changedByName === 'string' &&
		Array.isArray(value.changes) &&
		value.changes.every(isAuditFieldChange) &&
		structuredKeys.every(
			key => value[key] === undefined || (Array.isArray(value[key]) && value[key].every(isAuditStructuredChange))
		)
	);
}

export function isAuditHistory(value: unknown): value is AuditHistoryEntry[] {
	return Array.isArray(value) && value.every(isAuditHistoryEntry);
}

export function hasValidAuditHistory(value: Record<string, unknown>): boolean {
	return value.history === undefined || isAuditHistory(value.history);
}
