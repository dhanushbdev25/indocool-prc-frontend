import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, TextField, Button, Alert, Card, CardContent, Grid } from '@mui/material';
import { type TimelineStep, type ExecutionData, type FormData } from '../../../../types/execution.types';

interface InspectionStepProps {
	step: TimelineStep;
	executionData: ExecutionData;
	onStepComplete: (formData: FormData) => void;
}

const InspectionStep = ({ step, executionData, onStepComplete }: InspectionStepProps) => {
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Compute initial form data from existing data
	const initialFormData = useMemo(() => {
		if ((step.status === 'completed' || step.status === 'in-progress') && executionData.prcAggregatedSteps) {
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
				Object.entries(existingData).forEach(([parameterId, parameterData]) => {
					if (typeof parameterData === 'object' && parameterData !== null) {
						// Check if there's an extra level with parameter name
						// Structure: { "15": { "TEST": { "TEST1": "TEST", "TEST2": "12" } } }
						const firstKey = Object.keys(parameterData)[0];
						const firstValue = (
							parameterData as Record<string, string | number | boolean | Record<string, string | number | boolean>>
						)[firstKey];

						if (typeof firstValue === 'object' && firstValue !== null) {
							// Extra level with parameter name
							Object.entries(firstValue).forEach(([columnName, value]) => {
								newFormData[`${parameterId}_${columnName}`] = String(value);
							});
						} else {
							// Direct structure: { "15": { "TEST1": "Good", "TEST2": "1" } }
							Object.entries(parameterData).forEach(([columnName, value]) => {
								newFormData[`${parameterId}_${columnName}`] = String(value);
							});
						}
					} else {
						// Fallback for old structure: { "7_Resin": "100" }
						newFormData[parameterId] = String(parameterData);
					}
				});
				return newFormData;
			}
		}
		return {};
	}, [executionData.prcAggregatedSteps, step]);

	const [formData, setFormData] = useState<FormData>(initialFormData);

	// Update form data when initial data changes
	useEffect(() => {
		setFormData(initialFormData);
	}, [initialFormData]);

	const isReadOnly = step.status === 'completed';

	const handleParameterChange = (parameterId: number, columnName: string, value: string) => {
		const key = `${parameterId}_${columnName}`;
		setFormData(prev => ({
			...prev,
			[key]: value
		}));

		// Clear error when user starts typing
		if (errors[key]) {
			setErrors(prev => ({
				...prev,
				[key]: ''
			}));
		}
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
				const value = formData[key];
				if (!value || (typeof value === 'string' && value.trim() === '')) {
					newErrors[key] = 'Value is required';
				} else if (param.type === 'number') {
					const numValue = parseFloat(String(value));
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
			// Convert flat form data to nested structure
			const nestedData: Record<string, unknown> = {};

			Object.entries(formData).forEach(([key, value]) => {
				if (key.includes('_')) {
					// Multi-column parameter: "7_Resin" -> { "7": { "Resin": "100" } }
					const [parameterId, columnName] = key.split('_');
					if (!nestedData[parameterId]) {
						nestedData[parameterId] = {};
					}
					(nestedData[parameterId] as Record<string, unknown>)[columnName] = value;
				} else {
					// Single column parameter: "7" -> { "7": "100" }
					nestedData[key] = value;
				}
			});

			onStepComplete(nestedData as FormData);
		}
	};

	return (
		<Box sx={{ p: 3, backgroundColor: 'white' }}>
			{/* Step Header */}
			<Box sx={{ mb: 3 }}>
				<Typography variant="h5" sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
					{step.title}
				</Typography>
				<Typography variant="body2" sx={{ color: '#666' }}>
					{step.description}
				</Typography>
			</Box>

			{/* Inspection Parameters */}
			{step.inspectionParameters?.map((param, _index) => (
				<Card key={param.id} sx={{ mb: 3 }}>
					<CardContent>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
							<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
								{param.parameterName}
							</Typography>
							{param.ctq && (
								<Alert severity="warning" sx={{ py: 0, px: 1, fontSize: '0.75rem' }}>
									CTQ
								</Alert>
							)}
						</Box>

						<Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
							{param.specification}
						</Typography>

						{param.columns && param.columns.length > 0 ? (
							// Multi-column parameter
							<Grid container spacing={2}>
								{param.columns.map(column => {
									const key = `${param.id}_${column.name}`;
									return (
										<Grid key={column.name} size={{ xs: 12, md: 6 }}>
											<TextField
												label={column.name}
												type={column.type === 'number' ? 'number' : 'text'}
												value={formData[key] || ''}
												onChange={e => handleParameterChange(param.id, column.name, e.target.value)}
												error={!!errors[key]}
												helperText={errors[key]}
												fullWidth
												disabled={isReadOnly}
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
						) : (
							// Single value parameter
							<TextField
								label="Value"
								type={param.type === 'number' ? 'number' : 'text'}
								value={formData[param.id.toString()] || ''}
								onChange={e => handleParameterChange(param.id, 'value', e.target.value)}
								error={!!errors[param.id.toString()]}
								helperText={errors[param.id.toString()]}
								fullWidth
								disabled={isReadOnly}
								inputProps={{
									min: 0,
									step: param.type === 'number' ? 0.01 : undefined
								}}
							/>
						)}

						{param.files && Object.keys(param.files).length > 0 && (
							<Box sx={{ mt: 2 }}>
								<Typography variant="body2" sx={{ fontWeight: 500, color: '#666', mb: 1 }}>
									Reference Files
								</Typography>
								{Object.entries(param.files).map(([key, url]) => (
									<Typography key={key} variant="caption" sx={{ display: 'block', color: '#1976d2' }}>
										{key}: {url}
									</Typography>
								))}
							</Box>
						)}
					</CardContent>
				</Card>
			))}

			{/* Validation Alert */}
			{Object.keys(errors).length > 0 && (
				<Alert severity="error" sx={{ mb: 3 }}>
					Please fill in all required fields with valid values.
				</Alert>
			)}

			{/* Submit Button */}
			{!isReadOnly && (
				<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
						Complete Step
					</Button>
				</Box>
			)}
		</Box>
	);
};

export default InspectionStep;
