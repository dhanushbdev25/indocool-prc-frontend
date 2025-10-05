import { Grid, Typography, Box, Paper } from '@mui/material';
import AuthLogin from './auth-forms/AuthLogin';
import Logo from '../../components/common/logo/Logo';

const Login = () => (
	<Box
		sx={{
			minHeight: '100vh',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			bgcolor: 'background.default',
			background: 'linear-gradient(135deg, #012B64 0%, #2c8fffff 100%)'
		}}
	>
		<Paper
			elevation={6}
			sx={{
				maxWidth: { xs: 400, lg: 475 },
				width: '100%',
				p: { xs: 2, sm: 3, md: 4, xl: 5 },
				borderRadius: 3,
				textAlign: 'center',
				backgroundColor: 'rgba(255,255,255,0.95)',
				backdropFilter: 'blur(6px)'
			}}
		>
			<Grid container spacing={3} justifyContent="center">
				<Grid item xs={12}>
					<Box display="flex" alignItems="center" justifyContent="center" gap={1}>
						<Logo sx={{ width: 32, height: 32 }} fill="black" />
						<Typography variant="h3" component="h1">
							Digitalisation Portal
						</Typography>
					</Box>
				</Grid>

				<Grid item xs={12}>
					<AuthLogin />
				</Grid>
			</Grid>
		</Paper>
	</Box>
);

export default Login;
