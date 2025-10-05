export default function ScrollBar(theme: any) {
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
