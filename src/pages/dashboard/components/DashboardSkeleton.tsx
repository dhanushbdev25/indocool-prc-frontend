import { Box, Grid, Skeleton, Stack } from '@mui/material';
import {
	analyticsMetricGrid,
	analyticsPanel,
	analyticsPanelBody,
	analyticsPanelHeader,
	analyticsPageGap
} from '../constants/dashboardTokens';

const KpiCardSkeleton = () => (
	<Box
		sx={{
			border: 1,
			borderColor: 'divider',
			borderRadius: '10px',
			backgroundColor: 'background.paper',
			p: 1.5,
			minHeight: 168,
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			gap: 1
		}}
	>
		<Skeleton variant="text" width="80%" height={14} />
		<Skeleton variant="circular" width={72} height={72} />
		<Skeleton variant="text" width="50%" height={12} />
	</Box>
);

const KpiPanelSkeleton = () => (
	<Box sx={analyticsPanel}>
		<Box sx={analyticsPanelHeader}>
			<Box sx={{ width: '100%' }}>
				<Skeleton variant="text" width={180} height={22} />
				<Skeleton variant="text" width="60%" height={16} sx={{ mt: 0.75 }} />
			</Box>
		</Box>
		<Box sx={analyticsPanelBody}>
			<Box sx={analyticsMetricGrid}>
				{Array.from({ length: 8 }).map((_, i) => (
					<KpiCardSkeleton key={i} />
				))}
			</Box>
		</Box>
	</Box>
);

const ChartCardSkeleton = () => (
	<Box sx={analyticsPanel}>
		<Box sx={[analyticsPanelBody, { height: 360 }]}>
			<Skeleton variant="text" width="55%" height={20} sx={{ mb: 2 }} />
			<Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 1.5 }} />
		</Box>
	</Box>
);

export const DashboardSkeleton = () => (
	<Box component="article" sx={{ minWidth: 0, pb: { xs: 2, sm: 3 } }}>
		<Box sx={{ pb: 2.5, mb: 0.5, borderBottom: 1, borderColor: 'divider' }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
				<Box sx={{ flex: 1, minWidth: 240 }}>
					<Skeleton variant="text" width={260} height={36} />
					<Skeleton variant="text" width={420} height={20} sx={{ mt: 1 }} />
				</Box>
				<Skeleton variant="rounded" width={220} height={36} sx={{ borderRadius: '8px' }} />
			</Box>
		</Box>

		<Stack spacing={analyticsPageGap}>
			<KpiPanelSkeleton />
			<KpiPanelSkeleton />

			<Box>
				<Skeleton variant="text" width={160} height={22} sx={{ mb: 0.75 }} />
				<Skeleton variant="text" width={320} height={16} sx={{ mb: 2 }} />
				<Grid container spacing={2}>
					{Array.from({ length: 3 }).map((_, i) => (
						<Grid key={i} size={{ xs: 12, lg: 4 }}>
							<ChartCardSkeleton />
						</Grid>
					))}
				</Grid>
			</Box>

			<Box>
				<Skeleton variant="text" width={180} height={22} sx={{ mb: 0.75 }} />
				<Skeleton variant="text" width={360} height={16} sx={{ mb: 2 }} />
				<Grid container spacing={2}>
					{Array.from({ length: 6 }).map((_, i) => (
						<Grid key={i} size={{ xs: 12, md: 6, xl: 4 }}>
							<ChartCardSkeleton />
						</Grid>
					))}
				</Grid>
			</Box>
		</Stack>
	</Box>
);
