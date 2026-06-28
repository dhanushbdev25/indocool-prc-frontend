import { useState } from 'react';
import type { MRT_PaginationState } from 'material-react-table';
import TableComponent from '../../../components/table/TableComponent';
import { useReportColumns } from '../hooks/useReportColumns';
import type {
	ReportHeader,
	ReportRow
} from '../../../store/api/business/reports/reports.validators';

interface ReportTableProps {
	header: ReportHeader[];
	detail: ReportRow[];
	exportTitle: string;
}

export const ReportTable = ({ header, detail, exportTitle }: ReportTableProps) => {
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
