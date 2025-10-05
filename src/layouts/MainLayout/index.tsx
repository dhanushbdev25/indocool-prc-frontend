import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Box, useMediaQuery } from '@mui/material';
import Drawer from './Drawer';
import Cookie from '../../utils/Cookie';
import { useSessionContextQuery } from '../../store/api/auth/sessionApi';
import BackdropLoader from '../../components/third-party/BackdropLoader';
import SessionError from '../../pages/general/SessionError';

const MainLayout: any = () => {
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
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				height: '100vh',
				backgroundColor: '#F0F0F0 !important'
			}}
		>
			<Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
				<Drawer open={open} handleDrawerToggle={handleDrawerToggle} permissions={data.permissions} />
				<Box
					component="main"
					sx={{
						width: '100%',
						height: '100vh',
						overflow: 'hidden',
						display: 'flex',
						flexDirection: 'column'
					}}
				>
					<Box
						sx={{
							flexGrow: 1,
							overflow: 'auto'
							// padding: '1%'
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
