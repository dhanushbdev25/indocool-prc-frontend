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
	AccessTime as AccessTimeIcon,
	Lock as LockIcon
} from '@mui/icons-material';
import { formatOkNotOkTypeForDisplay } from '../../../../../../utils/okNotOkLabels';
import React from 'react';
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
													<TableCell>Target Value</TableCell>
													<TableCell>UOM</TableCell>
													<TableCell>CTQ</TableCell>
													<TableCell>Get Responsible Person</TableCell>
													<TableCell>Get Instrument id</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{stepGroup.processSteps.map((step: ProcessStepFormData, stepIndex: number) => {
													const tc = (step as Record<string, unknown>).tableConfig as {
														columns?: Array<{ name: string; type: string }>;
														rows?: Array<{ cells: Record<string, { value: string; readOnly: boolean }> }>;
													} | null;
													const isTable = step.targetValueType === 'table' && tc?.columns && tc.columns.length > 0;

													return (
													<React.Fragment key={stepIndex}>
													<TableRow>
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
														{step.targetValueType === 'ok/not ok' ? (
															<Typography variant="body2">{formatOkNotOkTypeForDisplay('ok/not ok')}</Typography>
														) : isTable ? (
															<Chip
																label={`Table \u00b7 ${tc!.columns!.length} cols, ${tc!.rows?.length || 0} rows`}
																size="small"
																sx={{ backgroundColor: '#ede7f6', color: '#5e35b1', fontSize: '0.75rem', fontWeight: 500 }}
															/>
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
																icon={step.responsiblePerson ? <CheckCircleIcon /> : <CancelIcon />}
																label={step.responsiblePerson ? 'Yes' : 'No'}
																size="small"
																sx={{
																	backgroundColor: step.responsiblePerson ? '#4caf50' : '#9e9e9e',
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
																icon={step.getInstrumentId ? <CheckCircleIcon /> : <CancelIcon />}
																label={step.getInstrumentId ? 'Yes' : 'No'}
																size="small"
																sx={{
																	backgroundColor: step.getInstrumentId ? '#4caf50' : '#9e9e9e',
																	color: 'white',
																	fontSize: '0.75rem',
																	'& .MuiChip-icon': {
																		color: 'white'
																	}
																}}
															/>
														</TableCell>
													</TableRow>
													{isTable && (
														<TableRow>
															<TableCell colSpan={8} sx={{ py: 1.5, px: 2, backgroundColor: '#fafafa', borderBottom: '2px solid #e0e0e0' }}>
																<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflow: 'hidden' }}>
																	<Table size="small">
																		<TableHead>
																			<TableRow sx={{ backgroundColor: '#e8eaf6' }}>
																				<TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#333', py: 0.75, width: 40, textAlign: 'center' }}>
																					#
																				</TableCell>
																				{tc!.columns!.map((col, ci) => (
																					<TableCell key={ci} sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#333', py: 0.75 }}>
																						{col.name}
																						<Typography variant="caption" sx={{ display: 'block', color: '#888', fontWeight: 400, lineHeight: 1, fontSize: '0.65rem' }}>
																							{col.type}
																						</Typography>
																					</TableCell>
																				))}
																			</TableRow>
																		</TableHead>
																		<TableBody>
																			{(tc!.rows || []).map((row, ri) => (
																				<TableRow key={ri} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}>
																					<TableCell sx={{ textAlign: 'center', color: '#999', fontSize: '0.7rem', py: 0.5 }}>
																						{ri + 1}
																					</TableCell>
																					{tc!.columns!.map((col, ci) => {
																						const cell = row.cells[col.name] || { value: '', readOnly: false };
																						return (
																							<TableCell key={ci} sx={{ py: 0.5, fontSize: '0.8rem' }}>
																								<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
																									{cell.readOnly && (
																										<LockIcon sx={{ fontSize: 12, color: '#1976d2' }} />
																									)}
																									<Typography
																										variant="body2"
																										sx={{
																											fontSize: '0.8rem',
																											...(cell.readOnly
																												? { color: '#1565c0', fontWeight: 500 }
																												: { color: '#999', fontStyle: 'italic' })
																										}}
																									>
																										{cell.value || (cell.readOnly ? '-' : 'Editable')}
																									</Typography>
																								</Box>
																							</TableCell>
																						);
																					})}
																				</TableRow>
																			))}
																			{(!tc!.rows || tc!.rows.length === 0) && (
																				<TableRow>
																					<TableCell colSpan={tc!.columns!.length + 1} sx={{ textAlign: 'center', py: 2, color: '#aaa' }}>
																						No rows defined
																					</TableCell>
																				</TableRow>
																			)}
																		</TableBody>
																	</Table>
																</TableContainer>
															</TableCell>
														</TableRow>
													)}
													</React.Fragment>
													);
												})}
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
