import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
	Box,
	Paper,
	Typography,
	Button,
	Tabs,
	Tab,
	Alert,
	Skeleton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	IconButton,
	CircularProgress
} from '@mui/material';
import { Save, Cancel, Close as CloseIcon } from '@mui/icons-material';
import Swal from 'sweetalert2';
import GeneralInfo from './components/GeneralInfo';
import RawMaterialsTab from './components/RawMaterialsTab';
import TechnicalDataTab from './components/TechnicalDataTab';
import LinkedMastersTab from './components/LinkedMastersTab';
import { partMasterFormSchema, defaultPartMasterFormData } from './schemas';
import { PartMasterFormData } from './schemas';
import {
	useFetchPartByIdQuery,
	useCreatePartMutation,
	useUpdatePartMutation
} from '../../../../../store/api/business/part-master/part.api';
import { useFetchCustomersQuery } from '../../../../../store/api/business/part-master/part.api';
import { uploadPartDrawings } from '../../../../../utils/uploadPartDrawings';
import { useImageGallery } from '../../../../../hooks/useImageGallery';

/**
 * Handles image upload and updates form data with API filenames
 * @param formData - Current form data
 * @param gallery - Current image gallery
 * @param setGallery - Function to update gallery
 * @param setValue - Function to update form values
 * @param setError - Function to set error messages
 * @returns Uploaded drawings data or null if upload failed
 */
const handleImageUploadAndUpdateForm = async (
	formData: any, // eslint-disable-line @typescript-eslint/no-explicit-any
	gallery: any[], // eslint-disable-line @typescript-eslint/no-explicit-any
	setGallery: (gallery: any[]) => void, // eslint-disable-line @typescript-eslint/no-explicit-any
	setValue: any, // eslint-disable-line @typescript-eslint/no-explicit-any
	setError: (error: string | null) => void,
	setIsUploadingImages: (loading: boolean) => void
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[] | null> => {
	if (gallery.length === 0) return [];

	// Separate new files (to upload) from existing files (already uploaded)
	const newFiles = gallery.map(item => item.file).filter(Boolean) as File[];
	const existingFiles = gallery
		.filter(item => !item.file && item.fileName)
		.map(item => ({
			fileName: item.fileName,
			filePath: item.image,
			originalFileName: item.fileName
		}));

	// If no new files to upload, return existing files
	if (newFiles.length === 0) {
		return existingFiles;
	}

	setIsUploadingImages(true);
	try {
		const { uploads, errors: uploadErrors } = await uploadPartDrawings(newFiles);

		if (uploadErrors.length > 0) {
			const errorMessage = uploadErrors.map(err => `${err.fileName}: ${err.error}`).join('\n');
			setError(`Some images failed to upload:\n${errorMessage}`);
			return null;
		}

		// Update gallery with API filenames
		updateGalleryWithApiFilenames(gallery, uploads, setGallery);

		// Update inspectionDiagrams with API filenames
		updateInspectionDiagramsWithApiFilenames(formData, uploads, setValue);

		// Return both existing files and newly uploaded files
		return [...existingFiles, ...uploads];
	} catch {
		setError('Failed to upload images. Please try again.');
		return null;
	} finally {
		setIsUploadingImages(false);
	}
};

/**
 * Updates gallery with API filenames from upload results
 */
const updateGalleryWithApiFilenames = (
	gallery: any[], // eslint-disable-line @typescript-eslint/no-explicit-any
	uploads: any[], // eslint-disable-line @typescript-eslint/no-explicit-any
	setGallery: (gallery: any[]) => void // eslint-disable-line @typescript-eslint/no-explicit-any
): void => {
	const updatedGallery = gallery.map((imageItem, index) => {
		const uploadResult = uploads[index];
		if (uploadResult?.fileName) {
			return {
				...imageItem,
				fileName: uploadResult.fileName
			};
		}
		return imageItem;
	});
	setGallery(updatedGallery);
};

/**
 * Updates inspectionDiagrams form data with API filenames
 */
const updateInspectionDiagramsWithApiFilenames = (
	formData: any, // eslint-disable-line @typescript-eslint/no-explicit-any
	uploads: any[], // eslint-disable-line @typescript-eslint/no-explicit-any
	setValue: any // eslint-disable-line @typescript-eslint/no-explicit-any
): void => {
	if (!formData.inspectionDiagrams?.files) return;

	const updatedInspectionDiagrams = {
		...formData.inspectionDiagrams,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		files: formData.inspectionDiagrams.files.map((file: any) => ({
			...file,
			fileName:
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				file.fileName?.map((fileObj: any) => {
					// If it's already a complete file object, find the matching upload result
					if (typeof fileObj === 'object' && fileObj.originalFileName) {
						const uploadResult = uploads.find(upload => upload.originalFileName === fileObj.originalFileName);
						if (uploadResult) {
							return {
								fileName: uploadResult.fileName,
								filePath: uploadResult.filePath,
								originalFileName: uploadResult.originalFileName
							};
						}
					}
					// If it's just a string (legacy format), find the matching upload result
					else if (typeof fileObj === 'string') {
						const uploadResult = uploads.find(upload => upload.originalFileName === fileObj);
						if (uploadResult) {
							return {
								fileName: uploadResult.fileName,
								filePath: uploadResult.filePath,
								originalFileName: uploadResult.originalFileName
							};
						}
					}
					return fileObj;
				}) || []
		}))
	};

	setValue('inspectionDiagrams', updatedInspectionDiagrams);
};

/**
 * Transforms form data to API request format
 */
const transformFormDataToApiRequest = (
	formData: any, // eslint-disable-line @typescript-eslint/no-explicit-any
	uploadedDrawings: any[], // eslint-disable-line @typescript-eslint/no-explicit-any
	isEditMode: boolean
) => {
	return {
		partMaster: {
			...(isEditMode && formData.id ? { id: formData.id } : {}),
			partNumber: formData.partNumber,
			drawingNumber: formData.drawingNumber,
			drawingRevision: formData.drawingRevision,
			partRevision: formData.partRevision,
			status: formData.isActive ? ('ACTIVE' as const) : ('INACTIVE' as const),
			customer: formData.customer,
			description: formData.description,
			notes: formData.notes || '',
			layupType: formData.layupType || '',
			model: formData.model || '',
			sapReferenceNumber: formData.sapReferenceNumber || '',
			version: formData.version || 1,
			isLatest: formData.isLatest ?? true,
			catalyst: formData.catalyst,
			prcTemplate: formData.prcTemplate,
			files: uploadedDrawings,
			inspectionDiagrams: transformInspectionDiagrams(formData.inspectionDiagrams)
		},
		rawMaterials: transformArrayData(formData.rawMaterials, isEditMode),
		bom: transformArrayData(formData.bom, isEditMode),
		drilling: transformArrayData(formData.drilling, isEditMode),
		cutting: transformArrayData(formData.cutting, isEditMode)
	};
};

/**
 * Transforms array data (rawMaterials, bom, drilling, cutting) for API request
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformArrayData = (arrayData: any[], isEditMode: boolean) => {
	return (arrayData || []).map(item => {
		const { id, ...itemWithoutId } = item;
		return {
			...(isEditMode && id && typeof id === 'number' ? { id } : {}),
			...itemWithoutId,
			version: item.version || 1,
			isLatest: item.isLatest ?? true
		};
	});
};

/**
 * Transforms inspectionDiagrams for API request
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformInspectionDiagrams = (inspectionDiagrams: any) => {
	if (!inspectionDiagrams) return undefined;

	return {
		files:
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			inspectionDiagrams.files?.map((file: any) => ({
				inspectionParameterId: file.inspectionParameterId || 0,
				fileName: (file.fileName || []).filter(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(fileObj: any) => fileObj !== undefined && fileObj !== null && typeof fileObj === 'object'
				)
			})) || []
	};
};

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`part-tabpanel-${index}`}
			aria-labelledby={`part-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ py: 3 }}>{children}</Box>}
		</div>
	);
}

const CreatePart = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const isEditMode = Boolean(id);
	const { gallery, handleAddImage, handleRemoveImage, setGallery } = useImageGallery();

	const [activeTab, setActiveTab] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [showExitDialog, setShowExitDialog] = useState(false);
	const [isUploadingImages, setIsUploadingImages] = useState(false);

	// Fetch part data for edit mode
	const {
		data: partData,
		isLoading: isFetching,
		isSuccess: isFetchSuccess
	} = useFetchPartByIdQuery({ id: Number(id) }, { skip: !isEditMode || !id });

	// Fetch customers for dropdown
	const { data: customersData } = useFetchCustomersQuery();

	// API mutations
	const [createPart, { isLoading: isCreating }] = useCreatePartMutation();
	const [updatePart, { isLoading: isUpdating }] = useUpdatePartMutation();

	// Initialize React Hook Form
	const methods = useForm<PartMasterFormData>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		resolver: yupResolver(partMasterFormSchema) as any,
		defaultValues: defaultPartMasterFormData,
		mode: 'onChange',
		reValidateMode: 'onChange'
	});

	const {
		control,
		handleSubmit,
		formState: { errors },
		reset,
		trigger,
		setValue,
		getValues
	} = methods;

	// Debug: Log errors when they change
	useEffect(() => {
		if (Object.keys(errors).length > 0) {
			console.log('Form errors (Yup):', errors);
		}
	}, [errors]);

	// Load data for edit mode when API data is available
	useEffect(() => {
		if (isEditMode && isFetchSuccess && partData && customersData) {
			const { partMaster, rawMaterials, drilling, cutting } = partData.detail;

			const formData: PartMasterFormData = {
				id: partMaster.id,
				partNumber: partMaster.partNumber,
				drawingNumber: partMaster.drawingNumber,
				drawingRevision: partMaster.drawingRevision,
				partRevision: partMaster.partRevision,
				isActive: partMaster.status === 'ACTIVE',
				customer: partMaster.customer,
				description: partMaster.description,
				notes: partMaster.notes || '',
				layupType: partMaster.layupType || '',
				model: partMaster.model || '',
				sapReferenceNumber: partMaster.sapReferenceNumber || '',
				version: partMaster.version,
				isLatest: partMaster.isLatest,
				catalyst: partMaster.catalyst || undefined,
				prcTemplate: partMaster.prcTemplate || undefined,
				rawMaterials: rawMaterials.map(rm => ({
					id: rm.id,
					materialName: rm.materialName,
					materialCode: rm.materialCode,
					quantity: rm.quantity,
					uom: rm.uom,
					batching: rm.batching,
					splitting: rm.splitting,
					splittingConfiguration: rm.splittingConfiguration
						? rm.splittingConfiguration.map(split => ({
								order: split.order,
								splitQuantity: String(split.splitQuantity)
							}))
						: null,
					version: rm.version,
					isLatest: rm.isLatest
				})),
				drilling: drilling.map(d => ({
					id: d.id,
					characteristics: d.characteristics,
					specification: d.specification,
					noOfHoles: d.noOfHoles,
					diaOfHoles: d.diaOfHoles,
					tolerance: d.tolerance,
					version: d.version,
					isLatest: d.isLatest
				})),
				cutting: cutting.map(c => ({
					id: c.id,
					characteristics: c.characteristics,
					specification: c.specification,
					tolerance: c.tolerance,
					version: c.version,
					isLatest: c.isLatest
				})),
				files: partMaster.files || [],
				inspectionDiagrams: partMaster.inspectionDiagrams
					? Array.isArray(partMaster.inspectionDiagrams)
						? partMaster.inspectionDiagrams[0] // Take first item if array
						: partMaster.inspectionDiagrams // Use as is if object
					: undefined,
				createdAt: partMaster.createdAt || undefined,
				updatedAt: partMaster.updatedAt || undefined
			};
			reset(formData);

			// Populate gallery with existing files
			if (partMaster.files && partMaster.files.length > 0) {
				const galleryItems = partMaster.files.map((file, index) => ({
					id: `existing-${index}`,
					file: null,
					image: file.filePath ? `${process.env.API_BASE_URL_PRE_AUTH}${file.filePath.replace(/\\/g, '/')}` : '',
					fileName: file.originalFileName || `Image ${index}`
				}));
				setGallery(galleryItems);
			}
		}
	}, [isEditMode, isFetchSuccess, partData, customersData, reset, setGallery]);

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	const onSubmit = async (data: PartMasterFormData) => {
		setError(null);

		try {
			const isValid = await trigger();
			if (!isValid) {
				console.log('Form validation failed on submit:', errors);
				setError('Please fix all validation errors before submitting');
				return;
			}

			// Upload images and update form data with API filenames
			const currentUploadedDrawings = await handleImageUploadAndUpdateForm(
				data,
				gallery,
				setGallery,
				setValue,
				setError,
				setIsUploadingImages
			);
			if (!currentUploadedDrawings) return; // Upload failed

			// Get updated form data after setValue calls
			const updatedData = getValues();

			// Transform form data to API request format
			const partRequestData = transformFormDataToApiRequest(updatedData, currentUploadedDrawings, isEditMode);

			// Submit to API
			if (isEditMode && data.id) {
				// Update existing part
				const updateData = {
					id: data.id,
					data: partRequestData
				};
				await updatePart(updateData).unwrap();

				Swal.fire({
					icon: 'success',
					title: 'Success!',
					text: 'Part updated successfully',
					timer: 2000,
					showConfirmButton: false
				});
			} else {
				// Create new part
				await createPart({ data: partRequestData }).unwrap();

				Swal.fire({
					icon: 'success',
					title: 'Success!',
					text: 'Part created successfully',
					timer: 2000,
					showConfirmButton: false
				});
			}

			navigate('/part-master');
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
						: `Failed to ${isEditMode ? 'update' : 'create'} part`;
			setError(errorMessage);
		}
	};

	const handleCancel = () => {
		setShowExitDialog(true);
	};

	const handleExitConfirm = () => {
		navigate('/part-master');
	};

	const handleExitCancel = () => {
		setShowExitDialog(false);
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
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
						<Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }}>
							{isEditMode ? 'Edit Part' : 'Create New Part'}
						</Typography>
						<Box sx={{ display: 'flex', gap: 2 }}>
							<Button variant="outlined" startIcon={<Cancel />} onClick={handleCancel} sx={{ textTransform: 'none' }}>
								Cancel
							</Button>
							<Button
								variant="contained"
								startIcon={isUploadingImages ? <CircularProgress size={20} color="inherit" /> : <Save />}
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								onClick={handleSubmit(onSubmit as any)}
								disabled={isCreating || isUpdating || isUploadingImages}
								sx={{
									textTransform: 'none',
									backgroundColor: '#1976d2',
									'&:hover': { backgroundColor: '#1565c0' }
								}}
							>
								{isUploadingImages
									? 'Uploading Images...'
									: isCreating || isUpdating
										? isEditMode
											? 'Updating...'
											: 'Creating...'
										: isEditMode
											? 'Update Part'
											: 'Create Part'}
							</Button>
						</Box>
					</Box>

					{/* Error Alert */}
					{error && (
						<Alert severity="error" sx={{ mb: 3 }}>
							{error}
						</Alert>
					)}

					{/* Tabs */}
					<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
						<Tabs value={activeTab} onChange={handleTabChange} aria-label="part tabs">
							<Tab label="General Info" id="part-tab-0" aria-controls="part-tabpanel-0" />
							<Tab label="Raw Materials" id="part-tab-1" aria-controls="part-tabpanel-1" />
							<Tab label="Technical Data" id="part-tab-2" aria-controls="part-tabpanel-2" />
							<Tab label="Linked Masters" id="part-tab-3" aria-controls="part-tabpanel-3" />
						</Tabs>
					</Box>

					{/* Tab Content */}
					<TabPanel value={activeTab} index={0}>
						<GeneralInfo
							control={control}
							errors={errors}
							gallery={gallery}
							onAddImage={handleAddImage}
							onRemoveImage={handleRemoveImage}
						/>
					</TabPanel>
					<TabPanel value={activeTab} index={1}>
						<RawMaterialsTab control={control} errors={errors} />
					</TabPanel>
					<TabPanel value={activeTab} index={2}>
						<TechnicalDataTab control={control} errors={errors} />
					</TabPanel>
					<TabPanel value={activeTab} index={3}>
						<LinkedMastersTab control={control} errors={errors} setValue={setValue} gallery={gallery} />
					</TabPanel>
				</Paper>
			</Box>

			{/* Exit Confirmation Dialog */}
			<Dialog open={showExitDialog} onClose={handleExitCancel} maxWidth="sm" fullWidth>
				<DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<Typography variant="h6">Exit Without Saving</Typography>
					<IconButton onClick={handleExitCancel} size="small">
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					<Typography>Are you sure you want to exit without saving? All unsaved changes will be lost.</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleExitCancel}>Cancel</Button>
					<Button onClick={handleExitConfirm} color="error" variant="contained">
						Exit
					</Button>
				</DialogActions>
			</Dialog>
		</FormProvider>
	);
};

export default CreatePart;
