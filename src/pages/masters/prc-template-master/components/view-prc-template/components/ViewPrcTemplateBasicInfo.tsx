import { Box, Grid, Typography, Chip, Paper } from '@mui/material';
import { PrcTemplate } from '../../../../../../store/api/business/prc-template/prc-template.validators';

interface ViewPrcTemplateBasicInfoProps {
	template: PrcTemplate;
}

const ViewPrcTemplateBasicInfo = ({ template }: ViewPrcTemplateBasicInfoProps) => {
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'ACTIVE':
				return 'success';
			case 'NEW':
				return 'info';
			case 'INACTIVE':
				return 'error';
			default:
				return 'default';
		}
	};

	return (
		<Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
			<Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#333' }}>
				Basic Information
			</Typography>

			<Grid container spacing={3}>
				<Grid size={{ xs: 12, md: 6 }}>
					<Box sx={{ mb: 2 }}>
						<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
							Template ID
						</Typography>
						<Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
							{template.templateId}
						</Typography>
					</Box>
				</Grid>

				<Grid size={{ xs: 12, md: 6 }}>
					<Box sx={{ mb: 2 }}>
						<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
							Template Name
						</Typography>
						<Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
							{template.templateName}
						</Typography>
					</Box>
				</Grid>

				<Grid size={{ xs: 12, md: 6 }}>
					<Box sx={{ mb: 2 }}>
						<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
							Version
						</Typography>
						<Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
							{template.version}
						</Typography>
					</Box>
				</Grid>

				<Grid size={{ xs: 12, md: 6 }}>
					<Box sx={{ mb: 2 }}>
						<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
							Status
						</Typography>
						<Chip
							label={template.status}
							color={
								getStatusColor(template.status) as
									| 'default'
									| 'primary'
									| 'secondary'
									| 'error'
									| 'info'
									| 'success'
									| 'warning'
							}
							size="small"
							variant="outlined"
						/>
					</Box>
				</Grid>

				<Grid size={{ xs: 12, md: 6 }}>
					<Box sx={{ mb: 2 }}>
						<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
							Is Latest Version
						</Typography>
						<Chip
							label={template.isLatest ? 'Yes' : 'No'}
							color={template.isLatest ? 'success' : 'default'}
							size="small"
							variant="outlined"
						/>
					</Box>
				</Grid>

				<Grid size={{ xs: 12, md: 6 }}>
					<Box sx={{ mb: 2 }}>
						<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
							Is Active
						</Typography>
						<Chip
							label={template.isActive ? 'Yes' : 'No'}
							color={template.isActive ? 'success' : 'default'}
							size="small"
							variant="outlined"
						/>
					</Box>
				</Grid>

				{template.notes && (
					<Grid size={{ xs: 12 }}>
						<Box sx={{ mb: 2 }}>
							<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
								Notes
							</Typography>
							<Typography variant="body1" sx={{ color: '#333', lineHeight: 1.6 }}>
								{template.notes}
							</Typography>
						</Box>
					</Grid>
				)}

				<Grid size={{ xs: 12, md: 6 }}>
					<Box sx={{ mb: 2 }}>
						<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
							Created At
						</Typography>
						<Typography variant="body1" sx={{ color: '#333' }}>
							{new Date(template.createdAt || '').toLocaleString()}
						</Typography>
					</Box>
				</Grid>

				<Grid size={{ xs: 12, md: 6 }}>
					<Box sx={{ mb: 2 }}>
						<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
							Updated At
						</Typography>
						<Typography variant="body1" sx={{ color: '#333' }}>
							{new Date(template.updatedAt || '').toLocaleString()}
						</Typography>
					</Box>
				</Grid>
			</Grid>
		</Paper>
	);
};

export default ViewPrcTemplateBasicInfo;
