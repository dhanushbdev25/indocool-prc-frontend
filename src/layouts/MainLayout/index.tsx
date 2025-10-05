import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
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

const MainLayout: React.FC = () => {
	const theme = useTheme();
	const matchDownLG = useMediaQuery(theme.breakpoints.down('lg'));
	const [open, setOpen] = useState(true);

	useEffect(() => {
		setOpen(!matchDownLG);
	}, [matchDownLG]);

	const token = Cookie.getToken();
	const { data, isLoading, isError, errorMessage } = useSessionContextQuery(token);

	if (isLoading) return <BackdropLoader openStates={isLoading} />;
	if (isError || !data) return <SessionError errMsg={errorMessage} />;

	const handleDrawerToggle = () => {
		setOpen(!open);
	};

	return (
		<RoleProvider sessionData={data}>
			<MainLayoutContent 
				open={open} 
				handleDrawerToggle={handleDrawerToggle} 
				data={data}
			/>
		</RoleProvider>
	);
};

const MainLayoutContent: React.FC<{
	open: boolean;
	handleDrawerToggle: () => void;
	data: unknown;
}> = ({ open, handleDrawerToggle, data }) => {
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
			
			<Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden', pt: '64px' }}>
				<Drawer open={open} handleDrawerToggle={handleDrawerToggle} permissions={permissions} />
				<Box
					component="main"
					sx={{
						flexGrow: 1,
						height: 'calc(100vh - 64px)',
						overflow: 'hidden',
						display: 'flex',
						flexDirection: 'column',
						backgroundColor: '#fafafa',
						transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
					}}
				>
					<Box
						sx={{
							flexGrow: 1,
							overflow: 'auto',
							p: { xs: 2, sm: 3 },
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
						<Outlet context={data} />
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default MainLayout;
