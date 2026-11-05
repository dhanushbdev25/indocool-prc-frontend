import type { TableCellConfig, TableCellType, TableColumn } from '../types/table-config.types';
import { OK_NOT_OK_TYPE_KEY, OK_NOT_OK_TYPE_LABEL } from './okNotOkLabels';
import { formatAcceptanceRange } from '../components/masters/acceptanceRange';

/**
 * Every scalar data type the portal offers anywhere (inspection parameters, table columns, list
 * items, sequence target values), offered for fixed-table columns and, with per-cell types on,
 * for each cell.
 */
export const FIXED_TABLE_DATA_TYPE_OPTIONS: ReadonlyArray<{ value: TableCellType; label: string }> = [
	{ value: 'text', label: 'Text' },
	{ value: 'number', label: 'Number' },
	{ value: 'integer', label: 'Integer' },
	{ value: 'range', label: 'Range' },
	{ value: 'exact value', label: 'Exact Value' },
	{ value: 'boolean', label: 'Boolean' },
	{ value: OK_NOT_OK_TYPE_KEY, label: OK_NOT_OK_TYPE_LABEL },
	{ value: 'date', label: 'Date' },
	{ value: 'datetime', label: 'Date & Time' },
	{ value: 'shift', label: 'Shift' },
	{ value: 'workstation', label: 'Workstation' }
];

export const FIXED_TABLE_DATA_TYPES: readonly TableCellType[] = FIXED_TABLE_DATA_TYPE_OPTIONS.map(o => o.value);

export const BOOLEAN_CELL_OPTIONS = ['Yes', 'No'] as const;

export const fixedTableDataTypeLabel = (type: string | undefined): string =>
	FIXED_TABLE_DATA_TYPE_OPTIONS.find(option => option.value === type)?.label ?? type ?? '';

/** Types whose reading is a number checked against a min/max (an exact value is min = max). */
export const isNumericCellType = (type: string | undefined): boolean =>
	type === 'number' || type === 'integer' || type === 'range' || type === 'exact value';

export interface FixedTableCellSpec {
	type: TableCellType;
	minimumAcceptanceValue?: string | number | null;
	maximumAcceptanceValue?: string | number | null;
}

/**
 * The data type and range that apply to one cell: the cell's own when the table has per-cell
 * types on and the cell has a type, otherwise its column's (every table saved before per-cell
 * types existed).
 */
export const resolveFixedTableCellSpec = (
	config: { cellTypes?: boolean } | null | undefined,
	column: Pick<TableColumn, 'type' | 'minimumAcceptanceValue' | 'maximumAcceptanceValue'>,
	cell: Partial<TableCellConfig> | null | undefined
): FixedTableCellSpec => {
	const source = config?.cellTypes && cell?.type ? cell : column;
	return {
		type: (source.type ?? 'text') as TableCellType,
		minimumAcceptanceValue: source.minimumAcceptanceValue,
		maximumAcceptanceValue: source.maximumAcceptanceValue
	};
};

/**
 * Applies a type change to a column or cell spec: bounds only belong to numeric types, so they
 * are dropped otherwise, and an exact value keeps a single target (min = max).
 */
export const withCellType = <T extends Partial<FixedTableCellSpec>>(spec: T, type: TableCellType): T => {
	const { minimumAcceptanceValue: min, maximumAcceptanceValue: max, ...rest } = spec;
	if (!isNumericCellType(type)) return { ...rest, type } as T;
	const next = { ...rest, type } as T;
	if (min !== undefined) next.minimumAcceptanceValue = min;
	if (type === 'exact value') {
		if (min !== undefined) next.maximumAcceptanceValue = min;
	} else if (max !== undefined) {
		next.maximumAcceptanceValue = max;
	}
	return next;
};

const isBlankBound = (value: unknown) => value === undefined || value === null || String(value).trim() === '';

/**
 * Master-side check of one spec's range. Returns an error message or null. Range needs both
 * bounds, exact value needs its target, and min may not exceed max.
 */
export const validateCellSpecRange = (spec: Partial<FixedTableCellSpec> | null | undefined): string | null => {
	if (!spec || !isNumericCellType(spec.type)) return null;
	const { minimumAcceptanceValue: min, maximumAcceptanceValue: max } = spec;
	if (spec.type === 'range' && (isBlankBound(min) || isBlankBound(max))) return 'Range needs a minimum and maximum';
	if (spec.type === 'exact value' && isBlankBound(min)) return 'Exact value needs a target value';
	if (!isBlankBound(min) && !isBlankBound(max) && Number(min) > Number(max)) {
		return 'Minimum value cannot be greater than maximum value';
	}
	return null;
};

/** The target of an exact-value cell for display, or null when none is set. */
export const formatExactTarget = (target: string | number | null | undefined): string | null =>
	isBlankBound(target) ? null : String(target).trim();

/** "Range: 1 to 5" or "Target: 3" for a numeric spec, or null when there is nothing to show. */
export const formatCellSpecRange = (spec: Partial<FixedTableCellSpec>): string | null => {
	if (!isNumericCellType(spec.type)) return null;
	if (spec.type === 'exact value') {
		const target = formatExactTarget(spec.minimumAcceptanceValue);
		return target ? `Target: ${target}` : null;
	}
	const range = formatAcceptanceRange(spec.minimumAcceptanceValue, spec.maximumAcceptanceValue);
	return range ? `Range: ${range}` : null;
};
