import { useMemo } from 'react';
import type { MRT_ColumnDef } from 'material-react-table';
import type {
	ReportHeader,
	ReportRow
} from '../../../store/api/business/reports/reports.validators';

export const formatReportCell = (value: unknown): string => {
	if (value === null || value === undefined) return '';
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	if (Array.isArray(value)) return value.map(v => (v == null ? '' : String(v))).join(', ');
	if (typeof value === 'object') {
		try {
			return JSON.stringify(value);
		} catch {
			return String(value);
		}
	}
	return String(value);
};

export const useReportColumns = (header: ReportHeader[]): MRT_ColumnDef<ReportRow>[] =>
	useMemo(
		() =>
			[...header]
				.sort((a, b) => a.sequence - b.sequence)
				.map<MRT_ColumnDef<ReportRow>>(h => ({
					accessorKey: h.key,
					header: h.label,
					meta: { exportable: h.export },
					Cell: ({ cell }) => formatReportCell(cell.getValue())
				})),
		[header]
	);
