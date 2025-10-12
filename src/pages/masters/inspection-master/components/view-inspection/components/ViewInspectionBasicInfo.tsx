import { Box, Typography, Card, CardContent, Chip, Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import { CheckCircle, Cancel, Image } from '@mui/icons-material';
import { Inspection } from '../../../../../../store/api/business/inspection-master/inspection.validators';
import Pictures from '../../../../../../components/common/imageGallery/Pictures';

interface ViewInspectionBasicInfoProps {
	inspection: Inspection;
}

const ViewInspectionBasicInfo = ({ inspection }: ViewInspectionBasicInfoProps) => {
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'ACTIVE':
				return '#4caf50';
			case 'NEW':
				return '#2196f3';
			case 'INACTIVE':
				return '#9e9e9e';
			default:
				return '#666';
		}
	};

	const getStatusIcon = (status: string) => {
		return status === 'ACTIVE' ? <CheckCircle /> : <Cancel />;
	};

	return (
		<Card>
			<CardContent>
				<Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#333' }}>
					Basic Information
				</Typography>

				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 6 }}>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
							Inspection Name
						</Typography>
						<Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
							{inspection.inspectionName}
						</Typography>
					</Grid>

					<Grid size={{ xs: 12, md: 6 }}>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
							Inspection ID
						</Typography>
						<Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
							{inspection.inspectionId}
						</Typography>
					</Grid>

					<Grid size={{ xs: 12, md: 6 }}>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
							Type
						</Typography>
						<Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
							{inspection.type}
						</Typography>
					</Grid>

					<Grid size={{ xs: 12, md: 6 }}>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
							Status
						</Typography>
						<Chip
							icon={getStatusIcon(inspection.status)}
							label={inspection.status}
							sx={{
								backgroundColor: getStatusColor(inspection.status),
								color: 'white',
								fontWeight: 500,
								mb: 2
							}}
						/>
					</Grid>

					<Grid size={{ xs: 12, md: 6 }}>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
							Version
						</Typography>
						<Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
							v{inspection.version}
						</Typography>
					</Grid>

					<Grid size={{ xs: 12, md: 6 }}>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
							Latest Version
						</Typography>
						<Chip
							icon={inspection.isLatest ? <CheckCircle /> : <Cancel />}
							label={inspection.isLatest ? 'YES' : 'NO'}
							sx={{
								backgroundColor: inspection.isLatest ? '#4caf50' : '#f44336',
								color: 'white',
								fontWeight: 500,
								mb: 2
							}}
						/>
					</Grid>

					<Grid size={{ xs: 12, md: 6 }}>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
							Show Part Images
						</Typography>
						<Chip
							icon={inspection.showPartImages ? <CheckCircle /> : <Cancel />}
							label={inspection.showPartImages ? 'YES' : 'NO'}
							sx={{
								backgroundColor: inspection.showPartImages ? '#4caf50' : '#f44336',
								color: 'white',
								fontWeight: 500,
								mb: 2
							}}
						/>
					</Grid>

					{inspection.createdAt && (
						<Grid size={{ xs: 12, md: 6 }}>
							<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
								Created At
							</Typography>
							<Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
								{new Date(inspection.createdAt).toLocaleString()}
							</Typography>
						</Grid>
					)}

					{inspection.updatedAt && (
						<Grid size={{ xs: 12, md: 6 }}>
							<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
								Updated At
							</Typography>
							<Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
								{new Date(inspection.updatedAt).toLocaleString()}
							</Typography>
						</Grid>
					)}
				</Grid>

				{/* Part Images Section */}
				{inspection.showPartImages && inspection.partImages && inspection.partImages.length > 0 && (
					<>
						<Divider sx={{ my: 3 }} />
						<Box>
							<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
								<Image sx={{ mr: 1, color: 'text.secondary' }} />
								<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
									Part Images ({inspection.partImages.length})
								</Typography>
							</Box>
							<Pictures
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								gallery={inspection.partImages as any}
								onAddImage={() => {}}
								onRemoveImage={() => {}}
								view={true}
							/>
						</Box>
					</>
				)}
			</CardContent>
		</Card>
	);
};

export default ViewInspectionBasicInfo;
