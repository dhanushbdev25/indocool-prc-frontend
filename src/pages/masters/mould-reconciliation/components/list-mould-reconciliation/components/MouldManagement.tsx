import { Box, Typography, TextField, InputAdornment, Button, Stack } from '@mui/material';
import { Search as SearchIcon, Build as MouldIcon } from '@mui/icons-material';

interface MouldManagementProps {
	searchTerm: string;
	activeFilter: string;
	onSearchChange: (searchTerm: string) => void;
	onFilterChange: (filter: string) => void;
}

const MouldManagement = ({ searchTerm, activeFilter, onSearchChange, onFilterChange }: MouldManagementProps) => {
	const filterButtons = ['All Moulds', 'Due', 'Not due'];

	const handleFilterClick = (filter: string) => {
		onFilterChange(filter);
	};

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		onSearchChange(event.target.value);
	};

	return (
		<Box sx={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', mb: 3 }}>
			<Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
					<MouldIcon sx={{ color: '#666', mr: 1, fontSize: '1.25rem' }} />
					<Typography
						variant="h5"
						sx={{
							fontWeight: 600,
							color: '#333',
							fontSize: '1.25rem'
						}}
					>
						Mould management
					</Typography>
				</Box>
				<Typography
					variant="body2"
					sx={{
						color: '#666',
						fontSize: '0.875rem'
					}}
				>
					Search by part code or mould ID, and filter by reconciliation status
				</Typography>
			</Box>

			<Box sx={{ p: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
				<TextField
					placeholder="Search by part code or mould ID"
					variant="outlined"
					size="small"
					value={searchTerm}
					onChange={handleSearchChange}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon sx={{ color: '#999' }} />
							</InputAdornment>
						)
					}}
					sx={{
						flex: 1,
						minWidth: 240,
						'& .MuiOutlinedInput-root': {
							borderRadius: '8px',
							backgroundColor: '#fafafa',
							'& fieldset': {
								borderColor: '#e0e0e0'
							},
							'&:hover fieldset': {
								borderColor: '#ccc'
							},
							'&.Mui-focused fieldset': {
								borderColor: '#1976d2'
							}
						},
						'& .MuiInputBase-input': {
							fontSize: '0.875rem',
							color: '#666',
							'&::placeholder': {
								color: '#999',
								opacity: 1
							}
						}
					}}
				/>

				<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
					{filterButtons.map(filter => (
						<Button
							key={filter}
							variant={activeFilter === filter ? 'contained' : 'outlined'}
							onClick={() => handleFilterClick(filter)}
							sx={{
								borderRadius: '8px',
								textTransform: 'none',
								fontSize: '0.875rem',
								fontWeight: 500,
								px: 2,
								py: 1,
								minWidth: 'auto',
								...(activeFilter === filter
									? {
											backgroundColor: '#1976d2',
											color: 'white',
											'&:hover': {
												backgroundColor: '#1565c0'
											}
										}
									: {
											color: '#666',
											borderColor: '#e0e0e0',
											'&:hover': {
												borderColor: '#ccc',
												backgroundColor: '#f5f5f5'
											}
										})
							}}
						>
							{filter}
						</Button>
					))}
				</Stack>
			</Box>
		</Box>
	);
};

export default MouldManagement;
