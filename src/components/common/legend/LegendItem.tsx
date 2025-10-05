import React from 'react';
import { Box, Typography } from '@mui/material';

interface LegendItemProps {
	name: string;
	color: string;
}

const LegendItem: React.FC<LegendItemProps> = ({ name, color }) => (
	<Box
		display="flex"
		alignItems="center"
		justifyContent="flex-end"
		mr={2}
		mb={1}
		sx={{
			textAlign: 'right',
			'@media (max-width:600px)': {
				mb: 0.5
			}
		}}
	>
		<Box width={10} height={10} mr={1} bgcolor={color} borderRadius={0} />
		<Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555' }}>
			{name}
		</Typography>
	</Box>
);

export default LegendItem;
