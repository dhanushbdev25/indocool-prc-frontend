import { useState, useEffect, useMemo } from 'react';
import {
	Box,
	Typography,
	TextField,
	Button,
	Alert,
	Grid,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Chip,
	IconButton,
	Collapse,
	Tooltip
} from '@mui/material';
import { Image, ExpandMore, ExpandLess, CameraAlt } from '@mui/icons-material';
import {
	type TimelineStep,
	type ExecutionData,
	type FormData,
	type ImageAnnotation
} from '../../../../types/execution.types';
import ImageAnnotator from '../ImageAnnotator';

interface InspectionStepProps {
	step: TimelineStep;
	executionData: ExecutionData;
	onStepComplete: (formData: FormData) => void;
}

const InspectionStep = ({ step, executionData, onStepComplete }: InspectionStepProps) => {
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [annotations, setAnnotations] = useState<ImageAnnotation[]>([]);
	const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
	const [expandedMultiColumnRows, setExpandedMultiColumnRows] = useState<Set<number>>(new Set());
	// Default all annotations to open (no need for expand/collapse state)

	// Compute initial form data from existing data
	const initialFormData = useMemo(() => {
		if (executionData.prcAggregatedSteps) {
			// Try to find data under the correct prcTemplateStepId first
			let existingData = step.stepData?.prcTemplateStepId
				? executionData.prcAggregatedSteps[step.stepData.prcTemplateStepId]
				: undefined;

			// If not found, try to find data under any key that contains inspection parameter data
			if (!existingData) {
				for (const [_key, value] of Object.entries(executionData.prcAggregatedSteps)) {
					if (typeof value === 'object' && value !== null) {
						// Check if this looks like inspection data (has parameter IDs as keys)
						const hasParameterStructure = Object.keys(value).some(paramKey =>
							step.inspectionParameters?.some(param => param.id.toString() === paramKey)
						);
						if (hasParameterStructure) {
							existingData = value;
							break;
						}
					}
				}
			}

			if (existingData && typeof existingData === 'object') {
				// Convert the nested structure to flat form data
				const newFormData: FormData = {};
				const extractedAnnotations: ImageAnnotation[] = [];

				Object.entries(existingData).forEach(([parameterId, parameterData]) => {
					if (typeof parameterData === 'object' && parameterData !== null) {
						// Handle the current storage structure: { "30": { "value": "1", "annotations": [...] } }
						const paramFormData: Record<string, unknown> = {};
						let hasAnnotations = false;

						Object.entries(parameterData).forEach(([columnName, value]) => {
							if (columnName === 'annotations' && Array.isArray(value)) {
								// Handle annotations
								paramFormData.annotations = value;
								extractedAnnotations.push(...(value as ImageAnnotation[]));
								hasAnnotations = true;
								console.log(`Loading annotations for parameter ${parameterId}:`, value);
							} else if (columnName === 'value' && typeof value === 'object' && value !== null) {
								// Handle multi-column data structure: { "value": { "Date": "213", "Name": "1" } }
								// Check if there's double nesting: { "value": { "value": { "Date": "213" } } }
								const actualValue = (value as Record<string, unknown>).value;
								if (actualValue && typeof actualValue === 'object' && actualValue !== null) {
									// Double nesting case: { "value": { "value": { "Date": "213" } } }
									Object.entries(actualValue as Record<string, unknown>).forEach(([subColumnName, subValue]) => {
										const key = `${parameterId}_${subColumnName}`;
										newFormData[key] = String(subValue);
										console.log(
											`Loading double-nested multi-column data: ${parameterId}.value.value.${subColumnName} -> ${key} = ${subValue}`
										);
									});
								} else {
									// Single nesting case: { "value": { "Date": "213" } }
									Object.entries(value as Record<string, unknown>).forEach(([subColumnName, subValue]) => {
										const key = `${parameterId}_${subColumnName}`;
										newFormData[key] = String(subValue);
										console.log(
											`Loading single-nested multi-column data: ${parameterId}.value.${subColumnName} -> ${key} = ${subValue}`
										);
									});
								}
							} else if (columnName === 'value') {
								// Handle single value parameter: { "value": "1" } or { "value": { "value": "1" } }
								const actualValue = (value as Record<string, unknown>).value;
								if (actualValue !== undefined) {
									// Double nesting case: { "value": { "value": "1" } }
									paramFormData.value = String(actualValue);
									console.log(
										`Loading double-nested single value data: ${parameterId}.value.value -> ${parameterId} = ${actualValue}`
									);
								} else {
									// Single nesting case: { "value": "1" }
									paramFormData.value = String(value);
									console.log(
										`Loading single-nested single value data: ${parameterId}.value -> ${parameterId} = ${value}`
									);
								}
							} else {
								// Handle direct column data (fallback)
								const key = `${parameterId}_${columnName}`;
								newFormData[key] = String(value);
								console.log(`Loading direct column data: ${parameterId}.${columnName} -> ${key} = ${value}`);
							}
						});

						// If this parameter has annotations or a value, store it as an object
						if (hasAnnotations || paramFormData.value !== undefined) {
							newFormData[parameterId] = paramFormData;
							console.log(`Stored parameter ${parameterId} as object:`, paramFormData);
						}
					} else {
						// Fallback for old structure: { "7_Resin": "100" }
						newFormData[parameterId] = String(parameterData);
					}
				});

				// Set extracted annotations for backward compatibility
				if (extractedAnnotations.length > 0) {
					newFormData.annotations = extractedAnnotations;
				}

				console.log('Data mapping debug:', {
					existingData,
					mappedFormData: newFormData,
					extractedAnnotations,
					formDataKeys: Object.keys(newFormData)
				});

				return newFormData;
			}
		}
		return {};
	}, [executionData.prcAggregatedSteps, step.stepData, step.inspectionParameters]);

	const [formData, setFormData] = useState<FormData>(initialFormData);

	// Update form data when initial data changes
	useEffect(() => {
		console.log('Initializing form data and annotations:', initialFormData);
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setFormData(initialFormData);

		// Initialize annotations from form data
		if (initialFormData.annotations && Array.isArray(initialFormData.annotations)) {
			console.log('Loading annotations from initialFormData.annotations:', initialFormData.annotations);
			setAnnotations(initialFormData.annotations as ImageAnnotation[]);
		} else {
			// Extract annotations from individual parameter data
			const extractedAnnotations: ImageAnnotation[] = [];
			Object.entries(initialFormData).forEach(([key, value]) => {
				if (typeof value === 'object' && value !== null && 'annotations' in value) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const paramAnnotations = (value as any).annotations;
					if (Array.isArray(paramAnnotations)) {
						console.log(`Loading annotations from parameter ${key}:`, paramAnnotations);
						extractedAnnotations.push(...paramAnnotations);
					}
				}
			});
			console.log('Total extracted annotations:', extractedAnnotations);
			setAnnotations(extractedAnnotations);
		}
	}, [initialFormData]);

	const isReadOnly = step.status === 'completed';

	// Debug logging
	console.log('InspectionStep Debug:', {
		stepStatus: step.status,
		isReadOnly,
		formData,
		stepData: step.stepData,
		inspectionParameters: step.inspectionParameters,
		initialFormData,
		executionData: executionData.prcAggregatedSteps
	});

	const handleParameterChange = (parameterId: number, columnName: string, value: string) => {
		// For single value parameters, use just the parameter ID as key
		// For multi-column parameters, use parameterId_columnName format
		const key = columnName === 'value' ? parameterId.toString() : `${parameterId}_${columnName}`;

		setFormData(prev => {
			const newFormData = { ...prev };

			if (columnName === 'value') {
				// For single value parameters, check if we already have an object structure
				const existingValue = newFormData[parameterId.toString()];
				if (typeof existingValue === 'object' && existingValue !== null) {
					// Preserve existing annotations and other properties
					newFormData[parameterId.toString()] = {
						...existingValue,
						value: value
					};
				} else {
					// Create new object structure
					newFormData[parameterId.toString()] = {
						value: value
					};
				}
			} else {
				// For multi-column parameters, use the flat structure
				newFormData[key] = value;
			}

			return newFormData;
		});

		// Clear error when user starts typing
		if (errors[key]) {
			setErrors(prev => ({
				...prev,
				[key]: ''
			}));
		}
	};

	const handleAnnotationSave = (parameterId: number, newAnnotations: ImageAnnotation[]) => {
		console.log('handleAnnotationSave called with:', { parameterId, newAnnotations });
		setAnnotations(prev => {
			// Remove existing annotations for this parameter
			const filtered = prev.filter(
				ann =>
					!step.inspectionParameters?.find(
						param =>
							param.id === parameterId &&
							Array.isArray(param.files) &&
							param.files.some(file => file.fileName === ann.imageFileName)
					)
			);
			// Add new annotations
			const updated = [...filtered, ...newAnnotations];
			console.log('Updated annotations state:', updated);
			return updated;
		});

		// Also update form data to include annotations
		setFormData(prev => {
			const newFormData = { ...prev };
			if (!newFormData[parameterId.toString()]) {
				newFormData[parameterId.toString()] = {};
			}
			(newFormData[parameterId.toString()] as Record<string, unknown>).annotations = newAnnotations;

			console.log('Updated formData with annotations:', newFormData);
			console.log('Annotations being saved for parameter', parameterId, ':', newAnnotations);
			return newFormData;
		});
	};

	const toggleRowExpansion = (parameterId: number) => {
		setExpandedRows(prev => {
			const newSet = new Set(prev);
			if (newSet.has(parameterId)) {
				newSet.delete(parameterId);
			} else {
				newSet.add(parameterId);
			}
			return newSet;
		});
	};

	const toggleMultiColumnRowExpansion = (parameterId: number) => {
		setExpandedMultiColumnRows(prev => {
			const newSet = new Set(prev);
			if (newSet.has(parameterId)) {
				newSet.delete(parameterId);
			} else {
				newSet.add(parameterId);
			}
			return newSet;
		});
	};

	const getAnnotationCount = (parameterId: number) => {
		return annotations.filter(ann =>
			step.inspectionParameters?.find(
				param =>
					param.id === parameterId &&
					Array.isArray(param.files) &&
					param.files.some(file => file.fileName === ann.imageFileName)
			)
		).length;
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		step.inspectionParameters?.forEach(param => {
			if (param.columns && param.columns.length > 0) {
				// Multi-column parameter
				param.columns.forEach(column => {
					const key = `${param.id}_${column.name}`;
					const value = formData[key];
					if (!value || (typeof value === 'string' && value.trim() === '')) {
						newErrors[key] = `${column.name} is required`;
					} else if (column.type === 'number') {
						const numValue = parseFloat(String(value));
						if (isNaN(numValue)) {
							newErrors[key] = `${column.name} must be a valid number`;
						}
					}
				});
			} else {
				// Single value parameter
				const key = param.id.toString();
				const paramData = formData[key];
				let value: string;

				// Extract value from object structure or use direct value
				if (typeof paramData === 'object' && paramData !== null && 'value' in paramData) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					value = String((paramData as any).value || '');
				} else {
					value = String(paramData || '');
				}

				if (!value || value.trim() === '') {
					newErrors[key] = 'Value is required';
				} else if (param.type === 'number') {
					const numValue = parseFloat(value);
					if (isNaN(numValue)) {
						newErrors[key] = 'Value must be a valid number';
					}
				}
			}
		});

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = () => {
		if (validateForm()) {
			// Convert flat form data to nested structure with annotations
			const nestedData: Record<string, unknown> = {};

			Object.entries(formData).forEach(([key, value]) => {
				if (key.includes('_')) {
					// Multi-column parameter: "30_Date" -> { "30": { "value": { "Date": "2024-01-01" } } }
					const [parameterId, columnName] = key.split('_');
					if (!nestedData[parameterId]) {
						nestedData[parameterId] = {};
					}
					if (!(nestedData[parameterId] as Record<string, unknown>).value) {
						(nestedData[parameterId] as Record<string, unknown>).value = {};
					}
					((nestedData[parameterId] as Record<string, unknown>).value as Record<string, unknown>)[columnName] = value;
					console.log(`Multi-column data: ${key} -> ${parameterId}.value.${columnName} = ${value}`);
				} else if (key !== 'annotations') {
					// Handle both single value parameters and parameter objects
					if (typeof value === 'object' && value !== null) {
						// This is a parameter object (could have value, annotations, or both)
						// e.g., { "53": { "value": "q", "annotations": [...] } } or { "53": { "value": "q" } }
						nestedData[key] = value;
						console.log(`Parameter object: ${key} -> ${JSON.stringify(value)}`);
					} else {
						// Single column parameter: "30" -> { "30": { "value": "2" } }
						if (!nestedData[key]) {
							nestedData[key] = {};
						}
						(nestedData[key] as Record<string, unknown>).value = value;
						console.log(`Single column data: ${key} -> ${key}.value = ${value}`);
					}
				}
			});

			// Add annotations to each parameter that has images (for parameters that don't already have them)
			step.inspectionParameters?.forEach(param => {
				if (Array.isArray(param.files) && param.files.length > 0) {
					const parameterAnnotations = annotations.filter(ann =>
						param.files?.some(file => file.fileName === ann.imageFileName)
					);

					console.log(`Parameter ${param.id} annotations:`, parameterAnnotations);

					if (parameterAnnotations.length > 0) {
						// Ensure parameter structure exists
						if (!nestedData[param.id.toString()]) {
							nestedData[param.id.toString()] = {};
						}

						const paramData = nestedData[param.id.toString()] as Record<string, unknown>;

						// Only add annotations if they don't already exist
						if (!paramData.annotations) {
							paramData.annotations = parameterAnnotations;
							console.log(`Added annotations to parameter ${param.id}:`, parameterAnnotations);
						}
					}
				}
			});

			console.log('Submitting data:', nestedData);
			console.log('Data structure analysis:', {
				formDataKeys: Object.keys(formData),
				formDataTypes: Object.entries(formData).map(([key, value]) => ({
					key,
					type: typeof value,
					isObject: typeof value === 'object'
				})),
				nestedDataKeys: Object.keys(nestedData),
				nestedDataStructure: Object.entries(nestedData).map(([key, value]) => ({
					key,
					type: typeof value,
					hasValue: typeof value === 'object' && value !== null && 'value' in value,
					hasAnnotations: typeof value === 'object' && value !== null && 'annotations' in value,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					valueType: typeof value === 'object' && value !== null ? typeof (value as any).value : 'N/A',
					annotationsCount:
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						typeof value === 'object' && value !== null && Array.isArray((value as any).annotations)
							? // eslint-disable-next-line @typescript-eslint/no-explicit-any
								(value as any).annotations.length
							: 0
				}))
			});
			onStepComplete(nestedData as FormData);
		}
	};

	return (
		<Box sx={{ p: 2, backgroundColor: 'white' }}>
			{/* Compact Step Header */}
			<Box sx={{ mb: 2 }}>
				<Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 0.5, lineHeight: 1.3 }}>
					{step.title}
				</Typography>
				{step.description && step.description !== step.title && (
					<Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
						{step.description}
					</Typography>
				)}
			</Box>

			{/* Inspection Metadata */}
			{step.inspectionMetadata && (
				<Box sx={{ mb: 2, p: 1.5, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
					<Grid container spacing={1.5}>
						<Grid size={{ xs: 6, sm: 3 }}>
							<Typography variant="caption" sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}>
								Inspection ID
							</Typography>
							<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
								{step.inspectionMetadata.inspectionId}
							</Typography>
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<Typography variant="caption" sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}>
								Inspection Type
							</Typography>
							<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
								{step.inspectionMetadata.type}
							</Typography>
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<Typography variant="caption" sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}>
								Status
							</Typography>
							<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
								{step.inspectionMetadata.status}
							</Typography>
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<Typography variant="caption" sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}>
								Version
							</Typography>
							<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
								v{step.inspectionMetadata.version}
							</Typography>
						</Grid>
					</Grid>
				</Box>
			)}

			{/* Inspection Parameters Table */}
			<TableContainer component={Paper} sx={{ mb: 2 }}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>#</TableCell>
							<TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>Parameter Name</TableCell>
							<TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>CTQ</TableCell>
							<TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>Value</TableCell>
							<TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>Images</TableCell>
							<TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>Specification</TableCell>
							<TableCell sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{step.inspectionParameters?.map((param, index) => {
							const hasImages = Array.isArray(param.files) && param.files.length > 0;
							const hasMultipleColumns = param.columns && param.columns.length > 0;
							const isExpanded = expandedRows.has(param.id);
							const isMultiColumnExpanded = expandedMultiColumnRows.has(param.id);
							const annotationCount = getAnnotationCount(param.id);

							return (
								<>
									<TableRow
										key={param.id}
										sx={{
											'&:hover': { backgroundColor: '#f8f9fa' },
											'&:nth-of-type(odd)': { backgroundColor: '#fafafa' }
										}}
									>
										<TableCell sx={{ fontWeight: 500 }}>{index + 1}</TableCell>
										<TableCell>
											<Typography variant="body2" sx={{ fontWeight: 500 }}>
												{param.parameterName}
											</Typography>
											<Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
												{param.type} • {param.role}
												{hasMultipleColumns && ` • ${param.columns?.length} fields`}
											</Typography>
										</TableCell>
										<TableCell>
											{param.ctq && <Chip label="CTQ" size="small" color="warning" sx={{ fontSize: '0.75rem' }} />}
										</TableCell>
										<TableCell>
											{hasMultipleColumns ? (
												// Multi-column parameter - show summary and expand button
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													<Typography variant="caption" sx={{ color: '#666' }}>
														{param.columns?.length} fields
													</Typography>
													<IconButton
														size="small"
														onClick={() => toggleMultiColumnRowExpansion(param.id)}
														sx={{ color: 'primary' }}
													>
														{isMultiColumnExpanded ? <ExpandLess /> : <ExpandMore />}
													</IconButton>
												</Box>
											) : (
												// Single value parameter
												<TextField
													label="Value"
													type={param.type === 'number' ? 'number' : 'text'}
													value={(() => {
														const paramData = formData[param.id.toString()];
														if (typeof paramData === 'object' && paramData !== null && 'value' in paramData) {
															// eslint-disable-next-line @typescript-eslint/no-explicit-any
															return String((paramData as any).value || '');
														}
														return String(paramData || '');
													})()}
													onChange={e => handleParameterChange(param.id, 'value', e.target.value)}
													error={!!errors[param.id.toString()]}
													helperText={errors[param.id.toString()]}
													size="small"
													disabled={isReadOnly}
													variant="outlined"
													inputProps={{
														min: 0,
														step: param.type === 'number' ? 0.01 : undefined
													}}
													sx={{
														minWidth: 120,
														'& .MuiOutlinedInput-root': {
															height: '40px'
														}
													}}
												/>
											)}
										</TableCell>
										<TableCell>
											{hasImages ? (
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													<CameraAlt color="primary" fontSize="small" />
													<Typography variant="caption" sx={{ color: '#666' }}>
														{Array.isArray(param.files) ? param.files.length : 0} file
														{Array.isArray(param.files) && param.files.length !== 1 ? 's' : ''}
													</Typography>
													{annotationCount > 0 && (
														<Chip
															label={annotationCount}
															size="small"
															color="primary"
															sx={{ fontSize: '0.7rem', height: 20 }}
														/>
													)}
												</Box>
											) : (
												<Typography variant="caption" sx={{ color: '#999' }}>
													No images
												</Typography>
											)}
										</TableCell>
										<TableCell>
											<Tooltip title={param.specification} arrow>
												<Typography
													variant="caption"
													sx={{
														color: '#666',
														display: '-webkit-box',
														WebkitLineClamp: 2,
														WebkitBoxOrient: 'vertical',
														overflow: 'hidden',
														maxWidth: 200
													}}
												>
													{param.specification}
												</Typography>
											</Tooltip>
										</TableCell>
										<TableCell>
											<Box sx={{ display: 'flex', gap: 0.5 }}>
												{hasImages && (
													<IconButton
														size="small"
														onClick={() => toggleRowExpansion(param.id)}
														sx={{ color: 'primary' }}
														title="Toggle Image Annotation"
													>
														{isExpanded ? <ExpandLess /> : <ExpandMore />}
													</IconButton>
												)}
											</Box>
										</TableCell>
									</TableRow>

									{/* Expandable Multi-Column Row */}
									{hasMultipleColumns && (
										<TableRow key={`${param.id}-multicolumn`}>
											<TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
												<Collapse in={isMultiColumnExpanded} timeout="auto" unmountOnExit>
													<Box sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
														<Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
															{param.parameterName} - Multiple Fields
														</Typography>

														<Grid container spacing={2}>
															{param.columns?.map(column => {
																const key = `${param.id}_${column.name}`;
																return (
																	<Grid key={column.name} size={{ xs: 12, sm: 6, md: 4 }}>
																		<TextField
																			label={column.name}
																			type={column.type === 'number' ? 'number' : 'text'}
																			value={String(formData[key] || '')}
																			onChange={e => handleParameterChange(param.id, column.name, e.target.value)}
																			error={!!errors[key]}
																			helperText={errors[key]}
																			fullWidth
																			disabled={isReadOnly}
																			variant="outlined"
																			inputProps={{
																				min: 0,
																				step: column.type === 'number' ? 0.01 : undefined
																			}}
																		/>
																		{column.defaultValue && (
																			<Typography variant="caption" sx={{ color: '#666', mt: 0.5, display: 'block' }}>
																				Default: {column.defaultValue}
																			</Typography>
																		)}
																		{column.tolerance && (
																			<Typography variant="caption" sx={{ color: '#666', mt: 0.5, display: 'block' }}>
																				Tolerance: ±{column.tolerance}
																			</Typography>
																		)}
																	</Grid>
																);
															})}
														</Grid>
													</Box>
												</Collapse>
											</TableCell>
										</TableRow>
									)}

									{/* Expandable Image Annotation Row */}
									{hasImages && (
										<TableRow key={`${param.id}-annotations`}>
											<TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
												<Collapse in={isExpanded} timeout="auto" unmountOnExit>
													<Box sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
														<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
															<Image color="primary" />
															<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
																Image Annotation for {param.parameterName}
															</Typography>
														</Box>

														{/* Attached Files Info */}
														<Box
															sx={{
																mb: 2,
																p: 1,
																backgroundColor: '#e3f2fd',
																borderRadius: 0.5,
																border: '1px solid #bbdefb'
															}}
														>
															<Typography
																variant="caption"
																sx={{ fontWeight: 600, color: '#1565c0', fontSize: '0.75rem' }}
															>
																Attached Files
															</Typography>
															<Box sx={{ mt: 0.5 }}>
																{Array.isArray(param.files) &&
																	param.files.map((file, fileIndex) => (
																		<Box
																			key={fileIndex}
																			sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
																		>
																			<Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#1565c0' }}>
																				📎 {file.originalFileName}
																			</Typography>
																		</Box>
																	))}
															</Box>
														</Box>

														<ImageAnnotator
															images={Array.isArray(param.files) ? param.files : []}
															existingAnnotations={(() => {
																const filteredAnnotations = annotations.filter(
																	ann =>
																		Array.isArray(param.files) &&
																		param.files.some(file => file.fileName === ann.imageFileName)
																);
																console.log(`Filtering annotations for parameter ${param.id}:`, {
																	allAnnotations: annotations,
																	paramFiles: param.files,
																	filteredAnnotations
																});
																return filteredAnnotations;
															})()}
															onSave={newAnnotations => handleAnnotationSave(param.id, newAnnotations)}
															readOnly={isReadOnly}
														/>
													</Box>
												</Collapse>
											</TableCell>
										</TableRow>
									)}
								</>
							);
						})}
					</TableBody>
				</Table>
			</TableContainer>

			{/* Validation Alert */}
			{Object.keys(errors).length > 0 && (
				<Alert severity="error" sx={{ mb: 2, py: 1 }}>
					Please fill in all required fields with valid values.
				</Alert>
			)}

			{/* Submit Button */}
			{!isReadOnly && (
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
					<Button
						variant="contained"
						onClick={handleSubmit}
						sx={{
							backgroundColor: '#1976d2',
							'&:hover': {
								backgroundColor: '#1565c0'
							}
						}}
					>
						Complete step
					</Button>
				</Box>
			)}
		</Box>
	);
};

export default InspectionStep;
