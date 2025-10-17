import { Box, Typography, Paper, Grid } from '@mui/material';
import { Science as CatalystIcon, Assignment as TemplateIcon } from '@mui/icons-material';
import { PartMaster } from '../../../../../../store/api/business/part-master/part.validators';

interface ViewLinkedMastersProps {
	partMaster: PartMaster;
}

const ViewLinkedMasters = ({ partMaster }: ViewLinkedMastersProps) => {
	const hasLinkedMasters = partMaster.catalyst || partMaster.prcTemplate;

	if (!hasLinkedMasters) {
		return (
			<Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
				<Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
					Linked Masters
				</Typography>
				<Typography variant="body1" color="textSecondary" textAlign="center" sx={{ py: 4 }}>
					No linked masters configured for this part
				</Typography>
			</Paper>
		);
	}

	return (
		<Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
			<Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#333' }}>
				Linked Masters
			</Typography>

			<Grid container spacing={3}>
				{/* Catalyst Chart */}
				{partMaster.catalyst && (
					<Grid size={{ xs: 12, md: 6 }}>
						<Box
							sx={{
								p: 3,
								border: '1px solid #e0e0e0',
								borderRadius: '12px',
								backgroundColor: '#f3f8ff',
								display: 'flex',
								alignItems: 'center',
								gap: 2
							}}
						>
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									width: 48,
									height: 48,
									borderRadius: '50%',
									backgroundColor: '#1976d2',
									color: 'white'
								}}
							>
								<CatalystIcon />
							</Box>
							<Box>
								<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 0.5 }}>
									Catalyst Chart
								</Typography>
								<Typography variant="body2" sx={{ color: '#666' }}>
									ID: {partMaster.catalyst}
								</Typography>
							</Box>
						</Box>
					</Grid>
				)}

				{/* PRC Template */}
				{partMaster.prcTemplate && (
					<Grid size={{ xs: 12, md: 6 }}>
						<Box
							sx={{
								p: 3,
								border: '1px solid #e0e0e0',
								borderRadius: '12px',
								backgroundColor: '#f0f8f0',
								display: 'flex',
								alignItems: 'center',
								gap: 2
							}}
						>
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									width: 48,
									height: 48,
									borderRadius: '50%',
									backgroundColor: '#4caf50',
									color: 'white'
								}}
							>
								<TemplateIcon />
							</Box>
							<Box>
								<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 0.5 }}>
									PRC Template
								</Typography>
								<Typography variant="body2" sx={{ color: '#666' }}>
									ID: {partMaster.prcTemplate}
								</Typography>
							</Box>
						</Box>
					</Grid>
				)}
			</Grid>
		</Paper>
	);
};

export default ViewLinkedMasters;
