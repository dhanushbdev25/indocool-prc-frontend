import { Box, Skeleton } from '@mui/material';

const CatalystTableSkeleton = () => {
	return (
		<Box sx={{ backgroundColor: '#fff', p: 2 }}>
			{/* Header skeleton */}
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
				<Skeleton variant="text" width={200} height={40} />
				<Skeleton variant="rectangular" width={120} height={36} />
			</Box>
			
			{/* Table header skeleton */}
			<Box sx={{ display: 'flex', gap: 2, mb: 1, p: 1, backgroundColor: '#f5f5f5' }}>
				<Skeleton variant="text" width={150} height={24} />
				<Skeleton variant="text" width={100} height={24} />
				<Skeleton variant="text" width={200} height={24} />
				<Skeleton variant="text" width={100} height={24} />
				<Skeleton variant="text" width={80} height={24} />
				<Skeleton variant="text" width={60} height={24} />
			</Box>
			
			{/* Table rows skeleton */}
			{Array.from({ length: 5 }).map((_, index) => (
				<Box key={index} sx={{ display: 'flex', gap: 2, mb: 1, p: 1, alignItems: 'center' }}>
					<Box sx={{ flex: 1 }}>
						<Skeleton variant="text" width="80%" height={20} />
						<Skeleton variant="text" width="60%" height={16} />
						<Skeleton variant="rectangular" width={120} height={20} sx={{ mt: 0.5, borderRadius: 1 }} />
					</Box>
					<Skeleton variant="text" width={80} height={20} />
					<Skeleton variant="text" width="90%" height={20} />
					<Skeleton variant="text" width={80} height={20} />
					<Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
					<Skeleton variant="circular" width={32} height={32} />
				</Box>
			))}
			
			{/* Pagination skeleton */}
			<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, p: 1 }}>
				<Skeleton variant="rectangular" width={200} height={36} sx={{ borderRadius: 1 }} />
			</Box>
		</Box>
	);
};

export default CatalystTableSkeleton;
