import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './config';

// Redux
import { Provider as ReduxProvider } from 'react-redux';

// Project files
import App from './App';
import { store } from './store/store';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
	<React.StrictMode>
		<MsalProvider instance={msalInstance}>
			<ReduxProvider store={store}>
				<BrowserRouter>
					<App />
				</BrowserRouter>
			</ReduxProvider>
		</MsalProvider>
	</React.StrictMode>
);
