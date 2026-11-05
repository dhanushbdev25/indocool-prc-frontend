export type TableCellType =
	| 'text'
	| 'number'
	| 'integer'
	| 'range'
	| 'exact value'
	| 'boolean'
	| 'ok/not ok'
	| 'date'
	| 'datetime'
	| 'shift'
	| 'workstation';

export interface TableColumn {
	name: string;
	type: TableCellType;
	/**
	 * Acceptance range for a numeric column (number, integer, range, exact value), applied to
	 * every row of that column. Left unset — or stored as a 0-to-0 band, which is what the master
	 * writes for a blank range — the column carries no range and readings are never flagged as
	 * deviations. An exact value is stored as a collapsed range (min = max).
	 */
	minimumAcceptanceValue?: string | number | null;
	maximumAcceptanceValue?: string | number | null;
}

export interface TableCellConfig {
	value: string;
	readOnly: boolean;
	/** The cell's own data type and range. Read only when the table's `cellTypes` is on. */
	type?: TableCellType;
	minimumAcceptanceValue?: string | number | null;
	maximumAcceptanceValue?: string | number | null;
}

export interface TableRowConfig {
	cells: Record<string, TableCellConfig>;
}

export interface TableConfig {
	columns: TableColumn[];
	rows: TableRowConfig[];
	/**
	 * Fixed table only: when true every cell carries its own data type and range instead of
	 * taking its column's. Absent on every table saved before the option existed.
	 */
	cellTypes?: boolean;
}
