import { Box, Typography } from '@mui/material';

const PrcExecutionHeader = () => {
	return (
		<Box sx={{ mb: 4 }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
				<Box>
					<Typography
						variant="h3"
						sx={{
							fontWeight: 600,
							color: '#333',
							mb: 1,
							fontSize: '2rem'
						}}
					>
						PRC Execution
					</Typography>
					<Typography
						variant="body1"
						sx={{
							color: '#666',
							fontSize: '1rem',
							fontWeight: 400
						}}
					>
						Manage and monitor production run control executions
					</Typography>
				</Box>
			</Box>
		</Box>
	);
};

export default PrcExecutionHeader;
