// ==============================|| OVERRIDES - PAPER ||============================== //

export default function Paper() {
	return {
		MuiPaper: {
			styleOverrides: {
				root: {
					borderRadius: '12px',
					background: '#FFF',
					boxShadow: '-4px 4px 24px -1px rgba(0, 0, 0, 0.03)'
				}
			}
		}
	};
}
