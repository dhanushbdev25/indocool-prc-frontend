import { Box, InputAdornment, TextField, Typography } from '@mui/material';
import { Search as SearchIcon, CloudSync as SapIcon } from '@mui/icons-material';

interface SapJobsManagementProps {
	searchTerm: string;
	onSearchChange: (value: string) => void;
}

const SapJobsManagement = ({ searchTerm, onSearchChange }: SapJobsManagementProps) => {
	return (
		<Box sx={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', mb: 3 }}>
			<Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
					<SapIcon sx={{ color: '#666', mr: 1, fontSize: '1.25rem' }} />
					<Typography variant="h5" sx={{ fontWeight: 600, color: '#333', fontSize: '1.25rem' }}>
						Job catalogue
					</Typography>
				</Box>
				<Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
					Filter by job key, configuration ID, or cron expression. Use &quot;View run history&quot; to open execution
					details.
				</Typography>
			</Box>
			<Box sx={{ p: 3 }}>
				<TextField
					placeholder="Search by job key, ID, or cron"
					variant="outlined"
					size="small"
					fullWidth
					value={searchTerm}
					onChange={e => onSearchChange(e.target.value)}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon sx={{ color: '#999' }} />
							</InputAdornment>
						)
					}}
					sx={{ maxWidth: 480 }}
				/>
			</Box>
		</Box>
	);
};

export default SapJobsManagement;
