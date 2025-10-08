// ==============================|| OVERRIDES - BUTTON ||============================== //

import { Theme } from '@mui/material/styles';

export default function Button(theme: Theme) {
	const disabledStyle = {
		'&.Mui-disabled': {
			backgroundColor: theme.palette.grey[200]
		}
	};

	return {
		MuiButton: {
			styleOverrides: {
				root: {
					fontWeight: 400,
					boxShadow: 'none', // React 19 compatible: use styleOverrides instead of defaultProps
					'&:hover': {
						boxShadow: 'none'
					}
				},
				contained: {
					...disabledStyle
				},
				outlined: {
					...disabledStyle
				}
			}
		}
	};
}
