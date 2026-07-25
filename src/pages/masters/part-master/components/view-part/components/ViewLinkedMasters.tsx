import { useState } from 'react';
import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import { Science as CatalystIcon, Assignment as TemplateIcon, History, Image as ImageIcon } from '@mui/icons-material';
import { PartDrawing, PartMaster } from '../../../../../../store/api/business/part-master/part.validators';
import { MasterAuditHistoryDialog } from '../../../../../../components/common/auditHistory';
import ViewOnlyImageGallery from '../../../../../../components/common/imageGallery/ViewOnlyImageGallery';

interface ViewLinkedMastersProps {
	partMaster: PartMaster;
	files?: PartDrawing[];
}

const ViewLinkedMasters = ({ partMaster, files = [] }: ViewLinkedMastersProps) => {
	const hasLinkedMasters = partMaster.catalyst || partMaster.prcTemplate;
	const [showTemplateHistory, setShowTemplateHistory] = useState(false);

	return (
		<Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
			<Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#333' }}>
				Linked Masters
			</Typography>

			<Box sx={{ mb: 3 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
					<ImageIcon color="primary" />
					<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
						Part Images
					</Typography>
				</Box>
				<ViewOnlyImageGallery images={files} />
			</Box>

			{hasLinkedMasters ? (
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
								<Box sx={{ flex: 1 }}>
									<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 0.5 }}>
										PRC Template
									</Typography>
									<Typography variant="body2" sx={{ color: '#666' }}>
										ID: {partMaster.prcTemplate}
									</Typography>
									<Button
										size="small"
										startIcon={<History />}
										onClick={() => setShowTemplateHistory(true)}
										sx={{ mt: 1, textTransform: 'none' }}
									>
										Audit Logs
									</Button>
								</Box>
							</Box>
						</Grid>
					)}
				</Grid>
			) : (
				<Typography variant="body1" color="textSecondary" textAlign="center" sx={{ py: 4 }}>
					No linked masters configured for this part
				</Typography>
			)}
			<MasterAuditHistoryDialog
				target={
					showTemplateHistory && partMaster.prcTemplate
						? {
								domain: 'prcTemplate',
								id: partMaster.prcTemplate,
								label: `PRC Template ${partMaster.prcTemplate}`
							}
						: null
				}
				onClose={() => setShowTemplateHistory(false)}
			/>
		</Paper>
	);
};

export default ViewLinkedMasters;
