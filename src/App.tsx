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
					<ScrollTop>
						<Routes />
					</ScrollTop>
			</LocalizationProvider>
		</ThemeCustomization>
	);
};

const Routes = () => {
	const r = useAuthRoutes();
	return useRoutes(r);
};

export default App;
