import { Typography, Button, Container } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useLogout } from '../../hooks/useLogOut';

const SessionError = ({ errMsg }: { errMsg?: string | null }) => {
	const logout = useLogout();
	return (
		<Container maxWidth="sm" sx={{ textAlign: 'center', py: 10 }}>
			<ErrorOutlineIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
			<Typography variant="h4" gutterBottom>
				Session Failed/Expired
			</Typography>
			<Typography variant="h6" color="text.secondary">
				{errMsg ?? 'Your session has ended or is invalid. Please log in again to continue.'}
			</Typography>
			<Button variant="contained" onClick={logout} sx={{ mt: 4 }}>
				Login Again
			</Button>
		</Container>
	);
};

export default SessionError;
