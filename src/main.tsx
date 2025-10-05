import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './config';
// MUI
import { ThemeProvider, CssBaseline } from '@mui/material';

// Redux
import { Provider as ReduxProvider } from 'react-redux';

// Project files
import App from './App';
import { store } from './store/store';
import theme from './theme'; // Custom MUI theme with Public Sans

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
	<React.StrictMode>
		<MsalProvider instance={msalInstance}>
			<ReduxProvider store={store}>
				<BrowserRouter>
					<ThemeProvider theme={theme}>
						<CssBaseline />
						<App />
					</ThemeProvider>
				</BrowserRouter>
			</ReduxProvider>
		</MsalProvider>
	</React.StrictMode>
);
