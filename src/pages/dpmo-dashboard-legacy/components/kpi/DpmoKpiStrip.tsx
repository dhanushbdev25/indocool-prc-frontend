import { Box, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { type DpmoKpi, formatKpiNumber } from '../../../../store/api/business/dpmo/dpmo.legacy.validators';
import { TruncatedTextWithTooltip } from '../../../dashboard/components/TruncatedTextWithTooltip';

interface DpmoKpiStripProps {
	kpis: DpmoKpi[];
}

const Header = ({ label }: { label: string }) => (
	<TruncatedTextWithTooltip
		text={label}
		variant="caption"
		color="text.secondary"
		lineClamp={2}
		sx={{
			fontWeight: 600,
			fontSize: '0.6875rem',
			lineHeight: 1.35,
			textTransform: 'uppercase',
			letterSpacing: '0.04em'
		}}
	/>
);

const KpiCard = ({ kpi }: { kpi: DpmoKpi }) => {
	const theme = useTheme();
	const cardSx = {
		backgroundColor: 'background.paper',
		borderRadius: '10px',
		border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
		px: { xs: 1.5, sm: 2 },
		py: { xs: 1.25, sm: 1.5 },
		display: 'flex',
		flexDirection: 'column',
		gap: 0.75,
		minHeight: { xs: 96, sm: 108 },
		height: '100%',
		transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
		'&:hover': {
			borderColor: alpha(theme.palette.primary.main, 0.35),
			boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.08)}`
		}
	} as const;

	if (kpi.kind === 'split') {
		return (
			<Box sx={cardSx}>
				<Header label={kpi.label} />
				<Stack spacing={0.25} sx={{ mt: 0.25 }}>
					{kpi.items.map(item => (
						<Stack key={item.label} direction="row" alignItems="baseline" spacing={1.5}>
							<Typography
								sx={{
									fontSize: '0.6875rem',
									fontWeight: 600,
									color: 'text.secondary',
									minWidth: 64,
									textTransform: 'uppercase',
									letterSpacing: '0.04em'
								}}
							>
								{item.label}
							</Typography>
							<Typography
								sx={{
									fontWeight: 700,
									fontVariantNumeric: 'tabular-nums',
									color: 'text.primary',
									fontSize: '1.0625rem',
									lineHeight: 1.2
								}}
							>
								{formatKpiNumber(item.value, kpi.format)}
							</Typography>
						</Stack>
					))}
				</Stack>
			</Box>
		);
	}

	return (
		<Box sx={cardSx}>
			<Header label={kpi.label} />
			<Typography
				sx={{
					fontWeight: 700,
					fontVariantNumeric: 'tabular-nums',
					color: 'text.primary',
					fontSize: { xs: '1.25rem', sm: '1.375rem' },
					lineHeight: 1.15,
					letterSpacing: '-0.02em'
				}}
			>
				{kpi.value === null ? '—' : formatKpiNumber(kpi.value, kpi.format)}
			</Typography>
		</Box>
	);
};

export const DpmoKpiStrip = ({ kpis }: DpmoKpiStripProps) => {
	if (kpis.length === 0) return null;

	return (
		<Box
			sx={{
				display: 'grid',
				gridTemplateColumns: {
					xs: 'repeat(2, minmax(0, 1fr))',
					sm: 'repeat(2, minmax(0, 1fr))',
					md: 'repeat(4, minmax(0, 1fr))',
					lg: `repeat(${Math.min(kpis.length, 5)}, minmax(0, 1fr))`
				},
				gap: { xs: 1.25, sm: 1.5 }
			}}
		>
			{kpis.map(kpi => (
				<KpiCard key={kpi.key} kpi={kpi} />
			))}
		</Box>
	);
};
