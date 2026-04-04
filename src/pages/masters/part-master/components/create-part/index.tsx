import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
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
import {
	useFetchPrcTemplateByIdQuery,
	useFetchOperationsComboQuery,
	useCreatePrcTemplateMutation
} from '../../../../../store/api/business/prc-template/prc-template.api';
import { useFetchProcessSequencesQuery } from '../../../../../store/api/business/sequence-master/sequence.api';
import { useFetchInspectionsQuery } from '../../../../../store/api/business/inspection-master/inspection.api';
import { uploadPartDrawings } from '../../../../../utils/uploadPartDrawings';
import { ImageItem } from '../../../../../hooks/useImageGallery';
import { getPartMoulds, upsertPartMoulds } from '../../../../../mocks/mould-reconciliation.mock';
import type { PrcTemplateOperationRequest } from '../../../../../store/api/business/prc-template/prc-template.validators';

/** Build nested operations[] for create PRC template: global sequence from flat order, then per-operation sequences/inspections arrays. */
function buildPrcTemplateOperationsFromSteps(
	steps: PartMasterFormData['prcTemplateSteps'],
	operationTextByValue: Map<string, string>
): PrcTemplateOperationRequest[] {
	const list = steps || [];
	const withGlobalSequence = list.map((step, index) => ({
		step,
		globalSequence: index + 3
	}));

	const groupOrder: string[] = [];
	const byGroup = new Map<string, typeof withGlobalSequence>();
	for (const item of withGlobalSequence) {
		const g = item.step.group ?? '';
		if (!byGroup.has(g)) {
			byGroup.set(g, []);
			groupOrder.push(g);
		}
		byGroup.get(g)!.push(item);
	}

	return groupOrder.map(groupId => {
		const items = byGroup.get(groupId)!;
		const sequences: PrcTemplateOperationRequest['sequences'] = [];
		const inspections: PrcTemplateOperationRequest['inspections'] = [];
		for (const { step, globalSequence } of items) {
			const payload = {
				version: step.version ?? 1,
				isLatest: step.isLatest ?? true,
				sequence: globalSequence,
				stepId: step.stepId,
				type: step.type,
				blockCatalystMixing: step.blockCatalystMixing ?? false,
				requestSupervisorApproval: step.requestSupervisorApproval ?? false
			};
			if (step.type === 'sequence') {
				sequences.push(payload);
			} else {
				inspections.push(payload);
			}
		}
		const operationText = operationTextByValue.get(groupId);
		return {
			operation: groupId,
			...(operationText ? { operationText } : {}),
			sequences,
			inspections
		};
	});
}

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
	const [isUploadingImages, setIsUploadingImages] = useState(false);

	// Per-inspection step galleries: keyed by "{group}-{itemType}-{stepId}"
	const [stepGalleries, setStepGalleries] = useState<Record<string, ImageItem[]>>({});

	const {
		data: partData,
		isLoading: isFetching,
		isSuccess: isFetchSuccess
	} = useFetchPartByIdQuery({ id: Number(id) }, { skip: !isEditMode || !id });

	const { data: customersData } = useFetchCustomersQuery();

	const prcTemplateIdFromPart = partData?.detail?.partMaster?.prcTemplate;
	const {
		data: prcTemplateData,
		isSuccess: isPrcTemplateFetchSuccess
	} = useFetchPrcTemplateByIdQuery(
		{ id: Number(prcTemplateIdFromPart) },
		{ skip: !isEditMode || !prcTemplateIdFromPart }
	);
	const { data: sequencesData } = useFetchProcessSequencesQuery();
	const { data: inspectionsData } = useFetchInspectionsQuery();

	const [createPart, { isLoading: isCreating }] = useCreatePartMutation();
	const [updatePart, { isLoading: isUpdating }] = useUpdatePartMutation();
	const [createPrcTemplate] = useCreatePrcTemplateMutation();

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

	const formPartId = useWatch({ control, name: 'id' });
	const operationsQueryPartId = formPartId ?? (id ? Number(id) : undefined);
	const { data: operationsData } = useFetchOperationsComboQuery(
		{ partId: operationsQueryPartId! },
		{ skip: !operationsQueryPartId }
	);

	useEffect(() => {
		if (Object.keys(errors).length > 0) {
			console.log('Form errors (Yup):', errors);
		}
	}, [errors]);

	useEffect(() => {
		if (isEditMode && isFetchSuccess && partData && customersData) {
			const { partMaster, rawMaterials, drilling, cutting } = partData.detail;

			const sequenceMap = new Map<number, { sequenceId: string; sequenceName: string }>();
			(sequencesData?.detail || []).forEach(seq => {
				sequenceMap.set(seq.id, { sequenceId: seq.sequenceId, sequenceName: seq.sequenceName });
			});

			const inspectionMap = new Map<number, { inspectionId: string; inspectionName: string }>();
			(inspectionsData?.detail || []).forEach(ins => {
				if (ins.inspection.id != null) {
					inspectionMap.set(ins.inspection.id, {
						inspectionId: ins.inspection.inspectionId,
						inspectionName: ins.inspection.inspectionName
					});
				}
			});

			let templateId = '';
			let templateName = '';
			let templateNotes = '';
			let isTemplateActive = true;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let prcTemplateSteps: any[] = [];

			if (isPrcTemplateFetchSuccess && prcTemplateData) {
				const tpl = prcTemplateData.detail.prcTemplate;
				templateId = tpl.templateId;
				templateName = tpl.templateName;
				templateNotes = tpl.notes || '';
				isTemplateActive = tpl.isActive;

				const defaultGroup = operationsData?.data?.[0]?.value || 'unknown';

				prcTemplateSteps = prcTemplateData.detail.prcTemplateSteps.map(step => {
					let itemName = '';
					let itemId = '';
					const itemType = step.type as 'sequence' | 'inspection';

					if (step.type === 'sequence' && step.stepId != null) {
						const seqData = sequenceMap.get(step.stepId);
						if (seqData) {
							itemName = seqData.sequenceName;
							itemId = seqData.sequenceId;
						}
					} else if (step.type === 'inspection' && step.stepId != null) {
						const insData = inspectionMap.get(step.stepId);
						if (insData) {
							itemName = insData.inspectionName;
							itemId = insData.inspectionId;
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
						itemName,
						itemId,
						itemType,
						group: defaultGroup
					};
				});
			}

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
				templateId,
				templateName,
				templateNotes,
				isTemplateActive,
				prcTemplateSteps,
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
				moulds: [],
				files: partMaster.files || [],
				inspectionDiagrams: partMaster.inspectionDiagrams
					? Array.isArray(partMaster.inspectionDiagrams)
						? partMaster.inspectionDiagrams[0]
						: partMaster.inspectionDiagrams
					: undefined,
				createdAt: partMaster.createdAt || undefined,
				updatedAt: partMaster.updatedAt || undefined
			};
			reset(formData);
		}
	}, [isEditMode, isFetchSuccess, partData, customersData, isPrcTemplateFetchSuccess, prcTemplateData, operationsData, sequencesData, inspectionsData, reset]);

	useEffect(() => {
		const loadMoulds = async () => {
			if (!isEditMode || !partData?.detail?.partMaster?.partNumber) return;
			const pm = partData.detail.partMaster as typeof partData.detail.partMaster & {
				mouldDetails?: Array<{ mouldCode: string; reconciliationCount: number; currentCount?: number }>;
				mouldedetails?: Array<{ mouldeCode?: string; mouldCode?: string; reconciliationCount: number; currentCount?: number }>;
			};
			const fromNewApi = pm.mouldDetails;
			const fromLegacyApi = pm.mouldedetails;
			if (fromNewApi && fromNewApi.length > 0) {
				setValue(
					'moulds',
					fromNewApi.map(item => ({
						mouldCode: item.mouldCode,
						reconciliationCount: item.reconciliationCount,
						currentCount: item.currentCount ?? 0
					}))
				);
				return;
			}
			if (fromLegacyApi && fromLegacyApi.length > 0) {
				setValue(
					'moulds',
					fromLegacyApi.map(item => ({
						mouldCode: item.mouldCode ?? item.mouldeCode ?? '',
						reconciliationCount: item.reconciliationCount,
						currentCount: item.currentCount ?? 0
					}))
				);
				return;
			}
			const existingMoulds = await getPartMoulds(pm.partNumber);
			setValue(
				'moulds',
				existingMoulds.map(item => ({
					mouldCode: item.mouldCode,
					reconciliationCount: item.reconciliationCount,
					currentCount: item.currentCount
				}))
			);
		};
		loadMoulds();
	}, [isEditMode, partData, setValue]);

	const handleAddStepImage = useCallback((stepKey: string, file: File) => {
		const newItem: ImageItem = {
			id: Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000,
			file,
			image: URL.createObjectURL(file),
			fileName: file.name
		};
		setStepGalleries(prev => ({
			...prev,
			[stepKey]: [...(prev[stepKey] || []), newItem]
		}));
	}, []);

	const handleRemoveStepImage = useCallback((stepKey: string, imageId: number | string) => {
		setStepGalleries(prev => ({
			...prev,
			[stepKey]: (prev[stepKey] || []).filter(item => item.id !== imageId)
		}));
	}, []);

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	const uploadStepImages = async (): Promise<Record<string, { fileName: string; filePath: string; originalFileName: string }[]>> => {
		const uploadedMap: Record<string, { fileName: string; filePath: string; originalFileName: string }[]> = {};

		for (const [stepKey, gallery] of Object.entries(stepGalleries)) {
			if (gallery.length === 0) continue;

			const newFiles = gallery.map(item => item.file).filter(Boolean) as File[];
			const existingFiles = gallery
				.filter(item => !item.file && item.fileName)
				.map(item => ({
					fileName: item.fileName || '',
					filePath: item.filePath || '',
					originalFileName: item.originalFileName || item.fileName || ''
				}));

			if (newFiles.length > 0) {
				const { uploads, errors: uploadErrors } = await uploadPartDrawings(newFiles);
				if (uploadErrors.length > 0) {
					throw new Error(`Image upload failed for step ${stepKey}: ${uploadErrors.map(e => e.error).join(', ')}`);
				}
				uploadedMap[stepKey] = [...existingFiles, ...uploads.map(u => ({
					fileName: u.fileName || '',
					filePath: u.filePath || '',
					originalFileName: u.originalFileName || ''
				}))];
			} else {
				uploadedMap[stepKey] = existingFiles;
			}
		}

		return uploadedMap;
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

			setIsUploadingImages(true);

			// Step 1: Always CREATE a new PRC Template to get a fresh template ID
			let prcTemplateId: number | undefined;
			const hasTemplateData = data.templateId && data.templateName && (data.prcTemplateSteps || []).length > 0;

			if (hasTemplateData) {
				const templateRequestData = {
					status: data.isTemplateActive ? 'ACTIVE' : 'INACTIVE',
					templateId: data.templateId!,
					templateName: data.templateName!,
					notes: data.templateNotes || '',
					version: 1,
					isLatest: true,
					isActive: data.isTemplateActive ?? true
				};

				const operationTextByValue = new Map(
					(operationsData?.data ?? []).map(op => [op.value, op.data.operationText] as const)
				);

				const operations = buildPrcTemplateOperationsFromSteps(data.prcTemplateSteps, operationTextByValue);

				try {
					const createResult = await createPrcTemplate({
						prcTemplate: templateRequestData,
						operations
					}).unwrap();

					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const resultData = createResult?.data as any;
					if (resultData?.prcTemplate?.id) {
						prcTemplateId = resultData.prcTemplate.id;
					} else if (resultData?.id) {
						prcTemplateId = resultData.id;
					}
				} catch (templateErr) {
					console.error('PRC Template creation failed:', templateErr);
					setError('Failed to create PRC template. Please try again.');
					setIsUploadingImages(false);
					return;
				}
			}

			// Step 2: Upload per-inspection images
			let uploadedStepFiles: Record<string, { fileName: string; filePath: string; originalFileName: string }[]> = {};
			try {
				uploadedStepFiles = await uploadStepImages();
			} catch (uploadErr) {
				setError(uploadErr instanceof Error ? uploadErr.message : 'Failed to upload images');
				setIsUploadingImages(false);
				return;
			}

			// Step 3: Build inspection diagrams from uploaded files and link everything to Part Master
			const inspectionDiagramFiles = Object.entries(uploadedStepFiles)
				.filter(([key]) => key.includes('-inspection-'))
				.map(([key, files]) => {
					const stepIdStr = key.split('-').pop();
					const stepId = stepIdStr ? parseInt(stepIdStr, 10) : 0;
					const matchingStep = (data.prcTemplateSteps || []).find(s => s.stepId === stepId && s.type === 'inspection');
					return {
						inspectionParameterId: matchingStep?.stepId || stepId,
						fileName: files.map(f => ({
							fileName: f.fileName,
							filePath: f.filePath,
							originalFileName: f.originalFileName
						}))
					};
				});

			const inspectionDiagrams = inspectionDiagramFiles.length > 0
				? { partId: data.id || 0, files: inspectionDiagramFiles }
				: undefined;

			const updatedData = getValues();
			const partRequestData = {
				partMaster: {
					...(isEditMode && updatedData.id ? { id: updatedData.id } : {}),
					partNumber: updatedData.partNumber,
					drawingNumber: updatedData.drawingNumber,
					drawingRevision: updatedData.drawingRevision,
					partRevision: updatedData.partRevision,
					status: updatedData.isActive ? ('ACTIVE' as const) : ('INACTIVE' as const),
					customer: updatedData.customer,
					description: updatedData.description,
					notes: updatedData.notes || '',
					layupType: updatedData.layupType || '',
					model: updatedData.model || '',
					sapReferenceNumber: updatedData.sapReferenceNumber || '',
					version: updatedData.version || 1,
					isLatest: updatedData.isLatest ?? true,
					catalyst: updatedData.catalyst,
					prcTemplate: prcTemplateId,
					mouldDetails: (updatedData.moulds || []).map(m => ({
						mouldCode: m.mouldCode,
						reconciliationCount: Number(m.reconciliationCount) || 0
					})),
					files: [],
					inspectionDiagrams: inspectionDiagrams
				},
				rawMaterials: transformArrayData(updatedData.rawMaterials, isEditMode),
				bom: [],
				drilling: transformArrayData(updatedData.drilling, isEditMode),
				cutting: transformArrayData(updatedData.cutting, isEditMode)
			};

			if (isEditMode && data.id) {
				await updatePart({ id: data.id, data: partRequestData }).unwrap();
				Swal.fire({
					icon: 'success',
					title: 'Success!',
					text: 'Part updated successfully',
					timer: 2000,
					showConfirmButton: false
				});
			} else {
				await createPart({ data: partRequestData }).unwrap();
				Swal.fire({
					icon: 'success',
					title: 'Success!',
					text: 'Part created successfully',
					timer: 2000,
					showConfirmButton: false
				});
			}

			await upsertPartMoulds(data.partNumber, data.moulds || []);
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
		} finally {
			setIsUploadingImages(false);
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

					{error && (
						<Alert severity="error" sx={{ mb: 3 }}>
							{error}
						</Alert>
					)}

					<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
						<Tabs value={activeTab} onChange={handleTabChange} aria-label="part tabs">
							<Tab label="General Info" id="part-tab-0" aria-controls="part-tabpanel-0" />
							<Tab label="Raw Materials" id="part-tab-1" aria-controls="part-tabpanel-1" />
							<Tab label="Technical Data" id="part-tab-2" aria-controls="part-tabpanel-2" />
							<Tab label="Linked Masters" id="part-tab-3" aria-controls="part-tabpanel-3" />
						</Tabs>
					</Box>

					<TabPanel value={activeTab} index={0}>
						<GeneralInfo control={control} errors={errors} />
					</TabPanel>
					<TabPanel value={activeTab} index={1}>
						<RawMaterialsTab control={control} errors={errors} />
					</TabPanel>
					<TabPanel value={activeTab} index={2}>
						<TechnicalDataTab control={control} errors={errors} />
					</TabPanel>
					<TabPanel value={activeTab} index={3}>
						<LinkedMastersTab
							control={control}
							errors={errors}
							setValue={setValue}
							stepGalleries={stepGalleries}
							onAddStepImage={handleAddStepImage}
							onRemoveStepImage={handleRemoveStepImage}
						/>
					</TabPanel>
				</Paper>
			</Box>

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

export default CreatePart;
