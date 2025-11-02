import {
	Box,
	Typography,
	Card,
	CardContent,
	Chip,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Divider
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
	ExpandMore as ExpandMoreIcon,
	Image as ImageIcon,
	CheckCircle as CheckCircleIcon,
	Cancel as CancelIcon,
	Assignment as AssignmentIcon,
	Settings as SettingsIcon
} from '@mui/icons-material';
import { useWatch } from 'react-hook-form';
import { InspectionReviewProps } from '../types';
import { roleOptions } from '../schemas';

const InspectionReview = ({ control }: InspectionReviewProps) => {
	const watchedData = useWatch({ control });

	const getRoleLabel = (roleValue: string) => {
		const role = roleOptions.find(r => r.value === roleValue);
		return role ? role.label : roleValue;
	};

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
					<AssignmentIcon sx={{ mr: 1, color: '#1976d2' }} />
					<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
						Basic Information
					</Typography>
				</Box>
				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
								Inspection Name
							</Typography>
							<Typography variant="body1" sx={{ fontWeight: 500 }}>
								{watchedData.inspectionName || 'Not specified'}
							</Typography>
						</Box>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
								Inspection ID
							</Typography>
							<Typography variant="body1" sx={{ fontWeight: 500 }}>
								{watchedData.inspectionId || 'Not specified'}
							</Typography>
						</Box>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
								Type
							</Typography>
							<Typography variant="body1" sx={{ fontWeight: 500 }}>
								{watchedData.type || 'Not specified'}
							</Typography>
						</Box>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
								Status
							</Typography>
							<Chip
								icon={watchedData.status ? <CheckCircleIcon /> : <CancelIcon />}
								label={watchedData.status ? 'ACTIVE' : 'INACTIVE'}
								size="small"
								sx={{
									backgroundColor: watchedData.status ? '#4caf50' : '#9e9e9e',
									color: 'white',
									fontSize: '0.75rem',
									'& .MuiChip-icon': {
										color: 'white'
									}
								}}
							/>
						</Box>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
								Approve By Production
							</Typography>
							<Chip
								icon={watchedData.approveByProduction ? <CheckCircleIcon /> : <CancelIcon />}
								label={watchedData.approveByProduction ? 'Yes' : 'No'}
								size="small"
								sx={{
									backgroundColor: watchedData.approveByProduction ? '#4caf50' : '#9e9e9e',
									color: 'white',
									fontSize: '0.75rem',
									'& .MuiChip-icon': {
										color: 'white'
									}
								}}
							/>
						</Box>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
								Approve By Quality
							</Typography>
							<Chip
								icon={watchedData.approveByQuality ? <CheckCircleIcon /> : <CancelIcon />}
								label={watchedData.approveByQuality ? 'Yes' : 'No'}
								size="small"
								sx={{
									backgroundColor: watchedData.approveByQuality ? '#4caf50' : '#9e9e9e',
									color: 'white',
									fontSize: '0.75rem',
									'& .MuiChip-icon': {
										color: 'white'
									}
								}}
							/>
						</Box>
					</Grid>
					{watchedData.notes && (
						<Grid size={{ xs: 12 }}>
							<Divider sx={{ my: 2 }} />
							<Box>
								<Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
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
										{watchedData.notes}
									</Typography>
								</Paper>
							</Box>
						</Grid>
					)}
				</Grid>
			</Paper>

			{/* Part Images Review */}
			{watchedData.showPartImages && watchedData.partImages && watchedData.partImages.length > 0 && (
				<Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
					<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
						<ImageIcon sx={{ mr: 1, color: '#1976d2' }} />
						<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
							Part Images ({watchedData.partImages.length})
						</Typography>
					</Box>
					<Grid container spacing={2}>
						{watchedData.partImages.map((image: Record<string, unknown>, index: number) => (
							<Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
								<Card sx={{ border: '1px solid #e0e0e0', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
									<CardContent sx={{ p: 2 }}>
										<Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
											<ImageIcon sx={{ mr: 1, color: '#1976d2', fontSize: '1.2rem' }} />
											<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333' }}>
												{String(image.name)}
											</Typography>
										</Box>
										<Typography variant="body2" sx={{ color: '#666', wordBreak: 'break-all', fontSize: '0.875rem' }}>
											{String(image.url)}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
						))}
					</Grid>
				</Paper>
			)}

			{/* Inspection Parameters Review */}
			<Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
					<SettingsIcon sx={{ mr: 1, color: '#1976d2' }} />
					<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
						Inspection Parameters ({watchedData.inspectionParameters?.length || 0})
					</Typography>
				</Box>
				{watchedData.inspectionParameters && watchedData.inspectionParameters.length > 0 ? (
					watchedData.inspectionParameters.map((parameter: Record<string, unknown>, index: number) => (
						<Accordion key={index} sx={{ mb: 2, border: '1px solid #e0e0e0', borderRadius: '8px !important' }}>
							<AccordionSummary
								expandIcon={<ExpandMoreIcon />}
								sx={{
									backgroundColor: '#f8f9fa',
									borderRadius: '8px 8px 0 0',
									'&:hover': { backgroundColor: '#f1f3f4' }
								}}
							>
								<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
									<Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 2, color: '#333' }}>
										{String(parameter.parameterName || `Parameter ${index + 1}`)}
									</Typography>
									<Chip
										label={String(parameter.type)}
										size="small"
										variant="outlined"
										sx={{ mr: 1, fontSize: '0.75rem' }}
									/>
									{Boolean(parameter.ctq) && (
										<Chip
											label="CTQ"
											size="small"
											color="warning"
											variant="outlined"
											sx={{ mr: 1, fontSize: '0.75rem' }}
										/>
									)}
									<Chip
										label={getRoleLabel(String(parameter.role))}
										size="small"
										color="primary"
										variant="outlined"
										sx={{ fontSize: '0.75rem' }}
									/>
								</Box>
							</AccordionSummary>
							<AccordionDetails sx={{ backgroundColor: 'white', borderRadius: '0 0 8px 8px' }}>
								<Box>
									<Grid container spacing={3}>
										<Grid size={{ xs: 12, md: 6 }}>
											<Box>
												<Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
													Specification
												</Typography>
												<Typography variant="body1" sx={{ fontWeight: 500 }}>
													{String(parameter.specification || 'Not specified')}
												</Typography>
											</Box>
										</Grid>
										<Grid size={{ xs: 12, md: 6 }}>
											<Box>
												<Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
													Tolerance
												</Typography>
												<Typography variant="body1" sx={{ fontWeight: 500 }}>
													{String(parameter.tolerance || 'Not specified')}
												</Typography>
											</Box>
										</Grid>
										{parameter.columns && (parameter.columns as Record<string, unknown>[]).length > 0 ? (
											<Grid size={{ xs: 12 }}>
												<Divider sx={{ my: 2 }} />
												<Box>
													<Typography variant="body2" sx={{ color: '#666', mb: 1, fontWeight: 600 }}>
														Columns ({(parameter.columns as Record<string, unknown>[]).length})
													</Typography>
													<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
														<Table size="small">
															<TableHead sx={{ backgroundColor: '#f8f9fa' }}>
																<TableRow>
																	<TableCell sx={{ fontWeight: 600, color: '#333' }}>Name</TableCell>
																	<TableCell sx={{ fontWeight: 600, color: '#333' }}>Type</TableCell>
																	<TableCell sx={{ fontWeight: 600, color: '#333' }}>Default Value</TableCell>
																	<TableCell sx={{ fontWeight: 600, color: '#333' }}>Tolerance</TableCell>
																</TableRow>
															</TableHead>
															<TableBody>
																{(parameter.columns as Record<string, unknown>[]).map(
																	(column: Record<string, unknown>, colIndex: number) => (
																		<TableRow key={colIndex} sx={{ '&:hover': { backgroundColor: '#f8f9fa' } }}>
																			<TableCell>{String(column.name)}</TableCell>
																			<TableCell>
																				<Chip
																					label={String(column.type)}
																					size="small"
																					variant="outlined"
																					sx={{ fontSize: '0.75rem' }}
																				/>
																			</TableCell>
																			<TableCell>{String(column.defaultValue || '-')}</TableCell>
																			<TableCell>{String(column.tolerance || '-')}</TableCell>
																		</TableRow>
																	)
																)}
															</TableBody>
														</Table>
													</TableContainer>
												</Box>
											</Grid>
										) : null}
									</Grid>
								</Box>
							</AccordionDetails>
						</Accordion>
					))
				) : (
					<Typography variant="body2" sx={{ color: '#666', textAlign: 'center', py: 2 }}>
						No inspection parameters added
					</Typography>
				)}
			</Paper>

			{/* Summary Statistics */}
			<Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
					<CheckCircleIcon sx={{ mr: 1, color: '#4caf50' }} />
					<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
						Summary
					</Typography>
				</Box>
				<Grid container spacing={3}>
					<Grid size={{ xs: 12, sm: 4 }}>
						<Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
							<CardContent sx={{ p: 1 }}>
								<Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
									Total Parameters
								</Typography>
								<Typography variant="h4" sx={{ fontWeight: 600, color: '#1976d2' }}>
									{watchedData.inspectionParameters?.length || 0}
								</Typography>
							</CardContent>
						</Card>
					</Grid>
					<Grid size={{ xs: 12, sm: 4 }}>
						<Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
							<CardContent sx={{ p: 1 }}>
								<Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
									CTQ Parameters
								</Typography>
								<Typography variant="h4" sx={{ fontWeight: 600, color: '#ff9800' }}>
									{watchedData.inspectionParameters?.filter((p: Record<string, unknown>) => p.ctq).length || 0}
								</Typography>
							</CardContent>
						</Card>
					</Grid>
					<Grid size={{ xs: 12, sm: 4 }}>
						<Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
							<CardContent sx={{ p: 1 }}>
								<Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
									Part Images
								</Typography>
								<Typography variant="h4" sx={{ fontWeight: 600, color: '#4caf50' }}>
									{watchedData.partImages?.length || 0}
								</Typography>
							</CardContent>
						</Card>
					</Grid>
				</Grid>
			</Paper>
		</Box>
	);
};

export default InspectionReview;
