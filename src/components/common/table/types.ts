import { MRT_Cell, MRT_Row, MRT_RowData, MRT_TableInstance } from 'material-react-table';
import { ReactNode } from 'react';

export interface TableComponentProps {
	columnValues: any;
	rowValues: any;
	enableColumnFilterModes?: boolean;
	enableColumnOrdering?: boolean;
	enableColumnPinning?: boolean;
	enableFacetedValues?: boolean;
	showInitColumnFilters?: boolean;
	showInitGlobalFilter?: boolean;
	enableEditing?: boolean;
	enableRowPinning?: boolean;
	onCreatingRowSave?: any;
	enableColumnActions?: boolean;
	enableColumnFilters?: boolean;
	enablePagination?: boolean;
	enableSorting?: boolean;
	enableBottomToolbar?: boolean;
	enableTopToolbar?: boolean;
	enableGlobalFilter?: boolean;
	enableHiding?: boolean;
	enableDensityToggle?: boolean;
	enableFullScreenToggle?: boolean;
	enableRowSelection?: boolean;
	enableColumnResizing?: boolean;
	bodyStyles?: any;
	renderRowActionMenuItems?: (props: {
		closeMenu: () => void;
		row: MRT_Row<MRT_RowData>;
		staticRowIndex?: number;
		table: MRT_TableInstance<MRT_RowData>;
	}) => ReactNode[];

	renderRowActions?: (props: {
		cell: MRT_Cell<MRT_RowData, unknown>;
		row: MRT_Row<MRT_RowData>;
		staticRowIndex?: number;
		table: MRT_TableInstance<MRT_RowData>;
	}) => React.ReactNode;

	enableRowActions?: boolean;
	columnPinningLeft?: string[];
	columnVisibility?: any;
	columnPinningRight?: string[];
	rowsPerPageOptions?: number[];
	positionActionsColumn?: 'first' | 'last';
	customToolbar?: ReactNode | ((props: { table: MRT_TableInstance<MRT_RowData> }) => ReactNode);
	customBottomToolbar?: ReactNode | ((props: { table: MRT_TableInstance<MRT_RowData> }) => ReactNode);
	// enableSorting: any,
}
