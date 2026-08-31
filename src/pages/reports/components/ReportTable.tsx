import { useMemo, useState } from 'react';
import type { MRT_PaginationState } from 'material-react-table';
import TableComponent from '../../../components/table/TableComponent';
import { useReportColumns } from '../hooks/useReportColumns';
import type { ReportHeader, ReportRow } from '../../../store/api/business/reports/reports.validators';

interface ReportTableProps {
	header: ReportHeader[];
	detail: ReportRow[];
	exportTitle: string;
}

const ReportTableInstance = ({ header, detail, exportTitle }: ReportTableProps) => {
	const columns = useReportColumns(header);
	const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 25 });

	return (
		<TableComponent<ReportRow>
			data={detail}
			tableColumns={columns}
			pagination={pagination}
			onPaginationChange={setPagination}
			exportTitle={exportTitle}
		/>
	);
};

export const ReportTable = (props: ReportTableProps) => {
	// material-react-table locks in its column order on first render and only recalculates it
	// when the column count changes, so switching to a report with the same number of columns
	// kept the previous report's order. Every distinct column set gets its own table instance.
	const columnSignature = useMemo(() => props.header.map(h => h.key).join('|'), [props.header]);

	return <ReportTableInstance key={columnSignature} {...props} />;
};
