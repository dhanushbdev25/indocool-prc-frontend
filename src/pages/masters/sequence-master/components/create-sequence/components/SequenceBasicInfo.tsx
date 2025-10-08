import React from 'react';
import {
	Box,
	Paper,
	Typography,
	TextField,
	FormControlLabel,
	Switch,
	Grid,
	Divider,
	FormControl,
	InputLabel,
	Select,
	MenuItem
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { Controller } from 'react-hook-form';
import { SequenceBasicInfoProps } from '../types';

const SequenceBasicInfo = ({ control, errors }: SequenceBasicInfoProps) => {
	return (
		<Box>
			<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
				<InfoIcon sx={{ mr: 1, color: '#1976d2' }} />
				<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
					Basic Information
				</Typography>
			</Box>

			<Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				<Grid container spacing={3}>
					{/* Sequence ID */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="sequenceId"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Sequence ID"
									required
									placeholder="e.g., SEQ-001"
									helperText={errors.sequenceId?.message || 'Unique identifier for the process sequence'}
									error={!!errors.sequenceId}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px'
										}
									}}
								/>
							)}
						/>
					</Grid>

					{/* Sequence Name */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="sequenceName"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Sequence Name"
									required
									placeholder="e.g., Composite Molding Line - Phase 1"
									helperText={errors.sequenceName?.message || 'Descriptive name for the process sequence'}
									error={!!errors.sequenceName}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px'
										}
									}}
								/>
							)}
						/>
					</Grid>

					{/* Category */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="category"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Category"
									required
									placeholder="e.g., Production"
									helperText={errors.category?.message || 'Category classification for the sequence'}
									error={!!errors.category}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px'
										}
									}}
								/>
							)}
						/>
					</Grid>

					{/* Type */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="type"
							control={control}
							render={({ field }) => (
								<FormControl fullWidth error={!!errors.type}>
									<InputLabel>Type</InputLabel>
									<Select {...field} label="Type" sx={{ borderRadius: '8px' }}>
										<MenuItem value="Layout">Layout</MenuItem>
										<MenuItem value="ISP">ISP</MenuItem>
									</Select>
									{errors.type && (
										<Typography variant="caption" sx={{ color: 'error.main', mt: 0.5, ml: 1.75 }}>
											{errors.type.message}
										</Typography>
									)}
								</FormControl>
							)}
						/>
					</Grid>

					{/* Active Status */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								height: '100%',
								pt: 2
							}}
						>
							<Controller
								name="status"
								control={control}
								render={({ field }) => (
									<FormControlLabel
										control={<Switch checked={field.value} onChange={field.onChange} color="primary" />}
										label={
											<Box>
												<Typography variant="body1" sx={{ fontWeight: 500 }}>
													Active Status
												</Typography>
												<Typography variant="caption" sx={{ color: '#666' }}>
													Enable this sequence for use in production
												</Typography>
											</Box>
										}
									/>
								)}
							/>
						</Box>
					</Grid>

					{/* Notes */}
					<Grid size={{ xs: 12 }}>
						<Divider sx={{ my: 2 }} />
						<Controller
							name="notes"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Notes"
									multiline
									rows={4}
									placeholder="Additional notes about this process sequence..."
									helperText={
										errors.notes?.message ||
										'Optional notes about usage, special conditions, or other relevant information'
									}
									error={!!errors.notes}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px'
										}
									}}
								/>
							)}
						/>
					</Grid>
				</Grid>
			</Paper>
		</Box>
	);
};

export default SequenceBasicInfo;
