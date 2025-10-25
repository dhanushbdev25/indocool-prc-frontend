import {
	Box,
	Paper,
	Typography,
	Grid,
	Card,
	CardContent,
	Chip,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow
} from '@mui/material';
import {
	ExpandMore as ExpandMoreIcon,
	CheckCircle as CheckCircleIcon,
	Cancel as CancelIcon,
	AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { useWatch } from 'react-hook-form';
import { SequenceReviewProps } from '../types';
import { ProcessStepFormData } from '../schemas';

const SequenceReview = ({ control }: SequenceReviewProps) => {
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
				<Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
					Basic Information
				</Typography>
				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
								Sequence ID
							</Typography>
							<Typography variant="body1" sx={{ fontWeight: 500 }}>
								{formData?.sequenceId || 'Not specified'}
							</Typography>
						</Box>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
								Sequence Name
							</Typography>
							<Typography variant="body1" sx={{ fontWeight: 500 }}>
								{formData?.sequenceName || 'Not specified'}
							</Typography>
						</Box>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
								Category
							</Typography>
							<Typography variant="body1" sx={{ fontWeight: 500 }}>
								{formData?.category || 'Not specified'}
							</Typography>
						</Box>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
								Type
							</Typography>
							<Typography variant="body1" sx={{ fontWeight: 500 }}>
								{formData?.type || 'Not specified'}
							</Typography>
						</Box>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
								Status
							</Typography>
							<Chip
								icon={formData?.status ? <CheckCircleIcon /> : <CancelIcon />}
								label={formData?.status ? 'ACTIVE' : 'INACTIVE'}
								size="small"
								sx={{
									backgroundColor: formData?.status ? '#4caf50' : '#9e9e9e',
									color: 'white',
									fontSize: '0.75rem',
									'& .MuiChip-icon': {
										color: 'white'
									}
								}}
							/>
						</Box>
					</Grid>
					{formData?.notes && (
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

			{/* Step Groups Review */}
			<Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				<Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
					Process Step Groups
				</Typography>

				{formData?.processStepGroups?.map(
					(
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						stepGroup: any,
						groupIndex: number
					) => (
						<Accordion key={groupIndex} sx={{ mb: 2 }}>
							<AccordionSummary expandIcon={<ExpandMoreIcon />}>
								<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
									<Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
										{stepGroup.processName || `Step Group ${groupIndex + 1}`}
									</Typography>
									<Chip
										label={`${stepGroup.processSteps?.length || 0} steps`}
										size="small"
										sx={{ ml: 2, backgroundColor: '#e3f2fd', color: '#1976d2' }}
									/>
								</Box>
							</AccordionSummary>
							<AccordionDetails>
								<Box sx={{ mb: 2 }}>
									<Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
										Description
									</Typography>
									<Typography variant="body1" sx={{ fontWeight: 500 }}>
										{stepGroup.processDescription || 'No description provided'}
									</Typography>
								</Box>
								<Box sx={{ mb: 2 }}>
									<Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
										Expected Duration
									</Typography>
									<Box sx={{ display: 'flex', alignItems: 'center' }}>
										<AccessTimeIcon sx={{ mr: 1, color: '#2e7d32', fontSize: '1.2rem' }} />
										<Typography variant="body1" sx={{ fontWeight: 500 }}>
											{stepGroup.sequenceTiming || '00:00'}
										</Typography>
									</Box>
								</Box>

								{stepGroup.processSteps && stepGroup.processSteps.length > 0 && (
									<TableContainer>
										<Table size="small">
											<TableHead>
												<TableRow>
													<TableCell>Step #</TableCell>
													<TableCell>Parameter</TableCell>
													<TableCell>Type</TableCell>
													<TableCell>Target Value</TableCell>
													<TableCell>UOM</TableCell>
													<TableCell>CTQ</TableCell>
													<TableCell>Attachments</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{stepGroup.processSteps.map((step: ProcessStepFormData, stepIndex: number) => (
													<TableRow key={stepIndex}>
														<TableCell>{step.stepNumber}</TableCell>
														<TableCell>
															<Typography variant="body2" sx={{ fontWeight: 500 }}>
																{step.parameterDescription}
															</Typography>
															{step.evaluationMethod && (
																<Typography variant="caption" sx={{ color: '#666' }}>
																	Method: {step.evaluationMethod}
																</Typography>
															)}
														</TableCell>
														<TableCell>
															<Chip
																label={step.stepType}
																size="small"
																sx={{
																	backgroundColor: '#f5f5f5',
																	color: '#333',
																	fontSize: '0.75rem'
																}}
															/>
														</TableCell>
														<TableCell>
															{step.targetValueType === 'ok/not ok' ? (
																<Typography variant="body2">OK/Not OK</Typography>
															) : step.targetValueType === 'exact value' ? (
																<Typography variant="body2">{step.minimumAcceptanceValue}</Typography>
															) : (
																<Typography variant="body2">
																	{step.minimumAcceptanceValue} - {step.maximumAcceptanceValue}
																</Typography>
															)}
														</TableCell>
														<TableCell>{step.uom || 'N/A'}</TableCell>
														<TableCell>
															<Chip
																icon={step.ctq ? <CheckCircleIcon /> : <CancelIcon />}
																label={step.ctq ? 'Yes' : 'No'}
																size="small"
																sx={{
																	backgroundColor: step.ctq ? '#4caf50' : '#9e9e9e',
																	color: 'white',
																	fontSize: '0.75rem',
																	'& .MuiChip-icon': {
																		color: 'white'
																	}
																}}
															/>
														</TableCell>
														<TableCell>
															<Chip
																icon={step.allowAttachments ? <CheckCircleIcon /> : <CancelIcon />}
																label={step.allowAttachments ? 'Yes' : 'No'}
																size="small"
																sx={{
																	backgroundColor: step.allowAttachments ? '#4caf50' : '#9e9e9e',
																	color: 'white',
																	fontSize: '0.75rem',
																	'& .MuiChip-icon': {
																		color: 'white'
																	}
																}}
															/>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
								)}
							</AccordionDetails>
						</Accordion>
					)
				)}
			</Paper>

			{/* Summary Statistics */}
			<Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				<Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
					Summary Statistics
				</Typography>
				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 4 }}>
						<Card sx={{ backgroundColor: '#e3f2fd' }}>
							<CardContent sx={{ textAlign: 'center' }}>
								<Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
									{formData?.processStepGroups?.length || 0}
								</Typography>
								<Typography variant="body2" sx={{ color: '#1976d2' }}>
									Step Groups
								</Typography>
							</CardContent>
						</Card>
					</Grid>
					<Grid size={{ xs: 12, md: 4 }}>
						<Card sx={{ backgroundColor: '#f3e5f5' }}>
							<CardContent sx={{ textAlign: 'center' }}>
								<Typography variant="h4" sx={{ fontWeight: 700, color: '#7b1fa2' }}>
									{formData?.processStepGroups?.reduce(
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										(total: number, group: any) => total + (group.processSteps?.length || 0),
										0
									) || 0}
								</Typography>
								<Typography variant="body2" sx={{ color: '#7b1fa2' }}>
									Total Steps
								</Typography>
							</CardContent>
						</Card>
					</Grid>
					<Grid size={{ xs: 12, md: 4 }}>
						<Card sx={{ backgroundColor: '#ffebee' }}>
							<CardContent sx={{ textAlign: 'center' }}>
								<Typography variant="h4" sx={{ fontWeight: 700, color: '#c62828' }}>
									{formData?.processStepGroups?.reduce(
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										(total: number, group: any) =>
											total +
											(group.processSteps?.filter(
												// eslint-disable-next-line @typescript-eslint/no-explicit-any
												(step: any) => step.ctq
											)?.length || 0),
										0
									) || 0}
								</Typography>
								<Typography variant="body2" sx={{ color: '#c62828' }}>
									CTQ Steps
								</Typography>
							</CardContent>
						</Card>
					</Grid>
				</Grid>
			</Paper>
		</Box>
	);
};

export default SequenceReview;
