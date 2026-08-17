import { Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import {
	formatPercentage,
	type MetricBlock
} from '../../../../store/api/business/dashboard/dashboard.validators';
import { analyticsMetricCard } from '../../constants/dashboardTokens';
import { TruncatedTextWithTooltip } from '../TruncatedTextWithTooltip';

interface MetricDonutCardProps {
	title: string;
	/** Metrics for exactly the applied date range. */
	selected: MetricBlock;
	/** Metrics for the applied range widened 90 days into the past. */
	extended: MetricBlock;
}

interface RangeDonutProps {
	caption: string;
	metric: MetricBlock;
	/** The extended range is the comparison figure, so it renders in a muted tone. */
	muted?: boolean;
}

const RangeDonut = ({ caption, metric, muted = false }: RangeDonutProps) => {
	const theme = useTheme();
	const hasData = metric.total > 0 || metric.completed > 0;
	const displayPct = hasData ? formatPercentage(metric.percentage) : '—';
	const fillPct = hasData ? Math.min(Math.max(metric.percentage, 0), 100) : 0;
	const arcColor = muted ? alpha(theme.palette.primary.main, 0.55) : theme.palette.primary.main;

	const donutData = [
		{ name: 'completed', value: fillPct },
		{ name: 'remaining', value: Math.max(100 - fillPct, 0) }
	];

	return (
		<Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
			<Box sx={{ position: 'relative', width: '100%', height: { xs: 68, sm: 78 }, flexShrink: 0 }}>
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Pie
							data={donutData}
							cx="50%"
							cy="50%"
							innerRadius="72%"
							outerRadius="92%"
							startAngle={90}
							endAngle={-270}
							dataKey="value"
							stroke="none"
						>
							<Cell fill={hasData ? arcColor : theme.palette.action.disabledBackground} />
							<Cell fill={alpha(theme.palette.primary.main, 0.1)} />
						</Pie>
					</PieChart>
				</ResponsiveContainer>
				<Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<Typography
						variant="body2"
						sx={{
							fontWeight: 700,
							color: 'text.primary',
							fontSize: { xs: '0.8rem', sm: '0.875rem' },
							fontVariantNumeric: 'tabular-nums'
						}}
					>
						{displayPct}
					</Typography>
				</Box>
			</Box>

			<Typography
				variant="caption"
				sx={{
					mt: 0.75,
					fontWeight: 600,
					fontVariantNumeric: 'tabular-nums',
					fontSize: '0.625rem',
					color: 'text.secondary',
					textAlign: 'center'
				}}
			>
				<Box component="span" sx={{ color: 'success.main' }}>
					{metric.completed.toLocaleString('en-IN')}
				</Box>
				<Box component="span" sx={{ color: 'text.disabled', mx: 0.35 }}>
					/
				</Box>
				<Box component="span" sx={{ color: 'text.primary' }}>
					{metric.total.toLocaleString('en-IN')}
				</Box>
			</Typography>

			<Typography
				variant="caption"
				sx={{
					mt: 0.25,
					fontSize: '0.5625rem',
					fontWeight: 600,
					letterSpacing: '0.03em',
					textTransform: 'uppercase',
					color: 'text.disabled',
					textAlign: 'center'
				}}
			>
				{caption}
			</Typography>
		</Box>
	);
};

export const MetricDonutCard = ({ title, selected, extended }: MetricDonutCardProps) => (
	<Box sx={analyticsMetricCard}>
		<TruncatedTextWithTooltip
			text={title}
			variant="caption"
			color="text.secondary"
			lineClamp={2}
			sx={{
				fontWeight: 600,
				textAlign: 'center',
				mb: 1,
				fontSize: '0.6875rem',
				lineHeight: 1.35,
				minHeight: '2.7em',
				width: '100%'
			}}
		/>

		<Box sx={{ display: 'flex', width: '100%', gap: 1, alignItems: 'flex-start' }}>
			<RangeDonut caption="Selected range" metric={selected} />
			<RangeDonut caption="Extended range" metric={extended} muted />
		</Box>
	</Box>
);
