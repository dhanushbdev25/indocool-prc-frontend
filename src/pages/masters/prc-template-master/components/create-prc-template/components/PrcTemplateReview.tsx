import { Box, Paper, Typography, Grid, Card, CardContent, Chip } from '@mui/material';
import {
	CheckCircle as CheckCircleIcon,
	Cancel as CancelIcon,
	Info as InfoIcon,
	Settings as SettingsIcon
} from '@mui/icons-material';
import { useWatch } from 'react-hook-form';
import { PrcTemplateReviewProps } from '../types';

const PrcTemplateReview = ({ control }: PrcTemplateReviewProps) => {
	const formData = useWatch({ control });

	return (
		<Box>
			<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
				<CheckCircleIcon sx={{ mr: 1, color: '#4caf50' }} />
				<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
					Review & Submit
				</Typography>
			</Box>

			{/* Basic Information Review */}
			<Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
					<InfoIcon sx={{ mr: 1, color: '#1976d2' }} />
					<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
						Basic Information
					</Typography>
				</Box>
				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
								Template ID
							</Typography>
							<Typography variant="body1" sx={{ fontWeight: 500 }}>
								{formData.templateId || 'N/A'}
							</Typography>
						</Box>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
								Template Name
							</Typography>
							<Typography variant="body1" sx={{ fontWeight: 500 }}>
								{formData.templateName || 'N/A'}
							</Typography>
						</Box>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
								Status
							</Typography>
							<Chip
								label={formData.isActive ? 'Active' : 'Inactive'}
								color={formData.isActive ? 'success' : 'default'}
								size="small"
								icon={formData.isActive ? <CheckCircleIcon /> : <CancelIcon />}
							/>
						</Box>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
								Version
							</Typography>
							<Typography variant="body1" sx={{ fontWeight: 500 }}>
								{formData.version || 1}
							</Typography>
						</Box>
					</Grid>
					{formData.notes && (
						<Grid size={{ xs: 12 }}>
							<Box>
								<Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
									Notes
								</Typography>
								<Typography variant="body1" sx={{ fontWeight: 500 }}>
									{formData.notes}
								</Typography>
							</Box>
						</Grid>
					)}
				</Grid>
			</Paper>

			{/* Template Steps Review */}
			<Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
					<SettingsIcon sx={{ mr: 1, color: '#1976d2' }} />
					<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
						Template Steps Configuration
					</Typography>
				</Box>

				{/* Default Steps */}
				<Box sx={{ mb: 3 }}>
					<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
						Default Steps
					</Typography>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						<Card sx={{ backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
							<CardContent sx={{ py: 2 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
									<Box
										sx={{
											width: 32,
											height: 32,
											borderRadius: '50%',
											backgroundColor: '#6c757d',
											color: 'white',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontWeight: 'bold',
											fontSize: '0.9rem'
										}}
									>
										1
									</Box>
									<Box sx={{ flex: 1 }}>
										<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
											Raw Materials
										</Typography>
										<Typography variant="body2" color="textSecondary">
											Preparation and verification of raw materials
										</Typography>
									</Box>
									<Chip label="Default" size="small" color="default" />
								</Box>
							</CardContent>
						</Card>
						<Card sx={{ backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
							<CardContent sx={{ py: 2 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
									<Box
										sx={{
											width: 32,
											height: 32,
											borderRadius: '50%',
											backgroundColor: '#6c757d',
											color: 'white',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontWeight: 'bold',
											fontSize: '0.9rem'
										}}
									>
										2
									</Box>
									<Box sx={{ flex: 1 }}>
										<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
											Catalyst Mixing
										</Typography>
										<Typography variant="body2" color="textSecondary">
											Mixing of catalyst components
										</Typography>
									</Box>
									<Chip label="Default" size="small" color="default" />
								</Box>
							</CardContent>
						</Card>
					</Box>
				</Box>

				{/* User Added Steps */}
				{formData.prcTemplateSteps && formData.prcTemplateSteps.length > 0 ? (
					<Box>
						<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
							Additional Steps ({formData.prcTemplateSteps.length})
						</Typography>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
							{formData.prcTemplateSteps.map((step, index) => (
								<Card key={step.stepId || index} sx={{ border: '1px solid #e0e0e0' }}>
									<CardContent sx={{ py: 2 }}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
											<Box
												sx={{
													width: 32,
													height: 32,
													borderRadius: '50%',
													backgroundColor: step.type === 'sequence' ? '#1976d2' : '#4caf50',
													color: 'white',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													fontWeight: 'bold',
													fontSize: '0.9rem'
												}}
											>
												{index + 3}
											</Box>
											<Box sx={{ flex: 1 }}>
												<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
													{step.itemName}
												</Typography>
												<Typography variant="body2" color="textSecondary">
													{step.type === 'sequence' ? 'Process Sequence' : 'Inspection Task'}
												</Typography>
											</Box>
											<Box sx={{ display: 'flex', gap: 1 }}>
												<Chip
													label={step.type === 'sequence' ? 'Sequence' : 'Inspection'}
													size="small"
													color={step.type === 'sequence' ? 'primary' : 'success'}
												/>
												{step.blockCatalystMixing && <Chip label="Block Catalyst" size="small" color="warning" />}
												{step.requestSupervisorApproval && (
													<Chip label="Supervisor Approval" size="small" color="info" />
												)}
											</Box>
										</Box>
									</CardContent>
								</Card>
							))}
						</Box>
					</Box>
				) : (
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							height: 120,
							border: '2px dashed #e0e0e0',
							borderRadius: 2,
							backgroundColor: '#fafafa'
						}}
					>
						<Typography color="textSecondary" textAlign="center">
							No additional steps configured
						</Typography>
					</Box>
				)}
			</Paper>

			{/* Summary */}
			<Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0', backgroundColor: '#f8f9fa' }}>
				<Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
					Summary
				</Typography>
				<Grid container spacing={2}>
					<Grid size={{ xs: 12, sm: 6, md: 3 }}>
						<Box sx={{ textAlign: 'center' }}>
							<Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
								{2 + (formData.prcTemplateSteps?.length || 0)}
							</Typography>
							<Typography variant="body2" color="textSecondary">
								Total Steps
							</Typography>
						</Box>
					</Grid>
					<Grid size={{ xs: 12, sm: 6, md: 3 }}>
						<Box sx={{ textAlign: 'center' }}>
							<Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
								2
							</Typography>
							<Typography variant="body2" color="textSecondary">
								Default Steps
							</Typography>
						</Box>
					</Grid>
					<Grid size={{ xs: 12, sm: 6, md: 3 }}>
						<Box sx={{ textAlign: 'center' }}>
							<Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
								{formData.prcTemplateSteps?.filter(step => step.type === 'sequence').length || 0}
							</Typography>
							<Typography variant="body2" color="textSecondary">
								Sequences
							</Typography>
						</Box>
					</Grid>
					<Grid size={{ xs: 12, sm: 6, md: 3 }}>
						<Box sx={{ textAlign: 'center' }}>
							<Typography variant="h4" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
								{formData.prcTemplateSteps?.filter(step => step.type === 'inspection').length || 0}
							</Typography>
							<Typography variant="body2" color="textSecondary">
								Inspections
							</Typography>
						</Box>
					</Grid>
				</Grid>
			</Paper>
		</Box>
	);
};

export default PrcTemplateReview;
