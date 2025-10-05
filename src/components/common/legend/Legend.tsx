import React from 'react';
import { Box } from '@mui/material';
import LegendItem from './LegendItem';

interface LegendProps {
	items: { name: string; color: string }[];
}

const Legend: React.FC<LegendProps> = ({ items }) => (
	<Box
		display="flex"
		flexWrap="wrap"
		justifyContent="flex-end"
		// p={2}
		sx={{
			overflow: 'hidden'
		}}
	>
		{items.map(item => (
			<LegendItem key={item.name} name={item.name} color={item.color} />
		))}
	</Box>
);

export default Legend;
