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
	Settings as SettingsIcon,
	Lock as LockIcon
} from '@mui/icons-material';
import { useWatch } from 'react-hook-form';
import { InspectionReviewProps } from '../types';
import { roleOptions } from '../schemas';

const InspectionReview = ({ control }: InspectionReviewProps) => {
	const watchedData = useWatch({ control });
	const formatRange = (min?: unknown, max?: unknown) => {
		if (min === undefined && max === undefined) return 'Not specified';
		return `${min ?? '-'} to ${max ?? '-'}`;
	};

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
													Range (Min-Max)
												</Typography>
												<Typography variant="body1" sx={{ fontWeight: 500 }}>
													{formatRange(
														parameter.minimumAcceptanceValue,
														parameter.maximumAcceptanceValue
													)}
												</Typography>
											</Box>
										</Grid>
									{parameter.columns && (parameter.columns as Record<string, unknown>[]).length > 0 && parameter.type !== 'fixed-table' ? (
										<Grid size={{ xs: 12 }}>
											<Divider sx={{ my: 2 }} />
											<Box sx={{ p: 2, backgroundColor: parameter.type === 'table' ? '#f0f4ff' : '#f8f9fa', borderRadius: '12px', border: parameter.type === 'table' ? 'none' : '1px solid #e0e0e0' }}>
												<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
													<Typography variant="body2" sx={{ color: parameter.type === 'table' ? '#1a237e' : '#666', fontWeight: 600 }}>
														{parameter.type === 'table' ? 'Table Columns (rows added at execution)' : 'Parameter Columns'}
													</Typography>
													<Chip
														label={`${(parameter.columns as Record<string, unknown>[]).length} column${(parameter.columns as Record<string, unknown>[]).length !== 1 ? 's' : ''}`}
														size="small"
														sx={{ backgroundColor: '#ede7f6', color: '#5e35b1', fontWeight: 500, fontSize: '0.7rem' }}
													/>
												</Box>
												<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflow: 'hidden' }}>
													<Table size="small">
														<TableHead>
															<TableRow sx={{ backgroundColor: '#e8eaf6' }}>
																<TableCell sx={{ fontWeight: 600, color: '#333', fontSize: '0.75rem', py: 0.75 }}>Name</TableCell>
																<TableCell sx={{ fontWeight: 600, color: '#333', fontSize: '0.75rem', py: 0.75 }}>Range (Min-Max)</TableCell>
															</TableRow>
														</TableHead>
														<TableBody>
															{(parameter.columns as Record<string, unknown>[]).map(
																(column: Record<string, unknown>, colIndex: number) => (
																	<TableRow key={colIndex} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}>
																		<TableCell sx={{ fontSize: '0.8rem' }}>{String(column.name)}</TableCell>
																		<TableCell sx={{ fontSize: '0.8rem' }}>
																			{formatRange(
																				column.minimumAcceptanceValue,
																				column.maximumAcceptanceValue
																			)}
																		</TableCell>
																	</TableRow>
																)
															)}
														</TableBody>
													</Table>
												</TableContainer>
											</Box>
										</Grid>
									) : null}
									{parameter.type === 'fixed-table' && parameter.tableConfig ? (() => {
										const tc = parameter.tableConfig as {
											columns?: Array<{ name: string; type: string }>;
											rows?: Array<{ cells: Record<string, { value: string; readOnly: boolean }> }>;
										};
										if (!tc.columns || tc.columns.length === 0) return null;
										return (
										<Grid size={{ xs: 12 }}>
											<Divider sx={{ my: 2 }} />
											<Box>
												<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
													<Typography variant="body2" sx={{ color: '#666', fontWeight: 600 }}>
														Fixed Table Preview
													</Typography>
													<Chip
														label={`${tc.columns.length} col${tc.columns.length !== 1 ? 's' : ''} \u00b7 ${tc.rows?.length || 0} row${(tc.rows?.length || 0) !== 1 ? 's' : ''}`}
														size="small"
														sx={{ backgroundColor: '#ede7f6', color: '#5e35b1', fontWeight: 500, fontSize: '0.7rem' }}
													/>
												</Box>
												<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflow: 'hidden' }}>
													<Table size="small">
														<TableHead>
															<TableRow sx={{ backgroundColor: '#e8eaf6' }}>
																<TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#333', py: 0.75, width: 40, textAlign: 'center' }}>
																	#
																</TableCell>
																{tc.columns.map((col, ci) => (
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
															{(tc.rows || []).map((row, ri) => (
																<TableRow key={ri} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}>
																	<TableCell sx={{ textAlign: 'center', color: '#999', fontSize: '0.7rem', py: 0.5 }}>
																		{ri + 1}
																	</TableCell>
																	{tc.columns!.map((col, ci) => {
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
															{(!tc.rows || tc.rows.length === 0) && (
																<TableRow>
																	<TableCell colSpan={tc.columns.length + 1} sx={{ textAlign: 'center', py: 2, color: '#aaa' }}>
																		No rows defined
																	</TableCell>
																</TableRow>
															)}
														</TableBody>
													</Table>
												</TableContainer>
											</Box>
										</Grid>
										);
									})() : null}
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
