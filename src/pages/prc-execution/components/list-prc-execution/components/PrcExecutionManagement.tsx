import { useState } from 'react';
import { Box, Typography, TextField, InputAdornment, Button, Stack } from '@mui/material';
import { Search as SearchIcon, PlayArrow as ExecutionIcon } from '@mui/icons-material';

interface PrcExecutionManagementProps {
	onSearchChange?: (searchTerm: string) => void;
	onFilterChange?: (filter: string) => void;
}

const PrcExecutionManagement = ({ onSearchChange, onFilterChange }: PrcExecutionManagementProps) => {
	const [activeFilter, setActiveFilter] = useState('All Executions');
	const [searchTerm, setSearchTerm] = useState('');

	const filterButtons = ['All Executions', 'ACTIVE', 'INPROGRESS', 'COMPLETED', 'INACTIVE'];

	const handleFilterClick = (filter: string) => {
		setActiveFilter(filter);
		onFilterChange?.(filter);
	};

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setSearchTerm(value);
		onSearchChange?.(value);
	};

	return (
		<Box sx={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', mb: 3 }}>
			{/* Section Header */}
			<Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
					<ExecutionIcon sx={{ color: '#666', mr: 1, fontSize: '1.25rem' }} />
					<Typography
						variant="h5"
						sx={{
							fontWeight: 600,
							color: '#333',
							fontSize: '1.25rem'
						}}
					>
						Execution Management
					</Typography>
				</Box>
				<Typography
					variant="body2"
					sx={{
						color: '#666',
						fontSize: '0.875rem'
					}}
				>
					Search and filter executions by status, part number, customer, or production details
				</Typography>
			</Box>

			{/* Search and Filter Section */}
			<Box sx={{ p: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
				<TextField
					placeholder="Search by Part Number, Customer, Production Set, or Mould ID"
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

				<Stack direction="row" spacing={1}>
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

export default PrcExecutionManagement;
