import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { masterListCardInset, masterListSummaryShell } from './masterListTokens';

export interface MasterSummaryMetric {
	label: string;
	value: string | number;
	hint?: string;
}

export interface MasterSummaryStripProps {
	metrics: MasterSummaryMetric[];
	sx?: SxProps<Theme>;
}

const MasterSummaryStrip = ({ metrics, sx }: MasterSummaryStripProps) => {
	if (metrics.length === 0) return null;

	const n = metrics.length;

	const shellSx: SxProps<Theme> = themeArg => {
		const base = typeof masterListSummaryShell === 'function' ? masterListSummaryShell(themeArg) : {};
		const extra = typeof sx === 'function' ? sx(themeArg) : sx;
		return { ...base, ...extra };
	};

	return (
		<Box sx={[shellSx] as SxProps<Theme>}>
			<Box
				sx={[
					masterListCardInset,
					{
						display: 'grid',
						gridTemplateColumns: {
							xs: 'repeat(auto-fit, minmax(118px, 1fr))',
							sm: `repeat(${n}, minmax(0, 1fr))`
						},
						columnGap: { xs: 2, sm: 3 },
						rowGap: { xs: 2, sm: 0 },
						alignItems: 'stretch'
					}
				]}
			>
				{metrics.map((m, index) => (
					<Box
						key={`${m.label}-${index}`}
						sx={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'center',
							minHeight: 52
						}}
					>
						<Typography
							variant="overline"
							color="text.secondary"
							sx={{
								fontSize: '0.6875rem',
								fontWeight: 600,
								letterSpacing: '0.08em',
								lineHeight: 1.35,
								textTransform: 'uppercase'
							}}
						>
							{m.label}
						</Typography>
						<Typography
							component="p"
							variant="h6"
							fontWeight={700}
							sx={{
								mt: 0.5,
								mb: 0,
								lineHeight: 1.2,
								color: 'text.primary',
								fontVariantNumeric: 'tabular-nums',
								letterSpacing: '-0.02em'
							}}
						>
							{m.value}
						</Typography>
						{m.hint ? (
							<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.35, opacity: 0.92 }}>
								{m.hint}
							</Typography>
						) : null}
					</Box>
				))}
			</Box>
		</Box>
	);
};

export default MasterSummaryStrip;
