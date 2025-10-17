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
	IconButton
} from '@mui/material';
import { Save, Cancel, Close as CloseIcon } from '@mui/icons-material';
import Swal from 'sweetalert2';
import GeneralInfo from './components/GeneralInfo';
import RawMaterialsTab from './components/RawMaterialsTab';
import BOMTab from './components/BOMTab';
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

	const [activeTab, setActiveTab] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [showExitDialog, setShowExitDialog] = useState(false);

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
		if (isEditMode && isFetchSuccess && partData && customersData) {
			const { partMaster, rawMaterials, bom, drilling, cutting } = partData.detail;

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
					version: rm.version,
					isLatest: rm.isLatest
				})),
				bom: bom.map(b => ({
					id: b.id,
					materialType: b.materialType,
					description: b.description,
					bomQuantity: b.bomQuantity,
					actualQuantity: b.actualQuantity,
					version: b.version,
					isLatest: b.isLatest
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
				createdAt: partMaster.createdAt || undefined,
				updatedAt: partMaster.updatedAt || undefined
			};
			reset(formData);
		}
	}, [isEditMode, isFetchSuccess, partData, customersData, reset]);

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

			// Transform form data to API request format
			const partRequestData = {
				partMaster: {
					...(isEditMode && data.id ? { id: data.id } : {}),
					partNumber: data.partNumber,
					drawingNumber: data.drawingNumber,
					drawingRevision: data.drawingRevision,
					partRevision: data.partRevision,
					status: data.isActive ? ('ACTIVE' as const) : ('INACTIVE' as const),
					customer: data.customer,
					description: data.description,
					notes: data.notes || '',
					layupType: data.layupType || '',
					model: data.model || '',
					version: data.version || 1,
					isLatest: data.isLatest ?? true,
					catalyst: data.catalyst,
					prcTemplate: data.prcTemplate
				},
				rawMaterials: (data.rawMaterials || []).map(rm => ({
					materialName: rm.materialName,
					materialCode: rm.materialCode,
					quantity: rm.quantity,
					uom: rm.uom,
					version: rm.version || 1,
					isLatest: rm.isLatest ?? true
				})),
				bom: (data.bom || []).map(b => ({
					materialType: b.materialType,
					description: b.description,
					bomQuantity: b.bomQuantity,
					actualQuantity: b.actualQuantity,
					version: b.version || 1,
					isLatest: b.isLatest ?? true
				})),
				drilling: (data.drilling || []).map(d => ({
					characteristics: d.characteristics,
					specification: d.specification,
					noOfHoles: d.noOfHoles,
					diaOfHoles: d.diaOfHoles,
					tolerance: d.tolerance,
					version: d.version || 1,
					isLatest: d.isLatest ?? true
				})),
				cutting: (data.cutting || []).map(c => ({
					characteristics: c.characteristics,
					specification: c.specification,
					tolerance: c.tolerance,
					version: c.version || 1,
					isLatest: c.isLatest ?? true
				}))
			};

			console.log('Saving part data:', partRequestData);

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
								{isCreating || isUpdating ? 'Saving...' : isEditMode ? 'Update Part' : 'Create Part'}
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
							<Tab label="BOM" id="part-tab-2" aria-controls="part-tabpanel-2" />
							<Tab label="Technical Data" id="part-tab-3" aria-controls="part-tabpanel-3" />
							<Tab label="Linked Masters" id="part-tab-4" aria-controls="part-tabpanel-4" />
						</Tabs>
					</Box>

					{/* Tab Content */}
					<TabPanel value={activeTab} index={0}>
						<GeneralInfo control={control} errors={errors} />
					</TabPanel>
					<TabPanel value={activeTab} index={1}>
						<RawMaterialsTab control={control} errors={errors} />
					</TabPanel>
					<TabPanel value={activeTab} index={2}>
						<BOMTab control={control} errors={errors} />
					</TabPanel>
					<TabPanel value={activeTab} index={3}>
						<TechnicalDataTab control={control} errors={errors} />
					</TabPanel>
					<TabPanel value={activeTab} index={4}>
						<LinkedMastersTab control={control} errors={errors} setValue={setValue} />
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
