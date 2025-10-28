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
	IconButton,
	Select,
	MenuItem,
	InputLabel
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
		const defaultResponsiblePersonData = [{ id: '1', role: 'l1' as const, employeeName: '', employeeCode: '' }];
		if (!stepData)
			return {
				formData: {},
				measurements: [{ id: '1', value: '' }],
				responsiblePersonData: defaultResponsiblePersonData
			};
		if (executionData.prcAggregatedSteps) {
			const existingData =
				stepData.stepGroupId && stepData.stepId
					? (executionData.prcAggregatedSteps as Record<string, Record<string, Record<string, unknown>>>)[
							stepData.prcTemplateStepId
						]?.[stepData.stepGroupId?.toString() ?? '']?.[stepData.stepId?.toString() ?? '']
					: undefined;

			if (existingData) {
				// Handle the new data structure where data is nested
				let actualData = existingData;
				if (typeof existingData === 'object' && existingData !== null && 'data' in existingData) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					actualData = (existingData as any).data;
				}

				// Extract responsible person data if it exists (at the same level as data)
				let responsiblePersonData: Array<{
					id: string;
					role: 'l1' | 'l2' | 'l3' | 'l4';
					employeeName: string;
					employeeCode: string;
				}> = defaultResponsiblePersonData;
				if (typeof existingData === 'object' && existingData !== null) {
					// Check for responsible person data at the same level as data
					if ('employeeName' in existingData && 'employeeCode' in existingData && 'role' in existingData) {
						// Single object format (backward compatibility)
						const role = existingData.role as string;
						const validRole = ['l1', 'l2', 'l3', 'l4'].includes(role) ? (role as 'l1' | 'l2' | 'l3' | 'l4') : 'l1';
						responsiblePersonData = [
							{
								id: '1',
								role: validRole,
								employeeName: (existingData.employeeName as string) || '',
								employeeCode: (existingData.employeeCode as string) || ''
							}
						];
					} else if ('responsiblePersons' in existingData && Array.isArray(existingData.responsiblePersons)) {
						// Array format (new format)
						responsiblePersonData = (
							existingData.responsiblePersons as Array<{
								id: string;
								role: string;
								employeeName: string;
								employeeCode: string;
							}>
						).map((person, index) => ({
							id: person.id || (index + 1).toString(),
							role: ['l1', 'l2', 'l3', 'l4'].includes(person.role) ? (person.role as 'l1' | 'l2' | 'l3' | 'l4') : 'l1',
							employeeName: person.employeeName || '',
							employeeCode: person.employeeCode || ''
						}));
					}
				}

				if (stepData.multipleMeasurements && Array.isArray(actualData)) {
					// Load multiple measurements from array
					const loadedMeasurements = actualData.map((value: string | number, index: number) => ({
						id: (index + 1).toString(),
						value: value.toString()
					}));
					return { formData: {}, measurements: loadedMeasurements, responsiblePersonData };
				} else if (typeof actualData === 'string' || typeof actualData === 'number') {
					// Load single value directly
					return {
						formData: { value: actualData.toString() },
						measurements: [{ id: '1', value: '' }],
						responsiblePersonData
					};
				} else if (typeof actualData === 'object' && actualData !== null) {
					// Handle object data (like { value: "ok" })
					if ('value' in actualData) {
						return {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							formData: { value: (actualData as any).value.toString() },
							measurements: [{ id: '1', value: '' }],
							responsiblePersonData
						};
					}
				}
			}
		}
		return {
			formData: {},
			measurements: [{ id: '1', value: '' }],
			responsiblePersonData: defaultResponsiblePersonData
		};
	}, [executionData.prcAggregatedSteps, step]);

	const [formData, setFormData] = useState<FormData>(initialData.formData);
	const [measurements, setMeasurements] = useState<Array<{ id: string; value: string }>>(initialData.measurements);
	const [responsiblePersonData, setResponsiblePersonData] = useState<
		Array<{
			id: string;
			role: 'l1' | 'l2' | 'l3' | 'l4';
			employeeName: string;
			employeeCode: string;
		}>
	>(initialData.responsiblePersonData);

	// Update form data when initial data changes
	useEffect(() => {
		setFormData(initialData.formData);
		setMeasurements(initialData.measurements);
		setResponsiblePersonData(initialData.responsiblePersonData);
	}, [initialData]);

	const stepData = step.stepData;
	if (!stepData) {
		return <div>Invalid step data</div>;
	}

	// Check if this specific sub-step is already filled
	const isSubStepFilled =
		initialData &&
		((initialData.formData && Object.keys(initialData.formData).length > 0) ||
			(initialData.measurements && initialData.measurements.some(m => m.value && m.value.trim() !== '')));
	const isReadOnly = step.status === 'completed' || isSubStepFilled;

	// Debug logging
	console.log('SequenceStep Debug:', {
		stepId: step.stepData?.stepId,
		stepStatus: step.status,
		initialData,
		isSubStepFilled,
		isReadOnly
	});

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

	const handleResponsiblePersonChange = (
		personId: string,
		field: 'role' | 'employeeName' | 'employeeCode',
		value: string
	) => {
		setResponsiblePersonData(prev =>
			prev.map(person => (person.id === personId ? { ...person, [field]: value } : person))
		);

		// Clear error when user starts typing
		if (errors[`responsiblePerson_${personId}_${field}`]) {
			setErrors(prev => ({
				...prev,
				[`responsiblePerson_${personId}_${field}`]: ''
			}));
		}
	};

	const addResponsiblePerson = () => {
		const newId = (responsiblePersonData.length + 1).toString();
		setResponsiblePersonData(prev => [...prev, { id: newId, role: 'l1', employeeName: '', employeeCode: '' }]);
	};

	const removeResponsiblePerson = (personId: string) => {
		if (responsiblePersonData.length > 1) {
			setResponsiblePersonData(prev => prev.filter(person => person.id !== personId));
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
						// Check range validation for range type steps
						if (stepData.targetValueType === 'range' && stepData.minValue && stepData.maxValue) {
							const min = parseFloat(stepData.minValue);
							const max = parseFloat(stepData.maxValue);
							if (numValue < min || numValue > max) {
								newErrors[`measurement_${measurement.id}`] =
									`Measurement ${index + 1} must be between ${min} and ${max} ${stepData.uom || ''}`;
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
						// Check range validation for range type steps
						if (stepData.targetValueType === 'range' && stepData.minValue && stepData.maxValue) {
							const min = parseFloat(stepData.minValue);
							const max = parseFloat(stepData.maxValue);
							if (numValue < min || numValue > max) {
								newErrors.value = `Value must be between ${min} and ${max} ${stepData.uom || ''}`;
							}
						}
					}
				}
			}
		}

		// Validate responsible person data if required
		if (stepData.responsiblePerson) {
			responsiblePersonData.forEach((person, index) => {
				if (!person.role) {
					newErrors[`responsiblePerson_${person.id}_role`] = `Role is required for person ${index + 1}`;
				}
				if (!person.employeeName || person.employeeName.trim() === '') {
					newErrors[`responsiblePerson_${person.id}_employeeName`] =
						`Employee name is required for person ${index + 1}`;
				}
				if (!person.employeeCode || person.employeeCode.trim() === '') {
					newErrors[`responsiblePerson_${person.id}_employeeCode`] =
						`Employee code is required for person ${index + 1}`;
				}
			});
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

			// Prepare form data with responsible person data at the same level as data
			const formDataToSubmit: FormData = {
				data: submitData,
				stepId: stepData.stepId,
				stepGroupId: stepData.stepGroupId,
				prcTemplateStepId: stepData.prcTemplateStepId
			};

			// Add responsible person data at the same level as data if required
			if (stepData.responsiblePerson) {
				formDataToSubmit.responsiblePersons = responsiblePersonData.map(person => ({
					id: person.id,
					role: person.role,
					employeeName: person.employeeName,
					employeeCode: person.employeeCode
				}));
			}

			onStepComplete(formDataToSubmit);
		}
	};

	const renderInput = () => {
		if (stepData.targetValueType === 'ok/not ok') {
			return (
				<FormControl component="fieldset" disabled={isReadOnly}>
					<FormLabel component="legend" sx={{ fontSize: '0.875rem', color: '#666', mb: 1 }}>
						Select Result
					</FormLabel>
					<RadioGroup
						row
						value={formData.value || ''}
						onChange={e => handleValueChange(e.target.value)}
						sx={{ gap: 2 }}
					>
						<FormControlLabel
							value="ok"
							control={<Radio size="small" color="success" />}
							label="OK"
							sx={{
								'& .MuiFormControlLabel-label': {
									fontSize: '0.875rem',
									color: formData.value === 'ok' ? '#2e7d32' : '#666'
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
									color: formData.value === 'not ok' ? '#d32f2f' : '#666'
								}
							}}
						/>
					</RadioGroup>
				</FormControl>
			);
		}

		if (stepData.multipleMeasurements) {
			const maxCount = stepData.multipleMeasurementMaxCount || 10;
			return (
				<Box>
					<Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#666' }}>
						Multiple Measurements (Max {maxCount} allowed):
					</Typography>
					{measurements.map((measurement, index) => (
						<Box key={measurement.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
							<Typography variant="body2" sx={{ minWidth: '60px' }}>
								{index + 1}:
							</Typography>
							<TextField
								size="small"
								type="number"
								value={measurement.value}
								onChange={e => handleMeasurementChange(measurement.id, e.target.value)}
								error={!!errors[`measurement_${measurement.id}`]}
								helperText={errors[`measurement_${measurement.id}`]}
								sx={{ flex: 1 }}
								inputProps={{
									min: stepData.minValue ? parseFloat(stepData.minValue) : 0,
									max: stepData.maxValue ? parseFloat(stepData.maxValue) : undefined,
									step: 0.01
								}}
								disabled={isReadOnly}
							/>
							{stepData.uom && stepData.uom !== 'None' && (
								<Typography variant="body2" sx={{ color: '#666', minWidth: '40px' }}>
									{stepData.uom}
								</Typography>
							)}
							{measurements.length > 1 && !isReadOnly && (
								<IconButton onClick={() => removeMeasurement(measurement.id)} color="error" size="small">
									<Delete />
								</IconButton>
							)}
						</Box>
					))}
					{measurements.length < maxCount && !isReadOnly && (
						<Button startIcon={<Add />} onClick={addMeasurement} variant="outlined" size="small">
							Add Measurement ({measurements.length}/{maxCount})
						</Button>
					)}
				</Box>
			);
		}

		// Single value input
		return (
			<Box>
				<TextField
					label="Value"
					type="number"
					value={formData.value || ''}
					onChange={e => handleValueChange(e.target.value)}
					error={!!errors.value}
					helperText={errors.value}
					fullWidth
					inputProps={{
						min: stepData.minValue ? parseFloat(stepData.minValue) : 0,
						max: stepData.maxValue ? parseFloat(stepData.maxValue) : undefined,
						step: 0.01
					}}
					disabled={isReadOnly}
				/>
				{stepData.uom && stepData.uom !== 'None' && (
					<Typography variant="caption" sx={{ color: '#666', mt: 0.5, display: 'block' }}>
						Unit: {stepData.uom}
					</Typography>
				)}
			</Box>
		);
	};

	return (
		<Box sx={{ p: 2, backgroundColor: 'white' }}>
			{/* Compact Step Header */}
			<Box sx={{ mb: 2 }}>
				<Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 0.5, lineHeight: 1.3 }}>
					{step.title}
				</Typography>
				{step.description && step.description !== step.title && (
					<Typography variant="body2" sx={{ color: '#666', mb: 1.5, fontSize: '0.875rem' }}>
						{step.description}
					</Typography>
				)}
			</Box>

			{/* Enhanced Step Details */}
			<Box sx={{ mb: 2, p: 1.5, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
				<Grid container spacing={1.5}>
					<Grid size={{ xs: 6, sm: 3 }}>
						<Typography variant="caption" sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}>
							Step Type
						</Typography>
						<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
							{stepData.stepType}
						</Typography>
					</Grid>
					<Grid size={{ xs: 6, sm: 3 }}>
						<Typography variant="caption" sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}>
							Evaluation Method
						</Typography>
						<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
							{stepData.evaluationMethod}
						</Typography>
					</Grid>
					<Grid size={{ xs: 6, sm: 3 }}>
						<Typography variant="caption" sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}>
							UOM
						</Typography>
						<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
							{stepData.uom || 'N/A'}
						</Typography>
					</Grid>
					<Grid size={{ xs: 6, sm: 3 }}>
						<Typography variant="caption" sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}>
							Target Type
						</Typography>
						<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
							{stepData.targetValueType}
						</Typography>
					</Grid>
				</Grid>

				{/* Acceptance Values for Range Type */}
				{stepData.targetValueType === 'range' && stepData.minValue && stepData.maxValue && (
					<Box sx={{ mt: 1.5, p: 1, backgroundColor: '#fff3cd', borderRadius: 0.5, border: '1px solid #ffeaa7' }}>
						<Grid container spacing={1.5}>
							<Grid size={{ xs: 6, sm: 3 }}>
								<Typography variant="caption" sx={{ fontWeight: 600, color: '#856404', fontSize: '0.75rem' }}>
									Min Acceptable Value
								</Typography>
								<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#856404' }}>
									{stepData.minValue} {stepData.uom}
								</Typography>
							</Grid>
							<Grid size={{ xs: 6, sm: 3 }}>
								<Typography variant="caption" sx={{ fontWeight: 600, color: '#856404', fontSize: '0.75rem' }}>
									Max Acceptable Value
								</Typography>
								<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#856404' }}>
									{stepData.maxValue} {stepData.uom}
								</Typography>
							</Grid>
							{stepData.multipleMeasurements && stepData.multipleMeasurementMaxCount && (
								<Grid size={{ xs: 12, sm: 6 }}>
									<Typography variant="caption" sx={{ fontWeight: 600, color: '#856404', fontSize: '0.75rem' }}>
										Multiple Measurements
									</Typography>
									<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#856404' }}>
										Max {stepData.multipleMeasurementMaxCount} measurements allowed
									</Typography>
								</Grid>
							)}
						</Grid>
					</Box>
				)}

				{/* Step Notes */}
				{stepData.notes && stepData.notes.trim() && (
					<Box sx={{ mt: 1.5, p: 1, backgroundColor: '#e3f2fd', borderRadius: 0.5, border: '1px solid #bbdefb' }}>
						<Typography variant="caption" sx={{ fontWeight: 600, color: '#1565c0', fontSize: '0.75rem' }}>
							Important Notes
						</Typography>
						<Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#1565c0', mt: 0.5 }}>
							{stepData.notes}
						</Typography>
					</Box>
				)}
			</Box>

			{/* Input Form */}
			<Box sx={{ mb: 2 }}>
				<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 1.5, fontSize: '1rem' }}>
					{stepData.parameterDescription}
				</Typography>
				{renderInput()}
			</Box>

			{/* Responsible Person Section */}
			{stepData.responsiblePerson && (
				<Box sx={{ mb: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
						<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', fontSize: '1rem' }}>
							Responsible Person Details
						</Typography>
						{!isReadOnly && (
							<Button
								variant="outlined"
								size="small"
								startIcon={<Add />}
								onClick={addResponsiblePerson}
								sx={{
									borderColor: '#1976d2',
									color: '#1976d2',
									'&:hover': { borderColor: '#1565c0', backgroundColor: '#e3f2fd' }
								}}
							>
								Add Person
							</Button>
						)}
					</Box>
					{responsiblePersonData.map((person, index) => (
						<Box
							key={person.id}
							sx={{ mb: 2, p: 2, backgroundColor: '#fff', borderRadius: 1, border: '1px solid #dee2e6' }}
						>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 600, color: '#666' }}>
									Person {index + 1}
								</Typography>
								{!isReadOnly && responsiblePersonData.length > 1 && (
									<IconButton size="small" onClick={() => removeResponsiblePerson(person.id)} sx={{ color: '#dc3545' }}>
										<Delete fontSize="small" />
									</IconButton>
								)}
							</Box>
							<Grid container spacing={2}>
								<Grid size={{ xs: 12, sm: 4 }}>
									<FormControl fullWidth error={!!errors[`responsiblePerson_${person.id}_role`]}>
										<InputLabel>Role</InputLabel>
										<Select
											value={person.role}
											onChange={e => handleResponsiblePersonChange(person.id, 'role', e.target.value)}
											label="Role"
											disabled={isReadOnly}
										>
											<MenuItem value="l1">L1</MenuItem>
											<MenuItem value="l2">L2</MenuItem>
											<MenuItem value="l3">L3</MenuItem>
											<MenuItem value="l4">L4</MenuItem>
										</Select>
										{errors[`responsiblePerson_${person.id}_role`] && (
											<Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
												{errors[`responsiblePerson_${person.id}_role`]}
											</Typography>
										)}
									</FormControl>
								</Grid>
								<Grid size={{ xs: 12, sm: 4 }}>
									<TextField
										fullWidth
										label="Employee Name"
										value={person.employeeName}
										onChange={e => handleResponsiblePersonChange(person.id, 'employeeName', e.target.value)}
										error={!!errors[`responsiblePerson_${person.id}_employeeName`]}
										helperText={errors[`responsiblePerson_${person.id}_employeeName`]}
										disabled={isReadOnly}
									/>
								</Grid>
								<Grid size={{ xs: 12, sm: 4 }}>
									<TextField
										fullWidth
										label="Employee Code"
										value={person.employeeCode}
										onChange={e => handleResponsiblePersonChange(person.id, 'employeeCode', e.target.value)}
										error={!!errors[`responsiblePerson_${person.id}_employeeCode`]}
										helperText={errors[`responsiblePerson_${person.id}_employeeCode`]}
										disabled={isReadOnly}
									/>
								</Grid>
							</Grid>
						</Box>
					))}
				</Box>
			)}

			{/* CTQ Warning */}
			{step.ctq && stepData.minValue && stepData.maxValue && (
				<Alert severity="warning" sx={{ mb: 2, py: 1 }}>
					This is a Critical to Quality (CTQ) parameter. Values outside the acceptable range may require supervisor
					approval.
				</Alert>
			)}

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

export default SequenceStep;
