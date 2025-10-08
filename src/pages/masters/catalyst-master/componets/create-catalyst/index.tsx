import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Paper, Typography, Button, Stepper, Step, StepLabel, Alert, Skeleton } from '@mui/material';
import { ArrowBack, Save, Cancel } from '@mui/icons-material';
import Swal from 'sweetalert2';
import CatalystBasicInfo from './components/CatalystBasicInfo';
import CatalystConfiguration from './components/CatalystConfiguration';
import { catalystFormSchema, defaultCatalystFormData } from './schemas';
import { CatalystFormData } from './schemas';
import {
	useFetchCatalystByIdQuery,
	useCreateCatalystMutation,
	useUpdateCatalystMutation
} from '../../../../../store/api/business/catalyst-master/catalyst.api';

const steps = ['Basic Information', 'Configuration Settings'];

const CreateCatalyst = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const isEditMode = Boolean(id);

	const [activeStep, setActiveStep] = useState(0);
	const [error, setError] = useState<string | null>(null);

	// Fetch catalyst data for edit mode
	const {
		data: catalystData,
		isLoading: isFetching,
		isSuccess: isFetchSuccess
	} = useFetchCatalystByIdQuery({ id: Number(id) }, { skip: !isEditMode || !id });

	// API mutations
	const [createCatalyst, { isLoading: isCreating }] = useCreateCatalystMutation();
	const [updateCatalyst, { isLoading: isUpdating }] = useUpdateCatalystMutation();

	// Initialize React Hook Form
	const methods = useForm<CatalystFormData>({
		resolver: yupResolver(catalystFormSchema) as unknown,
		defaultValues: defaultCatalystFormData,
		mode: 'onChange', // Validate on change for immediate feedback
		reValidateMode: 'onChange' // Re-validate on change
	});

	const {
		control,
		handleSubmit,
		formState: { errors },
		reset,
		trigger
	} = methods;

	// Debug: Log errors when they change
	useEffect(() => {
		if (Object.keys(errors).length > 0) {
			console.log('Form errors (Yup):', errors);
		}
	}, [errors]);

	// Load data for edit mode when API data is available
	useEffect(() => {
		if (isEditMode && isFetchSuccess && catalystData) {
			const formData: CatalystFormData = {
				id: catalystData.detail.catalyst.id,
				chartId: catalystData.detail.catalyst.chartId,
				chartSupplier: catalystData.detail.catalyst.chartSupplier,
				notes: catalystData.detail.catalyst.notes || '',
				mekpDensity: catalystData.detail.catalyst.mekpDensity,
				isActive: catalystData.detail.catalyst.isActive,
				catalystConfiguration: catalystData.detail.catalystConfiguration,
				createdAt: catalystData.detail.catalyst.createdAt,
				updatedAt: catalystData.detail.catalyst.updatedAt
			};
			reset(formData);
		}
	}, [isEditMode, isFetchSuccess, catalystData, reset]);

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
		setError(null);

		try {
			// Validate the entire form before submission
			const isValid = await trigger();
			if (!isValid) {
				console.log('Form validation failed on submit:', errors);
				setError('Please fix all validation errors before submitting');
				return;
			}

			// Transform form data to API request format
			const apiData = {
				catalyst: {
					status: data.isActive ? 'ACTIVE' : 'INACTIVE',
					chartId: data.chartId,
					chartSupplier: data.chartSupplier,
					notes: data.notes || '',
					mekpDensity: Number(data.mekpDensity),
					isActive: data.isActive ?? true
				},
				catalystConfiguration: (data.catalystConfiguration || []).map(config => ({
					minTemperature: Number(config.minTemperature),
					maxTemperature: Number(config.maxTemperature),
					minHumidity: Number(config.minHumidity),
					maxHumidity: Number(config.maxHumidity),
					minGelcoat: Number(config.minGelcoat),
					maxGelcoat: Number(config.maxGelcoat),
					gelcoatLabel: config.gelcoatLabel,
					minResinDosage: Number(config.minResinDosage),
					maxResinDosage: Number(config.maxResinDosage),
					resinLabel: config.resinLabel,
					blockCatalystMixing: config.blockCatalystMixing ?? false,
					requestSupervisorApproval: config.requestSupervisorApproval ?? false
				}))
			};

			console.log('Saving catalyst data:', apiData);

			if (isEditMode && data.id) {
				// Update existing catalyst
				await updateCatalyst({ id: data.id, ...apiData }).unwrap();

				// Show success message
				Swal.fire({
					icon: 'success',
					title: 'Success!',
					text: 'Catalyst chart updated successfully',
					timer: 2000,
					showConfirmButton: false
				});
			} else {
				// Create new catalyst
				await createCatalyst(apiData).unwrap();

				// Show success message
				Swal.fire({
					icon: 'success',
					title: 'Success!',
					text: 'Catalyst chart created successfully',
					timer: 2000,
					showConfirmButton: false
				});
			}

			// Navigate back to list on success
			navigate('/catalyst-master');
		} catch (err: unknown) {
			console.error('API Error:', err);
			const errorMessage =
				err &&
				typeof err === 'object' &&
				'data' in err &&
				err.data &&
				typeof err.data === 'object' &&
				'message' in err.data
					? (err.data as { message: string }).message
					: err && typeof err === 'object' && 'message' in err
						? (err as { message: string }).message
						: `Failed to ${isEditMode ? 'update' : 'create'} catalyst`;
			setError(errorMessage);
		}
	};

	const handleCancel = () => {
		navigate('/catalyst-master');
	};

	const renderStepContent = (step: number) => {
		switch (step) {
			case 0:
				return <CatalystBasicInfo control={control as unknown} errors={errors} />;
			case 1:
				return <CatalystConfiguration control={control as unknown} errors={errors} />;
			default:
				return null;
		}
	};

	// Show skeleton loading state when fetching data in edit mode
	if (isEditMode && isFetching) {
		return (
			<Box sx={{ minHeight: '100vh' }}>
				<Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
					{/* Header skeleton */}
					<Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
						<Skeleton variant="rectangular" width={80} height={36} sx={{ mr: 2, borderRadius: 1 }} />
						<Skeleton variant="text" width={300} height={40} />
					</Box>

					{/* Stepper skeleton */}
					<Box sx={{ mb: 4 }}>
						<Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 1 }} />
					</Box>

					{/* Form content skeleton */}
					<Box sx={{ mb: 4 }}>
						<Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 1 }} />
					</Box>

					{/* Navigation buttons skeleton */}
					<Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 3, borderTop: '1px solid #e0e0e0' }}>
						<Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
						<Box sx={{ display: 'flex', gap: 2 }}>
							<Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
							<Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
						</Box>
					</Box>
				</Paper>
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
									onClick={handleSubmit(onSubmit as unknown)}
									disabled={isCreating || isUpdating}
									sx={{
										textTransform: 'none',
										backgroundColor: '#1976d2',
										'&:hover': { backgroundColor: '#1565c0' }
									}}
								>
									{isCreating || isUpdating ? 'Saving...' : isEditMode ? 'Update Chart' : 'Create Chart'}
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
