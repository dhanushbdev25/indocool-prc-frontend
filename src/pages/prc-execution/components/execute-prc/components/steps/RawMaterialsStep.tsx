import { useState, useEffect } from 'react';
import {
	Box,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	TextField,
	Button,
	Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import { type TimelineStep, type ExecutionData, type FormData } from '../../../../types/execution.types';

interface RawMaterialsStepProps {
	step: TimelineStep;
	executionData: ExecutionData;
	onStepComplete: (formData: FormData) => void;
}

const RawMaterialsStep = ({ step, executionData, onStepComplete }: RawMaterialsStepProps) => {
	const [formData, setFormData] = useState<FormData>({});
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Load existing data from prcAggregatedSteps
	useEffect(() => {
		if (
			(step.status === 'completed' || step.status === 'in-progress') &&
			executionData.prcAggregatedSteps?.rawMaterials
		) {
			// Use setTimeout to avoid synchronous setState in effect
			setTimeout(() => {
				setFormData(executionData.prcAggregatedSteps?.rawMaterials as FormData);
			}, 0);
		}
	}, [step.status, executionData.prcAggregatedSteps]);

	const isReadOnly = step.status === 'completed';

	const handleQuantityChange = (materialId: number, value: string) => {
		setFormData(prev => ({
			...prev,
			[materialId.toString()]: value
		}));

		// Clear error when user starts typing
		if (errors[materialId.toString()]) {
			setErrors(prev => ({
				...prev,
				[materialId.toString()]: ''
			}));
		}
	};

	const handleBatchNumberChange = (materialId: number, value: string) => {
		setFormData(prev => ({
			...prev,
			[`${materialId}_batchNumber`]: value
		}));

		// Clear error when user starts typing
		if (errors[`${materialId}_batchNumber`]) {
			setErrors(prev => ({
				...prev,
				[`${materialId}_batchNumber`]: ''
			}));
		}
	};

	const handleExpiryDateChange = (materialId: number, value: Dayjs | null) => {
		const dateString = value ? value.format('YYYY-MM-DD') : '';
		setFormData(prev => ({
			...prev,
			[`${materialId}_expiryDate`]: dateString
		}));

		// Clear error when user starts typing
		if (errors[`${materialId}_expiryDate`]) {
			setErrors(prev => ({
				...prev,
				[`${materialId}_expiryDate`]: ''
			}));
		}
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		step.items?.forEach(item => {
			// Validate quantity
			const value = formData[item.id.toString()];
			if (!value || (typeof value === 'string' && value.trim() === '')) {
				newErrors[item.id.toString()] = 'Actual quantity is required';
			} else {
				const numValue = parseFloat(String(value));
				if (isNaN(numValue) || numValue < 0) {
					newErrors[item.id.toString()] = 'Please enter a valid positive number';
				}
			}

			// Validate batch number and expiry date if batching is enabled
			if (item.batching) {
				const batchNumber = formData[`${item.id}_batchNumber`];
				if (!batchNumber || (typeof batchNumber === 'string' && batchNumber.trim() === '')) {
					newErrors[`${item.id}_batchNumber`] = 'Batch number is required';
				}

				const expiryDate = formData[`${item.id}_expiryDate`];
				if (!expiryDate || (typeof expiryDate === 'string' && expiryDate.trim() === '')) {
					newErrors[`${item.id}_expiryDate`] = 'Expiry date is required';
				} else {
					// Validate date format and ensure it's not in the past
					const dateValue = dayjs(String(expiryDate));
					if (!dateValue.isValid()) {
						newErrors[`${item.id}_expiryDate`] = 'Please enter a valid date';
					} else if (dateValue.isBefore(dayjs(), 'day')) {
						newErrors[`${item.id}_expiryDate`] = 'Expiry date cannot be in the past';
					}
				}
			}
		});

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = () => {
		if (validateForm()) {
			onStepComplete(formData);
		}
	};

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
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

				{/* Materials Table */}
				<TableContainer component={Paper} sx={{ mb: 2 }}>
					<Table size="small">
						<TableHead>
							<TableRow sx={{ backgroundColor: '#f5f5f5' }}>
								<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Material Code</TableCell>
								<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Material Name</TableCell>
								<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Required Qty</TableCell>
								<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>UOM</TableCell>
								<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Actual Qty Used</TableCell>
								{step.items?.some(item => item.batching) && (
									<>
										<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Batch Number</TableCell>
										<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Expiry Date</TableCell>
									</>
								)}
							</TableRow>
						</TableHead>
						<TableBody>
							{step.items?.map(item => (
								<TableRow key={item.id}>
									<TableCell sx={{ py: 1 }}>
										<Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
											{item.description}
										</Typography>
									</TableCell>
									<TableCell sx={{ py: 1 }}>
										<Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
											{item.name}
										</Typography>
									</TableCell>
									<TableCell sx={{ py: 1 }}>
										<Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
											{item.quantity}
										</Typography>
									</TableCell>
									<TableCell sx={{ py: 1 }}>
										<Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
											{item.uom}
										</Typography>
									</TableCell>
									<TableCell sx={{ py: 1 }}>
										<TextField
											size="small"
											type="number"
											value={formData[item.id.toString()] || ''}
											onChange={e => handleQuantityChange(item.id, e.target.value)}
											error={!!errors[item.id.toString()]}
											helperText={errors[item.id.toString()]}
											sx={{ width: 120 }}
											inputProps={{ min: 0, step: 0.01 }}
											disabled={isReadOnly}
										/>
									</TableCell>
									{step.items?.some(i => i.batching) && (
										<>
											<TableCell sx={{ py: 1 }}>
												{item.batching ? (
													<TextField
														size="small"
														value={formData[`${item.id}_batchNumber`] || ''}
														onChange={e => handleBatchNumberChange(item.id, e.target.value)}
														error={!!errors[`${item.id}_batchNumber`]}
														helperText={errors[`${item.id}_batchNumber`]}
														sx={{ width: 140 }}
														disabled={isReadOnly}
														placeholder="Enter batch number"
													/>
												) : (
													<Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#999' }}>
														-
													</Typography>
												)}
											</TableCell>
											<TableCell sx={{ py: 1 }}>
												{item.batching ? (
													<DatePicker
														value={
															formData[`${item.id}_expiryDate`]
																? dayjs(formData[`${item.id}_expiryDate`] as string)
																: null
														}
														onChange={value => handleExpiryDateChange(item.id, value)}
														disabled={isReadOnly}
														slotProps={{
															textField: {
																size: 'small',
																error: !!errors[`${item.id}_expiryDate`],
																helperText: errors[`${item.id}_expiryDate`],
																sx: { width: 140 }
															}
														}}
														minDate={dayjs()}
													/>
												) : (
													<Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#999' }}>
														-
													</Typography>
												)}
											</TableCell>
										</>
									)}
								</TableRow>
							))}
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
		</LocalizationProvider>
	);
};

export default RawMaterialsStep;
