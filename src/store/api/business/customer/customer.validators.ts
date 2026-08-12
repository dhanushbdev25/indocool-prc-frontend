/** Normalized combo row (string `value`) after transform from GET /customer/*Combo. */
export interface CustomerComboItem {
	label: string;
	value: string;
}

/** Response envelope of GET /customer/{reservation|prcSetId|sapSetId|orderId}Combo. */
export interface CustomerComboResponse {
	data: CustomerComboItem[];
}

/** Raw row before normalization — server may emit numeric values. */
export type CustomerComboRawRow = { label: string; value: string | number } & Record<string, unknown>;

function isCustomerComboRow(value: unknown): value is CustomerComboRawRow {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const row = value as Record<string, unknown>;
	const labelOk = typeof row.label === 'string';
	const v = row.value;
	const valueOk = typeof v === 'string' || typeof v === 'number';
	return labelOk && valueOk;
}

export function isCustomerComboResponse(value: unknown): value is { data: CustomerComboRawRow[] } {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const o = value as Record<string, unknown>;
	if (!Array.isArray(o.data)) {
		return false;
	}
	return o.data.every(isCustomerComboRow);
}
