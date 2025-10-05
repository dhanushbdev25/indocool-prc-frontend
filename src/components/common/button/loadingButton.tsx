import React from 'react';
import { Button, CircularProgress, ButtonProps } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

export type CustomButtonProps = {
	label?: string;
	loading?: boolean;
} & Omit<ButtonProps, 'startIcon'>;

const CustomLoadingButton: React.FC<CustomButtonProps> = ({
	label,
	onClick,
	color = 'primary',
	variant = 'contained',
	disabled = false,
	type,
	fullWidth,
	style,
	children,
	loading = false,
	...muiProps
}) => {
	return (
		<Button
			color={color}
			onClick={onClick}
			variant={variant}
			disabled={disabled || loading}
			type={type}
			fullWidth={fullWidth}
			style={style}
			startIcon={!loading && <SaveIcon />}
			{...muiProps}
		>
			{loading && <CircularProgress size={20} color="inherit" style={{ marginRight: 8 }} />}
			{children || label}
		</Button>
	);
};

export default CustomLoadingButton;
