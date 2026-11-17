import type { TableConfig } from '../../../types/table-config.types';
import { BOOLEAN_CELL_OPTIONS, isNumericCellType, resolveFixedTableCellSpec } from '../../../utils/fixedTableCellSpec';
import { LIST_SHIFT_OPTIONS } from '../../../utils/listConfig';

export type RangeStatus = 'InRange' | 'Lesser' | 'Greater';

/** One operator-entered row of a fixed table, keyed by column name. */
export type FixedTableRow = Record<string, string>;

/**
 * Where a reading falls against a min/max, or null when there is no range to judge it by.
 * A 0-to-0 band is what the master stores when the author leaves the range blank
 * (`applyNumberDefaults` coerces empty numeric fields to 0), so it means "no range
 * configured" rather than "must be exactly zero". A range that genuinely starts at
 * zero — 0 to 10 — still applies.
 */
export const getRangeStatus = (
	value: number,
	min?: string | number | null,
	max?: string | number | null
): RangeStatus | null => {
	if (min === null || max === null || min === undefined || max === undefined || min === '' || max === '') return null;
	const minNum = Number(min);
	const maxNum = Number(max);
	if (Number.isNaN(minNum) || Number.isNaN(maxNum)) return null;
	if (minNum === 0 && maxNum === 0) return null;
	if (value < minNum) return 'Lesser';
	if (value > maxNum) return 'Greater';
	return 'InRange';
};

/**
 * A blank or zero reading is not a measurement to judge against the acceptance range: the
 * operator has either not filled the field in yet or has recorded a true zero, and neither
 * should raise an out-of-range deviation. Blank values are still caught by the
 * required-field check that runs before this one.
 */
export const isRangeExemptValue = (value: unknown): boolean => {
	if (value === null || value === undefined) return true;
	const text = String(value).trim();
	if (text === '') return true;
	return parseFloat(text) === 0;
};

/** The rows a fixed table starts with: every cell's configured value (locked or pre-filled). */
export const buildDefaultFixedTableRows = (config: TableConfig): FixedTableRow[] =>
	config.rows.map(row => {
		const rowObj: FixedTableRow = {};
		config.columns.forEach(col => {
			rowObj[col.name] = row?.cells?.[col.name]?.value || '';
		});
		return rowObj;
	});

/**
 * Required, type and range checks for every editable cell. Errors go under `cellKey(row, col)`;
 * an unacknowledged deviation goes under `ackKey(cellKey)`.
 */
export const validateFixedTableRows = (
	config: TableConfig,
	rows: FixedTableRow[],
	acknowledgments: Record<string, boolean>,
	cellKey: (rowIdx: number, colName: string) => string,
	ackKey: (key: string) => string
): Record<string, string> => {
	const errors: Record<string, string> = {};
	config.columns.forEach(col => {
		rows.forEach((row, rowIdx) => {
			const cellConfig = config.rows[rowIdx]?.cells?.[col.name];
			if (cellConfig?.readOnly) return;
			const spec = resolveFixedTableCellSpec(config, col, cellConfig);
			const val = row[col.name];
			const key = cellKey(rowIdx, col.name);
			const where = `Row ${rowIdx + 1}, ${col.name}`;
			if (!val || val.trim() === '') {
				errors[key] = `${where} is required`;
			} else if (isNumericCellType(spec.type)) {
				const numValue = Number(val.trim());
				if (!Number.isFinite(numValue)) {
					errors[key] = `${where} must be a number`;
				} else if (spec.type === 'integer' && !Number.isInteger(numValue)) {
					errors[key] = `${where} must be a whole number`;
				} else {
					const status = isRangeExemptValue(val)
						? null
						: getRangeStatus(numValue, spec.minimumAcceptanceValue, spec.maximumAcceptanceValue);
					if (status && status !== 'InRange' && !acknowledgments[key]) {
						errors[ackKey(key)] = `${where} out of range. Please acknowledge deviation.`;
					}
				}
			} else if (
				spec.type === 'shift' &&
				!LIST_SHIFT_OPTIONS.includes(String(val) as (typeof LIST_SHIFT_OPTIONS)[number])
			) {
				errors[key] = `${where} must be a valid shift`;
			} else if (
				spec.type === 'boolean' &&
				!BOOLEAN_CELL_OPTIONS.includes(String(val) as (typeof BOOLEAN_CELL_OPTIONS)[number])
			) {
				errors[key] = `${where} must be Yes or No`;
			}
		});
	});
	return errors;
};

/**
 * The rows as saved: each numeric reading carries its range, deviation status and whether the
 * operator acknowledged it (`<col>_validationStatus`, `_minimumAcceptanceValue`,
 * `_maximumAcceptanceValue`, `_acknowledged`), so the acknowledgement survives the save.
 */
export const enrichFixedTableRows = (
	config: TableConfig,
	rows: FixedTableRow[],
	acknowledgments: Record<string, boolean>,
	cellKey: (rowIdx: number, colName: string) => string
): Array<Record<string, unknown>> =>
	rows.map((row, rowIdx) => {
		const enriched: Record<string, unknown> = { ...row };
		config.columns.forEach(col => {
			const spec = resolveFixedTableCellSpec(config, col, config.rows[rowIdx]?.cells?.[col.name]);
			if (!isNumericCellType(spec.type)) return;
			const raw = row[col.name];
			if (raw === undefined || isRangeExemptValue(raw)) return;
			const parsed = parseFloat(String(raw));
			if (isNaN(parsed)) return;
			const status = getRangeStatus(parsed, spec.minimumAcceptanceValue, spec.maximumAcceptanceValue);
			if (!status) return;
			enriched[`${col.name}_validationStatus`] = status;
			enriched[`${col.name}_minimumAcceptanceValue`] = spec.minimumAcceptanceValue;
			enriched[`${col.name}_maximumAcceptanceValue`] = spec.maximumAcceptanceValue;
			enriched[`${col.name}_acknowledged`] = acknowledgments[cellKey(rowIdx, col.name)] || false;
		});
		return enriched;
	});
