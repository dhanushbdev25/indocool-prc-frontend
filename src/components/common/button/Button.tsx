import React from 'react';
import { Button as MUIButton, ButtonProps as MUIButtonProps } from '@mui/material';

export type ButtonPropsType = {
	label: string;
	name?: string;
	disableElevation?: boolean;
	size?: 'small' | 'medium' | 'large';
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
	color?: MUIButtonProps['color'];
	variant?: 'text' | 'outlined' | 'contained';
	disabled?: boolean;
	type?: 'button' | 'submit' | 'reset';
	fullWidth?: boolean;
	style?: React.CSSProperties;
	endIcon?: React.ReactNode;
	startIcon?: React.ReactNode;
};

const Button = ({
	color = 'primary',
	variant = 'contained',
	disabled = false,
	style,
	...buttonProps
}: ButtonPropsType) => {
	return (
		<MUIButton color={color} variant={variant} disabled={disabled} style={style} {...buttonProps}>
			{buttonProps.label}
		</MUIButton>
	);
};

export default Button;
