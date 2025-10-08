// ==============================|| OVERRIDES - SCROLLBAR ||============================== //

export default function ScrollBar() {
	return {
		MuiCssBaseline: {
			styleOverrides: {
				body: {
					'&::-webkit-scrollbar': {
						backgroundColor: 'transparent'
					},
					'&::-webkit-scrollbar:vertical': {
						width: 'auto'
					},
					'&::-webkit-scrollbar-thumb:vertical': {
						backgroundColor: 'initial',
						border: 'none'
					}
				}
			}
		}
	};
}
