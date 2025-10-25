import { Box, Typography, CircularProgress, Fade } from '@mui/material';
import { keyframes } from '@mui/system';

const DisplayError = ({ name }: { name: string }) => {
	return (
		<Fade in={true} timeout={300}>
			<Box
				sx={{
					minHeight: '100vh',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: '#fafafa',
					gap: 2
				}}
			>
				{/* Error icon */}
				<Box
					sx={{
						width: 48,
						height: 48,
						borderRadius: '50%',
						backgroundColor: '#ffebee',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						mb: 1
					}}
				>
					<Typography
						sx={{
							color: '#d32f2f',
							fontSize: '1.5rem',
							fontWeight: 'bold'
						}}
					>
						!
					</Typography>
				</Box>

				{/* Error text */}
				<Typography
					variant="body1"
					sx={{
						color: '#d32f2f',
						fontWeight: 500,
						fontSize: '0.95rem',
						letterSpacing: '0.02em',
						textAlign: 'center'
					}}
				>
					Error loading {name}
				</Typography>
			</Box>
		</Fade>
	);
};

// Keyframe animation for subtle text pulse
const pulseAnimation = keyframes`
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
`;

const Loading = ({ name }: { name: string }) => {
	return (
		<Fade in={true} timeout={300}>
			<Box
				sx={{
					minHeight: '100vh',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: '#fafafa',
					gap: 3
				}}
			>
				{/* Modern circular progress indicator */}
				<CircularProgress
					size={48}
					thickness={3}
					sx={{
						color: '#1976d2',
						'& .MuiCircularProgress-circle': {
							strokeLinecap: 'round'
						}
					}}
				/>

				{/* Loading text with subtle animation */}
				<Typography
					variant="body1"
					sx={{
						color: '#666',
						fontWeight: 400,
						fontSize: '0.95rem',
						letterSpacing: '0.02em',
						animation: `${pulseAnimation} 2s ease-in-out infinite`,
						textAlign: 'center'
					}}
				>
					Loading {name}...
				</Typography>
			</Box>
		</Fade>
	);
};
export { Loading, DisplayError };
