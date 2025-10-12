import { Button, Box, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const InspectionHeader = () => {
	const navigate = useNavigate();

	const handleAddInspection = () => {
		navigate('/inspection-master/create-inspection');
	};

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
						Inspection Master
					</Typography>
					<Typography
						variant="body1"
						sx={{
							color: '#666',
							fontSize: '1rem',
							fontWeight: 400
						}}
					>
						Manage quality inspection procedures and parameter configurations
					</Typography>
				</Box>
				<Button
					variant="contained"
					startIcon={<AddIcon />}
					onClick={handleAddInspection}
					sx={{
						backgroundColor: '#1976d2',
						color: 'white',
						borderRadius: '8px',
						px: 3,
						py: 1.5,
						textTransform: 'none',
						fontSize: '0.875rem',
						fontWeight: 500,
						'&:hover': {
							backgroundColor: '#1565c0'
						}
					}}
				>
					Add Inspection
				</Button>
			</Box>
		</Box>
	);
};

export default InspectionHeader;
