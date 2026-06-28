import { Box, Skeleton, Stack } from '@mui/material';

export const ReportsAvailableSkeleton = () => (
	<Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider', pb: 1.25 }}>
		<Stack direction="row" spacing={2}>
			{Array.from({ length: 4 }).map((_, i) => (
				<Skeleton key={i} variant="rounded" width={140} height={24} sx={{ borderRadius: 1 }} />
			))}
		</Stack>
	</Box>
);
