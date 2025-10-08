import { useState } from 'react';
import { Box, Typography, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Search as SearchIcon, AccountTree as SequenceIcon } from '@mui/icons-material';

interface SequenceManagementProps {
	onSearchChange?: (searchTerm: string) => void;
	onFilterChange?: (filter: string) => void;
	onTypeFilterChange?: (typeFilter: string) => void;
}

const SequenceManagement = ({ onSearchChange, onFilterChange, onTypeFilterChange }: SequenceManagementProps) => {
	const [activeFilter, setActiveFilter] = useState('All Sequences');
	const [activeTypeFilter, setActiveTypeFilter] = useState('All Types');
	const [searchTerm, setSearchTerm] = useState('');

	const filterButtons = ['All Sequences', 'ACTIVE', 'INACTIVE'];
	const typeFilterButtons = ['All Types', 'Layout', 'ISP'];

	const handleFilterClick = (filter: string) => {
		setActiveFilter(filter);
		onFilterChange?.(filter);
	};

	const handleTypeFilterClick = (typeFilter: string) => {
		setActiveTypeFilter(typeFilter);
		onTypeFilterChange?.(typeFilter);
	};

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setSearchTerm(value);
		onSearchChange?.(value);
	};

	return (
		<Box sx={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
			{/* Section Header */}
			<Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
					<SequenceIcon sx={{ color: '#666', mr: 1, fontSize: '1.25rem' }} />
					<Typography
						variant="h5"
						sx={{
							fontWeight: 600,
							color: '#333',
							fontSize: '1.25rem'
						}}
					>
						Sequence Management
					</Typography>
				</Box>
				<Typography
					variant="body2"
					sx={{
						color: '#666',
						fontSize: '0.875rem'
					}}
				>
					Manage and configure process sequences for production workflows
				</Typography>
			</Box>

			{/* Search and Filter Section */}
			<Box sx={{ p: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
				<TextField
					placeholder="Search by Sequence ID or notes"
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

				<FormControl size="small" sx={{ minWidth: 150 }}>
					<InputLabel>Status</InputLabel>
					<Select
						value={activeFilter}
						label="Status"
						onChange={e => handleFilterClick(e.target.value)}
						sx={{ borderRadius: '8px' }}
					>
						{filterButtons.map(filter => (
							<MenuItem key={filter} value={filter}>
								{filter}
							</MenuItem>
						))}
					</Select>
				</FormControl>

				<FormControl size="small" sx={{ minWidth: 150 }}>
					<InputLabel>Type</InputLabel>
					<Select
						value={activeTypeFilter}
						label="Type"
						onChange={e => handleTypeFilterClick(e.target.value)}
						sx={{ borderRadius: '8px' }}
					>
						{typeFilterButtons.map(typeFilter => (
							<MenuItem key={typeFilter} value={typeFilter}>
								{typeFilter}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</Box>
		</Box>
	);
};

export default SequenceManagement;
