import { DocPhotoStrip } from './DocPhotoStrip';
import type { DocDetail, DocTableModel } from './types';

function CellText({ text }: { text: string }) {
	const lines = text.split('\n');
	if (lines.length === 1) return <>{text}</>;
	return (
		<>
			{lines.map((line, i) => (
				<div key={i}>{line}</div>
			))}
		</>
	);
}

function Detail({ detail }: { detail: DocDetail }) {
	if (detail.kind === 'photos') return <DocPhotoStrip photos={detail.photos} defects={detail.defects} />;
	if (detail.kind === 'text') return <CellText text={detail.text} />;
	return (
		<>
			{detail.title && <div className="prc-doc-block-title">{detail.title}</div>}
			<DocTable table={detail.table} />
		</>
	);
}

/** Boxed table; a row's details print as full-width rows directly under it. */
export function DocTable({ table }: { table: DocTableModel }) {
	const { columns, rows, footer } = table;
	return (
		<table className="prc-doc-table">
			<colgroup>
				{columns.map(column => (
					<col key={column.key} style={column.width ? { width: column.width } : undefined} />
				))}
			</colgroup>
			<thead>
				<tr>
					{columns.map(column => (
						<th key={column.key} className={column.align === 'right' ? 'prc-doc-right' : undefined}>
							{column.label}
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{rows.length === 0 && (
					<tr>
						<td colSpan={columns.length} className="prc-doc-empty">
							No rows recorded
						</td>
					</tr>
				)}
				{rows.flatMap(row => [
					<tr key={row.key}>
						{columns.map(column => {
							const classes = [
								column.align === 'right' ? 'prc-doc-right' : '',
								row.strong?.includes(column.key) ? 'prc-doc-strong' : ''
							]
								.filter(Boolean)
								.join(' ');
							return (
								<td key={column.key} className={classes || undefined}>
									<CellText text={row.cells[column.key] ?? '—'} />
								</td>
							);
						})}
					</tr>,
					...(row.details ?? []).map((detail, i) => (
						<tr key={`${row.key}-d${i}`} className="prc-doc-detail">
							<td colSpan={columns.length}>
								<Detail detail={detail} />
							</td>
						</tr>
					))
				])}
			</tbody>
			{footer && (
				<tfoot>
					<tr>
						<td colSpan={columns.length}>{footer}</td>
					</tr>
				</tfoot>
			)}
		</table>
	);
}
