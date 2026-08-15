/** Shared helpers to turn combo API responses into filter option string lists. */

import type { FilterComboOption } from '../components/masters/filters/FilterAutocomplete';
import type { SapComboRow } from '../store/api/business/part-master/part.validators';

const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * SAP products combo → label/value options. The label surfaces the part code and
 * description carried in the combo row's detail; the value stays the bare SAP number
 * so the server contract is unchanged.
 */
export const sapComboOptions = (rows: SapComboRow[] | undefined): FilterComboOption[] => {
	const byValue = new Map<string, FilterComboOption>();
	for (const row of rows ?? []) {
		const value = String(row.value).trim();
		if (!value || byValue.has(value)) continue;
		const detail = [row.data?.partNumber, row.data?.description]
			.map(part => (part ?? '').trim())
			.filter(Boolean)
			.join(' · ');
		byValue.set(value, { label: detail ? `${value} — ${detail}` : value, value });
	}
	return [...byValue.values()].sort((a, b) => a.label.localeCompare(b.label));
};

/** De-duplicate, trim, drop empties and sort locale-aware. */
export const uniqueSorted = (values: string[]): string[] =>
	[...new Set(values.map(v => v.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));

const coercePlantCode = (row: unknown): string => {
	if (typeof row === 'string') return row.trim();
	if (!isRecord(row)) return '';
	if (typeof row.value === 'string') return row.value.trim();
	if (typeof row.value === 'number') return String(row.value);
	if (typeof row.label === 'string') return row.label.trim();
	return '';
};

/** Normalize the loosely-shaped GET /customer/plant response into plant-code options. */
export const plantCodeOptions = (plantsData: unknown): string[] => {
	const rows = Array.isArray(plantsData)
		? plantsData
		: isRecord(plantsData) && Array.isArray((plantsData as { data?: unknown }).data)
			? (plantsData as { data: unknown[] }).data
			: [];
	return uniqueSorted(rows.map(coercePlantCode));
};
