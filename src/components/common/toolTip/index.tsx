import { ThemeProvider, Tooltip, createTheme } from '@mui/material';
import { ToolTipProps } from '../../../common/types/ToolTipTypes';
const theme = createTheme({
	components: {
		MuiTooltip: {
			styleOverrides: {
				tooltip: {
					fontSize: '13px',
					color: '#2E2C5E',
					backgroundColor: 'white'
				}
			}
		}
	}
});

export const CustomTooltip = (props: ToolTipProps) => (
	<ThemeProvider theme={theme}>
		<Tooltip title={props.title} placement={'top'}>
			{props?.children}
		</Tooltip>
	</ThemeProvider>
);
