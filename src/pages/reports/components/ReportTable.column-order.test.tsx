import { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MRT_ColumnDef, MRT_RowData } from 'material-react-table';
import type { ReportHeader, ReportRow } from '../../../store/api/business/reports/reports.validators';

const mounts: string[][] = [];

/**
 * material-react-table freezes `initialState.columnOrder` on the first render of a
 * table instance and only recalculates it when the column *count* changes. Two
 * reports with the same number of columns therefore render the second report's
 * columns in the first report's order unless the table gets a fresh instance.
 * These tests pin both halves: the order handed down, and the fresh mount.
 */
function MockTableComponent<T extends MRT_RowData>({ tableColumns }: { tableColumns: MRT_ColumnDef<T>[] }) {
	const labels = tableColumns.map(column => String(column.header));
	// Records once per mounted instance: a report switch must produce a new entry.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => void mounts.push(labels), []);
	return <div data-testid="table-columns">{labels.join('|')}</div>;
}

vi.mock('../../../components/table/TableComponent', () => ({ default: MockTableComponent }));

import { ReportTable } from './ReportTable';

const reportA: ReportHeader[] = [
	{ key: 'prcNumber', label: 'PRC Number', sequence: 1, export: true },
	{ key: 'partCode', label: 'Part Code', sequence: 2, export: true },
	{ key: 'plantCode', label: 'Plant Code', sequence: 3, export: true }
];

const reportB: ReportHeader[] = [
	{ key: 'plantCode', label: 'Plant Code', sequence: 1, export: true },
	{ key: 'partCode', label: 'Part Code', sequence: 2, export: true },
	{ key: 'prcNumber', label: 'PRC Number', sequence: 3, export: true }
];

const rows: ReportRow[] = [{ prcNumber: 'PRC-1', partCode: 'P-1', plantCode: '1000' }];

const renderedColumns = () => screen.getByTestId('table-columns').textContent;

describe('ReportTable column order', () => {
	beforeEach(() => {
		mounts.length = 0;
	});

	it('passes columns in the sequence of the report currently shown', () => {
		const { rerender } = render(<ReportTable header={reportA} detail={rows} exportTitle="report-a" />);
		expect(renderedColumns()).toBe('PRC Number|Part Code|Plant Code');

		rerender(<ReportTable header={reportB} detail={rows} exportTitle="report-b" />);
		expect(renderedColumns()).toBe('Plant Code|Part Code|PRC Number');
	});

	it('mounts a fresh table when the report columns change, so no column state carries over', () => {
		const { rerender } = render(<ReportTable header={reportA} detail={rows} exportTitle="report-a" />);
		rerender(<ReportTable header={reportB} detail={rows} exportTitle="report-b" />);

		expect(mounts).toEqual([
			['PRC Number', 'Part Code', 'Plant Code'],
			['Plant Code', 'Part Code', 'PRC Number']
		]);
	});

	it('keeps the same table instance when the columns are unchanged', () => {
		const { rerender } = render(<ReportTable header={reportA} detail={rows} exportTitle="report-a" />);
		rerender(<ReportTable header={[...reportA]} detail={[...rows]} exportTitle="report-a" />);

		expect(mounts).toHaveLength(1);
	});
});
