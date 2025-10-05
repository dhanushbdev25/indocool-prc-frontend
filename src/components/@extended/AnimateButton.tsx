import { ButtonBase } from '@mui/material';

type AnimateButtonProps = {
	children: React.ReactNode;
	type?: 'slide' | 'scale' | 'rotate';
};

export default function AnimateButton({ children, type = 'scale' }: Readonly<AnimateButtonProps>) {
	const animationStyles = {
		scale: {
			transition: 'transform 0.15s ease-in-out',
			'&:hover': { transform: 'scale(1.05)' },
			'&:active': { transform: 'scale(0.95)' }
		},
		rotate: {
			transition: 'transform 0.2s ease-in-out',
			'&:hover': { transform: 'rotate(5deg)' },
			'&:active': { transform: 'rotate(-5deg)' }
		},
		slide: {
			transition: 'transform 0.2s ease-in-out',
			'&:hover': { transform: 'translateY(-2px)' },
			'&:active': { transform: 'translateY(0)' }
		}
	};

	return (
		<ButtonBase sx={animationStyles[type] || animationStyles.scale} disableRipple>
			{children}
		</ButtonBase>
	);
}
