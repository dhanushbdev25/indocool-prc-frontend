import React, { useState, useEffect } from 'react';
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
	Collapse,
	Autocomplete,
	CircularProgress
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
	ExpandLess,
	Warning,
	Error as ErrorIcon
} from '@mui/icons-material';
import { type StepPreviewData, type ProceedFromPreviewPayload } from '../../../types/execution.types';
import { useFetchOperationDelayReasonComboQuery } from '../../../../../store/api/business/prc-execution/prc-execution.api';
import { type OperationDelayReasonComboOption } from '../../../../../store/api/business/prc-execution/prc-execution.validators';
import ImageDisplay from './ImageDisplay';
import { debugDataTransformation } from '../../../utils/dataTransformers';
import { useCurrentRole } from '../../../../../hooks/useCurrentRole';
import { toFileRenderUrl } from '../../../../../utils/fileUrl';

interface StepPreviewProps {
	previewData: StepPreviewData;
	onBackToStep: () => void;
	onApproveProduction: () => void;
	onApproveCTQ: () => void;
	onPartialApproveCTQ: () => void;
	onProceedToNext: (payload?: ProceedFromPreviewPayload) => void;
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
	// Dynamic role checks for inspection steps based on approveByProduction and approveByQuality
	// For non-inspection steps, use hardcoded checks
	const canApproveProduction =
		previewData.type === 'inspection'
			? // For inspection: Admin always has access OR (approveByProduction enabled AND Production role)
				currentRole.id === 1 || (previewData.inspectionMetadata?.approveByProduction === true && currentRole.id === 2)
			: // For non-inspection steps: Keep hardcoded checks
				currentRole.id === 1 || currentRole.id === 2;
	const canApproveCTQ =
		previewData.type === 'inspection'
			? // For inspection: Admin always has access OR (approveByQuality enabled AND Quality role)
				currentRole.id === 1 || (previewData.inspectionMetadata?.approveByQuality === true && currentRole.id === 3)
			: // For non-inspection steps: Keep hardcoded checks
				currentRole.id === 1 || currentRole.id === 3;

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
	const [selectedDelayReason, setSelectedDelayReason] = useState<OperationDelayReasonComboOption | null>(null);
	const [ctqMenuAnchor, setCtqMenuAnchor] = useState<null | HTMLElement>(null);
	const [ctqApprovalMode, setCtqApprovalMode] = useState<'full' | 'partial'>('full');

	// Helper function to format seconds to HH:MM:SS
	const formatSecondsToTime = (seconds: number): string => {
		const hours = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = Math.round(seconds % 60);
		return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	// Helper functions for validation status display
	const getValidationIcon = (status: 'Accepted' | 'Lesser' | 'Greater') => {
		switch (status) {
			case 'Accepted':
				return <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />;
			case 'Lesser':
				return <Warning sx={{ color: 'warning.main', fontSize: 20 }} />;
			case 'Greater':
				return <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />;
		}
	};

	const getValidationChip = (status: 'Accepted' | 'Lesser' | 'Greater') => {
		const color = status === 'Accepted' ? 'success' : status === 'Lesser' ? 'warning' : 'error';
		const label = `Range: ${status}`;

		return <Chip icon={getValidationIcon(status)} label={label} color={color} size="small" variant="outlined" />;
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

	const {
		data: operationDelayReasonOptions = [],
		isLoading: isDelayReasonLoading,
		isFetching: isDelayReasonFetching
	} = useFetchOperationDelayReasonComboQuery(undefined, {
		skip: previewData.type !== 'sequence' || !previewData.timingExceeded
	});

	const delayReasonComboBusy = isDelayReasonLoading || isDelayReasonFetching;

	// Hydrate delay reason from saved execution data only. Do not clear when code is missing — the
	// combo list loading would otherwise wipe the user's selection before submit.
	useEffect(() => {
		if (previewData.type !== 'sequence' || !previewData.timingExceeded) {
			setSelectedDelayReason(null);
			return;
		}
		const code = previewData.timingExceededReasonCode;
		if (code === undefined || code === null || code === '') {
			return;
		}
		const match = operationDelayReasonOptions.find(
			o => o.value === code || String(o.value) === String(code)
		);
		if (match) {
			setSelectedDelayReason(match);
		} else if (previewData.timingExceededReasonLabel) {
			setSelectedDelayReason({
				label: previewData.timingExceededReasonLabel,
				value: String(code)
			});
		} else {
			setSelectedDelayReason({ label: String(code), value: String(code) });
		}
	}, [
		previewData.type,
		previewData.timingExceeded,
		previewData.timingExceededReasonCode,
		previewData.timingExceededReasonLabel,
		previewData.stepNumber,
		operationDelayReasonOptions
	]);

	const canProceed =
		productionApproved &&
		(!previewData.ctq || ctqApproved || partialCtqApproved) &&
		!previewData.stepCompleted &&
		(!previewData.timingExceeded ||
			(timingExceededRemarks.trim().length > 0 && selectedDelayReason !== null));

	const parseOkNotOkValue = (rawValue: unknown): { value: string; notOkComment: string } => {
		if (typeof rawValue === 'string') {
			return { value: rawValue, notOkComment: '' };
		}
		if (typeof rawValue === 'object' && rawValue !== null) {
			const rec = rawValue as Record<string, unknown>;
			const value = rec.value;
			const comments = rec.comments;
			const legacy = rec.notOkComment;
			const commentStr =
				typeof comments === 'string' ? comments : typeof legacy === 'string' ? legacy : '';
			return {
				value: typeof value === 'string' ? value : '',
				notOkComment: commentStr
			};
		}
		return { value: '', notOkComment: '' };
	};

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
							<Autocomplete<OperationDelayReasonComboOption, false, false, false>
								fullWidth
								sx={{ mt: 2 }}
								options={operationDelayReasonOptions}
								loading={delayReasonComboBusy}
								value={selectedDelayReason}
								onChange={(_, v) => setSelectedDelayReason(v)}
								getOptionLabel={o => o.label}
								isOptionEqualToValue={(a, b) => a.value === b.value}
								disabled={previewData.stepCompleted}
								renderInput={params => (
									<TextField
										{...params}
										label="Operation delay reason"
										placeholder="Select a reason code"
										required={!previewData.stepCompleted}
										error={!previewData.stepCompleted && !selectedDelayReason}
										helperText={
											!previewData.stepCompleted && !selectedDelayReason
												? 'Required to proceed'
												: undefined
										}
										InputProps={{
											...params.InputProps,
											endAdornment: (
												<>
													{delayReasonComboBusy ? (
														<CircularProgress color="inherit" size={20} />
													) : null}
													{params.InputProps.endAdornment}
												</>
											)
										}}
									/>
								)}
							/>
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
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Range</TableCell>
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
											{measurement.targetValueType === 'table' && Array.isArray(measurement.value) ? (
												<Box>
													<Chip
														label={`Table (${measurement.value.length} rows)`}
														size="small"
														sx={{ backgroundColor: '#f3e8ff', color: '#7b1fa2', fontSize: '0.7rem', height: 20 }}
													/>
													{measurement.tableConfig && (
														<Box
															component="table"
															sx={{
																mt: 1,
																width: '100%',
																borderCollapse: 'collapse',
																fontSize: '0.75rem',
																'& th, & td': { border: '1px solid #e0e0e0', p: 0.5, textAlign: 'left' },
																'& th': { backgroundColor: '#f5f5f5', fontWeight: 600 }
															}}
														>
															<thead>
																<tr>
																	{measurement.tableConfig.columns?.map((col: { name: string }) => (
																		<th key={col.name}>{col.name}</th>
																	))}
																</tr>
															</thead>
															<tbody>
																{measurement.value.map((row: Record<string, string>, rIdx: number) => (
																	<tr key={rIdx}>
																		{measurement.tableConfig.columns?.map((col: { name: string }) => {
																			const cellConfig = measurement.tableConfig.rows?.[rIdx]?.cells?.[col.name];
																			return (
																				<td
																					key={col.name}
																					style={cellConfig?.readOnly ? { backgroundColor: '#f9f9f9', fontStyle: 'italic' } : undefined}
																				>
																					{row[col.name] || '-'}
																				</td>
																			);
																		})}
																	</tr>
																))}
															</tbody>
														</Box>
													)}
												</Box>
											) : (
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
													{measurement.stepType === 'Check' || measurement.stepType === 'Inspection' ? (
														<Chip
															label={(() => {
																const parsedValue = parseOkNotOkValue(measurement.value);
																return parsedValue.value || String(measurement.value || '');
															})()}
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
											)}
											{(() => {
												const parsedValue = parseOkNotOkValue(measurement.value);
												const shouldShowComment =
													parsedValue.value === 'not ok' && parsedValue.notOkComment.trim().length > 0;
												if (!shouldShowComment) return null;
												return (
													<Typography variant="caption" sx={{ color: '#d32f2f', display: 'block', mt: 0.5 }}>
														Comment: {parsedValue.notOkComment}
													</Typography>
												);
											})()}
										</TableCell>
											<TableCell sx={{ py: 1, fontSize: '0.8rem', color: '#666' }}>{measurement.stepType}</TableCell>
											<TableCell sx={{ py: 1, fontSize: '0.8rem', color: '#666' }}>
												{measurement.evaluationMethod}
											</TableCell>
											<TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
												{measurement.stepType === 'Measurement' &&
												measurement.minimumAcceptanceValue &&
												measurement.maximumAcceptanceValue ? (
													<Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
														{measurement.minimumAcceptanceValue} - {measurement.maximumAcceptanceValue}{' '}
														{measurement.uom && measurement.uom !== 'None' ? measurement.uom : ''}
													</Typography>
												) : (
													<Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
														N/A
													</Typography>
												)}
											</TableCell>
											<TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
												{measurement.validationStatus &&
												measurement.minimumAcceptanceValue &&
												measurement.maximumAcceptanceValue ? (
													<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
														{getValidationChip(measurement.validationStatus as 'Accepted' | 'Lesser' | 'Greater')}
													</Box>
												) : (
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
												)}
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: '#666' }}>
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
									let isTableType = false;
									let isFixedTableType = false;
									let tableRowCount = 0;
									let ctqStatus = paramMeta?.ctq || false;
									let parameterName = paramMeta?.parameterName || `Parameter ${parameterId}`;
									let parameterType = paramMeta?.type || 'text';
									let specification = paramMeta?.specification || 'N/A';
									let notOkComment = '';

									if (parameterType === 'table' && paramMeta?.columns && paramMeta.columns.length > 0) {
										isTableType = true;
									}

									if (parameterType === 'fixed-table' && (paramMeta as Record<string, unknown>)?.tableConfig) {
										isFixedTableType = true;
									}

									if (typeof parameterData === 'object' && parameterData !== null) {
										const paramObj = parameterData as Record<string, unknown>;

										if (paramObj.annotations && Array.isArray(paramObj.annotations)) {
											hasAnnotations = true;
										}

										if (paramObj.value) {
											if (isFixedTableType && Array.isArray(paramObj.value)) {
												tableRowCount = (paramObj.value as unknown[]).length;
												displayValue = `${tableRowCount} row${tableRowCount !== 1 ? 's' : ''}`;
											} else if (isTableType && Array.isArray(paramObj.value)) {
												isMultiColumn = true;
												tableRowCount = (paramObj.value as unknown[]).length;
												displayValue = `${tableRowCount} row${tableRowCount !== 1 ? 's' : ''}`;
											} else if (
													typeof paramObj.value === 'object' &&
													paramObj.value !== null &&
													!Array.isArray(paramObj.value)
												) {
													// Multi-column data: { "value": { "Date": "213", "Name": "1" } }
													isMultiColumn = true;
													const valueObj = paramObj.value as Record<string, unknown>;
													displayValue = Object.entries(valueObj)
														.map(([col, val]) => {
															// Format values based on parameter type
															if (parameterType === 'ok/not ok') {
																const parsedValue = parseOkNotOkValue(val);
																const formatted =
																	parsedValue.value === 'ok'
																		? 'OK'
																		: parsedValue.value === 'not ok'
																			? 'Not OK'
																			: parsedValue.value;
																const commentSuffix =
																	parsedValue.value === 'not ok' && parsedValue.notOkComment.trim()
																		? ` (Comment: ${parsedValue.notOkComment})`
																		: '';
																return `${col}: ${formatted}${commentSuffix}`;
															} else if (parameterType === 'datetime') {
																return `${col}: ${val}`;
															}
															return `${col}: ${val}`;
														})
														.join(', ');
												} else {
													// Single value
													if (parameterType === 'ok/not ok') {
														const parsedValue = parseOkNotOkValue(paramObj.value);
														const value = parsedValue.value;
														notOkComment =
															parsedValue.notOkComment ||
															(typeof paramObj.comments === 'string' ? String(paramObj.comments) : '') ||
															(typeof paramObj.notOkComment === 'string' ? String(paramObj.notOkComment) : '');
														displayValue = value === 'ok' ? 'OK' : value === 'not ok' ? 'Not OK' : value;
													} else {
														const value = String(paramObj.value);
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
													cursor: isMultiColumn || isTableType || isFixedTableType ? 'pointer' : 'default'
												}}
												onClick={isMultiColumn || isTableType || isFixedTableType ? () => toggleMultiValueParam(parameterId) : undefined}
											>
												<TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
														{(isMultiColumn || isTableType || isFixedTableType) && (
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
															{isTableType && (
																<Chip
																	label="Table"
																	size="small"
																	sx={{
																		backgroundColor: '#e1f5fe',
																		color: '#0277bd',
																		fontSize: '0.6rem',
																		height: 16,
																		'& .MuiChip-label': { px: 0.5 }
																	}}
																/>
															)}
															{isFixedTableType && (
																<Chip
																	label="Fixed Table"
																	size="small"
																	sx={{
																		backgroundColor: '#f3e8ff',
																		color: '#7b1fa2',
																		fontSize: '0.6rem',
																		height: 16,
																		'& .MuiChip-label': { px: 0.5 }
																	}}
																/>
															)}
															{isMultiColumn && !isTableType && (
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
													{isFixedTableType ? (
														<Typography variant="body2" sx={{ fontWeight: 600, color: '#7b1fa2' }}>
															{tableRowCount} row{tableRowCount !== 1 ? 's' : ''}
														</Typography>
													) : isTableType ? (
														<Typography variant="body2" sx={{ fontWeight: 600, color: '#0277bd' }}>
															{tableRowCount} row{tableRowCount !== 1 ? 's' : ''}
														</Typography>
													) : isMultiColumn ? (
															<Typography variant="body2" sx={{ fontWeight: 600, color: '#7b1fa2' }}>
																{
																	Object.keys(
																		(parameterData as Record<string, unknown>).value as Record<string, unknown>
																	).length
																}{' '}
																fields
															</Typography>
														) : (
															<>
																<Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
																	{displayValue}
																</Typography>
																{parameterType === 'ok/not ok' && displayValue === 'Not OK' && notOkComment.trim() && (
																	<Typography variant="caption" sx={{ color: '#d32f2f', display: 'block', mt: 0.5 }}>
																		Comment: {notOkComment}
																	</Typography>
																)}
															</>
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

											{/* Collapsible Detail Row for Fixed-Table Parameters */}
											{isFixedTableType && (
												<TableRow>
													<TableCell colSpan={7} sx={{ py: 0, border: 'none' }}>
														<Collapse in={expandedMultiValueParams.has(parameterId)} timeout="auto" unmountOnExit>
															<Box sx={{ p: 2, backgroundColor: '#f0f4ff', borderRadius: '8px', m: 1 }}>
																<Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#1a237e' }}>
																	{parameterName} - Fixed Table Data
																</Typography>
																{(() => {
																	const tc = (paramMeta as Record<string, unknown>)?.tableConfig as {
																		columns?: Array<{ name: string; type: string }>;
																		rows?: Array<{ cells: Record<string, { value: string; readOnly: boolean }> }>;
																	} | null;
																	const rows = Array.isArray((parameterData as Record<string, unknown>).value)
																		? ((parameterData as Record<string, unknown>).value as Record<string, string>[])
																		: [];
																	const rowMappings = Array.isArray(paramMeta?.rowMappings) ? paramMeta.rowMappings : [];
																	const rowAnnotations = Array.isArray((parameterData as Record<string, unknown>).rowAnnotations)
																		? ((parameterData as Record<string, unknown>).rowAnnotations as Array<{
																				rowIndex: number;
																				annotations: Array<{
																					imageFileName: string;
																					imageUrl?: string;
																					regions?: unknown[];
																				}>;
																			}>)
																		: [];
																	if (!tc?.columns) return <Typography variant="body2" color="text.secondary">No table configuration</Typography>;
																	return (
																		<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflow: 'hidden' }}>
																			<Table size="small">
																				<TableHead>
																					<TableRow sx={{ backgroundColor: '#e8eaf6' }}>
																						{tc.columns.map(col => (
																							<TableCell key={col.name} sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75, px: 1, borderRight: '1px solid #e0e0e0' }}>
																								{col.name}
																								<Typography variant="caption" sx={{ display: 'block', color: '#666', fontWeight: 400, fontSize: '0.65rem' }}>
																									{col.type}
																								</Typography>
																							</TableCell>
																						))}
																						<TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75, px: 1 }}>
																							Row Images
																						</TableCell>
																					</TableRow>
																				</TableHead>
																				<TableBody>
																					{rows.map((row, rIdx) => (
																						<TableRow key={rIdx} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}>
																							{tc.columns!.map(col => {
																								const cellConfig = tc.rows?.[rIdx]?.cells?.[col.name];
																								const cellValue = row[col.name] || '';
																								return (
																									<TableCell
																										key={col.name}
																										sx={{
																											fontSize: '0.75rem',
																											py: 0.5,
																											px: 1,
																											borderRight: '1px solid #e0e0e0',
																											maxWidth: 150,
																											...(cellConfig?.readOnly ? { backgroundColor: '#f5f5f5', fontStyle: 'italic' } : {})
																										}}
																									>
																										<Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cellValue}>
																											{cellValue || '-'}
																										</Typography>
																									</TableCell>
																								);
																							})}
																							<TableCell sx={{ minWidth: 260 }}>
																								{(() => {
																									const mappedFiles = rowMappings.find(m => m.rowIndex === rIdx)?.fileName || [];
																									const rowAnn = rowAnnotations.find(a => a.rowIndex === rIdx)?.annotations || [];
																									if (rowAnn.length === 0) {
																										return (
																											<Typography variant="caption" sx={{ color: '#999' }}>
																												No row annotations
																											</Typography>
																										);
																									}

																									return (
																										<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
																											{rowAnn.map((annotation, annIdx) => {
																												const mappedFile =
																													mappedFiles.find(f => f.fileName === annotation.imageFileName) ||
																													paramMeta?.files?.find(f => f.fileName === annotation.imageFileName);
																												const imageUrl = annotation.imageUrl
																													? toFileRenderUrl(annotation.imageUrl)
																													: toFileRenderUrl(mappedFile?.filePath);
																												return (
																													<ImageDisplay
																														key={`${parameterId}-${rIdx}-${annIdx}-${annotation.imageFileName}`}
																														imageUrl={imageUrl}
																														imageFileName={annotation.imageFileName}
																														originalFileName={
																															mappedFile?.originalFileName || annotation.imageFileName
																														}
																														annotations={annotation.regions || []}
																														readOnly={true}
																														showAnnotations={true}
																													/>
																												);
																											})}
																										</Box>
																									);
																								})()}
																							</TableCell>
																						</TableRow>
																					))}
																				</TableBody>
																			</Table>
																		</TableContainer>
																	);
																})()}
															</Box>
														</Collapse>
													</TableCell>
												</TableRow>
											)}

											{/* Collapsible Detail Row for Multi-Column and Table Parameters */}
											{isMultiColumn && (
													<TableRow>
														<TableCell colSpan={7} sx={{ py: 0, border: 'none' }}>
															<Collapse in={expandedMultiValueParams.has(parameterId)} timeout="auto" unmountOnExit>
																<Box
																	sx={{
																		p: 2,
																		backgroundColor: isTableType ? '#f0f4ff' : '#f8f9fa',
																		border: isTableType ? 'none' : '1px solid #e0e0e0',
																		borderRadius: '8px',
																		m: 1
																	}}
																>
																	<Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: isTableType ? '#1a237e' : '#333' }}>
																		{parameterName} - {isTableType ? 'Table Data' : 'Detailed Values'}
																	</Typography>
																	<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflow: 'hidden' }}>
																		<Table size="small">
																			<TableHead>
																				<TableRow sx={{ backgroundColor: '#e8eaf6' }}>
																					{paramMeta?.columns?.map(column => (
																						<TableCell
																							key={column.name}
																							sx={{
																								fontWeight: 600,
																								fontSize: '0.75rem',
																								py: 0.75,
																								px: 1,
																								borderRight: '1px solid #e0e0e0'
																							}}
																						>
																							{column.name}
																							{isTableType && (
																								<Typography variant="caption" sx={{ display: 'block', color: '#666', fontWeight: 400, fontSize: '0.65rem' }}>
																									{column.type}
																								</Typography>
																							)}
																						</TableCell>
																					))}
																				</TableRow>
																			</TableHead>
																			<TableBody>
																				{isTableType &&
																				Array.isArray((parameterData as Record<string, unknown>).value) ? (
																					// Table type: render multiple rows
																					(
																						(parameterData as Record<string, unknown>).value as Record<
																							string,
																							unknown
																						>[]
																					).map((row, rowIndex) => (
																						<TableRow key={rowIndex} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}>
																							{paramMeta?.columns?.map(column => {
																								const value = row[column.name];
																								const parsedValue =
																									column.type === 'ok/not ok'
																										? parseOkNotOkValue(value)
																										: { value: String(value || ''), notOkComment: '' };
																								const formattedValue =
																									column.type === 'ok/not ok'
																										? parsedValue.value === 'ok'
																											? 'OK'
																											: parsedValue.value === 'not ok'
																												? 'Not OK'
																												: String(parsedValue.value || '')
																										: String(value || '');

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
																										{column.type === 'ok/not ok' &&
																											parsedValue.value === 'not ok' &&
																											parsedValue.notOkComment.trim() && (
																												<Typography
																													variant="caption"
																													sx={{ color: '#d32f2f', display: 'block', mt: 0.5 }}
																												>
																													Comment: {parsedValue.notOkComment}
																												</Typography>
																											)}
																									</TableCell>
																								);
																							})}
																						</TableRow>
																					))
																				) : (
																					// Multi-column single row
																					<TableRow>
																						{paramMeta?.columns?.map(column => {
																							const value = (
																								(parameterData as Record<string, unknown>).value as Record<
																									string,
																									unknown
																								>
																							)[column.name];
																							const parsedValue =
																								column.type === 'ok/not ok'
																									? parseOkNotOkValue(value)
																									: { value: String(value), notOkComment: '' };
																							const formattedValue =
																								column.type === 'ok/not ok'
																									? parsedValue.value === 'ok'
																										? 'OK'
																										: parsedValue.value === 'not ok'
																											? 'Not OK'
																											: String(parsedValue.value)
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
																									{column.type === 'ok/not ok' &&
																										parsedValue.value === 'not ok' &&
																										parsedValue.notOkComment.trim() && (
																											<Typography
																												variant="caption"
																												sx={{ color: '#d32f2f', display: 'block', mt: 0.5 }}
																											>
																												Comment: {parsedValue.notOkComment}
																											</Typography>
																										)}
																								</TableCell>
																							);
																						})}
																					</TableRow>
																				)}
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
															let imageUrl = annotation.imageUrl
																? toFileRenderUrl(annotation.imageUrl)
																: '';
															if (!imageUrl) {
																const matchedFilePath = paramMeta?.files?.find(
																	file => file.fileName === annotation.imageFileName
																)?.filePath;
																imageUrl = toFileRenderUrl(matchedFilePath);
															}

															// Normalize URL - replace backslashes with forward slashes
															imageUrl = imageUrl.replace(/\\/g, '/');

															console.log('🖼️ StepPreview: Image URL construction:', {
																parameterId,
																annotationIndex,
																annotation,
																paramMeta,
																imageUrl,
																annotationImageUrl: annotation.imageUrl,
																constructedUrl: toFileRenderUrl(
																	paramMeta?.files?.find(file => file.fileName === annotation.imageFileName)?.filePath
																)
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
						onClick={() =>
							onProceedToNext(
								previewData.timingExceeded
									? {
											timingExceededRemarks: timingExceededRemarks.trim(),
											timingExceededReasonCode: selectedDelayReason?.value,
											timingExceededReasonLabel: selectedDelayReason?.label
										}
									: undefined
							)
						}
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
