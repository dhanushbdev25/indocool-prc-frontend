import dayjs from 'dayjs';
import type { FilterFieldConfig, FilterValue } from './types';
import { EMPTY_DATE_RANGE, isDateRangeValue, isStringArrayValue, isFilterValueEmpty } from './types';

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

/**
 * Seed a draft state object from current applied values + field config.
 * Honours preset defaults for `dateRangePreset` when no value is stored yet.
 */
export function buildInitialDraftValues(
	fields: FilterFieldConfig[],
	values: Record<string, FilterValue | undefined>
): Record<string, FilterValue> {
	const init: Record<string, FilterValue> = {};
	for (const field of fields) {
		const current = values[field.key];
		if (field.kind === 'autocomplete') {
			init[field.key] = isStringArrayValue(current) ? current : [];
		} else if (field.kind === 'dateRange') {
			init[field.key] = isDateRangeValue(current) ? current : EMPTY_DATE_RANGE;
		} else if (field.kind === 'dateRangePreset') {
			const existingPresetId = values[field.presetKey];
			const presetIdFromState = typeof existingPresetId === 'string' && existingPresetId ? existingPresetId : '';
			const hasStoredRange = isDateRangeValue(current) && (current.from || current.to);
			if (hasStoredRange && presetIdFromState) {
				init[field.key] = current as FilterValue;
				init[field.presetKey] = presetIdFromState;
			} else {
				const defaultId = field.defaultPresetId ?? field.presets[0]?.id ?? '';
				const defaultPreset = field.presets.find(p => p.id === defaultId);
				const customId = field.customPresetId ?? 'custom';
				if (defaultPreset && defaultPreset.id !== customId) {
					const resolved = defaultPreset.resolve();
					init[field.key] = { from: resolved.from || null, to: resolved.to || null };
					init[field.presetKey] = defaultPreset.id;
				} else {
					init[field.key] = EMPTY_DATE_RANGE;
					init[field.presetKey] = defaultId || customId;
				}
			}
		}
	}
	return init;
}

/** Cleared draft for every field — autocomplete `[]`, dateRange `EMPTY_DATE_RANGE`, preset id `''`. */
export function buildClearedValues(fields: FilterFieldConfig[]): Record<string, FilterValue> {
	const cleared: Record<string, FilterValue> = {};
	for (const field of fields) {
		if (field.kind === 'autocomplete') {
			cleared[field.key] = [];
		} else if (field.kind === 'dateRange') {
			cleared[field.key] = EMPTY_DATE_RANGE;
		} else if (field.kind === 'dateRangePreset') {
			cleared[field.key] = EMPTY_DATE_RANGE;
			cleared[field.presetKey] = '';
		}
	}
	return cleared;
}

const normalizeForCompare = (value: FilterValue | undefined): FilterValue | null => {
	if (value === undefined) return null;
	if (isFilterValueEmpty(value)) {
		if (isStringArrayValue(value)) return [];
		if (isDateRangeValue(value)) return EMPTY_DATE_RANGE;
		return '';
	}
	if (isStringArrayValue(value)) return [...value].sort();
	return value;
};

/** Shallow structural compare for filter value maps. Order-insensitive for string[]. */
export function areFiltersEqual(
	a: Record<string, FilterValue | undefined>,
	b: Record<string, FilterValue | undefined>
): boolean {
	const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
	for (const key of keys) {
		const na = normalizeForCompare(a[key]);
		const nb = normalizeForCompare(b[key]);
		if (JSON.stringify(na) !== JSON.stringify(nb)) return false;
	}
	return true;
}
