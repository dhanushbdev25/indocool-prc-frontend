import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface DefaultStepItemProps {
	stepNumber: number;
	stepName: string;
	stepDescription: string;
}

const DefaultStepItem: React.FC<DefaultStepItemProps> = ({ stepNumber, stepName, stepDescription }) => {
	return (
		<Paper
			elevation={0}
			sx={{
				p: 2,
				mb: 2,
				border: '1px solid #e0e0e0',
				borderRadius: 2,
				backgroundColor: '#f8f9fa',
				position: 'relative'
			}}
		>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
				{/* Step Number */}
				<Box
					sx={{
						width: 32,
						height: 32,
						borderRadius: '50%',
						backgroundColor: '#6c757d',
						color: 'white',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontWeight: 'bold',
						fontSize: '0.9rem'
					}}
				>
					{stepNumber}
				</Box>

				{/* Step Info */}
				<Box sx={{ flex: 1 }}>
					<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
						{stepName}
					</Typography>
					<Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
						{stepDescription}
					</Typography>
				</Box>

				{/* Default Badge */}
				<Box
					sx={{
						px: 1.5,
						py: 0.5,
						backgroundColor: '#e9ecef',
						borderRadius: 1,
						border: '1px solid #dee2e6'
					}}
				>
					<Typography variant="caption" sx={{ color: '#6c757d', fontWeight: 500 }}>
						Default
					</Typography>
				</Box>
			</Box>
		</Paper>
	);
};

export default DefaultStepItem;
