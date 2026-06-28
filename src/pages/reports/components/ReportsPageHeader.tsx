import { Box, Typography } from '@mui/material';

export const ReportsPageHeader = () => (
	<Box sx={{ mb: 2.5 }}>
		<Typography
			component="h1"
			variant="h5"
			sx={{ fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.25, color: 'text.primary' }}
		>
			Reports
		</Typography>
	</Box>
);
