import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Paper, Typography, Button, Stepper, Step, StepLabel, Alert, Skeleton } from '@mui/material';
import { Save, Cancel } from '@mui/icons-material';
import Swal from 'sweetalert2';
import PrcTemplateBasicInfo from './components/PrcTemplateBasicInfo';
import PrcTemplateSteps from './components/PrcTemplateSteps';
import PrcTemplateReview from './components/PrcTemplateReview';
import { prcTemplateFormSchema, defaultPrcTemplateFormData } from './schemas';
import { PrcTemplateFormData } from './schemas';
import {
	useFetchPrcTemplateByIdQuery,
	useCreatePrcTemplateMutation,
	useUpdatePrcTemplateMutation
} from '../../../../../store/api/business/prc-template/prc-template.api';
import { useFetchProcessSequencesQuery } from '../../../../../store/api/business/sequence-master/sequence.api';
import { useFetchInspectionsQuery } from '../../../../../store/api/business/inspection-master/inspection.api';

const steps = ['Basic Information', 'Template Steps', 'Review & Submit'];

const CreatePrcTemplate = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const isEditMode = Boolean(id);

	const [activeStep, setActiveStep] = useState(0);
	const [error, setError] = useState<string | null>(null);

	// Fetch template data for edit mode
	const {
		data: templateData,
		isLoading: isFetching,
		isSuccess: isFetchSuccess
	} = useFetchPrcTemplateByIdQuery({ id: Number(id) }, { skip: !isEditMode || !id });

	// Fetch sequences and inspections for edit mode data mapping
	const { data: sequencesData } = useFetchProcessSequencesQuery();
	const { data: inspectionsData } = useFetchInspectionsQuery();

	// API mutations
	const [createTemplate, { isLoading: isCreating }] = useCreatePrcTemplateMutation();
	const [updateTemplate, { isLoading: isUpdating }] = useUpdatePrcTemplateMutation();

	// Initialize React Hook Form
	const methods = useForm<PrcTemplateFormData>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		resolver: yupResolver(prcTemplateFormSchema) as any,
		defaultValues: defaultPrcTemplateFormData,
		mode: 'onChange',
		reValidateMode: 'onChange'
	});

	const {
		control,
		handleSubmit,
		formState: { errors },
		reset,
		trigger,
		setValue
	} = methods;

	// Debug: Log errors when they change
	useEffect(() => {
		if (Object.keys(errors).length > 0) {
			console.log('Form errors (Yup):', errors);
		}
	}, [errors]);

	// Load data for edit mode when API data is available
	useEffect(() => {
		if (isEditMode && isFetchSuccess && templateData && sequencesData && inspectionsData) {
			// Create lookup maps for sequences and inspections
			const sequenceMap = new Map();
			(sequencesData.detail || []).forEach(seq => {
				sequenceMap.set(seq.id, seq);
			});

			const inspectionMap = new Map();
			(inspectionsData.detail || []).forEach(ins => {
				inspectionMap.set(ins.inspection.id, ins.inspection);
			});

			const formData: PrcTemplateFormData = {
				id: templateData.detail.prcTemplate.id,
				templateId: templateData.detail.prcTemplate.templateId,
				templateName: templateData.detail.prcTemplate.templateName,
				notes: templateData.detail.prcTemplate.notes || '',
				version: templateData.detail.prcTemplate.version,
				isLatest: templateData.detail.prcTemplate.isLatest,
				isActive: templateData.detail.prcTemplate.isActive,
				prcTemplateSteps: templateData.detail.prcTemplateSteps.map(step => {
					// Find the corresponding sequence or inspection data
					let itemName = '';
					let itemId = '';
					let itemType = step.type;

					if (step.type === 'sequence') {
						const sequenceData = sequenceMap.get(step.stepId);
						if (sequenceData) {
							itemName = sequenceData.sequenceName;
							itemId = sequenceData.sequenceId;
						}
					} else if (step.type === 'inspection') {
						const inspectionData = inspectionMap.get(step.stepId);
						if (inspectionData) {
							itemName = inspectionData.inspectionName;
							itemId = inspectionData.inspectionId;
						}
					}

					return {
						id: step.id,
						version: step.version,
						isLatest: step.isLatest,
						sequence: step.sequence,
						stepId: step.stepId || 0,
						type: step.type,
						blockCatalystMixing: step.blockCatalystMixing,
						requestSupervisorApproval: step.requestSupervisorApproval,
						createdAt: step.createdAt,
						updatedAt: step.updatedAt,
						// Add the missing fields for ExtendedPrcTemplateStep
						itemName,
						itemId,
						itemType: itemType as 'sequence' | 'inspection'
					};
				}),
				createdAt: templateData.detail.prcTemplate.createdAt,
				updatedAt: templateData.detail.prcTemplate.updatedAt
			};
			reset(formData);
		}
	}, [isEditMode, isFetchSuccess, templateData, sequencesData, inspectionsData, reset]);

	const handleNext = async () => {
		// Define fields to validate for each step
		const stepFields = {
			0: ['templateId', 'templateName', 'notes', 'isActive'] as const,
			1: ['prcTemplateSteps'] as const
			// Step 2 (Review) doesn't need validation
		};

		const fieldsToValidate = stepFields[activeStep as keyof typeof stepFields];

		if (fieldsToValidate) {
			try {
				const isValid = await trigger([...fieldsToValidate] as (keyof PrcTemplateFormData)[]);
				if (isValid) {
					setActiveStep(prevActiveStep => prevActiveStep + 1);
				} else {
					console.log('Validation failed for step:', activeStep, 'Errors (Yup):', errors);
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
			navigate('/prc-template-master');
		} else {
			setActiveStep(prevActiveStep => prevActiveStep - 1);
		}
	};

	const onSubmit = async (data: PrcTemplateFormData) => {
		setError(null);

		try {
			const isValid = await trigger();
			if (!isValid) {
				console.log('Form validation failed on submit:', errors);
				setError('Please fix all validation errors before submitting');
				return;
			}

			// Transform form data to API request format
			const templateRequestData = {
				status: data.isActive ? 'ACTIVE' : 'INACTIVE',
				templateId: data.templateId,
				templateName: data.templateName,
				notes: data.notes || '',
				version: data.version || 1,
				isLatest: data.isLatest ?? true,
				isActive: data.isActive ?? true
			};

			const templateSteps = (data.prcTemplateSteps || []).map((step, index) => ({
				version: step.version,
				isLatest: step.isLatest,
				sequence: index + 3, // Start from 3 (after 2 default steps)
				stepId: step.stepId,
				type: step.type,
				blockCatalystMixing: step.blockCatalystMixing ?? false,
				requestSupervisorApproval: step.requestSupervisorApproval ?? false
			}));

			console.log('Saving template data:', { templateRequestData, templateSteps });

			if (isEditMode && data.id) {
				// Update existing template
				const updateData = {
					id: data.id,
					prcTemplate: {
						id: data.id,
						...templateRequestData
					},
					prcTemplateSteps: templateSteps
				};
				await updateTemplate(updateData).unwrap();

				Swal.fire({
					icon: 'success',
					title: 'Success!',
					text: 'PRC template updated successfully',
					timer: 2000,
					showConfirmButton: false
				});
			} else {
				// Create new template
				const createData = {
					prcTemplate: templateRequestData,
					prcTemplateSteps: templateSteps
				};
				await createTemplate(createData).unwrap();

				Swal.fire({
					icon: 'success',
					title: 'Success!',
					text: 'PRC template created successfully',
					timer: 2000,
					showConfirmButton: false
				});
			}

			navigate('/prc-template-master');
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
						: `Failed to ${isEditMode ? 'update' : 'create'} PRC template`;
			setError(errorMessage);
		}
	};

	const handleCancel = () => {
		navigate('/prc-template-master');
	};

	const renderStepContent = (step: number) => {
		switch (step) {
			case 0:
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return <PrcTemplateBasicInfo control={control as any} errors={errors} />;
			case 1:
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return <PrcTemplateSteps control={control as any} errors={errors} setValue={setValue as any} />;
			case 2:
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return <PrcTemplateReview control={control as any} />;
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
							{isEditMode ? 'Edit PRC Template' : 'Create New PRC Template'}
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
									{isCreating || isUpdating ? 'Saving...' : isEditMode ? 'Update Template' : 'Create Template'}
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

export default CreatePrcTemplate;
