import { Typography, Box, Paper, Container, Link } from '@mui/material';
import AuthLogin from './auth-forms/AuthLogin';
import Logo from '../../components/common/logo/Logo';

const Login = () => {
	return (
		<Box
			sx={{
				minHeight: '100vh',
				display: 'flex',
				flexDirection: 'column',
				position: 'relative',
				overflow: 'hidden',
				background: '#ffffff',
				'&::before': {
					content: '""',
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: `
						radial-gradient(circle at 20% 80%, rgba(138, 165, 203, 0.03) 0%, transparent 50%),
						radial-gradient(circle at 80% 20%, rgba(87, 104, 128, 0.04) 0%, transparent 50%),
						radial-gradient(circle at 40% 40%, rgba(58, 77, 104, 0.02) 0%, transparent 50%)
					`,
					zIndex: 0
				}
			}}
		>
			{/* Header with Logo */}
			<Box
				sx={{
					position: 'absolute',
					top: 24,
					left: 24,
					display: 'flex',
					alignItems: 'center',
					gap: 1,
					zIndex: 2
				}}
			>
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: 32,
						height: 32,
					}}
				>
					<Logo sx={{ width: 18, height: 18 }} fill="black" />
				</Box>
				<Typography
					variant="h6"
					component="h1"
					sx={{
						fontWeight: 700,
						color: '#1a1a1a',
						letterSpacing: '-0.01em'
					}}
				>
					{process.env.VITE_APP_NAME}
				</Typography>
			</Box>

			{/* Main Content */}
			<Box
				sx={{
					flex: 1,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					position: 'relative',
					zIndex: 1,
					px: 2
				}}
			>
				<Container
					maxWidth="sm"
					sx={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center'
					}}
				>
					<Paper
						elevation={0}
						sx={{
							width: '100%',
							maxWidth: 480,
							p: { xs: 3, sm: 4 },
							borderRadius: 2,
							backgroundColor: '#ffffff',
							border: '1px solid rgba(0, 0, 0, 0.05)',
							boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
							transition: 'all 0.2s ease',
							'&:hover': {
								boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
							}
						}}
					>
						{/* Header */}
						<Box sx={{ mb: 3 }}>
							<Typography
								variant="h4"
								component="h1"
								sx={{
									fontWeight: 700,
									color: '#1a1a1a',
									mb: 1
								}}
							>
								Login
							</Typography>
						</Box>

						{/* Form */}
						<AuthLogin />
					</Paper>
				</Container>
			</Box>

			{/* Footer */}
			<Box
				sx={{
					position: 'absolute',
					bottom: 24,
					left: 24,
					right: 24,
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					zIndex: 2
				}}
			>
				<Typography
					variant="caption"
					sx={{
						color: '#9ca3af',
						fontSize: '0.75rem'
					}}
				>
					© powered by{' '}
					<Link
						href="#"
						sx={{
							color: '#0D5FDC',
							textDecoration: 'none',
							'&:hover': {
								textDecoration: 'underline'
							}
						}}
					>
						Digital Garage
					</Link>
				</Typography>
				<Link
					href="#"
					sx={{
						color: '#9ca3af',
						textDecoration: 'none',
						fontSize: '0.75rem',
						'&:hover': {
							textDecoration: 'underline'
						}
					}}
				>
					Terms and Conditions
				</Link>
			</Box>
		</Box>
	);
};

export default Login;
