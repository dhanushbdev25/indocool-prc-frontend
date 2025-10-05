import React from 'react';
import Button from '@mui/material/Button';

export type ButtonProps = {
	label: string;
	onClick?: any;
	color?: any;
	variant?: 'text' | 'outlined' | 'contained';
	disabled?: boolean;
	type?: 'button' | 'submit' | 'reset';
	fullWidth?: boolean;
	style?: React.CSSProperties;
};

const CustomButton: React.FC<ButtonProps> = ({
	label,
	onClick,
	color = 'primary',
	variant = 'contained',
	disabled = false,
	type,
	fullWidth,
	style,
	...muiProps
}) => {
	return (
		<Button
			onClick={onClick}
			color={color}
			variant={variant}
			disabled={disabled}
			type={type}
			fullWidth={fullWidth}
			style={style}
			{...muiProps}
		>
			{label}
		</Button>
	);
};

export default CustomButton;
