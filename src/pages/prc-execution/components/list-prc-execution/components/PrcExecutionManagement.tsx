import { useState } from 'react';
import { Box, TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

interface PrcExecutionManagementProps {
	onSearchChange?: (searchTerm: string) => void;
}

const PrcExecutionManagement = ({ onSearchChange }: PrcExecutionManagementProps) => {
	const [searchTerm, setSearchTerm] = useState('');

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setSearchTerm(value);
		onSearchChange?.(value);
	};

	return (
		<Box
			sx={{
				backgroundColor: 'white',
				borderRadius: '12px',
				boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
				mb: 3,
				p: { xs: 2, md: 2.5 }
			}}
		>
				<TextField
					placeholder="Search by ID, Order ID, Part Number, Customer name, or Mould ID"
					variant="outlined"
					size="small"
					fullWidth
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
		</Box>
	);
};

export default PrcExecutionManagement;
