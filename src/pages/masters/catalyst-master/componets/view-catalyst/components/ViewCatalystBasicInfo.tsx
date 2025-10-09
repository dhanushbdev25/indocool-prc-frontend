import { Box, Paper, Typography, Grid, Chip, Divider } from '@mui/material';
import { Info as InfoIcon, CheckCircle as CheckCircleIcon, Business as BusinessIcon } from '@mui/icons-material';
import { type Catalyst } from '../../../../../../store/api/business/catalyst-master/catalyst.validators';

interface ViewCatalystBasicInfoProps {
	catalyst: Catalyst;
}

const ViewCatalystBasicInfo = ({ catalyst }: ViewCatalystBasicInfoProps) => {
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'ACTIVE':
				return '#4caf50';
			case 'NEW':
				return '#2196f3';
			case 'INACTIVE':
				return '#9e9e9e';
			default:
				return '#9e9e9e';
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

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
						<Box>
							<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
								Chart ID
							</Typography>
							<Typography variant="body1" sx={{ color: '#333', fontSize: '1.1rem', fontWeight: 500 }}>
								{catalyst.chartId}
							</Typography>
						</Box>
					</Grid>

					{/* Chart Supplier */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
								Chart Supplier
							</Typography>
							<Box sx={{ display: 'flex', alignItems: 'center' }}>
								<BusinessIcon sx={{ mr: 1, color: '#1976d2', fontSize: '1.2rem' }} />
								<Typography variant="body1" sx={{ color: '#333', fontSize: '1.1rem' }}>
									{catalyst.chartSupplier}
								</Typography>
							</Box>
						</Box>
					</Grid>

					{/* MEKP Density */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
								MEKP Density
							</Typography>
							<Typography variant="body1" sx={{ color: '#333', fontSize: '1.1rem', fontWeight: 500 }}>
								{catalyst.mekpDensity} g/cm³
							</Typography>
							<Typography variant="caption" sx={{ color: '#666' }}>
								Methyl Ethyl Ketone Peroxide density
							</Typography>
						</Box>
					</Grid>

					{/* Status */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
								Status
							</Typography>
							<Chip
								icon={<CheckCircleIcon sx={{ fontSize: '0.875rem' }} />}
								label={catalyst.status}
								size="medium"
								sx={{
									backgroundColor: getStatusColor(catalyst.status),
									color: 'white',
									fontSize: '0.875rem',
									height: '32px',
									'& .MuiChip-icon': {
										color: 'white'
									}
								}}
							/>
						</Box>
					</Grid>

					{/* Notes */}
					{catalyst.notes && (
						<Grid size={{ xs: 12 }}>
							<Divider sx={{ my: 2 }} />
							<Box>
								<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
									Notes
								</Typography>
								<Paper
									sx={{
										p: 2,
										backgroundColor: '#f8f9fa',
										border: '1px solid #e9ecef',
										borderRadius: '8px'
									}}
								>
									<Typography variant="body1" sx={{ color: '#333', lineHeight: 1.6 }}>
										{catalyst.notes}
									</Typography>
								</Paper>
							</Box>
						</Grid>
					)}

					{/* Timestamps */}
					<Grid size={{ xs: 12 }}>
						<Divider sx={{ my: 2 }} />
						<Grid container spacing={3}>
							<Grid size={{ xs: 12, md: 6 }}>
								<Box>
									<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
										Created At
									</Typography>
									<Typography variant="body2" sx={{ color: '#666' }}>
										{formatDate(catalyst.createdAt)}
									</Typography>
								</Box>
							</Grid>
							<Grid size={{ xs: 12, md: 6 }}>
								<Box>
									<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
										Last Updated
									</Typography>
									<Typography variant="body2" sx={{ color: '#666' }}>
										{formatDate(catalyst.updatedAt)}
									</Typography>
								</Box>
							</Grid>
						</Grid>
					</Grid>
				</Grid>
			</Paper>
		</Box>
	);
};

export default ViewCatalystBasicInfo;
