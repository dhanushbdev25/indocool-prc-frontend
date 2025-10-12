import { Box, Paper, Typography, TextField, FormControlLabel, Switch } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Info as InfoIcon } from '@mui/icons-material';
import { Controller } from 'react-hook-form';
import { InspectionBasicInfoProps } from '../types';

const InspectionBasicInfo = ({ control, errors }: InspectionBasicInfoProps) => {
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
					{/* Inspection Name */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="inspectionName"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Inspection Name"
									required
									placeholder="Enter inspection name"
									helperText={errors.inspectionName?.message || 'Name of the inspection procedure'}
									error={!!errors.inspectionName}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px'
										}
									}}
								/>
							)}
						/>
					</Grid>

					{/* Inspection ID */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="inspectionId"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Inspection ID"
									required
									placeholder="e.g., INSP-001"
									helperText={errors.inspectionId?.message || 'Unique identifier for the inspection'}
									error={!!errors.inspectionId}
									onChange={e => field.onChange(e.target.value.toUpperCase())}
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
								<TextField
									{...field}
									fullWidth
									label="Type"
									placeholder="e.g., RESIN, GELCOAT, LAMINATE"
									helperText={errors.type?.message || 'Type of inspection procedure'}
									error={!!errors.type}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px'
										}
									}}
								/>
							)}
						/>
					</Grid>

					{/* Status */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="status"
							control={control}
							render={({ field }) => (
								<FormControlLabel
									control={<Switch checked={field.value} onChange={field.onChange} color="primary" />}
									label="Active Status"
									sx={{ mt: 2 }}
								/>
							)}
						/>
					</Grid>

					{/* Notes */}
					<Grid size={{ xs: 12 }}>
						<Controller
							name="notes"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label="Notes"
									fullWidth
									multiline
									rows={3}
									error={!!(errors as Record<string, unknown>).notes}
									helperText={
										(errors as Record<string, unknown>).notes
											? String((errors as Record<string, unknown>).notes)
											: 'Additional notes or comments about the inspection'
									}
									placeholder="Enter any additional notes or comments"
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

export default InspectionBasicInfo;
