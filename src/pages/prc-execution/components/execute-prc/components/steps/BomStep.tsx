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
import { type TimelineStep, type ExecutionData, type FormData } from '../../../../types/execution.types';

interface BomStepProps {
	step: TimelineStep;
	executionData: ExecutionData;
	onStepComplete: (formData: FormData) => void;
}

const BomStep = ({ step, executionData, onStepComplete }: BomStepProps) => {
	const [formData, setFormData] = useState<FormData>({});
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Load existing data from prcAggregatedSteps
	useEffect(() => {
		if ((step.status === 'completed' || step.status === 'in-progress') && executionData.prcAggregatedSteps?.bom) {
			setFormData(executionData.prcAggregatedSteps.bom as FormData);
		}
	}, [step.status, executionData.prcAggregatedSteps]);

	const isReadOnly = step.status === 'completed';

	const handleQuantityChange = (bomId: number, value: string) => {
		setFormData(prev => ({
			...prev,
			[bomId.toString()]: value
		}));

		// Clear error when user starts typing
		if (errors[bomId.toString()]) {
			setErrors(prev => ({
				...prev,
				[bomId.toString()]: ''
			}));
		}
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		step.items?.forEach(item => {
			const value = formData[item.id.toString()];
			if (!value || (typeof value === 'string' && value.trim() === '')) {
				newErrors[item.id.toString()] = 'Actual quantity is required';
			} else {
				const numValue = parseFloat(String(value));
				if (isNaN(numValue) || numValue < 0) {
					newErrors[item.id.toString()] = 'Please enter a valid positive number';
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

			{/* BOM Table */}
			<TableContainer component={Paper} sx={{ mb: 3 }}>
				<Table>
					<TableHead>
						<TableRow sx={{ backgroundColor: '#f5f5f5' }}>
							<TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
							<TableCell sx={{ fontWeight: 600 }}>Material Type</TableCell>
							<TableCell sx={{ fontWeight: 600 }}>Required Qty</TableCell>
							<TableCell sx={{ fontWeight: 600 }}>Actual Qty</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{step.items?.map(item => (
							<TableRow key={item.id}>
								<TableCell>
									<Typography variant="body2" sx={{ fontWeight: 500 }}>
										{item.name}
									</Typography>
								</TableCell>
								<TableCell>
									<Typography variant="body2">{item.description}</Typography>
								</TableCell>
								<TableCell>
									<Typography variant="body2" sx={{ fontWeight: 500 }}>
										{item.quantity}
									</Typography>
								</TableCell>
								<TableCell>
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
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>

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

export default BomStep;
