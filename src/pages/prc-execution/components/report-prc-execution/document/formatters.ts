import type { TimelineStep } from '../../../types/execution.types';
import {
	OK_NOT_OK_NA_VALUE,
	OK_NOT_OK_NEGATIVE_VALUE,
	OK_NOT_OK_POSITIVE_VALUE
} from '../../../../../utils/okNotOkLabels';
import type { DocStatus } from './types';

export const EMPTY = '—';

/** A value as printed text: empty becomes a dash, zero stays zero. */
export function dash(value: unknown): string {
	if (value === null || value === undefined) return EMPTY;
	const text = String(value).trim();
	return text === '' ? EMPTY : text;
}

/** Value with its unit; units of 'None' (the master data's "no unit") are dropped. */
export function withUnit(value: unknown, unit?: string | null): string {
	const text = dash(value);
	if (text === EMPTY) return EMPTY;
	const u = typeof unit === 'string' ? unit.trim() : '';
	return u && u.toLowerCase() !== 'none' ? `${text} ${u}` : text;
}

export function statusWord(status: TimelineStep['status']): DocStatus {
	if (status === 'completed') return 'Completed';
	if (status === 'in-progress') return 'In progress';
	return 'Pending';
}

/** Persisted range check (Accepted / InRange / Lesser / Greater) as a printed result. */
export function rangeResult(validationStatus?: unknown, acknowledged?: unknown): string {
	const status = typeof validationStatus === 'string' ? validationStatus.trim().toLowerCase() : '';
	let result: string;
	if (status === 'accepted' || status === 'inrange') result = 'OK';
	else if (status === 'lesser') result = 'Low';
	else if (status === 'greater') result = 'High';
	else return EMPTY;
	return result !== 'OK' && acknowledged === true ? `${result} (ack.)` : result;
}

function toNumber(value: unknown): number | null {
	if (value === null || value === undefined || String(value).trim() === '') return null;
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}

/** Exact-value target: OK when the reading matches, otherwise the signed difference. */
export function exactResult(value: unknown, target: unknown): string {
	const v = toNumber(value);
	const t = toNumber(target);
	if (v === null || t === null) return EMPTY;
	const delta = Math.round((v - t) * 1000) / 1000;
	if (delta === 0) return 'OK';
	return `Deviation ${delta > 0 ? '+' : ''}${delta}`;
}

export function okNotOkResult(value: unknown): string {
	const v = typeof value === 'string' ? value.trim().toLowerCase() : '';
	if (v === OK_NOT_OK_POSITIVE_VALUE) return 'OK';
	if (v === OK_NOT_OK_NEGATIVE_VALUE) return 'OK with deviation';
	if (v === OK_NOT_OK_NA_VALUE) return 'Not applicable';
	return EMPTY;
}

/** True for any result that is not a plain pass (printed in bold). */
export function isNotOk(result: string): boolean {
	return (
		result.startsWith('Low') ||
		result.startsWith('High') ||
		result.startsWith('Deviation') ||
		result.startsWith('Not OK') ||
		result === 'OK with deviation'
	);
}

/** One result for a list or table: Not OK if any entry is, OK if anything passed, else a dash. */
export function aggregateResult(results: readonly string[]): string {
	if (results.some(isNotOk)) return 'Not OK';
	if (results.some(r => r === 'OK' || r === 'Not applicable')) return 'OK';
	return EMPTY;
}

/** Several readings of one parameter: OK, or how many of them are not. */
export function readingsResult(results: readonly string[]): string {
	const bad = results.filter(isNotOk).length;
	if (bad > 0) return `Not OK (${bad} of ${results.length})`;
	return results.some(r => r === 'OK') ? 'OK' : EMPTY;
}
