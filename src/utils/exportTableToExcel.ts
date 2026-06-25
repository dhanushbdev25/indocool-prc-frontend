import * as XLSX from 'xlsx';
import type { MRT_RowData, MRT_TableInstance } from 'material-react-table';

const slugify = (s: string): string =>
	s
		.toString()
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '');

const timestamp = (): string => {
	const d = new Date();
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${pad(d.getDate())}${pad(d.getMonth() + 1)}${d.getFullYear()}-${pad(d.getHours())}${pad(d.getMinutes())}`;
};

const valueForCell = (raw: unknown): string | number | boolean | Date | null => {
	if (raw === null || raw === undefined) return '';
	if (raw instanceof Date) return raw;
	if (Array.isArray(raw)) return raw.map(v => (v == null ? '' : String(v))).join(', ');
	if (typeof raw === 'object') {
		try {
			return JSON.stringify(raw);
		} catch {
			return String(raw);
		}
	}
	return raw as string | number | boolean;
};

/**
 * Export the table's currently-filtered rows to an .xlsx file.
 * Respects:
 *  - The data already passed to the table (which the list page filters via the InlineFilterBar applied filters)
 *  - In-table column filters (via getFilteredRowModel)
 *  - The visible, non-action columns whose header is a string
 *
 * Skips columns where `id === 'actions'`, where the header isn't a string,
 * or where `columnDef.meta.exportable === false`.
 */
export function exportTableToExcel<T extends MRT_RowData>(
	table: MRT_TableInstance<T>,
	titleSlug: string
): void {
	const allColumns = table.getAllLeafColumns();
	const exportColumns = allColumns.filter(col => {
		const def = col.columnDef as typeof col.columnDef & { meta?: { exportable?: boolean } };
		if (def.meta?.exportable === false) return false;
		if (col.id === 'actions') return false;
		if (typeof def.header !== 'string') return false;
		// Skip any column whose header reads as "Actions" — non-data, button-only columns.
		if (def.header.trim().toLowerCase() === 'actions') return false;
		// Hide non-visible columns from export too
		if (col.getIsVisible && col.getIsVisible() === false) return false;
		return true;
	});

	const headerLabels = exportColumns.map(c => (c.columnDef.header as string) ?? c.id);

	// Use the filtered row model so in-table column filters are respected.
	const rows = table.getFilteredRowModel().rows;

	const aoa: (string | number | boolean | Date | null)[][] = [
		headerLabels,
		...rows.map(row => exportColumns.map(col => valueForCell(row.getValue(col.id))))
	];

	const ws = XLSX.utils.aoa_to_sheet(aoa);

	// Best-effort column widths based on the longest cell in each column
	ws['!cols'] = exportColumns.map((_, idx) => {
		const max = aoa.reduce((acc, r) => {
			const v = r[idx];
			const s = v instanceof Date ? v.toISOString() : v == null ? '' : String(v);
			return Math.max(acc, s.length);
		}, 0);
		return { wch: Math.min(Math.max(max + 2, 12), 60) };
	});

	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

	const filename = `${slugify(titleSlug) || 'table'}-${timestamp()}.xlsx`;
	XLSX.writeFile(wb, filename);
}
