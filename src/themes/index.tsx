import { useMemo, ReactNode } from 'react';

// material-ui
import { CssBaseline, StyledEngineProvider } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// project import
import Palette from './palette';
import Typography from './typography';
import CustomShadows from './shadows';
import componentsOverride from './overrides';

// ==============================|| DEFAULT THEME - MAIN  ||============================== //

interface ThemeCustomizationProps {
	children: ReactNode;
}

export default function ThemeCustomization({ children }: ThemeCustomizationProps) {
	const theme = Palette('light');
	const themeTypography = Typography(`'Poppins', sans-serif`);
	const themeCustomShadows = useMemo(() => CustomShadows(theme), [theme]);

	const themeOptions = useMemo(
		() => ({
			breakpoints: {
				values: {
					xs: 0,
					sm: 768,
					md: 1024,
					lg: 1266,
					xl: 1536
				}
			},
			direction: 'ltr' as const,
			mixins: {
				toolbar: {
					minHeight: 60,
					paddingTop: 8,
					paddingBottom: 8
				}
			},
			palette: theme.palette,
			customShadows: themeCustomShadows,
			typography: themeTypography,
			components: componentsOverride(theme)
		}),
		[theme, themeTypography, themeCustomShadows]
	);

	const themes = createTheme(themeOptions);

	return (
		<StyledEngineProvider injectFirst>
			<ThemeProvider theme={themes}>
				<CssBaseline />
				{children}
			</ThemeProvider>
		</StyledEngineProvider>
	);
}
