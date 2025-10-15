import { Box, Paper, Typography, TextField, FormControlLabel, Switch, Grid, Divider } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { PrcTemplateFormData } from '../schemas';

interface PrcTemplateBasicInfoProps {
	control: Control<PrcTemplateFormData>;
	errors: FieldErrors<PrcTemplateFormData>;
}

const PrcTemplateBasicInfo = ({ control, errors }: PrcTemplateBasicInfoProps) => {
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
					{/* Template ID */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="templateId"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Template ID"
									required
									placeholder="e.g., TMP-001"
									helperText={errors.templateId?.message || 'Unique identifier for the PRC template'}
									error={!!errors.templateId}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px'
										}
									}}
								/>
							)}
						/>
					</Grid>

					{/* Template Name */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="templateName"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Template Name"
									required
									placeholder="e.g., Catalyst Preparation Template"
									helperText={errors.templateName?.message || 'Descriptive name for the template'}
									error={!!errors.templateName}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px'
										}
									}}
								/>
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
								name="isActive"
								control={control}
								render={({ field }) => (
									<FormControlLabel
										control={<Switch checked={field.value} onChange={field.onChange} color="primary" />}
										label={
											<Box>
												<Typography variant="body1" sx={{ fontWeight: 500 }}>
													Active Template
												</Typography>
												<Typography variant="caption" sx={{ color: '#666' }}>
													Enable this template for use in production
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
									placeholder="Additional notes about this PRC template"
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

export default PrcTemplateBasicInfo;
