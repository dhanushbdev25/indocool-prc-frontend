import React from 'react';
import { Button as MUIButton } from '@mui/material';
export type ButtonPropsType = {
	label: string;
	name?: string;
	disableElevation?: boolean;
	size?: 'small' | 'medium' | 'large';
	onClick?: any;
	color?: any;
	variant?: 'text' | 'outlined' | 'contained';
	disabled?: boolean;
	type?: 'button' | 'submit' | 'reset';
	fullWidth?: boolean;
	style?: React.CSSProperties;
	endIcon?: any;
	startIcon?: any;
};

const Button: React.FC<ButtonPropsType> = ({
	color = 'primary',
	variant = 'contained',
	disabled = false,
	style,
	...buttonProps
}) => {
	return (
		<MUIButton color={color} variant={variant} disabled={disabled} style={style} {...buttonProps}>
			{buttonProps.label}
		</MUIButton>
	);
};

export default Button;
