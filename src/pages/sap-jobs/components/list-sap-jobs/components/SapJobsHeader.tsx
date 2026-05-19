import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface SapJobsHeaderProps {
	onRefresh?: () => void;
	isRefreshing?: boolean;
}

const SapJobsHeader = ({ onRefresh, isRefreshing }: SapJobsHeaderProps) => {
	return (
		<Box sx={{ mb: 4 }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
				<Box>
					<Typography
						variant="h3"
						sx={{
							fontWeight: 600,
							color: '#333',
							mb: 1,
							fontSize: '2rem'
						}}
					>
						SAP integration jobs
					</Typography>
					<Typography
						variant="body1"
						sx={{
							color: '#666',
							fontSize: '1rem',
							fontWeight: 400
						}}
					>
						Review configured SAP background jobs. Open run history to inspect execution logs.
					</Typography>
				</Box>
				{onRefresh && (
					<Tooltip title="Refresh">
						<span>
							<IconButton
								onClick={onRefresh}
								disabled={isRefreshing}
								sx={{
									color: '#1976d2',
									border: '1px solid #e0e0e0',
									borderRadius: '8px',
									'&:hover': { backgroundColor: '#f5f5f5' }
								}}
							>
								<RefreshIcon />
							</IconButton>
						</span>
					</Tooltip>
				)}
			</Box>
		</Box>
	);
};

export default SapJobsHeader;
