import {
	MaterialReactTable,
	useMaterialReactTable,
	type MRT_ColumnDef,
	type MRT_RowData,
	type MRT_FilterFn,
	type MRT_PaginationState,
	type MRT_Updater
} from 'material-react-table';
import { Badge, Box, Button, Pagination, PaginationItem, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
	FilterAltOutlined as FilterAltOutlinedIcon,
	FileDownloadOutlined as FileDownloadIcon
} from '@mui/icons-material';
import { useMemo, memo, useState } from 'react';
import { exportTableToExcel } from '../../utils/exportTableToExcel';

/** Case-insensitive substring; empty filter passes; null/undefined cells treated as empty string */
const nullSafeContains: MRT_FilterFn<MRT_RowData> = (row, id, filterValue) => {
	const q = String(filterValue ?? '')
		.trim()
		.toLowerCase();
	if (!q) return true;
	const v = row.getValue(id);
	const s = v == null ? '' : String(v).toLowerCase();
	return s.includes(q);
};

interface TableProps<T extends MRT_RowData> {
	data: T[];
	tableColumns: MRT_ColumnDef<T>[];
	/** Merged onto the scroll container (defaults include a viewport-aware max-height). */
	muiTableContainerSx?: Record<string, unknown>;
	/** When provided, pagination becomes controlled; pair with `onPaginationChange`. */
	pagination?: MRT_PaginationState;
	onPaginationChange?: (updaterOrValue: MRT_Updater<MRT_PaginationState>) => void;
	/** Filename prefix for Excel export (e.g. "catalyst-master"). Omit to hide the Export button. */
	exportTitle?: string;
	/** Column ids pinned to the left edge (stay visible while scrolling horizontally). */
	pinnedColumnsLeft?: string[];
}

const defaultTableContainerSx = {
	maxHeight: 'min(600px, calc(100vh - 320px))',
	overflowX: 'auto'
} as const;

const TableComponent = <T extends MRT_RowData>({
	data,
	tableColumns,
	muiTableContainerSx,
	pagination,
	onPaginationChange,
	exportTitle,
	pinnedColumnsLeft
}: TableProps<T>) => {
	const columns = useMemo(() => tableColumns, [tableColumns]);
	const memoData = useMemo(() => data, [data]);

	const [showColumnFilters, setShowColumnFilters] = useState(false);
	const isControlledPagination = pagination !== undefined && onPaginationChange !== undefined;
	const table = useMaterialReactTable<T>({
		columns,
		data: memoData,
		filterFns: {
			nullSafeContains
		},
		initialState: {
			pagination: { pageIndex: 0, pageSize: 5 },
			showColumnFilters: false,
			...(pinnedColumnsLeft?.length ? { columnPinning: { left: pinnedColumnsLeft } } : {})
		},
		state: {
			showColumnFilters,
			...(isControlledPagination ? { pagination } : {})
		},
		...(isControlledPagination ? { onPaginationChange } : {}),
		onShowColumnFiltersChange: (updater: MRT_Updater<boolean>) => {
			setShowColumnFilters(prev =>
				typeof updater === 'function' ? (updater as (old: boolean) => boolean)(prev) : updater
			);
		},
		defaultColumn: {
			enableColumnFilter: true,
			filterVariant: 'text',
			filterFn: 'nullSafeContains'
		},
		enableStickyHeader: true,
		enableColumnPinning: Boolean(pinnedColumnsLeft?.length),
		enablePagination: true,
		enableSorting: true,
		enableTopToolbar: false,
		renderBottomToolbar: false,
		enableColumnActions: false,
		enableColumnFilters: true,
		enableGlobalFilter: false,
		enableRowSelection: false,
		enableColumnResizing: false,
		enableColumnOrdering: false,
		enableHiding: false,
		enableDensityToggle: false,
		enableFullScreenToggle: false,
		muiTableContainerProps: {
			sx: {
				...defaultTableContainerSx,
				...muiTableContainerSx
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
		},
		muiFilterTextFieldProps: {
			placeholder: 'Filter…',
			size: 'small',
			sx: { minWidth: '100px' }
		}
	});

	const tablePaginationState = table.getState().pagination;
	const columnFilters = table.getState().columnFilters;
	const pageSize = tablePaginationState.pageSize;
	const pageIndex = tablePaginationState.pageIndex;
	const filteredRowCount = table.getFilteredRowModel().rows.length;

	const paginationState = useMemo(() => {
		const totalPages = Math.max(1, Math.ceil(filteredRowCount / pageSize));
		const currentPage = pageIndex + 1;

		const windowSize = 5;
		const halfWindow = Math.floor(windowSize / 2);

		let startPage = Math.max(currentPage - halfWindow, 1);
		let endPage = Math.min(startPage + windowSize - 1, totalPages);

		if (endPage - startPage < windowSize - 1) {
			startPage = Math.max(endPage - windowSize + 1, 1);
		}

		const visiblePages: number[] = [];
		for (let i = startPage; i <= endPage; i++) {
			visiblePages.push(i);
		}

		return { totalPages, currentPage, visiblePages };
	}, [filteredRowCount, pageSize, pageIndex]);

	const hasActiveColumnFilters = columnFilters.length > 0;
	const columnFilterCount = columnFilters.length;

	const handleToggleFilters = () => {
		setShowColumnFilters(show => !show);
	};

	const handleExport = () => {
		if (!exportTitle) return;
		exportTableToExcel(table, exportTitle);
	};

	const canExport = Boolean(exportTitle);
	const exportRowCount = filteredRowCount;

	return (
		<Box sx={{ backgroundColor: 'background.paper' }}>
			<Box
				component="nav"
				role="toolbar"
				aria-label="Table filtering"
				sx={{
					display: 'flex',
					flexWrap: 'wrap',
					alignItems: 'center',
					justifyContent: 'flex-end',
					gap: 1,
					px: { xs: 1.25, sm: 1.5 },
					py: 1,
					borderBottom: 1,
					borderColor: 'divider',
					backgroundColor: theme =>
						theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.03) : alpha(theme.palette.grey[50], 0.98)
				}}
			>
				<Badge
					overlap="rectangular"
					badgeContent={columnFilterCount}
					showZero={false}
					max={99}
					color="primary"
					invisible={columnFilterCount === 0}
					sx={{ '& .MuiBadge-badge': { fontWeight: 700, height: 18, minWidth: 18 } }}
				>
					<Tooltip title={showColumnFilters ? 'Hide per-column filters' : 'Show per-column filters'}>
						<span>
							<Button
								id="table-column-filters-toggle"
								size="small"
								variant="outlined"
								color={showColumnFilters ? 'primary' : 'inherit'}
								aria-pressed={showColumnFilters}
								onClick={handleToggleFilters}
								startIcon={<FilterAltOutlinedIcon fontSize="small" />}
								sx={themeArg => ({
							textTransform: 'none',
							fontWeight: 600,
							letterSpacing: '0.01em',
							borderRadius: 1,
							px: { xs: 1.125, sm: 1.5 },
							minHeight: 34,
							borderColor: showColumnFilters ? themeArg.palette.primary.main : themeArg.palette.divider,
							color: showColumnFilters ? themeArg.palette.primary.main : themeArg.palette.text.secondary,
							backgroundColor: showColumnFilters
								? alpha(themeArg.palette.primary.main, themeArg.palette.mode === 'dark' ? 0.14 : 0.08)
								: themeArg.palette.background.paper,
							'&:hover': {
								borderColor: themeArg.palette.primary.main,
								backgroundColor: alpha(themeArg.palette.primary.main, themeArg.palette.mode === 'dark' ? 0.22 : 0.1)
							}
						})}
					>
						Column filters
					</Button>
				</span>
					</Tooltip>
				</Badge>

				{showColumnFilters && hasActiveColumnFilters ? (
					<Button
						size="small"
						variant="text"
						color="inherit"
						onClick={() => table.resetColumnFilters()}
						sx={themeArg => ({
							textTransform: 'none',
							fontWeight: 600,
							color: themeArg.palette.text.secondary,
							px: { xs: 0.75, sm: 1 },
							minHeight: 34,
							'&:hover': {
								color: themeArg.palette.primary.main,
								backgroundColor: alpha(themeArg.palette.primary.main, themeArg.palette.mode === 'dark' ? 0.12 : 0.06)
							}
						})}
					>
						Clear table filters
					</Button>
				) : null}

				{canExport ? (
					<Tooltip title={`Export ${exportRowCount} row${exportRowCount === 1 ? '' : 's'} to Excel`}>
						<span>
							<Button
								id="table-export-button"
								size="small"
								variant="outlined"
								color="inherit"
								onClick={handleExport}
								disabled={exportRowCount === 0}
								startIcon={<FileDownloadIcon fontSize="small" />}
								sx={themeArg => ({
									textTransform: 'none',
									fontWeight: 600,
									letterSpacing: '0.01em',
									borderRadius: 1,
									px: { xs: 1.125, sm: 1.5 },
									minHeight: 34,
									borderColor: themeArg.palette.divider,
									color: themeArg.palette.text.secondary,
									backgroundColor: themeArg.palette.background.paper,
									'&:hover': {
										borderColor: themeArg.palette.primary.main,
										color: themeArg.palette.primary.main,
										backgroundColor: alpha(themeArg.palette.primary.main, themeArg.palette.mode === 'dark' ? 0.14 : 0.08)
									}
								})}
							>
								Export
							</Button>
						</span>
					</Tooltip>
				) : null}
			</Box>
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
