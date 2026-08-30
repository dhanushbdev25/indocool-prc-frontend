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

export const DpmoSkeleton = () => (
	<Box component="article" sx={{ minWidth: 0, pb: { xs: 2, sm: 3 } }}>
		<Box sx={{ pb: 2.5, mb: 0.5, borderBottom: 1, borderColor: 'divider' }}>
			<Skeleton variant="text" width={260} height={36} />
			<Skeleton variant="text" width={420} height={20} sx={{ mt: 1 }} />
			<Skeleton variant="rounded" width="100%" height={132} sx={{ mt: 2, borderRadius: '12px' }} />
		</Box>

		<Stack spacing={analyticsPageGap}>
			<SectionSkeleton charts={6} />
			<SectionSkeleton charts={5} />
			<SectionSkeleton charts={3} />
		</Stack>
	</Box>
);
