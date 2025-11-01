import { useState, useMemo, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Box, useMediaQuery } from '@mui/material';
import Drawer from './Drawer';
import Cookie from '../../utils/Cookie';
import { useSessionContextQuery } from '../../store/api/auth/session.api';
import BackdropLoader from '../../components/third-party/BackdropLoader';
import SessionError from '../../pages/general/SessionError';
import { RoleProvider } from '../../contexts/RoleContext';
import { useRole } from '../../contexts/useRole';
import ModernTopBar from '../../components/common/TopBar/ModernTopBar';
import Breadcrumbs from '../../components/common/breadcrumbs/Breadcrumbs';

const MainLayout = () => {
	const theme = useTheme();
	const matchDownLG = useMediaQuery(theme.breakpoints.down('lg'));

	// Use derived state for drawer open/closed based on screen size
	const shouldBeOpen = useMemo(() => {
		// On desktop (lg and above), drawer should be open by default
		// On tablets/mobile (lg and below), drawer should be collapsed by default
		return !matchDownLG;
	}, [matchDownLG]);

	// For manual toggling, we'll use a separate state
	const [manuallyToggled, setManuallyToggled] = useState(false);

	// Determine final drawer state
	const drawerOpen = manuallyToggled ? !shouldBeOpen : shouldBeOpen;

	const token = Cookie.getToken();

	useEffect(() => {
		if (localStorage.getItem('isLoggedIn') !== 'true') {
			window.location.href = '/';
		}
	}, [token]);

	const { data, isLoading, isError, errorMessage } = useSessionContextQuery(token);

	if (isLoading) return <BackdropLoader openStates={isLoading} />;
	if (isError || !data) return <SessionError errMsg={errorMessage} />;

	const handleDrawerToggle = () => {
		setManuallyToggled(!manuallyToggled);
	};

	return (
		<RoleProvider sessionData={data}>
			<MainLayoutContent open={drawerOpen} handleDrawerToggle={handleDrawerToggle} data={data} />
		</RoleProvider>
	);
};

const MainLayoutContent = ({
	open,
	handleDrawerToggle,
	data
}: {
	open: boolean;
	handleDrawerToggle: () => void;
	data: unknown;
}) => {
	const { getCurrentPermissions } = useRole();
	const permissions = getCurrentPermissions();

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				height: '100vh',
				backgroundColor: '#fafafa'
			}}
		>
			{/* Modern Top Bar */}
			<ModernTopBar onMenuToggle={handleDrawerToggle} drawerOpen={open} />

			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: open ? '240px 1fr' : { xs: '57px 1fr', sm: '65px 1fr' },
					flexGrow: 1,
					overflow: 'hidden',
					pt: '64px',
					transition: 'grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
				}}
			>
				<Drawer open={open} handleDrawerToggle={handleDrawerToggle} permissions={permissions} />
				<Box
					component="main"
					sx={{
						height: 'calc(100vh - 64px)',
						overflow: 'hidden',
						display: 'flex',
						flexDirection: 'column',
						backgroundColor: '#fafafa'
					}}
				>
					<Box
						sx={{
							flexGrow: 1,
							overflow: 'auto',
							p: { xs: 2, sm: 2.5, md: 3 },
							'&::-webkit-scrollbar': {
								width: '6px'
							},
							'&::-webkit-scrollbar-track': {
								backgroundColor: 'transparent'
							},
							'&::-webkit-scrollbar-thumb': {
								backgroundColor: 'rgba(0, 0, 0, 0.2)',
								borderRadius: '3px',
								'&:hover': {
									backgroundColor: 'rgba(0, 0, 0, 0.3)'
								}
							}
						}}
					>
						<Breadcrumbs permissions={permissions} />
						<Outlet context={data} />
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default MainLayout;
