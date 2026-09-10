import { Box, Grid, Skeleton, Stack } from '@mui/material';
import { analyticsPageGap, analyticsPanel, analyticsPanelBody } from '../../dashboard/constants/dashboardTokens';

const ChartCardSkeleton = () => (
	<Box sx={analyticsPanel}>
		<Box sx={analyticsPanelBody}>
			<Skeleton variant="text" width="55%" height={20} sx={{ mb: 2 }} />
			<Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 1.5 }} />
		</Box>
	</Box>
);

// Mirrors DpmoKpiStrip's grid so the strip doesn't shift the page in when it loads.
const KpiStripSkeleton = ({ cards }: { cards: number }) => (
	<Box
		sx={{
			display: 'grid',
			gridTemplateColumns: {
				xs: 'repeat(2, minmax(0, 1fr))',
				sm: 'repeat(2, minmax(0, 1fr))',
				md: 'repeat(4, minmax(0, 1fr))',
				lg: `repeat(${cards}, minmax(0, 1fr))`
			},
			gap: { xs: 1.25, sm: 1.5 }
		}}
	>
		{Array.from({ length: cards }).map((_, i) => (
			<Skeleton key={i} variant="rounded" height={108} sx={{ borderRadius: '10px' }} />
		))}
	</Box>
);

const SectionSkeleton = ({ charts }: { charts: number }) => (
	<Box>
		<Skeleton variant="text" width={160} height={22} sx={{ mb: 0.75 }} />
		<Skeleton variant="text" width={340} height={16} sx={{ mb: 2 }} />
		<Grid container spacing={2}>
			{Array.from({ length: charts }).map((_, i) => (
				<Grid key={i} size={{ xs: 12, md: 6, xl: 4 }}>
					<ChartCardSkeleton />
				</Grid>
			))}
		</Grid>
	</Box>
);

// Covers the tab body only — DpmoDashboard renders the title and tab bar immediately.
export const DpmoSkeleton = () => (
	<Box sx={{ minWidth: 0 }}>
		<Box sx={{ pb: 2.5, mb: 0.5 }}>
			<Skeleton variant="rounded" width="100%" height={132} sx={{ borderRadius: '12px' }} />
		</Box>

		<Stack spacing={analyticsPageGap}>
			<KpiStripSkeleton cards={5} />
			<SectionSkeleton charts={6} />
			<SectionSkeleton charts={5} />
			<SectionSkeleton charts={3} />
		</Stack>
	</Box>
);
