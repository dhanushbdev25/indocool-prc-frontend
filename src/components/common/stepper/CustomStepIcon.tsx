import React from 'react';
import { StepIconProps } from '@mui/material/StepIcon';
import { Code } from '@mui/icons-material'; // </> icon

const CustomStepIcon: React.FC<StepIconProps> = ({ active, completed, icon }) => {
	return (
		<div
			style={{
				backgroundColor: active ? '#1976d2' : completed ? '#4caf50' : '#e0e0e0',
				color: 'white',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				borderRadius: '50%',
				width: 32,
				height: 32,
				fontSize: 18,
				transition: '0.3s'
			}}
		>
			{/* {icon="http://www.w3.org/2000/svg"} if any icon */}
			<Code fontSize="small" />
		</div>
	);
};

export default CustomStepIcon;
