import { Box, Card, CardContent, Skeleton, Grid } from '@mui/material';

const SummaryCardSkeleton = () => (
	<Card
		sx={{
			flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', lg: '1 1 calc(25% - 18px)' },
			minWidth: { xs: '100%', sm: '200px' },
			borderRadius: '12px',
			boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
			backgroundColor: 'white'
		}}
	>
		<CardContent sx={{ p: 3 }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
				<Box sx={{ flex: 1 }}>
					<Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
					<Skeleton variant="text" width="40%" height={40} sx={{ mb: 0.5 }} />
					<Skeleton variant="text" width="80%" height={16} />
				</Box>
				<Skeleton variant="circular" width={24} height={24} />
			</Box>
		</CardContent>
	</Card>
);

const ChartSkeleton = ({ height = 400 }: { height?: number }) => (
	<Card
		sx={{
			borderRadius: '12px',
			boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
			backgroundColor: 'white',
			overflow: 'hidden'
		}}
	>
		<CardContent sx={{ p: 3 }}>
			<Box sx={{ mb: 2 }}>
				<Skeleton variant="text" width="40%" height={24} sx={{ mb: 0.5 }} />
				<Skeleton variant="text" width="60%" height={16} />
			</Box>
			<Box sx={{ height: height }}>
				<Skeleton variant="rectangular" width="100%" height="100%" />
			</Box>
		</CardContent>
	</Card>
);

const HeaderSkeleton = () => (
	<Box sx={{ mb: 4 }}>
		<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
			<Box>
				<Skeleton variant="text" width="300px" height={40} sx={{ mb: 1 }} />
				<Skeleton variant="text" width="500px" height={24} />
			</Box>
		</Box>

		<Box
			sx={{
				backgroundColor: 'white',
				borderRadius: '12px',
				boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
				p: 3
			}}
		>
			<Skeleton variant="text" width="80px" height={24} sx={{ mb: 2 }} />
			<Grid container spacing={3}>
				<Grid size={{ xs: 12, md: 6 }}>
					<Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: '8px' }} />
				</Grid>
				<Grid size={{ xs: 12, md: 6 }}>
					<Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: '8px' }} />
				</Grid>
			</Grid>
		</Box>
	</Box>
);

export const DashboardSkeleton = () => {
	return (
		<Box sx={{ p: 3, backgroundColor: '#fafafa', minHeight: '100vh' }}>
			<HeaderSkeleton />
			
			<Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
				<SummaryCardSkeleton />
				<SummaryCardSkeleton />
				<SummaryCardSkeleton />
				<SummaryCardSkeleton />
			</Box>

			<Grid container spacing={3}>
				<Grid size={{ xs: 12, lg: 6 }}>
					<ChartSkeleton height={400} />
				</Grid>
				<Grid size={{ xs: 12, lg: 6 }}>
					<ChartSkeleton height={400} />
				</Grid>
				<Grid size={{ xs: 12 }}>
					<ChartSkeleton height={600} />
				</Grid>
			</Grid>
		</Box>
	);
};
