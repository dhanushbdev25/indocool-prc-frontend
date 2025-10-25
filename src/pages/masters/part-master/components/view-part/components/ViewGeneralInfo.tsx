import { Box, Grid, Typography, Chip, Paper } from '@mui/material';
import { PartMaster, PartDrawing } from '../../../../../../store/api/business/part-master/part.validators';
import PartImageUpload from '../../create-part/components/PartImageUpload';

interface ViewGeneralInfoProps {
	partMaster: PartMaster;
	files?: PartDrawing[];
}

const ViewGeneralInfo = ({ partMaster, files = [] }: ViewGeneralInfoProps) => {
	// Convert files to gallery format for display
	const displayGallery = files.map((file, index) => ({
		id: index,
		file: null,
		image: file.filePath ? `${process.env.API_BASE_URL_PRE_AUTH}${file.filePath}` : '', // Prepend base URL to file path
		fileName: file.fileName || `Image ${index}`
	}));

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
				General Information
			</Typography>

			<Grid container spacing={3}>
				<Grid size={{ xs: 12, md: 6 }}>
					<Box sx={{ mb: 2 }}>
						<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
							Part Number
						</Typography>
						<Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
							{partMaster.partNumber}
						</Typography>
					</Box>
				</Grid>

				<Grid size={{ xs: 12, md: 6 }}>
					<Box sx={{ mb: 2 }}>
						<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
							Drawing Number
						</Typography>
						<Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
							{partMaster.drawingNumber}
						</Typography>
					</Box>
				</Grid>

				<Grid size={{ xs: 12, md: 6 }}>
					<Box sx={{ mb: 2 }}>
						<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
							Drawing Revision
						</Typography>
						<Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
							{partMaster.drawingRevision}
						</Typography>
					</Box>
				</Grid>

				<Grid size={{ xs: 12, md: 6 }}>
					<Box sx={{ mb: 2 }}>
						<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
							Part Revision
						</Typography>
						<Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
							{partMaster.partRevision}
						</Typography>
					</Box>
				</Grid>

				<Grid size={{ xs: 12, md: 6 }}>
					<Box sx={{ mb: 2 }}>
						<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
							Status
						</Typography>
						<Chip
							label={partMaster.status}
							color={
								getStatusColor(partMaster.status) as
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
							Customer
						</Typography>
						<Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
							{partMaster.customerName || partMaster.customer}
						</Typography>
					</Box>
				</Grid>

				<Grid size={{ xs: 12 }}>
					<Box sx={{ mb: 2 }}>
						<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
							Description
						</Typography>
						<Typography variant="body1" sx={{ color: '#333', lineHeight: 1.6 }}>
							{partMaster.description}
						</Typography>
					</Box>
				</Grid>

				{partMaster.layupType && (
					<Grid size={{ xs: 12, md: 6 }}>
						<Box sx={{ mb: 2 }}>
							<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
								Layup Type
							</Typography>
							<Typography variant="body1" sx={{ color: '#333' }}>
								{partMaster.layupType}
							</Typography>
						</Box>
					</Grid>
				)}

				{partMaster.model && (
					<Grid size={{ xs: 12, md: 6 }}>
						<Box sx={{ mb: 2 }}>
							<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
								Model
							</Typography>
							<Typography variant="body1" sx={{ color: '#333' }}>
								{partMaster.model}
							</Typography>
						</Box>
					</Grid>
				)}

				{partMaster.sapReferenceNumber && (
					<Grid size={{ xs: 12, md: 6 }}>
						<Box sx={{ mb: 2 }}>
							<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
								SAP Reference Number
							</Typography>
							<Typography variant="body1" sx={{ color: '#333' }}>
								{partMaster.sapReferenceNumber}
							</Typography>
						</Box>
					</Grid>
				)}

				<Grid size={{ xs: 12, md: 6 }}>
					<Box sx={{ mb: 2 }}>
						<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
							Version
						</Typography>
						<Typography variant="body1" sx={{ color: '#333' }}>
							v{partMaster.version}
						</Typography>
					</Box>
				</Grid>

				<Grid size={{ xs: 12, md: 6 }}>
					<Box sx={{ mb: 2 }}>
						<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
							Is Latest Version
						</Typography>
						<Chip
							label={partMaster.isLatest ? 'Yes' : 'No'}
							color={partMaster.isLatest ? 'success' : 'default'}
							size="small"
							variant="outlined"
						/>
					</Box>
				</Grid>

				{partMaster.notes && (
					<Grid size={{ xs: 12 }}>
						<Box sx={{ mb: 2 }}>
							<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
								Notes
							</Typography>
							<Typography variant="body1" sx={{ color: '#333', lineHeight: 1.6 }}>
								{partMaster.notes}
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
							{new Date(partMaster.createdAt || '').toLocaleString()}
						</Typography>
					</Box>
				</Grid>

				<Grid size={{ xs: 12, md: 6 }}>
					<Box sx={{ mb: 2 }}>
						<Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
							Updated At
						</Typography>
						<Typography variant="body1" sx={{ color: '#333' }}>
							{new Date(partMaster.updatedAt || '').toLocaleString()}
						</Typography>
					</Box>
				</Grid>
			</Grid>

			{/* Part Drawings Section */}
			{files.length > 0 && (
				<Box sx={{ mt: 4 }}>
					<Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#333' }}>
						Part Drawings
					</Typography>
					<PartImageUpload gallery={displayGallery} onAddImage={() => {}} onRemoveImage={() => {}} view={true} />
				</Box>
			)}
		</Paper>
	);
};

export default ViewGeneralInfo;
