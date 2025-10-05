import { MaterialReactTable, useMaterialReactTable, MRT_ColumnDef } from 'material-react-table';
import { Box, Pagination, PaginationItem } from '@mui/material';
import { useMemo } from 'react';

interface TableProps<T> {
	data: T[];
	tableColumns: MRT_ColumnDef<T>[];
}

export default function TableComponent<T extends object>({ data, tableColumns }: TableProps<T>) {
	const columns = useMemo(() => tableColumns, [tableColumns]);
	const memoData = useMemo(() => data, [data]);

	const table = useMaterialReactTable<T>({
		columns,
		data: memoData,
		initialState: {
			pagination: { pageIndex: 0, pageSize: 15 }
		},
		enableStickyHeader: true,
		enablePagination: true,
		enableSorting: true,
		enableTopToolbar: false,
		renderBottomToolbar: false,
		enableColumnActions: false,
		muiTableContainerProps: {
			sx: {
				maxHeight: '600px',
				overflowX: 'auto'
			}
		},
		muiTableHeadCellProps: {
			sx: {
				backgroundColor: '#e6eefe',
				color: '#000',
				fontWeight: 'bold',
				borderRight: '1px solid rgba(224, 224, 224, 1)'
			}
		},
		muiTableBodyCellProps: {
			sx: {
				padding: '4px 8px',
				borderRight: '1px solid rgba(224, 224, 224, 1)'
			}
		}
	});

	const totalPages = Math.ceil(data.length / table.getState().pagination.pageSize);
	const currentPage = table.getState().pagination.pageIndex + 1;

	// sliding window logic
	let startPage = Math.max(currentPage - 2, 1);
	let endPage = startPage + 4;

	if (endPage > totalPages) {
		endPage = totalPages;
		startPage = Math.max(endPage - 4, 1);
	}

	const visiblePages: number[] = [];
	for (let i = startPage; i <= endPage; i++) {
		visiblePages.push(i);
	}

	return (
		<Box sx={{ backgroundColor: '#fff', pt: 2 }}>
			<MaterialReactTable table={table} />
			<Box
				sx={{
					width: '100%',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					padding: '12px',
					borderTop: '1px solid #e0e0e0'
				}}
			>
				<Pagination
					count={visiblePages.length}
					page={visiblePages.indexOf(currentPage) + 1}
					onChange={(_, pageIndex) => table.setPageIndex(visiblePages[pageIndex - 1] - 1)}
					renderItem={(item) => {
						if (item.type === 'page') {
							const realPage = visiblePages[item.page - 1];
							return <PaginationItem {...item} page={realPage} selected={realPage === currentPage} />;
						}
						return <PaginationItem {...item} />;
					}}
					shape="rounded"
					sx={{
						'& .MuiPaginationItem-root': {
							margin: '0 4px',
							border: '1px solid #ccc',
							borderRadius: '6px',
							width: '36px',
							height: '36px'
						},
						'& .Mui-selected': {
							backgroundColor: '#0a63e9 !important',
							color: '#fff'
						}
					}}
				/>
			</Box>
		</Box>
	);
}
