import dayjs from 'dayjs';
import type { FilterValue } from './types';
import { isDateRangeValue, isStringArrayValue, isFilterValueEmpty } from './types';

/** Distinct, sorted, trimmed string list from an array of records — for autocomplete options. */
export function deriveOptions<T>(rows: readonly T[], accessor: (row: T) => string | null | undefined): string[] {
	const set = new Set<string>();
	for (const row of rows) {
		const v = accessor(row);
		if (v == null) continue;
		const trimmed = String(v).trim();
		if (trimmed) set.add(trimmed);
	}
	return [...set].sort((a, b) => a.localeCompare(b));
}

/** Case-insensitive substring match. Returns true when filter is empty (no narrowing). */
export function matchesText(value: string | null | undefined, filterValue: FilterValue | undefined): boolean {
	if (isFilterValueEmpty(filterValue)) return true;
	const haystack = (value ?? '').toLowerCase();
	if (typeof filterValue === 'string') {
		return haystack.includes(filterValue.toLowerCase());
	}
	if (isStringArrayValue(filterValue)) {
		return filterValue.some(v => haystack.includes(v.toLowerCase()));
	}
	return true;
}

/** Multi-select inclusion check. Returns true when filter is empty. */
export function matchesMulti(value: string | number | null | undefined, filterValue: FilterValue | undefined): boolean {
	if (isFilterValueEmpty(filterValue)) return true;
	const v = value == null ? '' : String(value);
	if (typeof filterValue === 'string') return v === filterValue;
	if (isStringArrayValue(filterValue)) return filterValue.includes(v);
	return true;
}

/** Inclusive date-range match against an ISO/date-parseable value. Returns true when filter is empty. */
export function matchesDateRange(value: string | null | undefined, filterValue: FilterValue | undefined): boolean {
	if (isFilterValueEmpty(filterValue)) return true;
	if (!isDateRangeValue(filterValue)) return true;
	if (!value) return false;
	const d = dayjs(value);
	if (!d.isValid()) return false;
	if (filterValue.from) {
		const from = dayjs(filterValue.from).startOf('day');
		if (d.isBefore(from)) return false;
	}
	if (filterValue.to) {
		const to = dayjs(filterValue.to).endOf('day');
		if (d.isAfter(to)) return false;
	}
	return true;
}

/** Count of active (non-empty) filters in a filter map. */
export function countActiveFilters(filters: Record<string, FilterValue | undefined>): number {
	let count = 0;
	for (const v of Object.values(filters)) {
		if (!isFilterValueEmpty(v)) count += 1;
	}
	return count;
}
