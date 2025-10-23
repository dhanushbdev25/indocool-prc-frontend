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

			{/* BOM Table */}
			<TableContainer component={Paper} sx={{ mb: 2 }}>
				<Table size="small">
					<TableHead>
						<TableRow sx={{ backgroundColor: '#f5f5f5' }}>
							<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Description</TableCell>
							<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Material Type</TableCell>
							<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Required Qty</TableCell>
							<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Actual Qty</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{step.items?.map(item => (
							<TableRow key={item.id}>
								<TableCell sx={{ py: 1 }}>
									<Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
										{item.name}
									</Typography>
								</TableCell>
								<TableCell sx={{ py: 1 }}>
									<Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
										{item.description}
									</Typography>
								</TableCell>
								<TableCell sx={{ py: 1 }}>
									<Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
										{item.quantity}
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
	);
};

export default BomStep;
