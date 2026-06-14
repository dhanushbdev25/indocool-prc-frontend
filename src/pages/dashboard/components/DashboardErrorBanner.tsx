import { Alert, Box, Button } from '@mui/material';

interface DashboardErrorBannerProps {
	onRetry: () => void;
}

export const DashboardErrorBanner = ({ onRetry }: DashboardErrorBannerProps) => (
	<Box sx={{ mb: 2 }}>
		<Alert
			severity="error"
			action={
				<Button color="inherit" size="small" onClick={onRetry}>
					Retry
				</Button>
			}
		>
			Failed to load dashboard data. Please try again.
		</Alert>
	</Box>
);
