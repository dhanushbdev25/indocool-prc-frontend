import { Box, Typography } from '@mui/material';
import { InsertChartOutlined } from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

interface ReportEmptyPromptProps {
	title?: string;
	message?: string;
}

export const ReportEmptyPrompt = ({
	title = 'No report generated',
	message = 'Choose a date range and click Generate report to view results.'
}: ReportEmptyPromptProps) => {
	const theme = useTheme();
	const accent = theme.palette.primary.main;
	return (
		<Box
			sx={{
				backgroundColor: 'background.paper',
				border: `1px solid ${theme.palette.divider}`,
				borderRadius: '12px',
				boxShadow:
					theme.palette.mode === 'dark'
						? 'none'
						: `0 1px 0 ${alpha(theme.palette.common.black, 0.04)}, 0 1px 3px ${alpha(theme.palette.common.black, 0.05)}`,
				py: { xs: 6, sm: 8 },
				px: 3,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				textAlign: 'center',
				gap: 1.5
			}}
		>
			<Box
				sx={{
					width: 56,
					height: 56,
					borderRadius: '50%',
					display: 'inline-flex',
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: alpha(accent, theme.palette.mode === 'dark' ? 0.16 : 0.08),
					color: accent,
					mb: 0.5
				}}
				aria-hidden
			>
				<InsertChartOutlined sx={{ fontSize: 28 }} />
			</Box>
			<Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1rem', letterSpacing: '-0.01em' }}>
				{title}
			</Typography>
			<Typography
				variant="body2"
				color="text.secondary"
				sx={{ maxWidth: 380, lineHeight: 1.55 }}
			>
				{message}
			</Typography>
		</Box>
	);
};
