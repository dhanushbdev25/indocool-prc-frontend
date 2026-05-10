import { IconButton, Stack, Tooltip } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { MasterListPageTitle } from '../../../../../../components/masters';

interface MouldHeaderProps {
	onRefresh?: () => void;
	isRefreshing?: boolean;
}

const MouldHeader = ({ onRefresh, isRefreshing }: MouldHeaderProps) => (
	<MasterListPageTitle
		title="Mould reconciliation"
		description="Track mould usage against thresholds, reconcile counts, and filter by due status."
		action={
			onRefresh ? (
				<Stack direction="row" alignItems="center" spacing={0.5}>
					<Tooltip title="Refresh list">
						<span>
							<IconButton
								onClick={onRefresh}
								disabled={isRefreshing}
								size="medium"
								aria-label="Refresh list"
								sx={{
									border: 1,
									borderColor: 'divider',
									borderRadius: 1,
									color: 'primary.main'
								}}
							>
								<RefreshIcon />
							</IconButton>
						</span>
					</Tooltip>
				</Stack>
			) : undefined
		}
	/>
);

export default MouldHeader;
