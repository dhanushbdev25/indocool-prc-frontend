import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef, type MRT_RowData } from 'material-react-table';
import { Box, Pagination, PaginationItem } from '@mui/material';
import { useMemo, memo } from 'react';

interface TableProps<T extends MRT_RowData> {
	data: T[];
	tableColumns: MRT_ColumnDef<T>[];
}

const TableComponent = <T extends MRT_RowData>({ data, tableColumns }: TableProps<T>) => {
	const columns = useMemo(() => tableColumns, [tableColumns]);
	const memoData = useMemo(() => data, [data]);

	const table = useMaterialReactTable<T>({
		columns,
		data: memoData,
		initialState: {
			pagination: { pageIndex: 0, pageSize: 5 }
		},
		// Performance optimizations
		enableStickyHeader: true,
		enablePagination: true,
		enableSorting: true,
		enableTopToolbar: false,
		renderBottomToolbar: false,
		enableColumnActions: false,
		// Disable features we don't use for better performance
		enableColumnFilters: false,
		enableGlobalFilter: false,
		enableRowSelection: false,
		enableColumnResizing: false,
		enableColumnOrdering: false,
		enableHiding: false,
		enableDensityToggle: false,
		enableFullScreenToggle: false,
		// MUI v7 optimized styling
		muiTableContainerProps: {
			sx: {
				maxHeight: '600px',
				overflowX: 'auto'
			}
		},
		muiTableHeadCellProps: {
			sx: {
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

	// Extract pagination state values to avoid complex expressions in dependency array
	const tablePaginationState = table.getState().pagination;
	const pageSize = tablePaginationState.pageSize;
	const pageIndex = tablePaginationState.pageIndex;

	// Memoize pagination calculations for better performance
	const paginationState = useMemo(() => {
		const totalPages = Math.ceil(data.length / pageSize);
		const currentPage = pageIndex + 1;

		// Optimized sliding window logic
		const windowSize = 5;
		const halfWindow = Math.floor(windowSize / 2);

		let startPage = Math.max(currentPage - halfWindow, 1);
		let endPage = Math.min(startPage + windowSize - 1, totalPages);

		// Adjust start if we're near the end
		if (endPage - startPage < windowSize - 1) {
			startPage = Math.max(endPage - windowSize + 1, 1);
		}

		const visiblePages: number[] = [];
		for (let i = startPage; i <= endPage; i++) {
			visiblePages.push(i);
		}

		return { totalPages, currentPage, visiblePages };
	}, [data.length, pageSize, pageIndex]);

	return (
		<Box sx={{ backgroundColor: '#fff' }}>
			<MaterialReactTable table={table} />
			<Box
				sx={{
					width: '100%',
					display: 'flex',
					justifyContent: 'flex-end',
					alignItems: 'center',
					padding: '12px',
					borderTop: '1px solid #e0e0e0'
				}}
			>
				<Pagination
					count={paginationState.visiblePages.length}
					page={paginationState.visiblePages.indexOf(paginationState.currentPage) + 1}
					onChange={(_, pageIndex) => table.setPageIndex(paginationState.visiblePages[pageIndex - 1] - 1)}
					renderItem={item => {
						if (item.type === 'page') {
							const realPage = paginationState.visiblePages[item.page ? item.page - 1 : 0];
							return <PaginationItem {...item} page={realPage} selected={realPage === paginationState.currentPage} />;
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
};

export default memo(TableComponent) as typeof TableComponent;
