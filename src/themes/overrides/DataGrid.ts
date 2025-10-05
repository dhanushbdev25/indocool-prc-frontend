// ==============================|| OVERRIDES - DATAGRID ||============================== //

export default function DataGrid(theme: any) {
	return {
		MuiDataGrid: {
			styleOverrides: {
				root: {
					// other styles for DataGrid root
				},
				headerCell: {
					fontWeight: 'bold',
					fontSize: '10px'
				},
				cell: {
					// other styles for cells
				}
			}
		},
		// Custom styles for the header class
		customHeaderClass: {
			fontWeight: 'bold' // Make the text bold
		}
	};
}
