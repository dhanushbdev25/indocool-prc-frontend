import { Box, Skeleton, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export const ReportTableSkeleton = () => {
	const theme = useTheme();
	return (
		<Box
			sx={{
				backgroundColor: 'background.paper',
				borderRadius: '12px',
				border: `1px solid ${theme.palette.divider}`,
				overflow: 'hidden'
			}}
		>
			<Stack
				direction="row"
				spacing={1}
				sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', justifyContent: 'flex-end' }}
			>
				<Skeleton variant="rounded" width={120} height={32} />
				<Skeleton variant="rounded" width={92} height={32} />
			</Stack>
			<Box sx={{ px: 2, py: 2 }}>
				<Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} variant="text" width={`${100 / 6}%`} height={22} />
					))}
				</Stack>
				{Array.from({ length: 8 }).map((_, rowIdx) => (
					<Stack
						key={rowIdx}
						direction="row"
						spacing={1}
						sx={{ py: 0.5, borderTop: rowIdx === 0 ? 1 : 0, borderColor: 'divider' }}
					>
						{Array.from({ length: 6 }).map((_, colIdx) => (
							<Skeleton
								key={colIdx}
								variant="text"
								width={`${100 / 6}%`}
								height={18}
								sx={{ flex: 1 }}
							/>
						))}
					</Stack>
				))}
			</Box>
		</Box>
	);
};
