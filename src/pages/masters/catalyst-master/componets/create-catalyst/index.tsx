import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Paper, Typography, Button, Stepper, Step, StepLabel, Alert, CircularProgress } from '@mui/material';
import { ArrowBack, Save, Cancel } from '@mui/icons-material';
import CatalystBasicInfo from './components/CatalystBasicInfo';
import CatalystConfiguration from './components/CatalystConfiguration';
import { catalystFormSchema, defaultCatalystFormData } from './schemas';
import { CatalystFormData } from './schemas';

const steps = ['Basic Information', 'Configuration Settings'];

const CreateCatalyst = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const isEditMode = Boolean(id);

	const [activeStep, setActiveStep] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Initialize React Hook Form
	const methods = useForm<CatalystFormData>({
		resolver: yupResolver(catalystFormSchema),
		defaultValues: defaultCatalystFormData,
		mode: 'onChange', // Validate on change for immediate feedback
		reValidateMode: 'onChange' // Re-validate on change
	});

	const { control, handleSubmit, formState: { errors }, reset, trigger } = methods;

	// Debug: Log errors when they change
	useEffect(() => {
		if (Object.keys(errors).length > 0) {
			console.log('Form errors (Yup):', errors);
		}
	}, [errors]);

	

	const loadCatalystData = useCallback(async (catalystId: string) => {
		setLoading(true);
		try {
			// In a real app, this would be an API call
			// For now, we'll use mock data based on the sample data from ListCatalyst
			const mockData: CatalystFormData = {
				id: parseInt(catalystId),
				chartId: 'CAT-CHT-001',
				chartSupplier: 'ABC Chemicals Ltd.',
				notes: 'Used for standard resin curing at room temperature.',
				mekpDensity: '1.12',
				isActive: true,
				catalystConfiguration: [
					{
						id: 7,
						catalystId: parseInt(catalystId),
						chartId: 'CAT-CHT-001',
						minTemperature: '20',
						maxTemperature: '35',
						minHumidity: '40',
						maxHumidity: '65',
						minGelcoat: '1.5',
						maxGelcoat: '2.5',
						gelcoatLabel: 'Standard Gelcoat Mix',
						minResinDosage: '0.8',
						maxResinDosage: '1.2',
						resinLabel: 'General Purpose Resin',
						blockCatalystMixing: false,
						requestSupervisorApproval: false,
						createdAt: '2025-10-05T14:20:47.048Z',
						updatedAt: '2025-10-05T14:20:47.048Z'
					},
					{
						id: 8,
						catalystId: parseInt(catalystId),
						chartId: 'CAT-CHT-001',
						minTemperature: '10',
						maxTemperature: '25',
						minHumidity: '30',
						maxHumidity: '55',
						minGelcoat: '1',
						maxGelcoat: '1.8',
						gelcoatLabel: 'Cold Weather Mix',
						minResinDosage: '0.6',
						maxResinDosage: '1',
						resinLabel: 'Low Temp Resin',
						blockCatalystMixing: true,
						requestSupervisorApproval: true,
						createdAt: '2025-10-05T14:20:47.048Z',
						updatedAt: '2025-10-05T14:20:47.048Z'
					}
				],
				createdAt: '2025-10-05T13:28:27.105Z',
				updatedAt: '2025-10-05T14:20:46.233Z'
			};
			reset(mockData);
		} catch (err) {
			setError('Failed to load catalyst data');
		} finally {
			setLoading(false);
		}
	}, [reset]);

	// Load data for edit mode
	useEffect(() => {
		if (isEditMode && id) {
			loadCatalystData(id);
		}
	}, [isEditMode, id, loadCatalystData]);

	const handleNext = async () => {
		// Define fields to validate for each step
		const stepFields = {
			0: ['chartId', 'chartSupplier', 'mekpDensity', 'isActive', 'notes'] as const, // Basic info step
			1: ['catalystConfiguration'] as const // Configuration step
		};

		const fieldsToValidate = stepFields[activeStep as keyof typeof stepFields];
		
		if (fieldsToValidate) {
			try {
				// Convert readonly tuple to mutable array to satisfy trigger's type requirement
				const isValid = await trigger([...fieldsToValidate] as (keyof CatalystFormData)[]);
				if (isValid) {
					setActiveStep(prevActiveStep => prevActiveStep + 1);
				} else {
					// Validation failed - errors will be displayed inline
					console.log('Validation failed for step:', activeStep, 'Errors (Yup):', errors);
					// Scroll to first error field
					const firstErrorField = document.querySelector('.Mui-error');
					if (firstErrorField) {
						firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
					}
				}
			} catch (error) {
				console.error('Validation error:', error);
				// Don't proceed to next step if validation throws an error
			}
		} else {
			setActiveStep(prevActiveStep => prevActiveStep + 1);
		}
	};

	const handleBack = () => {
		setActiveStep(prevActiveStep => prevActiveStep - 1);
	};

	const onSubmit = async (data: CatalystFormData) => {
		setLoading(true);
		setError(null);

		try {
			// Validate the entire form before submission
			const isValid = await trigger();
			if (!isValid) {
				console.log('Form validation failed on submit:', errors);
				setError('Please fix all validation errors before submitting');
				return;
			}

			// In a real app, this would be an API call
			console.log('Saving catalyst data:', data);

			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));

			// Navigate back to list
			navigate('/listcatalyst');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save catalyst');
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		navigate('/listcatalyst');
	};

	const renderStepContent = (step: number) => {
		switch (step) {
			case 0:
				return <CatalystBasicInfo control={control} errors={errors} />;
			case 1:
				return (
					<CatalystConfiguration 
						control={control} 
						errors={errors}
					/>
				);
			default:
				return null;
		}
	};

	if (loading && isEditMode) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<FormProvider {...methods}>
			<Box sx={{ minHeight: '100vh' }}>
				<Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
				{/* Header */}
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
					<Button startIcon={<ArrowBack />} onClick={handleCancel} sx={{ mr: 2, textTransform: 'none' }}>
						Back
					</Button>
					<Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }}>
						{isEditMode ? 'Edit Catalyst Chart' : 'Create New Catalyst Chart'}
					</Typography>
				</Box>

				{/* Error Alert */}
				{error && (
					<Alert severity="error" sx={{ mb: 3 }}>
						{error}
					</Alert>
				)}

				{/* Stepper */}
				<Box sx={{ mb: 4 }}>
					<Stepper activeStep={activeStep} alternativeLabel>
						{steps.map(label => (
							<Step key={label}>
								<StepLabel>{label}</StepLabel>
							</Step>
						))}
					</Stepper>
				</Box>

				{/* Step Content */}
				<Box sx={{ mb: 4 }}>{renderStepContent(activeStep)}</Box>

				{/* Navigation Buttons */}
				<Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 3, borderTop: '1px solid #e0e0e0' }}>
					<Button disabled={activeStep === 0} onClick={handleBack} sx={{ textTransform: 'none' }}>
						Back
					</Button>

					<Box sx={{ display: 'flex', gap: 2 }}>
						<Button variant="outlined" startIcon={<Cancel />} onClick={handleCancel} sx={{ textTransform: 'none' }}>
							Cancel
						</Button>

						{activeStep === steps.length - 1 ? (
							<Button
								variant="contained"
								startIcon={<Save />}
								onClick={handleSubmit(onSubmit)}
								disabled={loading}
								sx={{
									textTransform: 'none',
									backgroundColor: '#1976d2',
									'&:hover': { backgroundColor: '#1565c0' }
								}}
							>
								{loading ? 'Saving...' : isEditMode ? 'Update Chart' : 'Create Chart'}
							</Button>
						) : (
							<Button
								variant="contained"
								onClick={handleNext}
								sx={{
									textTransform: 'none',
									backgroundColor: '#1976d2',
									'&:hover': { backgroundColor: '#1565c0' }
								}}
							>
								Next
							</Button>
						)}
					</Box>
				</Box>
			</Paper>
		</Box>
		</FormProvider>
	);
};

export default CreateCatalyst;
