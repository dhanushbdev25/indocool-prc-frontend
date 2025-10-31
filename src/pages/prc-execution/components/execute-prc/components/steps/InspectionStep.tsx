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
	Tooltip,
	FormControl,
	FormLabel,
	RadioGroup,
	FormControlLabel,
	Radio
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { Image, ExpandMore, ExpandLess, CameraAlt, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import {
	type TimelineStep,
	type ExecutionData,
	type FormData,
	type ImageAnnotation
} from '../../../../types/execution.types';
import ImageAnnotator from '../ImageAnnotator';
import { transformPrcAggregatedData, debugDataTransformation } from '../../../../utils/dataTransformers';

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
				// Transform data if it's in the new nested format
				console.log('🔄 InspectionStep: Processing existing data...', existingData);
				const transformedData = transformPrcAggregatedData({ temp: existingData });
				debugDataTransformation(existingData, transformedData, 'InspectionStep');

				// Use transformed data if available, otherwise use original
				const dataToProcess = Object.keys(transformedData).length > 0 ? transformedData : existingData;

				// Convert the nested structure to flat form data
				const newFormData: FormData = {};
				const extractedAnnotations: ImageAnnotation[] = [];

				Object.entries(dataToProcess).forEach(([parameterId, parameterData]) => {
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
								// Check if this is a table type parameter (value is an array)
								const param = step.inspectionParameters?.find(p => p.id.toString() === parameterId);
								const isTableType = param?.type === 'table' && param?.columns && param.columns.length > 0;

								if (isTableType && Array.isArray(value)) {
									// Table type: { "value": [{col1: val1, ...}, {col1: val1, ...}] }
									const rows = value as Record<string, unknown>[];
									rows.forEach((row, rowIndex) => {
										if (param && param.columns) {
											param.columns.forEach(column => {
												const key = `${parameterId}_row_${rowIndex}_${column.name}`;
												const cellValue = row[column.name];
												newFormData[key] = cellValue !== undefined && cellValue !== null ? String(cellValue) : '';
												console.log(
													`Loading table data: ${parameterId}.value[${rowIndex}].${column.name} -> ${key} = ${cellValue}`
												);
											});
										}
									});
								} else {
									// Handle multi-column data structure: { "value": { "Date": "213", "Name": "1" } }
									// Check if there's double nesting: { "value": { "value": { "Date": "213" } } }
									const actualValue = (value as Record<string, unknown>).value;
									if (
										actualValue &&
										typeof actualValue === 'object' &&
										actualValue !== null &&
										!Array.isArray(actualValue)
									) {
										// Double nesting case: { "value": { "value": { "Date": "213" } } }
										Object.entries(actualValue as Record<string, unknown>).forEach(([subColumnName, subValue]) => {
											const key = `${parameterId}_${subColumnName}`;
											newFormData[key] = String(subValue);
											console.log(
												`Loading double-nested multi-column data: ${parameterId}.value.value.${subColumnName} -> ${key} = ${subValue}`
											);
										});
									} else if (!Array.isArray(value)) {
										// Single nesting case: { "value": { "Date": "213" } }
										Object.entries(value as Record<string, unknown>).forEach(([subColumnName, subValue]) => {
											const key = `${parameterId}_${subColumnName}`;
											newFormData[key] = String(subValue);
											console.log(
												`Loading single-nested multi-column data: ${parameterId}.value.${subColumnName} -> ${key} = ${subValue}`
											);
										});
									}
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
		const updatedFormData = { ...initialFormData };

		// For table type parameters with no existing data, add one default row
		step.inspectionParameters?.forEach(param => {
			const isTableType = param.type === 'table' && param.columns && param.columns.length > 0;
			if (isTableType && param.columns) {
				// Check if there are any rows for this parameter
				const hasRows = Object.keys(updatedFormData).some(key => key.match(new RegExp(`^${param.id}_row_\\d+_`)));

				if (!hasRows) {
					// Add one default row (empty values)
					param.columns.forEach(column => {
						const key = `${param.id}_row_0_${column.name}`;
						updatedFormData[key] = '';
					});
					console.log(`Added default row for table parameter ${param.id}`);
				}
			}
		});

		setFormData(updatedFormData);

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
	}, [initialFormData, step.inspectionParameters]);

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

	// Helper function to get row count for a table parameter
	const getTableRowCount = (parameterId: number): number => {
		if (!step.inspectionParameters) return 0;
		const param = step.inspectionParameters.find(p => p.id === parameterId);
		if (!param || param.type !== 'table' || !param.columns) return 0;

		// Count rows by checking for keys like "87_row_0_*", "87_row_1_*", etc.
		let maxRowIndex = -1;
		Object.keys(formData).forEach(key => {
			const match = key.match(new RegExp(`^${parameterId}_row_(\\d+)_`));
			if (match) {
				const rowIndex = parseInt(match[1], 10);
				if (rowIndex > maxRowIndex) {
					maxRowIndex = rowIndex;
				}
			}
		});
		return maxRowIndex + 1;
	};

	// Handler for table row changes
	const handleTableRowChange = (parameterId: number, rowIndex: number, columnName: string, value: string) => {
		const key = `${parameterId}_row_${rowIndex}_${columnName}`;
		setFormData(prev => {
			const newFormData = { ...prev };
			newFormData[key] = value;
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

	// Handler to add a new table row
	const handleAddTableRow = (parameterId: number) => {
		const param = step.inspectionParameters?.find(p => p.id === parameterId);
		if (!param || !param.columns) return;

		const rowCount = getTableRowCount(parameterId);
		const newRowIndex = rowCount;

		setFormData(prev => {
			const newFormData = { ...prev };
			// Initialize all columns with empty values
			param.columns?.forEach(column => {
				const key = `${parameterId}_row_${newRowIndex}_${column.name}`;
				newFormData[key] = '';
			});
			return newFormData;
		});
	};

	// Handler to remove a table row
	const handleRemoveTableRow = (parameterId: number, rowIndex: number) => {
		const param = step.inspectionParameters?.find(p => p.id === parameterId);
		if (!param || !param.columns) return;

		setFormData(prev => {
			const newFormData = { ...prev };

			// Calculate row count from current formData
			let maxRowIndex = -1;
			Object.keys(newFormData).forEach(key => {
				const match = key.match(new RegExp(`^${parameterId}_row_(\\d+)_`));
				if (match) {
					const idx = parseInt(match[1], 10);
					if (idx > maxRowIndex) {
						maxRowIndex = idx;
					}
				}
			});
			const rowCount = maxRowIndex + 1;

			// Remove all keys for this row
			param.columns?.forEach(column => {
				const key = `${parameterId}_row_${rowIndex}_${column.name}`;
				delete newFormData[key];
			});

			// Shift all rows after the removed row up by 1
			for (let i = rowIndex + 1; i < rowCount; i++) {
				param.columns?.forEach(column => {
					const oldKey = `${parameterId}_row_${i}_${column.name}`;
					const newKey = `${parameterId}_row_${i - 1}_${column.name}`;
					if (oldKey in newFormData) {
						newFormData[newKey] = newFormData[oldKey];
						delete newFormData[oldKey];
					}
				});
			}

			return newFormData;
		});

		// Update errors for shifted rows
		setErrors(prev => {
			const newErrors = { ...prev };

			// Calculate row count from errors
			let maxRowIndex = -1;
			Object.keys(newErrors).forEach(key => {
				const match = key.match(new RegExp(`^${parameterId}_row_(\\d+)_`));
				if (match) {
					const idx = parseInt(match[1], 10);
					if (idx > maxRowIndex) {
						maxRowIndex = idx;
					}
				}
			});
			const rowCount = maxRowIndex + 1;

			for (let i = rowIndex; i < rowCount; i++) {
				param.columns?.forEach(column => {
					const oldKey = `${parameterId}_row_${i}_${column.name}`;
					const newKey = `${parameterId}_row_${i - 1}_${column.name}`;
					if (oldKey in newErrors) {
						if (i === rowIndex) {
							// Delete error for removed row
							delete newErrors[oldKey];
						} else {
							// Shift error to new key
							newErrors[newKey] = newErrors[oldKey];
							delete newErrors[oldKey];
						}
					}
				});
			}
			return newErrors;
		});
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		step.inspectionParameters?.forEach(param => {
			const isTableType = param.type === 'table' && param.columns && param.columns.length > 0;

			if (isTableType && param.columns) {
				// Table type parameter - validate all rows
				const rowCount = getTableRowCount(param.id);

				if (rowCount === 0) {
					// At least one row is required
					newErrors[`${param.id}_table_rows`] = 'At least one row is required';
				}

				// Validate each row and each column in each row
				for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
					param.columns.forEach(column => {
						const key = `${param.id}_row_${rowIndex}_${column.name}`;
						const value = formData[key];

						if (!value || (typeof value === 'string' && value.trim() === '')) {
							newErrors[key] = `Row ${rowIndex + 1}, ${column.name} is required`;
						} else if (column.type === 'number') {
							const numValue = parseFloat(String(value));
							if (isNaN(numValue)) {
								newErrors[key] = `Row ${rowIndex + 1}, ${column.name} must be a valid number`;
							}
						} else if (column.type === 'ok/not ok') {
							if (value !== 'ok' && value !== 'not ok') {
								newErrors[key] = `Row ${rowIndex + 1}, ${column.name} must be either OK or Not OK`;
							}
						} else if (column.type === 'datetime') {
							if (!value || !String(value).trim()) {
								newErrors[key] = `Row ${rowIndex + 1}, ${column.name} is required`;
							}
						}
					});
				}
			} else if (param.columns && param.columns.length > 0) {
				// Multi-column parameter (non-table) - validate each column
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
					} else if (column.type === 'ok/not ok') {
						if (value !== 'ok' && value !== 'not ok') {
							newErrors[key] = `${column.name} must be either OK or Not OK`;
						}
					} else if (column.type === 'datetime') {
						if (!value || !String(value).trim()) {
							newErrors[key] = `${column.name} is required`;
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
				} else if (param.type === 'ok/not ok') {
					if (value !== 'ok' && value !== 'not ok') {
						newErrors[key] = 'Value must be either OK or Not OK';
					}
				} else if (param.type === 'datetime') {
					if (!value || !value.trim()) {
						newErrors[key] = 'Value is required';
					}
				}
			}
		});

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = () => {
		if (validateForm()) {
			// Convert form data to consistent nested structure
			const nestedData: Record<string, unknown> = {};

			// Process each parameter
			step.inspectionParameters?.forEach(param => {
				const paramData: Record<string, unknown> = {};
				const isTableType = param.type === 'table' && param.columns && param.columns.length > 0;

				if (isTableType && param.columns) {
					// Table type parameter: store as array of row objects
					const rowCount = getTableRowCount(param.id);
					const rowsArray: Record<string, unknown>[] = [];

					for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
						const rowObj: Record<string, unknown> = {};
						param.columns.forEach(column => {
							const key = `${param.id}_row_${rowIndex}_${column.name}`;
							const value = formData[key];
							if (value !== undefined && value !== null) {
								rowObj[column.name] = value;
							}
						});
						if (Object.keys(rowObj).length > 0) {
							rowsArray.push(rowObj);
						}
					}

					if (rowsArray.length > 0) {
						paramData.value = rowsArray;
					}

					console.log(`Table parameter ${param.id}:`, rowsArray);
				} else if (param.columns && param.columns.length > 0) {
					// Multi-column parameter (non-table): store all column values in a value object
					const valueObj: Record<string, unknown> = {};
					param.columns.forEach(column => {
						const key = `${param.id}_${column.name}`;
						const value = formData[key];
						if (value !== undefined && value !== null) {
							valueObj[column.name] = value;
						}
					});

					if (Object.keys(valueObj).length > 0) {
						paramData.value = valueObj;
					}

					console.log(`Multi-column parameter ${param.id}:`, valueObj);
				} else {
					// Single value parameter
					const key = param.id.toString();
					const formValue = formData[key];

					if (typeof formValue === 'object' && formValue !== null) {
						// Already in object format: { "value": "ok", "annotations": [...] }
						paramData.value = (formValue as Record<string, unknown>).value;
						if ((formValue as Record<string, unknown>).annotations) {
							paramData.annotations = (formValue as Record<string, unknown>).annotations;
						}
					} else {
						// Direct value
						paramData.value = formValue;
					}

					console.log(`Single value parameter ${param.id}:`, paramData.value);
				}

				// Add annotations if they exist for this parameter
				if (formData[param.id.toString()] && typeof formData[param.id.toString()] === 'object') {
					const paramFormData = formData[param.id.toString()] as Record<string, unknown>;
					if (paramFormData.annotations && Array.isArray(paramFormData.annotations)) {
						paramData.annotations = paramFormData.annotations;
					}
				}

				if (Object.keys(paramData).length > 0) {
					nestedData[param.id.toString()] = paramData;
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
							const isTableType = param.type === 'table' && param.columns && param.columns.length > 0;
							const hasMultipleColumns = !isTableType && param.columns && param.columns.length > 0;
							const isExpanded = expandedRows.has(param.id);
							const isMultiColumnExpanded = expandedMultiColumnRows.has(param.id);
							const annotationCount = getAnnotationCount(param.id);
							const tableRowCount = isTableType ? getTableRowCount(param.id) : 0;

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
												{isTableType && ` • Table`}
												{hasMultipleColumns && ` • ${param.columns?.length} fields`}
											</Typography>
										</TableCell>
										<TableCell>
											{param.ctq && <Chip label="CTQ" size="small" color="warning" sx={{ fontSize: '0.75rem' }} />}
										</TableCell>
										<TableCell>
											{isTableType ? (
												// Table type parameter - show row count and expand button
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													<Typography variant="caption" sx={{ color: '#666' }}>
														{tableRowCount} row{tableRowCount !== 1 ? 's' : ''}
													</Typography>
													<IconButton
														size="small"
														onClick={() => toggleMultiColumnRowExpansion(param.id)}
														sx={{ color: 'primary' }}
													>
														{isMultiColumnExpanded ? <ExpandLess /> : <ExpandMore />}
													</IconButton>
												</Box>
											) : hasMultipleColumns ? (
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
												(() => {
													const paramData = formData[param.id.toString()];
													const currentValue = (() => {
														if (typeof paramData === 'object' && paramData !== null && 'value' in paramData) {
															// eslint-disable-next-line @typescript-eslint/no-explicit-any
															return String((paramData as any).value || '');
														}
														return String(paramData || '');
													})();

													// Handle different parameter types
													if (param.type === 'ok/not ok') {
														return (
															<FormControl component="fieldset" disabled={isReadOnly}>
																<FormLabel component="legend" sx={{ fontSize: '0.875rem', color: '#666', mb: 1 }}>
																	Select Result
																</FormLabel>
																<RadioGroup
																	row
																	value={currentValue}
																	onChange={e => handleParameterChange(param.id, 'value', e.target.value)}
																	sx={{ gap: 2 }}
																>
																	<FormControlLabel
																		value="ok"
																		control={<Radio size="small" color="success" />}
																		label="OK"
																		sx={{
																			'& .MuiFormControlLabel-label': {
																				fontSize: '0.875rem',
																				color: currentValue === 'ok' ? '#2e7d32' : '#666'
																			}
																		}}
																	/>
																	<FormControlLabel
																		value="not ok"
																		control={<Radio size="small" color="error" />}
																		label="Not OK"
																		sx={{
																			'& .MuiFormControlLabel-label': {
																				fontSize: '0.875rem',
																				color: currentValue === 'not ok' ? '#d32f2f' : '#666'
																			}
																		}}
																	/>
																</RadioGroup>
															</FormControl>
														);
													}

													if (param.type === 'datetime') {
														return (
															<LocalizationProvider dateAdapter={AdapterDayjs}>
																<DateTimePicker
																	label="Value"
																	value={currentValue ? dayjs(currentValue) : null}
																	onChange={newValue => {
																		const formattedValue = newValue ? newValue.format('YYYY-MM-DDTHH:mm') : '';
																		handleParameterChange(param.id, 'value', formattedValue);
																	}}
																	disabled={isReadOnly}
																	slotProps={{
																		textField: {
																			size: 'small',
																			error: !!errors[param.id.toString()],
																			helperText: errors[param.id.toString()],
																			variant: 'outlined',
																			sx: {
																				minWidth: 200,
																				'& .MuiOutlinedInput-root': {
																					height: '40px'
																				}
																			}
																		}
																	}}
																/>
															</LocalizationProvider>
														);
													}

													// Default text/number input
													return (
														<TextField
															label="Value"
															type={param.type === 'number' ? 'number' : 'text'}
															value={currentValue}
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
													);
												})()
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

									{/* Expandable Table Type Row */}
									{isTableType && (
										<TableRow key={`${param.id}-table`}>
											<TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
												<Collapse in={isMultiColumnExpanded} timeout="auto" unmountOnExit>
													<Box sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
														<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
															<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
																{param.parameterName} - Table
															</Typography>
															{!isReadOnly && (
																<Button
																	variant="outlined"
																	size="small"
																	startIcon={<AddIcon />}
																	onClick={() => handleAddTableRow(param.id)}
																	sx={{
																		textTransform: 'none',
																		borderRadius: '4px'
																	}}
																>
																	Add Row
																</Button>
															)}
														</Box>

														{tableRowCount === 0 && !isReadOnly ? (
															<Box sx={{ textAlign: 'center', py: 4, color: '#999' }}>
																<Typography variant="body2">No rows added. Click "Add Row" to start.</Typography>
															</Box>
														) : (
															<TableContainer component={Paper} variant="outlined">
																<Table size="small">
																	<TableHead>
																		<TableRow sx={{ backgroundColor: '#f5f5f5' }}>
																			{param.columns?.map(column => (
																				<TableCell key={column.name} sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
																					{column.name}
																					{column.defaultValue && (
																						<Typography
																							variant="caption"
																							sx={{ display: 'block', color: '#666', fontWeight: 400 }}
																						>
																							Default: {column.defaultValue}
																						</Typography>
																					)}
																				</TableCell>
																			))}
																			{!isReadOnly && (
																				<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', width: 80 }}>
																					Actions
																				</TableCell>
																			)}
																		</TableRow>
																	</TableHead>
																	<TableBody>
																		{Array.from({ length: tableRowCount }, (_, rowIndex) => (
																			<TableRow key={rowIndex}>
																				{param.columns?.map(column => {
																					const key = `${param.id}_row_${rowIndex}_${column.name}`;
																					const currentValue = String(formData[key] || '');

																					return (
																						<TableCell key={column.name}>
																							{column.type === 'ok/not ok' ? (
																								<FormControl component="fieldset" disabled={isReadOnly} size="small">
																									<RadioGroup
																										row
																										value={currentValue}
																										onChange={e =>
																											handleTableRowChange(
																												param.id,
																												rowIndex,
																												column.name,
																												e.target.value
																											)
																										}
																										sx={{ gap: 0.5, m: 0 }}
																									>
																										<FormControlLabel
																											value="ok"
																											control={<Radio size="small" color="success" />}
																											label="OK"
																											sx={{
																												m: 0,
																												'& .MuiFormControlLabel-label': {
																													fontSize: '0.75rem',
																													color: currentValue === 'ok' ? '#2e7d32' : '#666'
																												}
																											}}
																										/>
																										<FormControlLabel
																											value="not ok"
																											control={<Radio size="small" color="error" />}
																											label="Not OK"
																											sx={{
																												m: 0,
																												'& .MuiFormControlLabel-label': {
																													fontSize: '0.75rem',
																													color: currentValue === 'not ok' ? '#d32f2f' : '#666'
																												}
																											}}
																										/>
																									</RadioGroup>
																								</FormControl>
																							) : column.type === 'datetime' ? (
																								<LocalizationProvider dateAdapter={AdapterDayjs}>
																									<DateTimePicker
																										value={currentValue ? dayjs(currentValue) : null}
																										onChange={newValue => {
																											const formattedValue = newValue
																												? newValue.format('YYYY-MM-DDTHH:mm')
																												: '';
																											handleTableRowChange(
																												param.id,
																												rowIndex,
																												column.name,
																												formattedValue
																											);
																										}}
																										disabled={isReadOnly}
																										slotProps={{
																											textField: {
																												size: 'small',
																												error: !!errors[key],
																												helperText: errors[key],
																												variant: 'outlined',
																												fullWidth: true
																											}
																										}}
																									/>
																								</LocalizationProvider>
																							) : (
																								<TextField
																									type={column.type === 'number' ? 'number' : 'text'}
																									value={currentValue}
																									onChange={e =>
																										handleTableRowChange(
																											param.id,
																											rowIndex,
																											column.name,
																											e.target.value
																										)
																									}
																									error={!!errors[key]}
																									helperText={errors[key]}
																									size="small"
																									disabled={isReadOnly}
																									variant="outlined"
																									fullWidth
																									inputProps={{
																										min: 0,
																										step: column.type === 'number' ? 0.01 : undefined
																									}}
																								/>
																							)}
																						</TableCell>
																					);
																				})}
																				{!isReadOnly && (
																					<TableCell>
																						<IconButton
																							size="small"
																							onClick={() => handleRemoveTableRow(param.id, rowIndex)}
																							color="error"
																							sx={{ p: 0.5 }}
																						>
																							<DeleteIcon fontSize="small" />
																						</IconButton>
																					</TableCell>
																				)}
																			</TableRow>
																		))}
																	</TableBody>
																</Table>
															</TableContainer>
														)}
													</Box>
												</Collapse>
											</TableCell>
										</TableRow>
									)}

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
																const currentValue = String(formData[key] || '');

																return (
																	<Grid key={column.name} size={{ xs: 12, sm: 6, md: 4 }}>
																		{column.type === 'ok/not ok' ? (
																			<Box>
																				<Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
																					{column.name}
																				</Typography>
																				<FormControl component="fieldset" disabled={isReadOnly}>
																					<RadioGroup
																						row
																						value={currentValue}
																						onChange={e => handleParameterChange(param.id, column.name, e.target.value)}
																						sx={{ gap: 1 }}
																					>
																						<FormControlLabel
																							value="ok"
																							control={<Radio size="small" color="success" />}
																							label="OK"
																							sx={{
																								'& .MuiFormControlLabel-label': {
																									fontSize: '0.75rem',
																									color: currentValue === 'ok' ? '#2e7d32' : '#666'
																								}
																							}}
																						/>
																						<FormControlLabel
																							value="not ok"
																							control={<Radio size="small" color="error" />}
																							label="Not OK"
																							sx={{
																								'& .MuiFormControlLabel-label': {
																									fontSize: '0.75rem',
																									color: currentValue === 'not ok' ? '#d32f2f' : '#666'
																								}
																							}}
																						/>
																					</RadioGroup>
																				</FormControl>
																				{errors[key] && (
																					<Typography
																						variant="caption"
																						color="error"
																						sx={{ mt: 0.5, display: 'block' }}
																					>
																						{errors[key]}
																					</Typography>
																				)}
																			</Box>
																		) : column.type === 'datetime' ? (
																			<LocalizationProvider dateAdapter={AdapterDayjs}>
																				<DateTimePicker
																					label={column.name}
																					value={currentValue ? dayjs(currentValue) : null}
																					onChange={newValue => {
																						const formattedValue = newValue ? newValue.format('YYYY-MM-DDTHH:mm') : '';
																						handleParameterChange(param.id, column.name, formattedValue);
																					}}
																					disabled={isReadOnly}
																					slotProps={{
																						textField: {
																							fullWidth: true,
																							error: !!errors[key],
																							helperText: errors[key],
																							variant: 'outlined'
																						}
																					}}
																				/>
																			</LocalizationProvider>
																		) : (
																			<TextField
																				label={column.name}
																				type={column.type === 'number' ? 'number' : 'text'}
																				value={currentValue}
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
																		)}
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
