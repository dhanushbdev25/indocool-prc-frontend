import { Box, Skeleton, Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { analyticsPageGap } from '../../dashboard/constants/dashboardTokens';

interface DpmoTabSkeletonProps {
	variant: 'overall' | 'projectWise';
}

const KpiCardSkeleton = () => {
	const theme = useTheme();
	return (
		<Box
			sx={{
				backgroundColor: 'background.paper',
				borderRadius: '10px',
				border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
				px: { xs: 1.5, sm: 2 },
				py: { xs: 1.25, sm: 1.5 },
				minHeight: { xs: 96, sm: 108 },
				display: 'flex',
				flexDirection: 'column',
				gap: 1
			}}
		>
			<Skeleton variant="text" width="60%" height={12} />
			<Skeleton variant="text" width="80%" height={28} />
		</Box>
	);
};

const ChartCardSkeleton = ({ height }: { height: number }) => {
	const theme = useTheme();
	return (
		<Box
			sx={{
				backgroundColor: 'background.paper',
				borderRadius: '12px',
				border: `1px solid ${theme.palette.divider}`,
				p: { xs: 2, sm: 2.5 }
			}}
		>
			<Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
			<Skeleton variant="rectangular" width="100%" height={height} sx={{ borderRadius: 1.5 }} />
		</Box>
	);
};

export const DpmoTabSkeleton = ({ variant }: DpmoTabSkeletonProps) => {
	const kpiCount = variant === 'overall' ? 5 : 4;
	return (
		<Stack spacing={analyticsPageGap}>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: {
						xs: 'repeat(2, minmax(0, 1fr))',
						sm: 'repeat(2, minmax(0, 1fr))',
						md: 'repeat(4, minmax(0, 1fr))',
						lg: `repeat(${kpiCount}, minmax(0, 1fr))`
					},
					gap: { xs: 1.25, sm: 1.5 }
				}}
			>
				{Array.from({ length: kpiCount }).map((_, i) => (
					<KpiCardSkeleton key={i} />
				))}
			</Box>

			{variant === 'overall' ? (
				<>
					<ChartCardSkeleton height={260} />
					<ChartCardSkeleton height={320} />
				</>
			) : (
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
						gap: 2
					}}
				>
					<ChartCardSkeleton height={260} />
					<ChartCardSkeleton height={260} />
				</Box>
			)}
		</Stack>
	);
};
