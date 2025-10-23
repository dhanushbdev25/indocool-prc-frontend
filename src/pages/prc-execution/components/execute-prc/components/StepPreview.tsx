import { useState } from 'react';
import {
	Box,
	Typography,
	Button,
	Card,
	CardContent,
	Avatar,
	Chip,
	IconButton,
	Alert,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Grid
} from '@mui/material';
import { ArrowBack, CheckCircle, Visibility, Check, ArrowForward, Image as ImageIcon } from '@mui/icons-material';
import { type StepPreviewData } from '../../../types/execution.types';

interface StepPreviewProps {
	previewData: StepPreviewData;
	onBackToStep: () => void;
	onApproveProduction: () => void;
	onApproveCTQ: () => void;
	onProceedToNext: () => void;
	onBackToStepGroup?: () => void;
}

const StepPreview = ({
	previewData,
	onBackToStep,
	onApproveProduction,
	onApproveCTQ,
	onProceedToNext,
	onBackToStepGroup
}: StepPreviewProps) => {
	const [productionApproved, setProductionApproved] = useState(previewData.productionApproved || false);
	const [ctqApproved, setCtqApproved] = useState(previewData.ctqApproved || false);

	// Debug logging
	console.log('StepPreview Debug:', {
		previewData,
		productionApproved,
		ctqApproved,
		stepCompleted: previewData.stepCompleted,
		ctq: previewData.ctq,
		canProceed: productionApproved && (!previewData.ctq || ctqApproved) && !previewData.stepCompleted
	});

	const handleApproveProduction = () => {
		setProductionApproved(true);
		onApproveProduction();
	};

	const handleApproveCTQ = () => {
		setCtqApproved(true);
		onApproveCTQ();
	};

	const canProceed = productionApproved && (!previewData.ctq || ctqApproved) && !previewData.stepCompleted;

	const renderDataSummary = () => {
		const { data } = previewData;

		if (previewData.type === 'sequence') {
			// Handle sequence data - show as compact report table
			return (
				<Box>
					<Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: '#333', fontSize: '1.1rem' }}>
						Measurement Report ({Array.isArray(data) ? data.length : 0} measurements)
					</Typography>
					<TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
						<Table size="small" stickyHeader>
							<TableHead>
								<TableRow sx={{ backgroundColor: '#f5f5f5' }}>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Step</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Parameter</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Value</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Type</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Method</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Status</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{Array.isArray(data) && data.length > 0 ? (
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									data.map((measurement: any, index: number) => (
										<TableRow
											key={measurement.stepId || index}
											sx={{
												'&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
												'&:hover': { backgroundColor: '#f0f0f0' }
											}}
										>
											<TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
													<Typography variant="body2" sx={{ fontWeight: 500 }}>
														{measurement.stepNumber || index + 1}
													</Typography>
													{measurement.ctq && (
														<Chip
															label="CTQ"
															size="small"
															sx={{
																backgroundColor: '#fff3e0',
																color: '#f57c00',
																fontSize: '0.6rem',
																height: 16,
																'& .MuiChip-label': { px: 0.5 }
															}}
														/>
													)}
												</Box>
											</TableCell>
											<TableCell sx={{ py: 1, fontSize: '0.8rem', maxWidth: 200 }}>
												<Typography
													variant="body2"
													sx={{
														fontWeight: 500,
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														whiteSpace: 'nowrap'
													}}
													title={measurement.parameterDescription}
												>
													{measurement.parameterDescription}
												</Typography>
											</TableCell>
											<TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
													{measurement.stepType === 'Check' || measurement.stepType === 'Inspection' ? (
														<Chip
															label={measurement.value}
															size="small"
															sx={{
																backgroundColor: '#e3f2fd',
																color: '#1976d2',
																fontSize: '0.7rem',
																height: 20
															}}
														/>
													) : (
														<Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
															{measurement.value} {measurement.uom && measurement.uom !== 'None' ? measurement.uom : ''}
														</Typography>
													)}
												</Box>
											</TableCell>
											<TableCell sx={{ py: 1, fontSize: '0.8rem', color: '#666' }}>{measurement.stepType}</TableCell>
											<TableCell sx={{ py: 1, fontSize: '0.8rem', color: '#666' }}>
												{measurement.evaluationMethod}
											</TableCell>
											<TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
												<Box
													sx={{
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														width: 24,
														height: 24,
														borderRadius: '50%',
														backgroundColor: '#e8f5e8'
													}}
												>
													<CheckCircle sx={{ color: '#4caf50', fontSize: 16 }} />
												</Box>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={6} sx={{ textAlign: 'center', py: 3, color: '#666' }}>
											No measurement data available
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</TableContainer>

					{/* Notes section for important notes */}
					{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
					{Array.isArray(data) && data.some((m: any) => m.notes && m.notes.length > 0) && (
						<Box sx={{ mt: 2 }}>
							<Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#333' }}>
								Important Notes:
							</Typography>
							{data
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								.filter((m: any) => m.notes && m.notes.length > 0)
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								.map((measurement: any, index: number) => (
									<Box key={index} sx={{ mb: 1, p: 1, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
										<Typography variant="caption" sx={{ fontWeight: 500, color: '#666' }}>
											Step {measurement.stepNumber}:
										</Typography>
										<Typography variant="caption" sx={{ color: '#333', ml: 0.5 }}>
											{measurement.notes}
										</Typography>
									</Box>
								))}
						</Box>
					)}
				</Box>
			);
		}

		if (previewData.type === 'inspection') {
			// Handle inspection data - show as detailed inspection report table
			const inspectionParams = previewData.inspectionParameters || [];
			const inspectionMeta = previewData.inspectionMetadata;

			// Debug logging for inspection preview
			console.log('🖼️ INSPECTION_PREVIEW_DEBUG:', {
				previewData,
				data: previewData.data,
				dataKeys: Object.keys(previewData.data),
				filteredKeys: Object.keys(previewData.data).filter(
					key => key !== 'data' && key !== 'startTime' && key !== 'endTime'
				),
				inspectionParams,
				inspectionMeta,
				parameterCount: Object.keys(previewData.data).filter(
					key => key !== 'data' && key !== 'startTime' && key !== 'endTime'
				).length
			});

			return (
				<Box>
					{/* Inspection Metadata Header */}
					{inspectionMeta && (
						<Box sx={{ mb: 2, p: 1.5, backgroundColor: '#e3f2fd', borderRadius: 1, border: '1px solid #bbdefb' }}>
							<Grid container spacing={1.5}>
								<Grid size={{ xs: 6, sm: 3 }}>
									<Typography variant="caption" sx={{ fontWeight: 600, color: '#1565c0', fontSize: '0.75rem' }}>
										Inspection ID
									</Typography>
									<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1565c0' }}>
										{inspectionMeta.inspectionId}
									</Typography>
								</Grid>
								<Grid size={{ xs: 6, sm: 3 }}>
									<Typography variant="caption" sx={{ fontWeight: 600, color: '#1565c0', fontSize: '0.75rem' }}>
										Type
									</Typography>
									<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1565c0' }}>
										{inspectionMeta.type}
									</Typography>
								</Grid>
								<Grid size={{ xs: 6, sm: 3 }}>
									<Typography variant="caption" sx={{ fontWeight: 600, color: '#1565c0', fontSize: '0.75rem' }}>
										Status
									</Typography>
									<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1565c0' }}>
										{inspectionMeta.status}
									</Typography>
								</Grid>
								<Grid size={{ xs: 6, sm: 3 }}>
									<Typography variant="caption" sx={{ fontWeight: 600, color: '#1565c0', fontSize: '0.75rem' }}>
										Version
									</Typography>
									<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1565c0' }}>
										v{inspectionMeta.version}
									</Typography>
								</Grid>
							</Grid>
						</Box>
					)}

					<Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: '#333', fontSize: '1.1rem' }}>
						Inspection Report (
						{Object.keys(data).filter(key => key !== 'data' && key !== 'startTime' && key !== 'endTime').length}{' '}
						parameters)
					</Typography>
					<TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
						<Table size="small" stickyHeader>
							<TableHead>
								<TableRow sx={{ backgroundColor: '#f5f5f5' }}>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>#</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Parameter</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Type</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Value</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>CTQ</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Specification</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Status</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{Object.entries(data)
									.filter(([key]) => key !== 'data' && key !== 'startTime' && key !== 'endTime')
									.map(([parameterId, parameterData], index) => {
										// Find the corresponding inspection parameter metadata
										const paramMeta = inspectionParams.find(p => p.id.toString() === parameterId);

										// Handle different data structures
										let displayValue = '';
										let hasAnnotations = false;
										let isMultiColumn = false;
										let ctqStatus = paramMeta?.ctq || false;
										let parameterName = paramMeta?.parameterName || `Parameter ${parameterId}`;
										let parameterType = paramMeta?.type || 'text';
										let specification = paramMeta?.specification || 'N/A';

										if (typeof parameterData === 'object' && parameterData !== null) {
											// Handle object structure: { "value": "1", "annotations": [...] }
											const paramObj = parameterData as Record<string, unknown>;

											// Check for annotations
											if (paramObj.annotations && Array.isArray(paramObj.annotations)) {
												hasAnnotations = true;
											}

											// Handle value
											if (paramObj.value) {
												if (typeof paramObj.value === 'object' && paramObj.value !== null) {
													// Multi-column data: { "value": { "Date": "213", "Name": "1" } }
													isMultiColumn = true;
													const valueObj = paramObj.value as Record<string, unknown>;
													displayValue = Object.entries(valueObj)
														.map(([col, val]) => `${col}: ${val}`)
														.join(', ');
												} else {
													// Single value
													displayValue = String(paramObj.value);
												}
											}
										} else {
											// Simple string/number value
											displayValue = String(parameterData);
										}

										return (
											<TableRow
												key={parameterId}
												sx={{
													'&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
													'&:hover': { backgroundColor: '#f0f0f0' }
												}}
											>
												<TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
													<Typography variant="body2" sx={{ fontWeight: 500 }}>
														{index + 1}
													</Typography>
												</TableCell>
												<TableCell sx={{ py: 1, fontSize: '0.8rem', maxWidth: 200 }}>
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
														<Typography
															variant="body2"
															sx={{
																fontWeight: 500,
																overflow: 'hidden',
																textOverflow: 'ellipsis',
																whiteSpace: 'nowrap'
															}}
															title={parameterName}
														>
															{parameterName}
														</Typography>
														{hasAnnotations && (
															<Chip
																label="Images"
																size="small"
																sx={{
																	backgroundColor: '#e3f2fd',
																	color: '#1976d2',
																	fontSize: '0.6rem',
																	height: 16,
																	'& .MuiChip-label': { px: 0.5 }
																}}
															/>
														)}
														{isMultiColumn && (
															<Chip
																label="Multi"
																size="small"
																sx={{
																	backgroundColor: '#f3e5f5',
																	color: '#7b1fa2',
																	fontSize: '0.6rem',
																	height: 16,
																	'& .MuiChip-label': { px: 0.5 }
																}}
															/>
														)}
														{paramMeta?.files && paramMeta.files.length > 0 && (
															<Chip
																label={`${paramMeta.files.length} files`}
																size="small"
																sx={{
																	backgroundColor: '#e8f5e8',
																	color: '#4caf50',
																	fontSize: '0.6rem',
																	height: 16,
																	'& .MuiChip-label': { px: 0.5 }
																}}
															/>
														)}
													</Box>
												</TableCell>
												<TableCell sx={{ py: 1, fontSize: '0.8rem', color: '#666' }}>{parameterType}</TableCell>
												<TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
														{isMultiColumn ? (
															<Chip
																label={displayValue}
																size="small"
																sx={{
																	backgroundColor: '#f3e5f5',
																	color: '#7b1fa2',
																	fontSize: '0.7rem',
																	height: 20,
																	maxWidth: 200,
																	'& .MuiChip-label': {
																		overflow: 'hidden',
																		textOverflow: 'ellipsis',
																		whiteSpace: 'nowrap'
																	}
																}}
																title={displayValue}
															/>
														) : (
															<Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
																{displayValue}
															</Typography>
														)}
													</Box>
												</TableCell>
												<TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
													{ctqStatus && (
														<Chip
															label="CTQ"
															size="small"
															sx={{
																backgroundColor: '#fff3e0',
																color: '#f57c00',
																fontSize: '0.7rem',
																height: 20
															}}
														/>
													)}
												</TableCell>
												<TableCell sx={{ py: 1, fontSize: '0.8rem', color: '#666', maxWidth: 150 }}>
													<Typography
														variant="body2"
														sx={{
															overflow: 'hidden',
															textOverflow: 'ellipsis',
															whiteSpace: 'nowrap'
														}}
														title={specification}
													>
														{specification}
													</Typography>
												</TableCell>
												<TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
													<Box
														sx={{
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
															width: 24,
															height: 24,
															borderRadius: '50%',
															backgroundColor: '#e8f5e8'
														}}
													>
														<CheckCircle sx={{ color: '#4caf50', fontSize: 16 }} />
													</Box>
												</TableCell>
											</TableRow>
										);
									})}
							</TableBody>
						</Table>
					</TableContainer>

					{/* Image Annotations Section */}
					{Object.entries(data)
						.filter(([key]) => key !== 'data' && key !== 'startTime' && key !== 'endTime')
						.some(
							([_, parameterData]) =>
								typeof parameterData === 'object' &&
								parameterData !== null &&
								'annotations' in parameterData &&
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								Array.isArray((parameterData as any).annotations) &&
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								(parameterData as any).annotations.length > 0
						) && (
						<Box sx={{ mt: 2 }}>
							<Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: '#333', fontSize: '1.1rem' }}>
								Image Annotations
							</Typography>
							{Object.entries(data)
								.filter(([key]) => key !== 'data' && key !== 'startTime' && key !== 'endTime')
								.map(([parameterId, parameterData]) => {
									// Find the corresponding inspection parameter metadata
									const paramMeta = inspectionParams.find(p => p.id.toString() === parameterId);

									if (typeof parameterData === 'object' && parameterData !== null && 'annotations' in parameterData) {
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										const annotations = (parameterData as any).annotations;
										if (Array.isArray(annotations) && annotations.length > 0) {
											return (
												<Box key={parameterId} sx={{ mb: 2 }}>
													<Paper variant="outlined" sx={{ p: 2 }}>
														<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#1976d2' }}>
															{paramMeta?.parameterName || `Parameter ${parameterId}`}
														</Typography>
														{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
														{annotations.map((annotation: any, annotationIndex: number) => {
															// Find the original filename by matching the generated filename
															const originalFileName =
																paramMeta?.files?.find(file => file.fileName === annotation.imageFileName)
																	?.originalFileName || annotation.imageFileName;

															return (
																<Box
																	key={annotationIndex}
																	sx={{
																		mb: 2,
																		p: 1.5,
																		backgroundColor: '#f8f9fa',
																		borderRadius: 1,
																		border: '1px solid #e9ecef'
																	}}
																>
																	<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
																		<ImageIcon color="primary" fontSize="small" />
																		<Typography variant="body2" sx={{ fontWeight: 500, color: '#333' }}>
																			{originalFileName}
																		</Typography>
																		<Chip
																			label={`${annotation.regions?.length || 0} annotations`}
																			size="small"
																			sx={{
																				backgroundColor: '#e3f2fd',
																				color: '#1976d2',
																				fontSize: '0.7rem',
																				height: 20
																			}}
																		/>
																	</Box>

																	{/* Display annotation regions */}
																	{annotation.regions && annotation.regions.length > 0 && (
																		<Box sx={{ mt: 1 }}>
																			<Typography
																				variant="caption"
																				sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}
																			>
																				Annotation Details:
																			</Typography>
																			{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
																			{annotation.regions.map((region: any, regionIndex: number) => (
																				<Box
																					key={regionIndex}
																					sx={{
																						mt: 0.5,
																						p: 1,
																						backgroundColor: '#fff',
																						borderRadius: 0.5,
																						border: '1px solid #e0e0e0'
																					}}
																				>
																					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
																						<Chip
																							label={region.type}
																							size="small"
																							sx={{
																								backgroundColor: region.type === 'point' ? '#e8f5e8' : '#fff3e0',
																								color: region.type === 'point' ? '#4caf50' : '#f57c00',
																								fontSize: '0.6rem',
																								height: 16
																							}}
																						/>
																						<Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
																							ID: {region.id}
																						</Typography>
																					</Box>
																					{region.comment && (
																						<Typography
																							variant="body2"
																							sx={{ fontSize: '0.8rem', color: '#333', fontStyle: 'italic' }}
																						>
																							"{region.comment}"
																						</Typography>
																					)}
																					{region.type === 'point' && (
																						<Typography
																							variant="caption"
																							sx={{ color: '#666', fontSize: '0.7rem', display: 'block', mt: 0.5 }}
																						>
																							Position: ({region.x}, {region.y})
																						</Typography>
																					)}
																					{region.type === 'polygon' && region.points && (
																						<Typography
																							variant="caption"
																							sx={{ color: '#666', fontSize: '0.7rem', display: 'block', mt: 0.5 }}
																						>
																							Points: {region.points.length} vertices
																						</Typography>
																					)}
																					{region.cls && (
																						<Typography
																							variant="caption"
																							sx={{ color: '#666', fontSize: '0.7rem', display: 'block', mt: 0.5 }}
																						>
																							Class: {region.cls}
																						</Typography>
																					)}
																				</Box>
																			))}
																		</Box>
																	)}
																</Box>
															);
														})}
													</Paper>
												</Box>
											);
										}
									}
									return null;
								})}
						</Box>
					)}

					{/* Summary Statistics */}
					<Box sx={{ mt: 2, p: 1.5, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
						<Grid container spacing={1.5}>
							<Grid size={{ xs: 6, sm: 3 }}>
								<Typography variant="caption" sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}>
									Total Parameters
								</Typography>
								<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
									{Object.keys(data).filter(key => key !== 'data' && key !== 'startTime' && key !== 'endTime').length}
								</Typography>
							</Grid>
							<Grid size={{ xs: 6, sm: 3 }}>
								<Typography variant="caption" sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}>
									CTQ Parameters
								</Typography>
								<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
									{inspectionParams.filter(p => p.ctq).length}
								</Typography>
							</Grid>
							<Grid size={{ xs: 6, sm: 3 }}>
								<Typography variant="caption" sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}>
									With Images
								</Typography>
								<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
									{
										Object.values(data).filter(
											// eslint-disable-next-line @typescript-eslint/no-explicit-any
											(param: any) =>
												typeof param === 'object' && param?.annotations && Array.isArray(param.annotations)
										).length
									}
								</Typography>
							</Grid>
							<Grid size={{ xs: 6, sm: 3 }}>
								<Typography variant="caption" sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}>
									Total Annotations
								</Typography>
								<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
									{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
									{Object.values(data).reduce((total: number, param: any) => {
										if (typeof param === 'object' && param?.annotations && Array.isArray(param.annotations)) {
											return (
												total +
												// eslint-disable-next-line @typescript-eslint/no-explicit-any
												param.annotations.reduce((annotationTotal: number, annotation: any) => {
													return annotationTotal + (annotation.regions?.length || 0);
												}, 0)
											);
										}
										return total;
									}, 0)}
								</Typography>
							</Grid>
						</Grid>
					</Box>
				</Box>
			);
		}

		// Fallback for other types
		return (
			<Box>
				<Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
					Step Completed
				</Typography>
				<Card variant="outlined" sx={{ backgroundColor: '#f8f9fa' }}>
					<CardContent sx={{ textAlign: 'center', py: 3 }}>
						<CheckCircle sx={{ fontSize: 48, color: '#4caf50', mb: 2 }} />
						<Typography variant="body1" sx={{ color: '#666' }}>
							This step has been completed successfully
						</Typography>
					</CardContent>
				</Card>
			</Box>
		);
	};

	return (
		<Box sx={{ p: 2 }}>
			{/* Header with Approval Buttons */}
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<IconButton onClick={onBackToStep} sx={{ mr: 1, p: 0.5 }}>
						<ArrowBack />
					</IconButton>
					<Avatar sx={{ bgcolor: 'success.main', mr: 1, width: 32, height: 32 }}>
						<Visibility sx={{ fontSize: 18 }} />
					</Avatar>
					<Box>
						<Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
							Step {previewData.stepNumber} -{' '}
							{previewData.type === 'inspection' ? 'Inspection Report' : 'Measurement Report'}
						</Typography>
						<Typography variant="caption" sx={{ color: 'text.secondary' }}>
							{previewData.title}
						</Typography>
					</Box>
				</Box>

				{/* Approval Buttons in Header */}
				<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
					<Button
						variant={productionApproved ? 'outlined' : 'contained'}
						color={productionApproved ? 'success' : 'primary'}
						onClick={handleApproveProduction}
						disabled={productionApproved}
						startIcon={<Check />}
						size="small"
					>
						{productionApproved
							? previewData.type === 'inspection'
								? 'Inspection Approved'
								: 'Production Approved'
							: previewData.type === 'inspection'
								? 'Approve Inspection'
								: 'Approve Production'}
					</Button>
					{previewData.ctq && (
						<Button
							variant={ctqApproved ? 'outlined' : 'contained'}
							color={ctqApproved ? 'success' : 'warning'}
							onClick={handleApproveCTQ}
							disabled={ctqApproved}
							startIcon={<Check />}
							size="small"
						>
							{ctqApproved ? 'CTQ Approved' : 'Approve CTQ'}
						</Button>
					)}
					<Button
						variant="contained"
						color="success"
						onClick={onProceedToNext}
						disabled={!canProceed}
						startIcon={previewData.stepCompleted ? <CheckCircle /> : <ArrowForward />}
						size="small"
					>
						{previewData.stepCompleted ? 'Completed' : 'Complete Step'}
					</Button>

					{/* Step Type Indicators */}
					<Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
						{previewData.ctq && (
							<Chip
								label="CTQ"
								sx={{
									backgroundColor: '#fff3e0',
									color: '#f57c00',
									fontSize: '0.7rem'
								}}
							/>
						)}
						<Chip
							label={previewData.type}
							sx={{
								backgroundColor: '#f5f5f5',
								color: '#666',
								fontSize: '0.7rem'
							}}
						/>
					</Box>
				</Box>
			</Box>

			{/* Report Data */}
			<Card variant="outlined" sx={{ mb: 2 }}>
				<CardContent sx={{ p: 2 }}>{renderDataSummary()}</CardContent>
			</Card>

			{/* CTQ Warning */}
			{previewData.ctq && !ctqApproved && (
				<Alert severity="warning" sx={{ mb: 2 }}>
					This is a Critical to Quality (CTQ) step. Both Production and CTQ approvals are required to proceed.
				</Alert>
			)}

			{/* Back Button */}
			<Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
				<Button variant="outlined" onClick={onBackToStepGroup || onBackToStep} startIcon={<ArrowBack />} size="small">
					{onBackToStepGroup ? 'Back to Steps' : 'Back to Step'}
				</Button>
			</Box>
		</Box>
	);
};

export default StepPreview;
