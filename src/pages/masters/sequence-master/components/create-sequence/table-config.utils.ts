import type { TableConfig } from '../../../../../types/table-config.types';

/** Remap legacy placeholder cell keys (col_i / col_{i+1} bug) to real column names after load. */
export function normalizeTableConfig(config: TableConfig | null | undefined): TableConfig | null {
	if (!config || !Array.isArray(config.columns) || !Array.isArray(config.rows)) {
		return config ?? null;
	}

	const columns = config.columns;
	const rows = config.rows.map(row => {
		if (!row.cells || typeof row.cells !== 'object') {
			return row;
		}
		const newCells = { ...row.cells };

		columns.forEach((col, i) => {
			const name = col.name?.trim();
			if (!name) return;
			if (newCells[name]) return;

			const legacy = `col_${i + 1}`;
			const placeholder = `col_${i}`;
			if (legacy in newCells) {
				newCells[name] = newCells[legacy];
				delete newCells[legacy];
			} else if (placeholder in newCells) {
				newCells[name] = newCells[placeholder];
				delete newCells[placeholder];
			}
		});

		return { cells: newCells };
	});

	return { columns, rows };
}
