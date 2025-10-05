import { useMemo } from 'react';
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Box, Pagination, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { TableComponentProps } from './types';

const TableComponent = ({
	columnValues,
	rowValues = [{}],
	showInitGlobalFilter,
	rowsPerPageOptions = [10, 25, 50],
	bodyStyles,
	enableColumnActions = false,
	enableColumnFilters = false,
	enablePagination = true,
	enableSorting = true,
	enableBottomToolbar = false,
	enableTopToolbar = false,
	enableGlobalFilter = true,
	enableHiding = false,
	enableDensityToggle = false,
	enableFullScreenToggle = false,
	enableRowSelection = false,
	enableRowActions = false,
	enableColumnResizing = false
}: TableComponentProps) => {
	const data = useMemo(() => rowValues, [rowValues]);
	const columns = useMemo<MRT_ColumnDef<any>[]>(() => columnValues, [columnValues]);

	const table = useMaterialReactTable({
		columns,
		data,
		initialState: {
			showGlobalFilter: showInitGlobalFilter,
			pagination: {
				pageSize: rowsPerPageOptions[0] || 10,
				pageIndex: 0
			}
		},
		// Disable all features we don't want
		enableColumnActions,
		enableColumnFilters,
		enablePagination,
		enableSorting,
		enableBottomToolbar,
		enableTopToolbar,
		enableGlobalFilter,
		enableHiding,
		enableDensityToggle,
		enableFullScreenToggle,
		enableRowSelection,
		enableRowActions,
		enableColumnResizing,

		// Styling
		muiTableBodyCellProps: {
			sx: {
				backgroundColor: '#fff',
				color: 'black',
				fontWeight: 'bold'
			}
		},
		muiTableContainerProps: {
			sx: {
				backgroundColor: '#fff',
				...bodyStyles
			}
		},
		muiTableHeadCellProps: {
			sx: {
				backgroundColor: '#fff',
				textAlign: 'right',
				textTransform: 'uppercase !important',
				color: '#637098'
			}
		},
		muiSearchTextFieldProps: {
			size: 'small',
			variant: 'outlined'
		}
	});

	const { pagination } = table.getState();
	const pageCount = table.getPageCount();
	const currentPage = pagination.pageIndex;
	const rowsPerPage = pagination.pageSize;

	return (
		<>
			<MaterialReactTable table={table} />
			<Box display="flex" justifyContent="flex-end" alignItems="center" p={2} gap={2}>
				{/* Rows per page selector */}
				<FormControl size="small" sx={{ minWidth: 120 }}>
					<InputLabel id="rows-per-page-label">Rows per page</InputLabel>
					<Select
						labelId="rows-per-page-label"
						id="rows-per-page-select"
						value={rowsPerPage}
						label="Rows per page"
						onChange={e => table.setPageSize(Number(e.target.value))}
					>
						{rowsPerPageOptions.map(option => (
							<MenuItem key={option} value={option}>
								{option}
							</MenuItem>
						))}
					</Select>
				</FormControl>

				{/* Pagination */}
				<Pagination
					count={pageCount}
					page={currentPage + 1}
					onChange={(_, value) => table.setPageIndex(value - 1)}
					color="primary"
					shape="rounded"
					sx={{
						'& .MuiPaginationItem-root': {
							backgroundColor: 'transparent',
							border: '1px solid black',
							color: 'black',
							'&.Mui-selected': {
								backgroundColor: 'transparent',
								border: '1px solid black',
								fontWeight: 'bold',
								color: 'black'
							},
							'&:hover': {
								backgroundColor: '#f0f0f0'
							}
						}
					}}
				/>
			</Box>
		</>
	);
};

export default TableComponent;
