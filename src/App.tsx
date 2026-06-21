import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useRoutes } from 'react-router-dom';

// project import
import ThemeCustomization from './themes';
import ScrollTop from './components/common/ScrollTop';

import './App.css';
import './utils/dayjsSetup';
import { useAuthRoutes } from './hooks/useAuthRoutes';

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
