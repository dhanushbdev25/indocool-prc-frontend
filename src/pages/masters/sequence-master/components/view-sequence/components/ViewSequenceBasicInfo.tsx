import { Box, Paper, Typography, Grid, Chip, Divider } from '@mui/material';
import { Info as InfoIcon, CheckCircle as CheckCircleIcon, Category as CategoryIcon } from '@mui/icons-material';
import { type ProcessSequence } from '../../../../../../store/api/business/sequence-master/sequence.validators';

interface ViewSequenceBasicInfoProps {
	sequence: ProcessSequence;
}

const ViewSequenceBasicInfo = ({ sequence }: ViewSequenceBasicInfoProps) => {
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'ACTIVE':
				return '#4caf50';
			case 'INACTIVE':
				return '#9e9e9e';
			default:
				return '#9e9e9e';
		}
	};

	const getTypeColor = (type: string) => {
		switch (type) {
			case 'Layout':
				return '#2196f3';
			case 'ISP':
				return '#ff9800';
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
					{/* Sequence ID */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
								Sequence ID
							</Typography>
							<Typography variant="body1" sx={{ color: '#333', fontSize: '1.1rem', fontWeight: 500 }}>
								{sequence.sequenceId}
							</Typography>
						</Box>
					</Grid>

					{/* Sequence Name */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
								Sequence Name
							</Typography>
							<Typography variant="body1" sx={{ color: '#333', fontSize: '1.1rem', fontWeight: 500 }}>
								{sequence.sequenceName}
							</Typography>
						</Box>
					</Grid>

					{/* Category */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
								Category
							</Typography>
							<Box sx={{ display: 'flex', alignItems: 'center' }}>
								<CategoryIcon sx={{ mr: 1, color: '#1976d2', fontSize: '1.2rem' }} />
								<Typography variant="body1" sx={{ color: '#333', fontSize: '1.1rem' }}>
									{sequence.category}
								</Typography>
							</Box>
						</Box>
					</Grid>

					{/* Type */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
								Type
							</Typography>
							<Chip
								label={sequence.type}
								size="medium"
								sx={{
									backgroundColor: getTypeColor(sequence.type),
									color: 'white',
									fontSize: '0.875rem',
									height: '32px',
									fontWeight: 600
								}}
							/>
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
								label={sequence.status}
								size="medium"
								sx={{
									backgroundColor: getStatusColor(sequence.status),
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

					{/* Version Info */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
								Version Information
							</Typography>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<Typography variant="body2" sx={{ color: '#666' }}>
									Version {sequence.version}
								</Typography>
								{sequence.isLatest && (
									<Chip
										label="Latest"
										size="small"
										sx={{
											backgroundColor: '#4caf50',
											color: 'white',
											fontSize: '0.75rem',
											height: '20px'
										}}
									/>
								)}
							</Box>
						</Box>
					</Grid>

					{/* Steps Summary */}
					<Grid size={{ xs: 12 }}>
						<Divider sx={{ my: 2 }} />
						<Box>
							<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 2 }}>
								Steps Summary
							</Typography>
							<Grid container spacing={2}>
								<Grid size={{ xs: 6, md: 3 }}>
									<Paper sx={{ p: 2, backgroundColor: '#e3f2fd', border: '1px solid #2196f3' }}>
										<Typography variant="caption" sx={{ color: '#1565c0', fontWeight: 600 }}>
											TOTAL STEPS
										</Typography>
										<Typography variant="h6" sx={{ color: '#1565c0', fontWeight: 600 }}>
											{sequence.totalSteps}
										</Typography>
									</Paper>
								</Grid>
								<Grid size={{ xs: 6, md: 3 }}>
									<Paper sx={{ p: 2, backgroundColor: '#ffebee', border: '1px solid #f44336' }}>
										<Typography variant="caption" sx={{ color: '#c62828', fontWeight: 600 }}>
											CTQ STEPS
										</Typography>
										<Typography variant="h6" sx={{ color: '#c62828', fontWeight: 600 }}>
											{sequence.ctqSteps}
										</Typography>
									</Paper>
								</Grid>
								<Grid size={{ xs: 6, md: 3 }}>
									<Paper sx={{ p: 2, backgroundColor: '#e8f5e8', border: '1px solid #4caf50' }}>
										<Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 600 }}>
											STEP GROUPS
										</Typography>
										<Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 600 }}>
											{sequence.stepGroups?.length || 0}
										</Typography>
									</Paper>
								</Grid>
								<Grid size={{ xs: 6, md: 3 }}>
									<Paper sx={{ p: 2, backgroundColor: '#fff3e0', border: '1px solid #ff9800' }}>
										<Typography variant="caption" sx={{ color: '#e65100', fontWeight: 600 }}>
											CTQ RATIO
										</Typography>
										<Typography variant="h6" sx={{ color: '#e65100', fontWeight: 600 }}>
											{sequence.totalSteps > 0 ? Math.round((sequence.ctqSteps / sequence.totalSteps) * 100) : 0}%
										</Typography>
									</Paper>
								</Grid>
							</Grid>
						</Box>
					</Grid>

					{/* Notes */}
					{sequence.notes && (
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
										{sequence.notes}
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
										{formatDate(sequence.createdAt)}
									</Typography>
								</Box>
							</Grid>
							<Grid size={{ xs: 12, md: 6 }}>
								<Box>
									<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
										Last Updated
									</Typography>
									<Typography variant="body2" sx={{ color: '#666' }}>
										{formatDate(sequence.updatedAt)}
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

export default ViewSequenceBasicInfo;
