import { forwardRef, ReactNode } from 'react';

// material-ui
import { Fade, Box, Grow } from '@mui/material';

interface TransitionsProps {
	children: ReactNode;
	type?: 'grow' | 'fade' | 'collapse' | 'slide' | 'zoom';
	position?: 'top-left' | 'top-right' | 'top' | 'bottom-left' | 'bottom-right' | 'bottom';
}

// ==============================|| TRANSITIONS ||============================== //

const Transitions = forwardRef<HTMLDivElement, TransitionsProps>(({ children, type = 'grow', ...others }, ref) => {
	const positionSX = {
		transformOrigin: '0 0 0'
	};

	return (
		<Box ref={ref}>
			{type === 'grow' && (
				<Grow {...others}>
					<Box sx={positionSX}>{children}</Box>
				</Grow>
			)}
			{type === 'fade' && (
				<Fade
					{...others}
					timeout={{
						appear: 0,
						enter: 300,
						exit: 150
					}}
				>
					<Box sx={positionSX}>{children}</Box>
				</Fade>
			)}
		</Box>
	);
});

export default Transitions;
