import { useState, useEffect, useMemo } from 'react';
import {
	Box,
	Typography,
	TextField,
	Button,
	Alert,
	FormControl,
	FormLabel,
	RadioGroup,
	FormControlLabel,
	Radio,
	Grid,
	Card,
	CardContent,
	IconButton
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { type TimelineStep, type ExecutionData, type FormData } from '../../../../types/execution.types';

interface SequenceStepProps {
	step: TimelineStep;
	executionData: ExecutionData;
	onStepComplete: (formData: FormData) => void;
}

const SequenceStep = ({ step, executionData, onStepComplete }: SequenceStepProps) => {
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Compute initial data from existing data
	const initialData = useMemo(() => {
		const stepData = step.stepData;
		if (!stepData) return { formData: {}, measurements: [{ id: '1', value: '' }] };
		if ((step.status === 'completed' || step.status === 'in-progress') && executionData.prcAggregatedSteps) {
			const existingData =
				stepData.stepGroupId && stepData.stepId
					? (executionData.prcAggregatedSteps as Record<string, Record<string, Record<string, unknown>>>)[
							stepData.prcTemplateStepId
						]?.[stepData.stepGroupId?.toString() ?? '']?.[stepData.stepId?.toString() ?? '']
					: undefined;

			if (existingData) {
				if (stepData.multipleMeasurements && Array.isArray(existingData)) {
					// Load multiple measurements from array
					const loadedMeasurements = existingData.map((value: string | number, index: number) => ({
						id: (index + 1).toString(),
						value: value.toString()
					}));
					return { formData: {}, measurements: loadedMeasurements };
				} else if (typeof existingData === 'string' || typeof existingData === 'number') {
					// Load single value directly
					return { formData: { value: existingData.toString() }, measurements: [{ id: '1', value: '' }] };
				}
			}
		}
		return { formData: {}, measurements: [{ id: '1', value: '' }] };
	}, [executionData.prcAggregatedSteps, step]);

	const [formData, setFormData] = useState<FormData>(initialData.formData);
	const [measurements, setMeasurements] = useState<Array<{ id: string; value: string }>>(initialData.measurements);

	// Update form data when initial data changes
	useEffect(() => {
		setFormData(initialData.formData);
		setMeasurements(initialData.measurements);
	}, [initialData]);

	const stepData = step.stepData;
	if (!stepData) {
		return <div>Invalid step data</div>;
	}

	const isReadOnly = step.status === 'completed';

	const handleValueChange = (value: string) => {
		setFormData(prev => ({
			...prev,
			value: value
		}));

		// Clear error when user starts typing
		if (errors.value) {
			setErrors(prev => ({
				...prev,
				value: ''
			}));
		}
	};

	const handleMeasurementChange = (measurementId: string, value: string) => {
		setMeasurements(prev => prev.map(m => (m.id === measurementId ? { ...m, value } : m)));
	};

	const addMeasurement = () => {
		const newId = (measurements.length + 1).toString();
		setMeasurements(prev => [...prev, { id: newId, value: '' }]);
	};

	const removeMeasurement = (measurementId: string) => {
		if (measurements.length > 1) {
			setMeasurements(prev => prev.filter(m => m.id !== measurementId));
		}
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		// For multiple measurements, only validate the measurements array
		if (stepData.multipleMeasurements) {
			measurements.forEach((measurement, index) => {
				if (!measurement.value || measurement.value.trim() === '') {
					newErrors[`measurement_${measurement.id}`] = `Measurement ${index + 1} is required`;
				} else {
					const numValue = parseFloat(measurement.value);
					if (isNaN(numValue)) {
						newErrors[`measurement_${measurement.id}`] = `Measurement ${index + 1} must be a valid number`;
					} else {
						// Check range validation for CTQ steps
						if (step.ctq && stepData.minValue && stepData.maxValue) {
							const min = parseFloat(stepData.minValue);
							const max = parseFloat(stepData.maxValue);
							if (numValue < min || numValue > max) {
								newErrors[`measurement_${measurement.id}`] =
									`Measurement ${index + 1} must be between ${min} and ${max}`;
							}
						}
					}
				}
			});
		} else {
			// For single measurements, validate the main formData.value
			if (stepData.targetValueType === 'ok/not ok') {
				if (!formData.value) {
					newErrors.value = 'Please select an option';
				}
			} else {
				if (!formData.value || (typeof formData.value === 'string' && formData.value.trim() === '')) {
					newErrors.value = 'Value is required';
				} else {
					const numValue = parseFloat(String(formData.value));
					if (isNaN(numValue)) {
						newErrors.value = 'Please enter a valid number';
					} else {
						// Check range validation for CTQ steps
						if (step.ctq && stepData.minValue && stepData.maxValue) {
							const min = parseFloat(stepData.minValue);
							const max = parseFloat(stepData.maxValue);
							if (numValue < min || numValue > max) {
								newErrors.value = `Value must be between ${min} and ${max}`;
							}
						}
					}
				}
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = () => {
		if (validateForm()) {
			let submitData: string | string[];

			if (stepData.multipleMeasurements) {
				// For multiple measurements, send array directly
				submitData = measurements.map(m => m.value);
			} else {
				// For single values, send string directly
				submitData = String(formData.value);
			}

			onStepComplete({ data: submitData });
		}
	};

	const renderInput = () => {
		if (stepData.targetValueType === 'ok/not ok') {
			return (
				<FormControl component="fieldset">
					<FormLabel component="legend">Result</FormLabel>
					<RadioGroup value={formData.value || ''} onChange={e => handleValueChange(e.target.value)}>
						<FormControlLabel value="ok" control={<Radio />} label="OK" />
						<FormControlLabel value="not ok" control={<Radio />} label="Not OK" />
					</RadioGroup>
				</FormControl>
			);
		}

		if (stepData.multipleMeasurements) {
			return (
				<Box>
					<Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
						Multiple Measurements
					</Typography>
					{measurements.map((measurement, index) => (
						<Box key={measurement.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
							<TextField
								label={`Measurement ${index + 1}`}
								type="number"
								value={measurement.value}
								onChange={e => handleMeasurementChange(measurement.id, e.target.value)}
								error={!!errors[`measurement_${measurement.id}`]}
								helperText={errors[`measurement_${measurement.id}`]}
								sx={{ flex: 1 }}
								inputProps={{ min: 0, step: 0.01 }}
								disabled={isReadOnly}
							/>
							{measurements.length > 1 && !isReadOnly && (
								<IconButton onClick={() => removeMeasurement(measurement.id)} color="error" size="small">
									<Delete />
								</IconButton>
							)}
						</Box>
					))}
					{!isReadOnly && (
						<Button startIcon={<Add />} onClick={addMeasurement} variant="outlined" size="small">
							Add Measurement
						</Button>
					)}
				</Box>
			);
		}

		return (
			<TextField
				label="Value"
				type="number"
				value={formData.value || ''}
				onChange={e => handleValueChange(e.target.value)}
				error={!!errors.value}
				helperText={errors.value}
				fullWidth
				inputProps={{ min: 0, step: 0.01 }}
				disabled={isReadOnly}
			/>
		);
	};

	return (
		<Box sx={{ p: 3, backgroundColor: 'white' }}>
			{/* Step Header */}
			<Box sx={{ mb: 3 }}>
				<Typography variant="h5" sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
					{step.title}
				</Typography>
				<Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
					{step.description}
				</Typography>
			</Box>

			{/* Step Details Card */}
			<Card sx={{ mb: 3 }}>
				<CardContent>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, md: 6 }}>
							<Typography variant="body2" sx={{ fontWeight: 500, color: '#666' }}>
								Step Type
							</Typography>
							<Typography variant="body2" sx={{ mb: 2 }}>
								{stepData.stepType}
							</Typography>
						</Grid>
						<Grid size={{ xs: 12, md: 6 }}>
							<Typography variant="body2" sx={{ fontWeight: 500, color: '#666' }}>
								Evaluation Method
							</Typography>
							<Typography variant="body2" sx={{ mb: 2 }}>
								{stepData.evaluationMethod}
							</Typography>
						</Grid>
						<Grid size={{ xs: 12, md: 6 }}>
							<Typography variant="body2" sx={{ fontWeight: 500, color: '#666' }}>
								UOM
							</Typography>
							<Typography variant="body2" sx={{ mb: 2 }}>
								{stepData.uom}
							</Typography>
						</Grid>
						{stepData.minValue && stepData.maxValue && (
							<Grid size={{ xs: 12, md: 6 }}>
								<Typography variant="body2" sx={{ fontWeight: 500, color: '#666' }}>
									Acceptable Range
								</Typography>
								<Typography variant="body2" sx={{ mb: 2 }}>
									{stepData.minValue} - {stepData.maxValue} {stepData.uom}
								</Typography>
							</Grid>
						)}
					</Grid>

					{stepData.notes && (
						<Box sx={{ mt: 2 }}>
							<Typography variant="body2" sx={{ fontWeight: 500, color: '#666' }}>
								Notes
							</Typography>
							<Typography variant="body2">{stepData.notes}</Typography>
						</Box>
					)}
				</CardContent>
			</Card>

			{/* Input Form */}
			<Box sx={{ mb: 3 }}>
				<Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 2 }}>
					{stepData.parameterDescription}
				</Typography>
				{renderInput()}
			</Box>

			{/* CTQ Warning */}
			{step.ctq && stepData.minValue && stepData.maxValue && (
				<Alert severity="warning" sx={{ mb: 3 }}>
					This is a Critical to Quality (CTQ) parameter. Values outside the acceptable range may require supervisor
					approval.
				</Alert>
			)}

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

export default SequenceStep;
