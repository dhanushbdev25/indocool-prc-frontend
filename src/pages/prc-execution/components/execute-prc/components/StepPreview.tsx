import React, { useState } from 'react';
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
	Grid,
	TextField,
	ButtonGroup,
	Menu,
	MenuItem,
	Collapse
} from '@mui/material';
import {
	ArrowBack,
	CheckCircle,
	Visibility,
	Check,
	ArrowForward,
	AccessTime,
	ArrowDropDown,
	ExpandMore,
	ExpandLess
} from '@mui/icons-material';
import { type StepPreviewData } from '../../../types/execution.types';
import ImageDisplay from './ImageDisplay';
import { debugDataTransformation } from '../../../utils/dataTransformers';
import { useCurrentRole } from '../../../../../hooks/useCurrentRole';

interface StepPreviewProps {
	previewData: StepPreviewData;
	onBackToStep: () => void;
	onApproveProduction: () => void;
	onApproveCTQ: () => void;
	onPartialApproveCTQ: () => void;
	onProceedToNext: (timingExceededRemarks?: string) => void;
	onBackToStepGroup?: () => void;
}

const StepPreview = ({
	previewData,
	onBackToStep,
	onApproveProduction,
	onApproveCTQ,
	onPartialApproveCTQ,
	onProceedToNext,
	onBackToStepGroup
}: StepPreviewProps) => {
	const { currentRole } = useCurrentRole();
	const canApproveProduction = currentRole.id === 1 || currentRole.id === 2;
	const canApproveCTQ = currentRole.id === 1 || currentRole.id === 3;

	const [productionApproved, setProductionApproved] = useState(previewData.productionApproved || false);
	const [ctqApproved, setCtqApproved] = useState(previewData.ctqApproved || false);
	const [expandedMultiValueParams, setExpandedMultiValueParams] = useState<Set<string>>(new Set());
	const [partialCtqApproved, setPartialCtqApproved] = useState(previewData.partialCtqApprove || false);

	const toggleMultiValueParam = (parameterId: string) => {
		setExpandedMultiValueParams(prev => {
			const newSet = new Set(prev);
			if (newSet.has(parameterId)) {
				newSet.delete(parameterId);
			} else {
				newSet.add(parameterId);
			}
			return newSet;
		});
	};
	const [timingExceededRemarks, setTimingExceededRemarks] = useState('');
	const [ctqMenuAnchor, setCtqMenuAnchor] = useState<null | HTMLElement>(null);
	const [ctqApprovalMode, setCtqApprovalMode] = useState<'full' | 'partial'>('full');

	// Helper function to format seconds to HH:MM:SS
	const formatSecondsToTime = (seconds: number): string => {
		const hours = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = Math.round(seconds % 60);
		return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

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
		if (ctqApprovalMode === 'full') {
			setCtqApproved(true);
			onApproveCTQ();
		} else {
			setPartialCtqApproved(true);
			onPartialApproveCTQ();
		}
	};

	const handleCtqMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setCtqMenuAnchor(event.currentTarget);
	};

	const handleCtqMenuClose = () => {
		setCtqMenuAnchor(null);
	};

	const handleSelectFullApproval = () => {
		setCtqApprovalMode('full');
		setCtqMenuAnchor(null);
	};

	const handleSelectPartialApproval = () => {
		setCtqApprovalMode('partial');
		setCtqMenuAnchor(null);
	};

	const canProceed =
		productionApproved &&
		(!previewData.ctq || ctqApproved || partialCtqApproved) &&
		!previewData.stepCompleted &&
		(!previewData.timingExceeded || timingExceededRemarks.trim().length > 0);

	const renderDataSummary = () => {
		let { data } = previewData;

		// Transform data if it's in the new nested format
		if (previewData.type === 'inspection' && typeof data === 'object' && data !== null) {
			console.log('🔍 StepPreview: Processing inspection data...', data);

			// Check if data has the nested structure (prcAggregatedSteps format)
			const dataKeys = Object.keys(data);
			console.log('🔍 StepPreview: Data keys:', dataKeys);

			// Check if any parameter has annotations in object format instead of array format
			const needsTransformation = dataKeys.some(key => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const value = (data as any)[key];
				if (typeof value === 'object' && value !== null && 'annotations' in value) {
					const annotations = value.annotations;
					// Check if annotations is an object instead of an array
					return typeof annotations === 'object' && annotations !== null && !Array.isArray(annotations);
				}
				return false;
			});

			if (needsTransformation) {
				console.log('🔄 StepPreview: Detected object-based annotations, transforming...', data);

				// Transform the data to convert object-based annotations to arrays
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const transformedData: Record<string, any> = {};

				Object.entries(data).forEach(([key, value]) => {
					// Skip system parameters
					if (['stepCompleted', 'productionApproved', 'ctqApproved', 'partialCtqApprove'].includes(key)) {
						return;
					}

					if (typeof value === 'object' && value !== null) {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const transformedParam: any = {};

						// Copy value if it exists
						if ('value' in value) {
							transformedParam.value = value.value;
						}

						// Transform annotations from object to array
						if ('annotations' in value && value.annotations) {
							const annotations = value.annotations;
							if (typeof annotations === 'object' && !Array.isArray(annotations)) {
								// Convert object to array and transform regions within each annotation
								transformedParam.annotations = Object.keys(annotations)
									.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
									.map(key => {
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										const annotation = (annotations as any)[key];
										if (typeof annotation === 'object' && annotation !== null) {
											const transformedAnnotation = { ...annotation };

											// Transform regions from object to array
											if ('regions' in annotation && annotation.regions) {
												const regions = annotation.regions;
												if (typeof regions === 'object' && !Array.isArray(regions)) {
													// Convert regions object to array
													transformedAnnotation.regions = Object.keys(regions)
														.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
														.map(regionKey => {
															// eslint-disable-next-line @typescript-eslint/no-explicit-any
															const region = (regions as any)[regionKey];
															if (typeof region === 'object' && region !== null) {
																const transformedRegion = { ...region };

																// Transform points from object to array
																if ('points' in region && region.points) {
																	const points = region.points;
																	if (typeof points === 'object' && !Array.isArray(points)) {
																		// Convert points object to array
																		transformedRegion.points = Object.keys(points)
																			.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
																			.map(pointKey => {
																				// eslint-disable-next-line @typescript-eslint/no-explicit-any
																				const point = (points as any)[pointKey];
																				if (
																					typeof point === 'object' &&
																					point !== null &&
																					'0' in point &&
																					'1' in point
																				) {
																					return [point['0'], point['1']];
																				}
																				return [0, 0];
																			});
																	}
																}

																return transformedRegion;
															}
															return region;
														});
												}
											}

											return transformedAnnotation;
										}
										return annotation;
									});
							} else {
								transformedParam.annotations = annotations;
							}
						}

						// Only add if there's actual data
						if (Object.keys(transformedParam).length > 0) {
							transformedData[key] = transformedParam;
						}
					}
				});

				data = transformedData;
				debugDataTransformation(previewData.data, data, 'StepPreview');
			} else {
				console.log('StepPreview: Data appears to be in expected format already');
			}
		}

		if (previewData.type === 'sequence') {
			// Handle sequence data - show as compact report table
			return (
				<Box>
					{/* Timing Exceeded Warning */}
					{previewData.timingExceeded && (
						<Box sx={{ mb: 2 }}>
							<Alert
								severity="warning"
								sx={{
									mb: 1,
									border: '1px solid #ff9800',
									backgroundColor: '#fff8e1',
									'& .MuiAlert-icon': {
										color: '#f57c00'
									}
								}}
								icon={<AccessTime sx={{ fontSize: 20 }} />}
							>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
									<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#e65100' }}>
										Timing Exceeded
									</Typography>
									<Chip
										label={`+${Math.round((previewData.actualDuration || 0) - (previewData.expectedDuration || 0))}s`}
										size="small"
										sx={{
											backgroundColor: '#ff5722',
											color: 'white',
											fontSize: '0.7rem',
											fontWeight: 600,
											height: 20
										}}
									/>
								</Box>
								<Typography variant="body2" sx={{ color: '#bf360c', fontSize: '0.875rem' }}>
									<strong>{formatSecondsToTime(previewData.actualDuration || 0)}</strong> actual vs{' '}
									<strong>{formatSecondsToTime(previewData.expectedDuration || 0)}</strong> expected
								</Typography>
							</Alert>
							<TextField
								fullWidth
								multiline
								rows={2}
								label="Reason for delay"
								placeholder="Brief explanation for the timing delay"
								value={
									previewData.stepCompleted
										? previewData.timingExceededRemarks || 'No reason provided'
										: timingExceededRemarks
								}
								onChange={e => setTimingExceededRemarks(e.target.value)}
								required={!previewData.stepCompleted}
								disabled={previewData.stepCompleted}
								sx={{
									mt: 2,
									'& .MuiOutlinedInput-root': {
										borderColor: !previewData.stepCompleted && !timingExceededRemarks.trim() ? '#f44336' : '#e0e0e0',
										'&:hover .MuiOutlinedInput-notchedOutline': {
											borderColor: !previewData.stepCompleted && !timingExceededRemarks.trim() ? '#f44336' : '#1976d2'
										},
										'&.Mui-disabled': {
											backgroundColor: '#f5f5f5',
											color: '#666'
										}
									}
								}}
								error={!previewData.stepCompleted && !timingExceededRemarks.trim()}
								helperText={'Required to proceed'}
							/>
						</Box>
					)}
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
															{Array.isArray(measurement.value) ? measurement.value.join(', ') : measurement.value}{' '}
															{measurement.uom && measurement.uom !== 'None' ? measurement.uom : ''}
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

					{/* Responsible Person Information */}
					{(() => {
						// Check for responsible person data in both array format and object format (backward compatibility)
						interface ResponsiblePerson {
							role: string;
							employeeName: string;
							employeeCode: string;
						}

						interface StepGroup {
							stepId: string;
							parameterDescription: string;
							responsiblePersons: ResponsiblePerson[];
						}

						let responsiblePersons: StepGroup[] = [];
						let displayResponsiblePersons: boolean = false;

						// For sequence type: Check if any measurement in the data array has responsiblePersons
						if (Array.isArray(data)) {
							// Group responsible persons by step
							const stepGroups: Record<string, StepGroup> = {};

							data.forEach((measurement: unknown, index: number) => {
								const measurementData = measurement as Record<string, unknown>;
								if (measurementData.responsiblePersons && Array.isArray(measurementData.responsiblePersons)) {
									console.log(
										`✅ Found responsiblePersons in measurement ${index}:`,
										measurementData.responsiblePersons
									);

									const stepId = (measurementData.stepId as string) || `Step ${index + 1}`;
									const parameterDescription =
										(measurementData.parameterDescription as string) || `Parameter ${index + 1}`;

									// Initialize step group if not exists
									if (!stepGroups[stepId]) {
										stepGroups[stepId] = {
											stepId: stepId,
											parameterDescription: parameterDescription,
											responsiblePersons: []
										};
									}

									// Add responsible persons to this step group
									measurementData.responsiblePersons.forEach((person: unknown) => {
										const personData = person as Record<string, unknown>;
										stepGroups[stepId].responsiblePersons.push({
											role: (personData.role as string) || '',
											employeeName: (personData.employeeName as string) || '',
											employeeCode: (personData.employeeCode as string) || ''
										});
									});
								}
							});

							// Convert to array for rendering
							responsiblePersons = Object.values(stepGroups);
							displayResponsiblePersons =
								responsiblePersons.filter(e => e?.responsiblePersons?.length)?.length > 0 ? true : false;
						}

						return (
							displayResponsiblePersons && (
								<Box sx={{ mt: 2 }}>
									<Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#333' }}>
										Responsible Person Details:
									</Typography>

									{responsiblePersons.map((stepGroup: StepGroup, groupIndex: number) =>
										stepGroup.responsiblePersons.length ? (
											<Box key={groupIndex} sx={{ mb: 2 }}>
												{/* Step Header */}
												<Box
													sx={{
														backgroundColor: '#f5f5f5',
														p: 1.5,
														borderRadius: '4px 4px 0 0',
														border: '1px solid #e0e0e0',
														borderBottom: 'none'
													}}
												>
													<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333', fontSize: '0.9rem' }}>
														Step {stepGroup.stepId}: {stepGroup.parameterDescription}
													</Typography>
												</Box>

												{/* Responsible Persons Table */}
												<TableContainer
													component={Paper}
													variant="outlined"
													sx={{ borderRadius: '0 0 4px 4px', borderTop: 'none' }}
												>
													<Table size="small">
														<TableHead>
															<TableRow sx={{ backgroundColor: '#fafafa' }}>
																<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Role</TableCell>
																<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Employee Name</TableCell>
																<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Employee Code</TableCell>
															</TableRow>
														</TableHead>
														<TableBody>
															{stepGroup.responsiblePersons.map((person: ResponsiblePerson, personIndex: number) => (
																<TableRow key={personIndex} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
																	<TableCell sx={{ fontSize: '0.875rem', py: 1 }}>
																		{person.role?.toUpperCase()}
																	</TableCell>
																	<TableCell sx={{ fontSize: '0.875rem', py: 1 }}>{person.employeeName}</TableCell>
																	<TableCell sx={{ fontSize: '0.875rem', py: 1 }}>{person.employeeCode}</TableCell>
																</TableRow>
															))}
														</TableBody>
													</Table>
												</TableContainer>
											</Box>
										) : (
											<></>
										)
									)}
								</Box>
							)
						);
					})()}
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
						{
							Object.keys(data).filter(
								key =>
									key !== 'data' &&
									key !== 'startTime' &&
									key !== 'endTime' &&
									key !== 'stepCompleted' &&
									key !== 'productionApproved' &&
									key !== 'ctqApproved'
							).length
						}{' '}
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
									.filter(
										([key]) =>
											key !== 'data' &&
											key !== 'startTime' &&
											key !== 'endTime' &&
											key !== 'stepCompleted' &&
											key !== 'productionApproved' &&
											key !== 'ctqApproved'
									)
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
														.map(([col, val]) => {
															// Format values based on parameter type
															if (parameterType === 'ok/not ok') {
																return `${col}: ${val === 'ok' ? 'OK' : val === 'not ok' ? 'Not OK' : val}`;
															} else if (parameterType === 'datetime') {
																return `${col}: ${val}`;
															}
															return `${col}: ${val}`;
														})
														.join(', ');
												} else {
													// Single value
													const value = String(paramObj.value);
													if (parameterType === 'ok/not ok') {
														displayValue = value === 'ok' ? 'OK' : value === 'not ok' ? 'Not OK' : value;
													} else {
														displayValue = value;
													}
												}
											}
										} else {
											// Simple string/number value
											const value = String(parameterData);
											if (parameterType === 'ok/not ok') {
												displayValue = value === 'ok' ? 'OK' : value === 'not ok' ? 'Not OK' : value;
											} else {
												displayValue = value;
											}
										}

										return (
											<React.Fragment key={parameterId}>
												{/* Main Row */}
												<TableRow
													sx={{
														'&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
														'&:hover': { backgroundColor: '#f0f0f0' },
														cursor: isMultiColumn ? 'pointer' : 'default'
													}}
													onClick={isMultiColumn ? () => toggleMultiValueParam(parameterId) : undefined}
												>
													<TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
														<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
															{isMultiColumn && (
																<IconButton size="small" sx={{ p: 0.25 }}>
																	{expandedMultiValueParams.has(parameterId) ? <ExpandLess /> : <ExpandMore />}
																</IconButton>
															)}
															<Typography variant="body2" sx={{ fontWeight: 500 }}>
																{index + 1}
															</Typography>
														</Box>
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
														{isMultiColumn ? (
															<Typography variant="body2" sx={{ fontWeight: 600, color: '#7b1fa2' }}>
																{
																	Object.keys(
																		(parameterData as Record<string, unknown>).value as Record<string, unknown>
																	).length
																}{' '}
																fields
															</Typography>
														) : (
															<Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
																{displayValue}
															</Typography>
														)}
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

												{/* Collapsible Detail Row for Multi-Column Parameters */}
												{isMultiColumn && (
													<TableRow>
														<TableCell colSpan={7} sx={{ py: 0, border: 'none' }}>
															<Collapse in={expandedMultiValueParams.has(parameterId)} timeout="auto" unmountOnExit>
																<Box
																	sx={{
																		p: 2,
																		backgroundColor: '#f8f9fa',
																		border: '1px solid #e0e0e0',
																		borderRadius: 1,
																		m: 1
																	}}
																>
																	<Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#333' }}>
																		{parameterName} - Detailed Values
																	</Typography>
																	<TableContainer component={Paper} variant="outlined">
																		<Table size="small">
																			<TableHead>
																				<TableRow sx={{ backgroundColor: '#fafafa' }}>
																					{paramMeta?.columns?.map(column => (
																						<TableCell
																							key={column.name}
																							sx={{
																								fontWeight: 600,
																								fontSize: '0.75rem',
																								py: 0.5,
																								px: 1,
																								borderRight: '1px solid #e0e0e0'
																							}}
																						>
																							{column.name}
																						</TableCell>
																					))}
																				</TableRow>
																			</TableHead>
																			<TableBody>
																				<TableRow>
																					{paramMeta?.columns?.map(column => {
																						const value = (
																							(parameterData as Record<string, unknown>).value as Record<
																								string,
																								unknown
																							>
																						)[column.name];
																						const formattedValue =
																							column.type === 'ok/not ok'
																								? value === 'ok'
																									? 'OK'
																									: value === 'not ok'
																										? 'Not OK'
																										: String(value)
																								: String(value);

																						return (
																							<TableCell
																								key={column.name}
																								sx={{
																									fontSize: '0.75rem',
																									py: 0.5,
																									px: 1,
																									borderRight: '1px solid #e0e0e0',
																									maxWidth: 150
																								}}
																							>
																								<Typography
																									variant="body2"
																									sx={{
																										overflow: 'hidden',
																										textOverflow: 'ellipsis',
																										whiteSpace: 'nowrap'
																									}}
																									title={formattedValue}
																								>
																									{formattedValue}
																								</Typography>
																							</TableCell>
																						);
																					})}
																				</TableRow>
																			</TableBody>
																		</Table>
																	</TableContainer>
																</Box>
															</Collapse>
														</TableCell>
													</TableRow>
												)}
											</React.Fragment>
										);
									})}
							</TableBody>
						</Table>
					</TableContainer>

					{/* Image Annotations Section */}
					{Object.entries(data)
						.filter(
							([key]) =>
								key !== 'data' &&
								key !== 'startTime' &&
								key !== 'endTime' &&
								key !== 'stepCompleted' &&
								key !== 'productionApproved' &&
								key !== 'ctqApproved'
						)
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
								.filter(
									([key]) =>
										key !== 'data' &&
										key !== 'startTime' &&
										key !== 'endTime' &&
										key !== 'stepCompleted' &&
										key !== 'productionApproved' &&
										key !== 'ctqApproved'
								)
								.map(([parameterId, parameterData]) => {
									// Find the corresponding inspection parameter metadata
									const paramMeta = inspectionParams.find(p => p.id.toString() === parameterId);

									if (typeof parameterData === 'object' && parameterData !== null && 'annotations' in parameterData) {
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										const annotations = (parameterData as any).annotations;
										console.log('🖼️ StepPreview: Processing annotations for parameter:', {
											parameterId,
											parameterData,
											annotations,
											isArray: Array.isArray(annotations),
											length: annotations?.length
										});

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

															// Construct image URL - use annotation.imageUrl if available, otherwise construct from filePath
															let imageUrl =
																annotation.imageUrl ||
																`${process.env.API_BASE_URL_PRE_AUTH}${paramMeta?.files?.find(file => file.fileName === annotation.imageFileName)?.filePath || ''}`;

															// Normalize URL - replace backslashes with forward slashes
															imageUrl = imageUrl.replace(/\\/g, '/');

															console.log('🖼️ StepPreview: Image URL construction:', {
																parameterId,
																annotationIndex,
																annotation,
																paramMeta,
																imageUrl,
																annotationImageUrl: annotation.imageUrl,
																constructedUrl: `${process.env.API_BASE_URL_PRE_AUTH}${paramMeta?.files?.find(file => file.fileName === annotation.imageFileName)?.filePath || ''}`
															});

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
																	{/* Image Display with Annotations */}
																	<Box sx={{ mb: 2 }}>
																		<ImageDisplay
																			key={`${parameterId}-${annotationIndex}-${annotation.imageFileName}`}
																			imageUrl={imageUrl}
																			imageFileName={annotation.imageFileName}
																			originalFileName={originalFileName}
																			annotations={annotation.regions || []}
																			readOnly={true}
																			showAnnotations={true}
																		/>
																	</Box>

																	{/* Display annotation regions details */}
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
																						{/* Annotation number badge */}
																						<Chip
																							label={`${regionIndex + 1}`}
																							size="small"
																							sx={{
																								backgroundColor: '#f44336',
																								color: 'white',
																								fontSize: '0.6rem',
																								fontWeight: 'bold',
																								height: 16,
																								minWidth: 20,
																								'& .MuiChip-label': { px: 0.5 }
																							}}
																						/>
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
																					{region.category && (
																						<Box sx={{ mt: 0.5 }}>
																							<Chip
																								label={region.category}
																								size="small"
																								sx={{
																									backgroundColor: '#e3f2fd',
																									color: '#1976d2',
																									fontSize: '0.6rem',
																									height: 18
																								}}
																							/>
																						</Box>
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
									{
										Object.keys(data).filter(
											key =>
												key !== 'data' &&
												key !== 'startTime' &&
												key !== 'endTime' &&
												key !== 'stepCompleted' &&
												key !== 'productionApproved' &&
												key !== 'ctqApproved'
										).length
									}
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
						disabled={
							productionApproved || (!canApproveProduction && !(previewData.type === 'inspection' && canApproveCTQ))
						}
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
						<>
							<ButtonGroup variant={ctqApproved || partialCtqApproved ? 'outlined' : 'contained'} size="small">
								<Button
									color={ctqApproved || partialCtqApproved ? 'success' : 'warning'}
									onClick={handleApproveCTQ}
									disabled={ctqApproved || partialCtqApproved || !canApproveCTQ}
									startIcon={<Check />}
								>
									{ctqApproved
										? 'CTQ Approved'
										: partialCtqApproved
											? 'Partially Approved'
											: ctqApprovalMode === 'partial'
												? 'Partially CTQ Approve'
												: 'CTQ Approve'}
								</Button>
								<Button
									color={ctqApproved || partialCtqApproved ? 'success' : 'warning'}
									onClick={handleCtqMenuOpen}
									disabled={ctqApproved || partialCtqApproved || !canApproveCTQ}
									sx={{ minWidth: 'auto', px: 1 }}
								>
									<ArrowDropDown />
								</Button>
							</ButtonGroup>
							<Menu
								anchorEl={ctqMenuAnchor}
								open={Boolean(ctqMenuAnchor)}
								onClose={handleCtqMenuClose}
								anchorOrigin={{
									vertical: 'bottom',
									horizontal: 'left'
								}}
								transformOrigin={{
									vertical: 'top',
									horizontal: 'left'
								}}
							>
								<MenuItem onClick={handleSelectFullApproval} selected={ctqApprovalMode === 'full'}>
									CTQ Approve
								</MenuItem>
								<MenuItem onClick={handleSelectPartialApproval} selected={ctqApprovalMode === 'partial'}>
									Partially CTQ Approve
								</MenuItem>
							</Menu>
						</>
					)}
					<Button
						variant="contained"
						color="success"
						onClick={() => onProceedToNext(timingExceededRemarks)}
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
			{previewData.ctq && !ctqApproved && !partialCtqApproved && (
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
