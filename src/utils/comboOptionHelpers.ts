/** Shared helpers to turn combo API responses into filter option string lists. */

const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

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
