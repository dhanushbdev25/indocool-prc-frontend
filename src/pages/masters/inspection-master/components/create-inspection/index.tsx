import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Paper, Typography, Button, Stepper, Step, StepLabel, Alert, Skeleton } from '@mui/material';
import { Save, Cancel } from '@mui/icons-material';
import Swal from 'sweetalert2';
import InspectionBasicInfo from './components/InspectionBasicInfo';
import InspectionParameters from './components/InspectionParameters';
import InspectionReview from './components/InspectionReview';
import { inspectionFormSchema, defaultInspectionFormData } from './schemas';
import { InspectionFormData } from './schemas';
import {
	useFetchInspectionByIdQuery,
	useCreateInspectionMutation,
	useUpdateInspectionMutation
} from '../../../../../store/api/business/inspection-master/inspection.api';

const steps = ['Basic Information', 'Inspection Parameters', 'Review & Submit'];

const CreateInspection = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const isEditMode = Boolean(id);

	const [activeStep, setActiveStep] = useState(0);
	const [error, setError] = useState<string | null>(null);

	// Fetch inspection data for edit mode
	const {
		data: inspectionData,
		isLoading: isFetching,
		isSuccess: isFetchSuccess
	} = useFetchInspectionByIdQuery({ id: Number(id) }, { skip: !isEditMode || !id });

	// API mutations
	const [createInspection, { isLoading: isCreating }] = useCreateInspectionMutation();
	const [updateInspection, { isLoading: isUpdating }] = useUpdateInspectionMutation();

	// Initialize React Hook Form
	const methods = useForm<InspectionFormData>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		resolver: yupResolver(inspectionFormSchema) as any,
		defaultValues: defaultInspectionFormData,
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
		if (isEditMode && isFetchSuccess && inspectionData) {
			const formData: InspectionFormData = {
				id: inspectionData.detail.inspection.id,
				inspectionName: inspectionData.detail.inspection.inspectionName,
				status: inspectionData.detail.inspection.status === 'ACTIVE',
				inspectionId: inspectionData.detail.inspection.inspectionId,
				type: inspectionData.detail.inspection.type,
				version: inspectionData.detail.inspection.version,
				isLatest: inspectionData.detail.inspection.isLatest,
				showPartImages: inspectionData.detail.inspection.showPartImages,
				partImages: inspectionData.detail.inspection.partImages,
				inspectionParameters: inspectionData.detail.inspectionParameters.map(param => ({
					order: param.order,
					parameterName: param.parameterName,
					specification: param.specification,
					tolerance: param.tolerance,
					type: param.type,
					files: param.files || {},
					columns: param.columns.map(col => ({
						name: col.name,
						type: col.type,
						defaultValue: col.defaultValue || '',
						tolerance: col.tolerance || ''
					})),
					role: param.role,
					ctq: param.ctq
				})),
				createdAt: inspectionData.detail.inspection.createdAt,
				updatedAt: inspectionData.detail.inspection.updatedAt
			};
			reset(formData);
		}
	}, [isEditMode, isFetchSuccess, inspectionData, reset]);

	const handleNext = async () => {
		// Define fields to validate for each step
		const stepFields = {
			0: ['inspectionName', 'inspectionId', 'type', 'status', 'showPartImages', 'partImages'] as const, // Basic info step
			1: ['inspectionParameters'] as const // Parameters step
		};

		const fieldsToValidate = stepFields[activeStep as keyof typeof stepFields];

		if (fieldsToValidate) {
			try {
				// Convert readonly tuple to mutable array to satisfy trigger's type requirement
				const isValid = await trigger([...fieldsToValidate] as (keyof InspectionFormData)[]);
				if (isValid) {
					setActiveStep(prevActiveStep => prevActiveStep + 1);
				} else {
					// Validation failed - show popup with errors
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
		if (activeStep === 0) {
			// If on first step, go back to main page
			navigate('/inspection-master');
		} else {
			// Otherwise, go to previous step
			setActiveStep(prevActiveStep => prevActiveStep - 1);
		}
	};

	const onSubmit = async (data: InspectionFormData) => {
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
			const inspectionRequestData = {
				inspectionName: data.inspectionName,
				status: data.status ? 'ACTIVE' : 'INACTIVE',
				inspectionId: data.inspectionId,
				type: data.type,
				version: data.version || 1,
				isLatest: data.isLatest ?? true,
				showPartImages: data.showPartImages ?? false,
				partImages: data.partImages || []
			};

			const inspectionParameters = (data.inspectionParameters || []).map(param => ({
				order: param.order,
				parameterName: param.parameterName,
				specification: param.specification,
				tolerance: param.tolerance ? String(param.tolerance) : undefined,
				type: param.type,
				files: param.files || {},
				columns: (param.columns || []).map(col => ({
					name: col.name,
					type: col.type,
					defaultValue: col.defaultValue ? String(col.defaultValue) : undefined,
					tolerance: col.tolerance ? String(col.tolerance) : undefined
				})),
				role: param.role,
				ctq: param.ctq ?? false
			}));

			console.log('Saving inspection data:', { inspectionRequestData, inspectionParameters });

			if (isEditMode && data.id) {
				// Update existing inspection
				const updateData = {
					id: data.id,
					inspection: {
						id: data.id,
						...inspectionRequestData
					},
					inspectionParameters
				};
				await updateInspection(updateData).unwrap();

				// Show success message
				Swal.fire({
					icon: 'success',
					title: 'Success!',
					text: 'Inspection updated successfully',
					timer: 2000,
					showConfirmButton: false
				});
			} else {
				// Create new inspection
				const createData = {
					inspection: inspectionRequestData,
					inspectionParameters
				};
				await createInspection(createData).unwrap();

				// Show success message
				Swal.fire({
					icon: 'success',
					title: 'Success!',
					text: 'Inspection created successfully',
					timer: 2000,
					showConfirmButton: false
				});
			}

			navigate('/inspection-master');
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
						: `Failed to ${isEditMode ? 'update' : 'create'} inspection`;
			setError(errorMessage);
		}
	};

	const handleCancel = () => {
		navigate('/inspection-master');
	};

	const renderStepContent = (step: number) => {
		switch (step) {
			case 0:
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return <InspectionBasicInfo control={control as any} errors={errors} />;
			case 1:
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return <InspectionParameters control={control as any} errors={errors} />;
			case 2:
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return <InspectionReview control={control as any} errors={errors} />;
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
						<Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }}>
							{isEditMode ? 'Edit Inspection' : 'Create New Inspection'}
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
						<Button onClick={handleBack} sx={{ textTransform: 'none' }}>
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
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									onClick={handleSubmit(onSubmit as any)}
									disabled={isCreating || isUpdating}
									sx={{
										textTransform: 'none',
										backgroundColor: '#1976d2',
										'&:hover': { backgroundColor: '#1565c0' }
									}}
								>
									{isCreating || isUpdating ? 'Saving...' : isEditMode ? 'Update Inspection' : 'Create Inspection'}
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

export default CreateInspection;
