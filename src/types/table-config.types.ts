export interface TableColumn {
	name: string;
	type: 'text' | 'number' | 'ok/not ok' | 'date' | 'datetime' | 'shift' | 'workstation';
	/**
	 * Acceptance range for a `number` column, applied to every row of that column. Left unset
	 * — or stored as a 0-to-0 band, which is what the master writes for a blank range — the
	 * column carries no range and readings are never flagged as deviations.
	 */
	minimumAcceptanceValue?: string | number | null;
	maximumAcceptanceValue?: string | number | null;
}

export interface TableCellConfig {
	value: string;
	readOnly: boolean;
}

export interface TableRowConfig {
	cells: Record<string, TableCellConfig>;
}

export interface TableConfig {
	columns: TableColumn[];
	rows: TableRowConfig[];
}
