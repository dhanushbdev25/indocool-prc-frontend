import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Paper, Typography, Button, Stepper, Step, StepLabel, Alert, Skeleton } from '@mui/material';
import { Save, Cancel } from '@mui/icons-material';
import Swal from 'sweetalert2';
import SequenceBasicInfo from './components/SequenceBasicInfo';
import SequenceStepGroups from './components/SequenceStepGroups';
import SequenceReview from './components/SequenceReview';
import { sequenceFormSchema, defaultSequenceFormData } from './schemas';
import { SequenceFormData } from './schemas';
import {
	useFetchProcessSequenceByIdQuery,
	useCreateProcessSequenceMutation,
	useUpdateProcessSequenceMutation
} from '../../../../../store/api/business/sequence-master/sequence.api';

const steps = ['Basic Information', 'Step Groups & Steps', 'Review & Submit'];

// Helper function to convert time string (HH:MM) to seconds
const convertTimeToSeconds = (timeString: string): number => {
	if (!timeString) return 0;
	const [hours, minutes] = timeString.split(':').map(Number);
	return (hours * 60 + minutes) * 60; // Convert to seconds
};

// Helper function to convert seconds to time string (HH:MM)
const convertSecondsToTime = (seconds: number): string => {
	if (!seconds || seconds === 0) return '00:01'; // Default to 1 minute
	const totalMinutes = Math.floor(seconds / 60);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const CreateSequence = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const isEditMode = Boolean(id);

	const [activeStep, setActiveStep] = useState(0);
	const [error, setError] = useState<string | null>(null);

	// Fetch sequence data for edit mode
	const {
		data: sequenceData,
		isLoading: isFetching,
		isSuccess: isFetchSuccess
	} = useFetchProcessSequenceByIdQuery({ id: Number(id) }, { skip: !isEditMode || !id });

	// API mutations
	const [createSequence, { isLoading: isCreating }] = useCreateProcessSequenceMutation();
	const [updateSequence, { isLoading: isUpdating }] = useUpdateProcessSequenceMutation();

	// Initialize React Hook Form
	const methods = useForm<SequenceFormData>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		resolver: yupResolver(sequenceFormSchema) as any,
		defaultValues: defaultSequenceFormData,
		mode: 'onChange',
		reValidateMode: 'onChange'
	});

	const {
		control,
		handleSubmit,
		formState: { errors },
		reset,
		trigger,
		watch
	} = methods;

	// Watch form data for calculations - use ref to avoid memoization issues
	const watchRef = useRef(watch);

	useEffect(() => {
		watchRef.current = watch;

		const calculateSteps = () => {
			const currentProcessStepGroups = methods.getValues('processStepGroups');
			if (currentProcessStepGroups) {
				const totalSteps = currentProcessStepGroups.reduce(
					(total, group) => total + (group.processSteps?.length || 0),
					0
				);
				const ctqSteps = currentProcessStepGroups.reduce(
					(total, group) => total + (group.processSteps?.filter(step => step.ctq)?.length || 0),
					0
				);

				// Update form values
				methods.setValue('totalSteps', totalSteps);
				methods.setValue('ctqSteps', ctqSteps);
			}
		};

		// Calculate steps when component mounts
		calculateSteps();

		// Set up a subscription to watch for changes
		const subscription = watchRef.current((_value, { name }) => {
			if (name === 'processStepGroups') {
				calculateSteps();
			}
		});

		return () => subscription.unsubscribe();
	}, [methods, watch]);

	// Debug: Log errors when they change
	useEffect(() => {
		if (Object.keys(errors).length > 0) {
			console.log('Form errors (Yup):', errors);
		}
	}, [errors]);

	// Load data for edit mode when API data is available
	useEffect(() => {
		if (isEditMode && isFetchSuccess && sequenceData) {
			const formData: SequenceFormData = {
				id: sequenceData.detail.id,
				sequenceId: sequenceData.detail.sequenceId,
				sequenceName: sequenceData.detail.sequenceName,
				category: sequenceData.detail.category,
				type: sequenceData.detail.type,
				status: sequenceData.detail.status === 'ACTIVE',
				notes: sequenceData.detail.notes || '',
				totalSteps: sequenceData.detail.totalSteps,
				ctqSteps: sequenceData.detail.ctqSteps,
				processStepGroups: sequenceData.detail.stepGroups.map(group => ({
					processName: group.processName,
					processDescription: group.processDescription,
					sequenceTiming: convertSecondsToTime(group.sequenceTiming || 60), // Convert seconds to HH:MM
					processSteps: group.steps.map(step => ({
						parameterDescription: step.parameterDescription,
						stepNumber: step.stepNumber,
						stepType: step.stepType,
						evaluationMethod: step.evaluationMethod,
						targetValueType: step.targetValueType,
						minimumAcceptanceValue: step.minimumAcceptanceValue ? Number(step.minimumAcceptanceValue) : null,
						maximumAcceptanceValue: step.maximumAcceptanceValue ? Number(step.maximumAcceptanceValue) : null,
						multipleMeasurements: step.multipleMeasurements ?? false,
						multipleMeasurementMaxCount: step.multipleMeasurementMaxCount,
						uom: step.uom,
						ctq: step.ctq ?? false,
						allowAttachments: step.allowAttachments ?? false,
						responsiblePerson: step.responsiblePerson ?? false,
						notes: step.notes
					}))
				})),
				createdAt: sequenceData.detail.createdAt,
				updatedAt: sequenceData.detail.updatedAt
			};
			reset(formData);
		}
	}, [isEditMode, isFetchSuccess, sequenceData, reset]);

	const handleNext = async () => {
		// Define fields to validate for each step
		const stepFields = {
			0: ['sequenceId', 'sequenceName', 'category', 'type', 'status', 'notes'] as const,
			1: ['processStepGroups'] as const
		};

		const fieldsToValidate = stepFields[activeStep as keyof typeof stepFields];

		if (fieldsToValidate) {
			try {
				const isValid = await trigger([...fieldsToValidate] as (keyof SequenceFormData)[]);
				if (isValid) {
					setActiveStep(prevActiveStep => prevActiveStep + 1);
				} else {
					console.log('Validation failed for step:', activeStep, 'Errors (Yup):', errors);
					// Scroll to first error field for better UX
					const firstErrorField = document.querySelector('.Mui-error');
					if (firstErrorField) {
						firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
					}
				}
			} catch (error) {
				console.error('Validation error:', error);
			}
		} else {
			setActiveStep(prevActiveStep => prevActiveStep + 1);
		}
	};

	const handleBack = () => {
		if (activeStep === 0) {
			// If on first step, go back to main page
			navigate('/sequence-master');
		} else {
			// Otherwise, go to previous step
			setActiveStep(prevActiveStep => prevActiveStep - 1);
		}
	};

	const onSubmit = async (data: SequenceFormData) => {
		setError(null);

		try {
			const isValid = await trigger();
			if (!isValid) {
				console.log('Form validation failed on submit:', errors);
				setError('Please fix all validation errors before submitting');
				return;
			}

			// Transform form data to API request format
			const apiData = {
				data: {
					processSequence: {
						status: data.status ? 'ACTIVE' : 'INACTIVE',
						sequenceId: data.sequenceId,
						sequenceName: data.sequenceName,
						version: isEditMode && sequenceData ? sequenceData.detail.version : 1,
						isLatest: isEditMode && sequenceData ? sequenceData.detail.isLatest : true,
						category: data.category,
						type: data.type,
						notes: data.notes || '',
						totalSteps: data.totalSteps || 0,
						ctqSteps: data.ctqSteps || 0
					},
					processStepGroups: (data.processStepGroups || []).map(group => ({
						processName: group.processName,
						processDescription: group.processDescription,
						sequenceTiming: convertTimeToSeconds(group.sequenceTiming),
						processSteps: (group.processSteps || []).map((step, stepIndex) => ({
							parameterDescription: step.parameterDescription,
							stepNumber: stepIndex + 1, // Auto-calculate step number
							stepType: step.stepType,
							evaluationMethod: step.evaluationMethod,
							targetValueType: step.targetValueType,
							minimumAcceptanceValue: step.minimumAcceptanceValue ?? null,
							maximumAcceptanceValue: step.maximumAcceptanceValue ?? null,
							multipleMeasurements: step.multipleMeasurements ?? false,
							multipleMeasurementMaxCount: step.multipleMeasurementMaxCount ?? null,
							uom: step.uom,
							ctq: step.ctq ?? false,
							allowAttachments: step.allowAttachments ?? false,
							responsiblePerson: step.responsiblePerson ?? false,
							notes: step.notes || ''
						}))
					}))
				}
			};

			console.log('Saving sequence data:', apiData);

			if (isEditMode && data.id) {
				await updateSequence({ id: data.id, data: apiData.data }).unwrap();

				Swal.fire({
					icon: 'success',
					title: 'Success!',
					text: 'Process sequence updated successfully',
					timer: 2000,
					showConfirmButton: false
				});
			} else {
				await createSequence(apiData).unwrap();

				Swal.fire({
					icon: 'success',
					title: 'Success!',
					text: 'Process sequence created successfully',
					timer: 2000,
					showConfirmButton: false
				});
			}

			navigate('/sequence-master');
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
						: `Failed to ${isEditMode ? 'update' : 'create'} process sequence`;
			setError(errorMessage);
		}
	};

	const handleCancel = () => {
		navigate('/sequence-master');
	};

	const renderStepContent = (step: number) => {
		switch (step) {
			case 0:
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return <SequenceBasicInfo control={control as any} errors={errors} />;
			case 1:
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return <SequenceStepGroups control={control as any} errors={errors} />;
			case 2:
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return <SequenceReview control={control as any} errors={errors} />;
			default:
				return null;
		}
	};

	// Show skeleton loading state when fetching data in edit mode
	if (isEditMode && isFetching) {
		return (
			<Box sx={{ minHeight: '100vh' }}>
				<Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
					<Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
						<Skeleton variant="rectangular" width={80} height={36} sx={{ mr: 2, borderRadius: 1 }} />
						<Skeleton variant="text" width={300} height={40} />
					</Box>

					<Box sx={{ mb: 4 }}>
						<Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 1 }} />
					</Box>

					<Box sx={{ mb: 4 }}>
						<Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 1 }} />
					</Box>

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
							{isEditMode ? 'Edit Process Sequence' : 'Create New Process Sequence'}
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
									{isCreating || isUpdating ? 'Saving...' : isEditMode ? 'Update Sequence' : 'Create Sequence'}
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

export default CreateSequence;
