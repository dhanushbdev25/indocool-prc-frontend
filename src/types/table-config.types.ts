export interface TableColumn {
	name: string;
	type: 'text' | 'number' | 'ok/not ok' | 'date' | 'datetime' | 'shift';
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
