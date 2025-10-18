import { Box, Typography, Paper } from '@mui/material';
import { PlayArrow as ExecutionIcon } from '@mui/icons-material';

const ViewPrcExecution = () => {
	return (
		<Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
			<Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
				<ExecutionIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
				<Typography variant="h4" sx={{ color: '#666', mb: 2 }}>
					PRC Execution View
				</Typography>
				<Typography variant="body1" color="textSecondary">
					This screen will contain the step-by-step execution interface for PRC processes. Implementation coming in the
					next phase.
				</Typography>
			</Paper>
		</Box>
	);
};

export default ViewPrcExecution;
