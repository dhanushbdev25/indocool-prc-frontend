import { Box, Paper, Typography, TextField, FormControlLabel, Switch, Grid, Divider } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { Controller } from 'react-hook-form';
import { CatalystBasicInfoProps } from '../types';

const CatalystBasicInfo = ({ control, errors }: CatalystBasicInfoProps) => {
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
					{/* Chart ID */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="chartId"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Chart ID"
									required
									placeholder="e.g., CAT-CHT-001"
									helperText={errors.chartId?.message || 'Unique identifier for the catalyst chart'}
									error={!!errors.chartId}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px'
										}
									}}
								/>
							)}
						/>
					</Grid>

					{/* Chart Supplier */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="chartSupplier"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Chart Supplier"
									required
									placeholder="e.g., ABC Chemicals Ltd."
									helperText={errors.chartSupplier?.message || 'Name of the chemical supplier'}
									error={!!errors.chartSupplier}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px'
										}
									}}
								/>
							)}
						/>
					</Grid>

					{/* MEKP Density */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="mekpDensity"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="MEKP Density"
									required
									type="number"
									placeholder="e.g., 1.12"
									helperText={errors.mekpDensity?.message || 'Methyl Ethyl Ketone Peroxide density (g/cm³)'}
									error={!!errors.mekpDensity}
									inputProps={{ step: '0.01', min: '0' }}
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
													Active Status
												</Typography>
												<Typography variant="caption" sx={{ color: '#666' }}>
													Enable this chart for use in production
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
									placeholder="Additional notes about this catalyst chart..."
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

export default CatalystBasicInfo;
