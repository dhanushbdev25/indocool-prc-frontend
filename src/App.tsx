import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useRoutes } from 'react-router-dom';

// project import
import ThemeCustomization from './themes';
import ScrollTop from './components/common/ScrollTop';

import './App.css';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useAuthRoutes } from './hooks/useAuthRoutes';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './config';

// Extend Day.js with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Set default timezone
dayjs.tz.setDefault('Africa/Lagos');

// ==============================|| APP - THEME, ROUTER, LOCAL  ||============================== //

const App = () => {
	return (
		<ThemeCustomization>
			<LocalizationProvider dateAdapter={AdapterDayjs}>
				<MsalProvider instance={msalInstance}>
					<ScrollTop>
						<Routes />
					</ScrollTop>
				</MsalProvider>
			</LocalizationProvider>
		</ThemeCustomization>
	);
};

const Routes = () => {
	const r = useAuthRoutes();
	console.log('routessssssssssssssssssssss', r);
	return useRoutes(r);
};

export default App;
