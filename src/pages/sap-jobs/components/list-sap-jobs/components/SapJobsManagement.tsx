import { Box, FormControl, InputAdornment, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import { Search as SearchIcon, CloudSync as SapIcon } from '@mui/icons-material';

export const SAP_JOBS_ALL_KEYS = 'All job keys';
export const SAP_JOBS_ALL_ENABLED = 'All';

interface SapJobsManagementProps {
	searchTerm: string;
	onSearchChange: (value: string) => void;
	jobKeyFilter: string;
	onJobKeyFilterChange: (value: string) => void;
	enabledFilter: string;
	onEnabledFilterChange: (value: string) => void;
	jobKeyOptions: string[];
}

const enabledChoices = [SAP_JOBS_ALL_ENABLED, 'Enabled only', 'Disabled only'];

const SapJobsManagement = ({
	searchTerm,
	onSearchChange,
	jobKeyFilter,
	onJobKeyFilterChange,
	enabledFilter,
	onEnabledFilterChange,
	jobKeyOptions
}: SapJobsManagementProps) => {
	const jobKeyChoices = [SAP_JOBS_ALL_KEYS, ...jobKeyOptions];

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
					Search or narrow by SAP job key and enabled flag. Use &quot;View run history&quot; for execution details.
				</Typography>
			</Box>
			<Box sx={{ p: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
				<TextField
					placeholder="Search by job key, ID, or cron"
					variant="outlined"
					size="small"
					value={searchTerm}
					onChange={e => onSearchChange(e.target.value)}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon sx={{ color: '#999' }} />
							</InputAdornment>
						)
					}}
					sx={{
						flex: '1 1 240px',
						minWidth: 200,
						maxWidth: 480
					}}
				/>
				<FormControl size="small" sx={{ minWidth: 220 }}>
					<InputLabel>Job key</InputLabel>
					<Select
						value={jobKeyChoices.includes(jobKeyFilter) ? jobKeyFilter : SAP_JOBS_ALL_KEYS}
						label="Job key"
						onChange={e => onJobKeyFilterChange(e.target.value)}
						sx={{ borderRadius: '8px' }}
					>
						{jobKeyChoices.map(k => (
							<MenuItem key={k} value={k}>
								{k}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControl size="small" sx={{ minWidth: 200 }}>
					<InputLabel>Enabled</InputLabel>
					<Select
						value={enabledFilter}
						label="Enabled"
						onChange={e => onEnabledFilterChange(e.target.value)}
						sx={{ borderRadius: '8px' }}
					>
						{enabledChoices.map(opt => (
							<MenuItem key={opt} value={opt}>
								{opt}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</Box>
		</Box>
	);
};

export default SapJobsManagement;
