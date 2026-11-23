import type { ListConfig, ListSavedEntry } from '../../../../../types/list-config.types';
import type { TableColumn, TableConfig } from '../../../../../types/table-config.types';
import { formatAcceptanceRange } from '../../../../../components/masters/acceptanceRange';
import { resolveFixedTableCellSpec } from '../../../../../utils/fixedTableCellSpec';
import { formatTableCellDisplay } from '../../../../../utils/formatTableCellDisplay';
import { formatDisplayDateTime } from '../../../../../utils/formatDisplayDate';
import {
	OK_NOT_OK_TYPE_KEY,
	formatOkNotOkValueForDisplay,
	getOkNotOkCommentPreviewLabel
} from '../../../../../utils/okNotOkLabels';
import { readStoredRowList } from '../../../utils/storedRowList';
import { EMPTY, aggregateResult, dash, isNotOk, okNotOkResult, rangeResult } from './formatters';
import type { DocRow, DocTableModel } from './types';

/** Ok/not ok values arrive as 'ok' or as { value, comments } (legacy: notOkComment). */
export function readOkNotOk(raw: unknown): { value: string; comments: string } {
	if (raw && typeof raw === 'object') {
		const o = raw as Record<string, unknown>;
		const comments = typeof o.comments === 'string' ? o.comments : typeof o.notOkComment === 'string' ? o.notOkComment : '';
		return { value: typeof o.value === 'string' ? o.value : '', comments };
	}
	return { value: typeof raw === 'string' ? raw : '', comments: '' };
}

/** Ok/not ok as printed text: the label, then "Deviation Number: X" / "Comment: X" on a new line. */
export function okNotOkText(raw: unknown, extraComments = ''): string {
	const { value, comments } = readOkNotOk(raw);
	if (!value) return EMPTY;
	const note = comments || extraComments;
	const label = formatOkNotOkValueForDisplay(value);
	return note ? `${label}\n${getOkNotOkCommentPreviewLabel(value)}: ${note}` : label;
}

/** One stored value of a given input type as printed text. */
export function cellText(type: string | undefined, raw: unknown): string {
	if (type === OK_NOT_OK_TYPE_KEY) return okNotOkText(raw);
	if (type === 'datetime') return typeof raw === 'string' && raw.trim() ? formatDisplayDateTime(raw) : EMPTY;
	if (raw !== null && typeof raw === 'object') return dash(JSON.stringify(raw));
	return formatTableCellDisplay(type, raw);
}

const NUMERIC_TYPES = new Set(['number', 'integer', 'range', 'exact value']);

/** Result of one table cell: its saved range check, or its ok/not ok answer. */
function cellResult(type: string | undefined, raw: unknown, row: Record<string, unknown>, column: string): string {
	if (type === OK_NOT_OK_TYPE_KEY) return okNotOkResult(readOk(raw));
	if (type && NUMERIC_TYPES.has(type)) {
		return rangeResult(row[`${column}_validationStatus`], row[`${column}_acknowledged`]);
	}
	return EMPTY;
}

const readOk = (raw: unknown) => readOkNotOk(raw).value;

export interface SubTable {
	table: DocTableModel;
	/** Per-entry results, for the parent row's aggregate. */
	results: string[];
	result: string;
}

function finish(table: DocTableModel, results: string[]): SubTable {
	return { table, results, result: aggregateResult(results) };
}

/** A list answer as Item | Value | Range | Result | Comment, in the master's item order. */
export function listSubTable(value: unknown, listConfig?: ListConfig | null): SubTable {
	const entries = readStoredRowList<ListSavedEntry>(value).filter(e => e && typeof e === 'object');
	const order = new Map((listConfig?.items ?? []).map((item, i) => [item.id, i]));
	const sorted = [...entries].sort(
		(a, b) => (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.id) ?? Number.MAX_SAFE_INTEGER)
	);
	const results: string[] = [];
	const rows: DocRow[] = sorted.map((entry, i) => {
		const isOk = entry.type === OK_NOT_OK_TYPE_KEY;
		const result = isOk
			? okNotOkResult(entry.value)
			: entry.type === 'number'
				? rangeResult(entry.validationStatus, entry.acknowledged)
				: EMPTY;
		results.push(result);
		return {
			key: `list-${entry.id ?? i}`,
			cells: {
				item: dash(entry.label),
				value: isOk ? (entry.value ? formatOkNotOkValueForDisplay(entry.value) : EMPTY) : cellText(entry.type, entry.value),
				range: entry.type === 'number' ? dash(formatAcceptanceRange(entry.minimumAcceptanceValue, entry.maximumAcceptanceValue)) : EMPTY,
				result,
				comment: dash(entry.comments)
			},
			strong: isNotOk(result) ? ['result'] : undefined
		};
	});
	return finish(
		{
			columns: [
				{ key: 'item', label: 'Item' },
				{ key: 'value', label: 'Value', width: '24%' },
				{ key: 'range', label: 'Range', width: '14%' },
				{ key: 'result', label: 'Result', width: '12%' },
				{ key: 'comment', label: 'Comment', width: '20%' }
			],
			rows
		},
		results
	);
}

/** A fixed table answer with the master's columns; each cell typed per column or per cell. */
export function fixedSubTable(value: unknown, tableConfig?: TableConfig | null): SubTable {
	const columns = tableConfig?.columns ?? [];
	const results: string[] = [];
	const rows: DocRow[] = readStoredRowList<Record<string, unknown>>(value).map((row, r) => {
		const strong: string[] = [];
		const cells: Record<string, string> = {};
		columns.forEach((column, c) => {
			const spec = resolveFixedTableCellSpec(tableConfig, column, tableConfig?.rows?.[r]?.cells?.[column.name]);
			const raw = row?.[column.name];
			cells[`c${c}`] = cellText(spec.type, raw);
			const result = cellResult(spec.type, raw, row ?? {}, column.name);
			results.push(result);
			if (isNotOk(result)) strong.push(`c${c}`);
		});
		return { key: `row-${r}`, cells, strong: strong.length ? strong : undefined };
	});
	return finish({ columns: columns.map((column, c) => ({ key: `c${c}`, label: column.name })), rows }, results);
}

/** A table / multi-column answer: rows of { column: value } typed by the parameter's columns. */
export function columnsSubTable(rowsValue: unknown, columns: Array<Pick<TableColumn, 'name' | 'type'>>): SubTable {
	const results: string[] = [];
	const rows: DocRow[] = readStoredRowList<Record<string, unknown>>(rowsValue).map((row, r) => {
		const strong: string[] = [];
		const cells: Record<string, string> = {};
		columns.forEach((column, c) => {
			const raw = row?.[column.name];
			cells[`c${c}`] = cellText(column.type, raw);
			const result = cellResult(column.type, raw, row ?? {}, column.name);
			results.push(result);
			if (isNotOk(result)) strong.push(`c${c}`);
		});
		return { key: `row-${r}`, cells, strong: strong.length ? strong : undefined };
	});
	return finish({ columns: columns.map((column, c) => ({ key: `c${c}`, label: column.name })), rows }, results);
}
