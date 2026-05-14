import { Backdrop, Box, CircularProgress, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

export interface FullScreenFormSavingOverlayProps {
	open: boolean;
	/** Short status line shown under the spinner */
	message?: string;
}

/**
 * Full-screen loading veil: soft dim + blur, no chrome — spinner and label sit directly on the overlay
 * (aligned with common minimal patterns: dimmed canvas, light foreground, no floating “card”).
 */
export function FullScreenFormSavingOverlay({ open, message = 'Saving' }: FullScreenFormSavingOverlayProps) {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	// One calm scrim density in both modes so foreground stays consistently light-on-veil.
	const scrimAlpha = isDark ? 0.5 : 0.34;

	return (
		<Backdrop
			open={open}
			transitionDuration={{ enter: 200, exit: 160 }}
			sx={{
				zIndex: theme.zIndex.modal + 2,
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: alpha('#000000', scrimAlpha),
				backdropFilter: 'saturate(1.05) blur(20px)',
				WebkitBackdropFilter: 'saturate(1.05) blur(20px)'
			}}
		>
			<Box
				role="status"
				aria-live="polite"
				aria-busy={open}
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: 2,
					// No panel, border, or shadow — only the indicator stack
					px: 2,
					pointerEvents: 'none'
				}}
			>
				<CircularProgress
					size={32}
					thickness={3}
					disableShrink
					sx={{
						color: alpha('#ffffff', 0.92),
						'& .MuiCircularProgress-circle': {
							strokeLinecap: 'round'
						}
					}}
				/>
				<Typography
					component="p"
					sx={{
						m: 0,
						maxWidth: 'min(18rem, 85vw)',
						color: alpha('#ffffff', 0.72),
						fontWeight: 500,
						fontSize: '0.8125rem',
						lineHeight: 1.45,
						letterSpacing: '0.01em',
						textAlign: 'center'
					}}
				>
					{message}
				</Typography>
			</Box>
		</Backdrop>
	);
}
