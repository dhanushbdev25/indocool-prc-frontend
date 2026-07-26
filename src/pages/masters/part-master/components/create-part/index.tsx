import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider, useWatch, type FieldErrors } from 'react-hook-form';
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
import PartFormStickySummary from './components/PartFormStickySummary';
import GeneralInfo from './components/GeneralInfo';
import RawMaterialsTab from './components/RawMaterialsTab';
import LinkedMastersTab from './components/LinkedMastersTab';
import InspectionImageMappingTab from './components/InspectionImageMappingTab';
import { partMasterFormSchema, defaultPartMasterFormData } from './schemas';
import { PartMasterFormData } from './schemas';
import {
	useFetchPartByIdQuery,
	useFetchCustomersQuery,
	useCreatePartMutation,
	useUpdatePartMutation
} from '../../../../../store/api/business/part-master/part.api';
import {
	useFetchPrcTemplateByIdQuery,
	useFetchOperationsComboQuery,
	useCreatePrcTemplateMutation,
	useUpdatePrcTemplateMutation
} from '../../../../../store/api/business/prc-template/prc-template.api';
import { useFetchProcessSequencesQuery } from '../../../../../store/api/business/sequence-master/sequence.api';
import { useFetchInspectionsQuery } from '../../../../../store/api/business/inspection-master/inspection.api';
import { uploadPartDrawings } from '../../../../../utils/uploadPartDrawings';
import { useImageGallery } from '../../../../../hooks/useImageGallery';
import { toFileRenderUrl, toFileStoragePath } from '../../../../../utils/fileUrl';
import type { PartMaster, OperationWisePartRow } from '../../../../../store/api/business/part-master/part.validators';
import { normalizePrcTemplateSteps, buildPrcTemplatePayload } from '../../utils/prcTemplatePayload';
import { flattenRhfFieldErrorsToHtml } from '../../../../../utils/flattenRhfFieldErrors';
import { FullScreenFormSavingOverlay } from '../../../../../components/common/FullScreenFormSavingOverlay';
import { MasterAuditHistoryButton } from '../../../../../components/common/auditHistory';
import PartSapSyncActions from '../PartSapSyncActions';

function mapMouldDetailsToFormMoulds(partMaster: PartMaster): PartMasterFormData['moulds'] {
	return (partMaster.mouldDetails ?? []).map(item => ({
		mouldCode: item.mouldCode,
		reconciliationCount: Number(item.reconciliationCount) || 0,
		currentCount: Number(item.currentCount ?? 0) || 0
	}));
}

function parseOptionalNonNegInt(n: unknown): number | undefined {
	if (n === undefined || n === null || n === '') return undefined;
	const x = Number(n);
	if (!Number.isFinite(x) || x < 0) return undefined;
	return Math.floor(x);
}

/** Parse L1–L4 from API row; legacy total-only rows map into L1 only; missing values → 0 for form display. */
function skillLevelsFromApiRecord(
	r: Record<string, unknown>
): Pick<OperationWisePartRow, 'l1Count' | 'l2Count' | 'l3Count' | 'l4Count'> {
	const keys = ['l1Count', 'l2Count', 'l3Count', 'l4Count'] as const;
	const hasSkillFields = keys.some(k => k in r && r[k] !== undefined && r[k] !== null && r[k] !== '');
	if (hasSkillFields) {
		return {
			l1Count: parseOptionalNonNegInt(r.l1Count) ?? 0,
			l2Count: parseOptionalNonNegInt(r.l2Count) ?? 0,
			l3Count: parseOptionalNonNegInt(r.l3Count) ?? 0,
			l4Count: parseOptionalNonNegInt(r.l4Count) ?? 0
		};
	}
	const rc = Number(r.responsiblePersonCount);
	if (Number.isFinite(rc) && rc >= 0) {
		return {
			l1Count: Math.max(0, Math.floor(rc)),
			l2Count: 0,
			l3Count: 0,
			l4Count: 0
		};
	}
	return {
		l1Count: 0,
		l2Count: 0,
		l3Count: 0,
		l4Count: 0
	};
}

function mapOperationWiseDataFromApi(partMaster: PartMaster): OperationWisePartRow[] {
	const raw = partMaster.operationWiseData;
	if (!raw) return [];
	if (Array.isArray(raw)) {
		const out: OperationWisePartRow[] = [];
		for (const item of raw) {
			if (!item || typeof item !== 'object') continue;
			const r = item as unknown as Record<string, unknown>;
			const operationID = Number(r.operationID);
			if (!Number.isFinite(operationID)) continue;
			const idRaw = r.id;
			const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? idRaw : `op-${operationID}`;
			const operationName = typeof r.operationName === 'string' ? r.operationName : '';
			const { l1Count, l2Count, l3Count, l4Count } = skillLevelsFromApiRecord(r);
			const sum = (l1Count ?? 0) + (l2Count ?? 0) + (l3Count ?? 0) + (l4Count ?? 0);
			out.push({
				id,
				operationID,
				operationName,
				l1Count,
				l2Count,
				l3Count,
				l4Count,
				responsiblePersonCount: sum
			});
		}
		return out;
	}
	// Legacy: Record<operationId, { memberCount }>
	if (typeof raw === 'object' && !Array.isArray(raw)) {
		const out: OperationWisePartRow[] = [];
		for (const [key, val] of Object.entries(raw)) {
			const opNum = Number(key);
			if (!Number.isFinite(opNum)) continue;
			const valRec = val && typeof val === 'object' && !Array.isArray(val) ? (val as Record<string, unknown>) : {};
			const merged: Record<string, unknown> = { ...valRec };
			if ('memberCount' in valRec) {
				merged.responsiblePersonCount = valRec.memberCount;
			}
			const operationName = typeof valRec.operationName === 'string' ? valRec.operationName : '';
			const { l1Count, l2Count, l3Count, l4Count } = skillLevelsFromApiRecord(merged);
			const sum = (l1Count ?? 0) + (l2Count ?? 0) + (l3Count ?? 0) + (l4Count ?? 0);
			out.push({
				id: `legacy-${key}`,
				operationID: opNum,
				operationName,
				l1Count,
				l2Count,
				l3Count,
				l4Count,
				responsiblePersonCount: sum
			});
		}
		return out;
	}
	return [];
}

/** Operation groups that require member count: steps' `group` plus any ids synced from Linked Masters (e.g. empty groups). */
function getHeadcountAllowedOperationIds(formData: {
	prcTemplateSteps?: Array<{ group?: string }>;
	operationGroupIdsForHeadcount?: string[];
}): Set<string> {
	const allowed = new Set<string>();
	for (const s of formData.prcTemplateSteps ?? []) {
		const g = s.group;
		if (typeof g === 'string' && g.length > 0) allowed.add(g);
	}
	for (const id of formData.operationGroupIdsForHeadcount ?? []) {
		if (id) allowed.add(id);
	}
	return allowed;
}

function cleanOperationWiseDataForApi(
	raw: OperationWisePartRow[] | undefined,
	allowedOperationIds?: Set<string>
): OperationWisePartRow[] {
	if (!raw || !Array.isArray(raw)) return [];
	if (allowedOperationIds && allowedOperationIds.size === 0) return [];
	const out: OperationWisePartRow[] = [];
	for (const row of raw) {
		if (!row || typeof row !== 'object') continue;
		const opIdStr = String(row.operationID);
		if (allowedOperationIds && !allowedOperationIds.has(opIdStr)) continue;
		if (!Number.isFinite(row.operationID)) continue;
		const l1 = parseOptionalNonNegInt(row.l1Count) ?? 0;
		const l2 = parseOptionalNonNegInt(row.l2Count) ?? 0;
		const l3 = parseOptionalNonNegInt(row.l3Count) ?? 0;
		const l4 = parseOptionalNonNegInt(row.l4Count) ?? 0;
		const sum = l1 + l2 + l3 + l4;
		out.push({
			id: row.id,
			operationID: row.operationID,
			operationName: String(row.operationName ?? ''),
			l1Count: l1,
			l2Count: l2,
			l3Count: l3,
			l4Count: l4,
			responsiblePersonCount: sum
		});
	}
	return out;
}

/**
 * Handles image upload and updates form data with API filenames
 */
const handleImageUploadAndUpdateForm = async (
	formData: PartMasterFormData,
	gallery: ReturnType<typeof useImageGallery>['gallery'],
	setGallery: ReturnType<typeof useImageGallery>['setGallery'],
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	setValue: any,
	setIsUploadingImages: (loading: boolean) => void
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[] | null> => {
	if (gallery.length === 0) return [];

	const newFiles = gallery.map(item => item.file).filter(Boolean) as File[];
	const existingFiles = gallery
		.filter(item => !item.file && item.fileName)
		.map(item => {
			let relativeFilePath = item.filePath;
			if (!relativeFilePath && item.image) {
				const baseUrl = process.env.API_BASE_URL || '';
				if (item.image.startsWith(baseUrl)) {
					relativeFilePath = item.image.substring(baseUrl.length);
				} else {
					relativeFilePath = item.image;
				}
			}
			return {
				fileName: item.fileName || '',
				filePath: relativeFilePath ? toFileStoragePath(relativeFilePath) : '',
				originalFileName: item.originalFileName || item.fileName || ''
			};
		});

	if (newFiles.length === 0) {
		return existingFiles;
	}

	setIsUploadingImages(true);
	try {
		const { uploads, errors: uploadErrors } = await uploadPartDrawings(newFiles);

		if (uploadErrors.length > 0) {
			const html = uploadErrors.map(err => `${err.fileName}: ${err.error}`).join('<br/>');
			void Swal.fire({
				icon: 'error',
				title: 'Some images failed to upload',
				html: `<div style="text-align:left">${html}</div>`
			});
			return null;
		}

		updateGalleryWithApiFilenames(gallery, uploads, setGallery);
		updateInspectionDiagramsWithApiFilenames(formData, uploads, setValue);

		return [...existingFiles, ...uploads];
	} catch {
		void Swal.fire({
			icon: 'error',
			title: 'Upload failed',
			text: 'Failed to upload images. Please try again.'
		});
		return null;
	} finally {
		setIsUploadingImages(false);
	}
};

const updateGalleryWithApiFilenames = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	gallery: any[],
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	uploads: any[],
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	setGallery: (gallery: any[]) => void
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

const updateInspectionDiagramsWithApiFilenames = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	formData: any,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	uploads: any[],
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	setValue: any
): void => {
	if (!formData.inspectionDiagrams?.files) return;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mapFileEntriesToUploaded = (entries: any[] | undefined) =>
		(entries || []).map(fileObj => {
			if (typeof fileObj === 'object' && fileObj.originalFileName) {
				const uploadResult = uploads.find(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(upload: any) => upload.originalFileName === fileObj.originalFileName
				);
				if (uploadResult) {
					return {
						fileName: uploadResult.fileName,
						filePath: uploadResult.filePath,
						originalFileName: uploadResult.originalFileName
					};
				}
			} else if (typeof fileObj === 'string') {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const uploadResult = uploads.find((upload: any) => upload.originalFileName === fileObj);
				if (uploadResult) {
					return {
						fileName: uploadResult.fileName,
						filePath: uploadResult.filePath,
						originalFileName: uploadResult.originalFileName
					};
				}
			}
			return fileObj;
		});

	const updatedInspectionDiagrams = {
		...formData.inspectionDiagrams,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		files: formData.inspectionDiagrams.files.map((file: any) => ({
			...file,
			fileName: mapFileEntriesToUploaded(file.fileName),
			rowMappings: (file.rowMappings || []).map(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(row: any) => ({
					...row,
					fileName: mapFileEntriesToUploaded(row.fileName)
				})
			)
		}))
	};

	setValue('inspectionDiagrams', updatedInspectionDiagrams);
};

const transformFormDataToApiRequest = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	formData: any,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	uploadedDrawings: any[],
	isEditMode: boolean,
	prcTemplateId?: number
) => {
	return {
		partMaster: {
			...(isEditMode && formData.id ? { id: formData.id } : {}),
			partNumber: formData.partNumber,
			drawingNumber: formData.drawingNumber,
			drawingRevision: formData.drawingRevision,
			partRevision: formData.partRevision,
			sqM: formData.sqM ?? null,
			status: formData.isActive ? ('ACTIVE' as const) : ('INACTIVE' as const),
			customer: formData.customer,
			customerVariantId: formData.customerVariantId,
			description: formData.description,
			notes: formData.notes || '',
			layupType: formData.layupType || '',
			model: formData.model || '',
			sapReferenceNumber: formData.sapReferenceNumber || '',
			version: formData.version || 1,
			isLatest: formData.isLatest ?? true,
			catalyst: formData.catalyst,
			prcTemplate: prcTemplateId ?? formData.prcTemplate,
			mouldDetails: (formData.moulds || []).map((m: { mouldCode: string; reconciliationCount: number }) => ({
				mouldCode: m.mouldCode,
				reconciliationCount: Number(m.reconciliationCount) || 0
			})),
			operationWiseData: cleanOperationWiseDataForApi(
				formData.operationWiseData,
				getHeadcountAllowedOperationIds(formData)
			),
			files: uploadedDrawings,
			inspectionDiagrams: transformInspectionDiagrams(formData.inspectionDiagrams)
		},
		rawMaterials: transformArrayData(formData.rawMaterials, isEditMode),
		bom: transformArrayData(formData.bom, isEditMode),
		drilling: transformArrayData(formData.drilling, isEditMode),
		cutting: transformArrayData(formData.cutting, isEditMode)
	};
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformArrayData = (arrayData: any[], isEditMode: boolean) => {
	return (arrayData || []).map(
		(item: { id?: number; version?: number; isLatest?: boolean; [key: string]: unknown }) => {
			const { id, ...itemWithoutId } = item;
			return {
				...(isEditMode && id && typeof id === 'number' ? { id } : {}),
				...itemWithoutId,
				version: item.version || 1,
				isLatest: item.isLatest ?? true
			};
		}
	);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformInspectionDiagrams = (inspectionDiagrams: any) => {
	if (!inspectionDiagrams) return undefined;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const normalizeFileEntries = (entries: any[]) =>
		(entries || []).filter(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(fileObj: any) => fileObj !== undefined && fileObj !== null && typeof fileObj === 'object'
		);

	return {
		files:
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			inspectionDiagrams.files?.map((file: any) => ({
				inspectionParameterId: file.inspectionParameterId || 0,
				fileName: normalizeFileEntries(file.fileName || []),
				rowMappings: (file.rowMappings || [])
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.filter((row: any) => typeof row?.rowIndex === 'number')
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.map((row: any) => ({
						rowIndex: row.rowIndex,
						fileName: normalizeFileEntries(row.fileName || [])
					}))
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
	const [selectedPlant, setSelectedPlant] = useState<string>('');

	const {
		data: partData,
		isLoading: isFetching,
		isSuccess: isFetchSuccess
	} = useFetchPartByIdQuery({ id: Number(id) }, { skip: !isEditMode || !id });

	const { data: customersData } = useFetchCustomersQuery();

	const prcTemplateIdFromPart = partData?.detail?.partMaster?.prcTemplate;
	const { data: prcTemplateData, isSuccess: isPrcTemplateFetchSuccess } = useFetchPrcTemplateByIdQuery(
		{ id: Number(prcTemplateIdFromPart) },
		{ skip: !isEditMode || !prcTemplateIdFromPart }
	);
	const { data: sequencesData } = useFetchProcessSequencesQuery();
	const { data: inspectionsData } = useFetchInspectionsQuery();

	const [createPart, { isLoading: isCreating }] = useCreatePartMutation();
	const [updatePart, { isLoading: isUpdating }] = useUpdatePartMutation();
	const [createPrcTemplate] = useCreatePrcTemplateMutation();
	const [updatePrcTemplate] = useUpdatePrcTemplateMutation();

	const methods = useForm<PartMasterFormData>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		resolver: yupResolver(partMasterFormSchema) as any,
		defaultValues: defaultPartMasterFormData,
		mode: 'onChange',
		reValidateMode: 'onChange',
		shouldFocusError: false
	});

	const {
		control,
		handleSubmit,
		formState: { errors },
		reset,
		setValue,
		getValues
	} = methods;

	const formPartId = useWatch({ control, name: 'id' });
	const formPrcTemplateId = useWatch({ control, name: 'prcTemplate' });
	const watchedPrcTemplateSteps = useWatch({ control, name: 'prcTemplateSteps' });
	const watchedHeadcountGroupIds = useWatch({ control, name: 'operationGroupIdsForHeadcount' });
	const operationsQueryPartId = formPartId ?? (id ? Number(id) : undefined);
	const { data: operationsData } = useFetchOperationsComboQuery(
		{ partId: operationsQueryPartId!, plant: selectedPlant || undefined },
		{ skip: !operationsQueryPartId || !selectedPlant }
	);

	// API-driven tab enablement: tabs 1-3 disabled until PartMaster exists on the backend
	const partMasterExists = isEditMode ? isFetchSuccess && !!partData?.detail?.partMaster?.id : !!formPartId;
	const isInspectionMappingEnabled = partMasterExists && !!formPrcTemplateId;

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
			let templateVersion = 1;
			let templateIsLatest = true;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let prcTemplateSteps: any[] = [];

			if (isPrcTemplateFetchSuccess && prcTemplateData) {
				const tpl = prcTemplateData.detail.prcTemplate;
				templateId = tpl.templateId;
				templateName = tpl.templateName;
				templateNotes = tpl.notes || '';
				isTemplateActive = tpl.isActive;
				templateVersion = tpl.version ?? 1;
				templateIsLatest = tpl.isLatest ?? true;

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

					const groupFromApi = (step as { operationID?: string }).operationID ?? step.group ?? '';
					const operationTextFromApi =
						typeof step.operationText === 'string' && step.operationText.trim().length > 0
							? step.operationText
							: undefined;

					return {
						id: step.id,
						version: step.version,
						isLatest: step.isLatest,
						sequence: step.sequence,
						stepId: step.stepId ?? undefined,
						type: step.type,
						blockCatalystMixing: step.blockCatalystMixing,
						requestSupervisorApproval: step.requestSupervisorApproval,
						createdAt: step.createdAt,
						updatedAt: step.updatedAt,
						itemName,
						itemId,
						itemType,
						group: groupFromApi,
						operationText: operationTextFromApi
					};
				});
			}

			const formData: PartMasterFormData = {
				id: partMaster.id,
				partNumber: partMaster.partNumber,
				drawingNumber: partMaster.drawingNumber,
				drawingRevision: partMaster.drawingRevision ?? 1,
				partRevision: partMaster.partRevision ?? 1,
				sqM: partMaster.sqM ?? undefined,
				isActive: partMaster.status === 'ACTIVE',
				customer: partMaster.customer,
				customerVariantId: partMaster.customerVariantId ?? undefined,
				description: partMaster.description,
				notes: partMaster.notes || '',
				layupType: partMaster.layupType || '',
				model: partMaster.model || '',
				sapReferenceNumber: partMaster.sapReferenceNumber || '',
				version: partMaster.version ?? 1,
				isLatest: partMaster.isLatest ?? true,
				catalyst: partMaster.catalyst || undefined,
				prcTemplate: partMaster.prcTemplate || undefined,
				templateId,
				templateName,
				templateNotes,
				isTemplateActive,
				templateVersion,
				templateIsLatest,
				prcTemplateSteps,
				rawMaterials: rawMaterials.map(rm => ({
					id: rm.id,
					materialName: rm.materialName,
					materialCode: rm.materialCode,
					materialGroup: rm.materialGroup ?? '',
					quantity: rm.quantity,
					uom: rm.uom,
					batching: rm.batching ?? false,
					splitting: rm.splitting ?? false,
					splittingConfiguration: rm.splittingConfiguration
						? rm.splittingConfiguration.map(split => ({
								order: split.order,
								splitQuantity: String(split.splitQuantity)
							}))
						: null,
					version: rm.version ?? 1,
					isLatest: rm.isLatest ?? true
				})),
				drilling: drilling.map(d => ({
					id: d.id,
					characteristics: d.characteristics,
					specification: d.specification,
					noOfHoles: d.noOfHoles,
					diaOfHoles: d.diaOfHoles,
					tolerance: d.tolerance,
					version: d.version ?? 1,
					isLatest: d.isLatest ?? true
				})),
				cutting: cutting.map(c => ({
					id: c.id,
					characteristics: c.characteristics,
					specification: c.specification,
					tolerance: c.tolerance,
					version: c.version ?? 1,
					isLatest: c.isLatest ?? true
				})),
				moulds: mapMouldDetailsToFormMoulds(partMaster),
				operationWiseData: mapOperationWiseDataFromApi(partMaster),
				operationGroupIdsForHeadcount: [],
				files: partMaster.files || [],
				inspectionDiagrams: partMaster.inspectionDiagrams
					? (() => {
							const d = Array.isArray(partMaster.inspectionDiagrams)
								? partMaster.inspectionDiagrams[0]
								: partMaster.inspectionDiagrams;
							return {
								partId: d.partId,
								files: d.files ?? []
							};
						})()
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
					image: toFileRenderUrl(file.filePath),
					fileName: file.fileName || file.originalFileName || `Image ${index}`,
					filePath: file.filePath ? file.filePath.replace(/\\/g, '/') : undefined,
					originalFileName: file.originalFileName || file.fileName || `Image ${index}`
				}));
				setGallery(galleryItems);
			}
		}
	}, [
		isEditMode,
		isFetchSuccess,
		partData,
		customersData,
		isPrcTemplateFetchSuccess,
		prcTemplateData,
		operationsData,
		sequencesData,
		inspectionsData,
		reset,
		setGallery
	]);

	useEffect(() => {
		if (!operationsQueryPartId) return;

		const allowedSet = getHeadcountAllowedOperationIds({
			prcTemplateSteps: getValues('prcTemplateSteps') as Array<{ group?: string }>,
			operationGroupIdsForHeadcount: getValues('operationGroupIdsForHeadcount') as string[] | undefined
		});
		if (allowedSet.size === 0) return;

		const current = getValues('operationWiseData') as OperationWisePartRow[] | undefined;
		const list = Array.isArray(current) ? current : [];
		const next = list.filter(r => allowedSet.has(String(r.operationID)));
		if (next.length !== list.length) {
			setValue('operationWiseData', next, { shouldDirty: false });
		}
	}, [operationsQueryPartId, watchedPrcTemplateSteps, watchedHeadcountGroupIds, getValues, setValue]);

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	const onInvalid = (errs: FieldErrors<PartMasterFormData>) => {
		void Swal.fire({
			icon: 'error',
			title: 'Cannot save',
			html: flattenRhfFieldErrorsToHtml(errs),
			confirmButtonText: 'OK',
			width: 560
		});
	};

	const onSubmit = async (data: PartMasterFormData) => {
		setError(null);

		try {
			// Step 1: Upsert PRC Template if template data exists
			let finalPrcTemplateId: number | undefined = data.prcTemplate;
			const hasTemplateBasics = Boolean(
				(typeof data.templateId === 'string' && data.templateId.trim().length > 0) ||
					(typeof data.templateName === 'string' && data.templateName.trim().length > 0)
			);
			const hasPrcSteps = (data.prcTemplateSteps || []).length > 0;
			const shouldCreateMissingPrc = !finalPrcTemplateId && hasPrcSteps;
			const shouldUpdateExistingPrc = Boolean(finalPrcTemplateId && (hasPrcSteps || hasTemplateBasics));
			const shouldUpsertTemplate = shouldCreateMissingPrc || shouldUpdateExistingPrc;

			if (shouldUpsertTemplate) {
				const { steps: normalizedPrcSteps, error: prcValidationError } = normalizePrcTemplateSteps(
					data,
					operationsData
				);
				if (prcValidationError) {
					void Swal.fire({
						icon: 'error',
						title: 'PRC template',
						text: prcValidationError
					});
					return;
				}
				const prcPayload = buildPrcTemplatePayload(data, normalizedPrcSteps);

				try {
					if (finalPrcTemplateId) {
						await updatePrcTemplate({
							id: finalPrcTemplateId,
							...prcPayload
						}).unwrap();
					} else {
						const createResult = await createPrcTemplate(prcPayload).unwrap();
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const resultData = createResult?.data as any;
						if (resultData?.prcTemplate?.id) {
							finalPrcTemplateId = resultData.prcTemplate.id;
						} else if (resultData?.id) {
							finalPrcTemplateId = resultData.id;
						}
						if (!finalPrcTemplateId) {
							void Swal.fire({
								icon: 'error',
								title: 'Error',
								text: 'PRC template was created but ID was not returned.'
							});
							return;
						}
						setValue('prcTemplate', finalPrcTemplateId);
					}
				} catch (templateErr) {
					console.error('PRC Template upsert failed:', templateErr);
					void Swal.fire({
						icon: 'error',
						title: 'PRC template',
						text: finalPrcTemplateId
							? 'Failed to update linked PRC template. Part was not saved.'
							: 'Failed to create PRC template. Part was not saved.'
					});
					return;
				}
			}

			// Step 2: Upload images via gallery
			const currentUploadedDrawings = await handleImageUploadAndUpdateForm(
				data,
				gallery,
				setGallery,
				setValue,
				setIsUploadingImages
			);
			if (!currentUploadedDrawings) return;

			// Step 3: Build part payload
			const updatedData = getValues();
			const partRequestData = transformFormDataToApiRequest(
				updatedData,
				currentUploadedDrawings,
				isEditMode,
				finalPrcTemplateId
			);

			// Step 4: Submit to API
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

	if (isEditMode && isFetching) {
		return (
			<Box
				sx={{
					height: 'calc(100vh - 64px - 38px)',
					display: 'flex',
					flexDirection: 'column',
					overflow: 'hidden',
					m: -3,
					p: 3,
					boxSizing: 'border-box'
				}}
			>
				<Box
					sx={{
						backgroundColor: 'background.paper',
						borderBottom: 1,
						borderColor: 'divider',
						flexShrink: 0,
						boxShadow: 'none'
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
						<Skeleton variant="text" width={260} height={40} />
						<Box sx={{ display: 'flex', gap: 2 }}>
							<Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
							<Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
						</Box>
					</Box>
					<Skeleton variant="rectangular" width="100%" height={88} sx={{ borderRadius: 1, mb: 0 }} />
					<Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 0, mt: 1 }} />
				</Box>
				<Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
					<Paper
						elevation={0}
						sx={{
							p: 4,
							borderRadius: 2,
							boxShadow: 'none',
							border: 1,
							borderColor: 'divider'
						}}
					>
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
			</Box>
		);
	}

	const isFullScreenBusy = isUploadingImages || isCreating || isUpdating;

	return (
		<FormProvider {...methods}>
			<>
				{/* Match execute-prc: outer column fills viewport segment; header does not scroll; tab body scrolls */}
				<Box
					sx={{
						height: 'calc(100vh - 64px - 38px)',
						display: 'flex',
						flexDirection: 'column',
						overflow: 'hidden',
						m: -3,
						p: 3,
						boxSizing: 'border-box'
					}}
				>
					<Box
						sx={{
							backgroundColor: 'background.paper',
							borderBottom: 1,
							borderColor: 'divider',
							flexShrink: 0,
							boxShadow: 'none'
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
							<Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }}>
								{isEditMode ? 'Edit Part' : 'Create New Part'}
							</Typography>
							<Box sx={{ display: 'flex', gap: 2 }}>
								{isEditMode && id && <PartSapSyncActions partId={Number(id)} />}
								<MasterAuditHistoryButton
									target={
										isEditMode && id
											? {
													domain: 'part',
													id: Number(id),
													label: partData?.detail.partMaster.partNumber ?? `Part ${id}`
												}
											: null
									}
								/>
								<Button variant="outlined" startIcon={<Cancel />} onClick={handleCancel} sx={{ textTransform: 'none' }}>
									Cancel
								</Button>
								<Button
									variant="contained"
									startIcon={<Save />}
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									onClick={handleSubmit(onSubmit as any, onInvalid)}
									disabled={isFullScreenBusy}
									sx={{
										textTransform: 'none',
										backgroundColor: '#1976d2',
										'&:hover': { backgroundColor: '#1565c0' }
									}}
								>
									{isEditMode ? 'Update Part' : 'Create Part'}
								</Button>
							</Box>
						</Box>

						<PartFormStickySummary />

						<Tabs
							value={activeTab}
							onChange={handleTabChange}
							aria-label="part tabs"
							sx={{
								mt: 0,
								bgcolor: 'background.paper',
								borderTop: 1,
								borderBottom: 1,
								borderColor: 'divider',
								minHeight: 48,
								px: 0,
								'& .MuiTabs-flexContainer': {
									alignItems: 'flex-end',
									minHeight: 48
								},
								'& .MuiTabs-indicator': {
									bottom: 0,
									height: 2
								},
								'& .MuiTab-root': {
									textTransform: 'none',
									minHeight: 48,
									py: 0
								}
							}}
						>
							<Tab label="General Info" id="part-tab-0" aria-controls="part-tabpanel-0" />
							<Tab
								label="Bill of Material"
								id="part-tab-1"
								aria-controls="part-tabpanel-1"
								disabled={!partMasterExists}
							/>
							<Tab
								label="Linked Masters"
								id="part-tab-2"
								aria-controls="part-tabpanel-2"
								disabled={!partMasterExists}
							/>
							<Tab
								label="Inspection Image Mapping"
								id="part-tab-3"
								aria-controls="part-tabpanel-3"
								disabled={!isInspectionMappingEnabled}
							/>
						</Tabs>
					</Box>

					<Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
						<Paper
							elevation={0}
							sx={{
								p: 4,
								borderRadius: 2,
								boxShadow: 'none',
								border: 1,
								borderColor: 'divider'
							}}
						>
							{error && (
								<Alert severity="error" sx={{ mb: 3 }}>
									{error}
								</Alert>
							)}

							<TabPanel value={activeTab} index={0}>
								<GeneralInfo
									control={control}
									gallery={gallery}
									onAddImage={handleAddImage}
									onRemoveImage={handleRemoveImage}
								/>
							</TabPanel>
							<TabPanel value={activeTab} index={1}>
								<RawMaterialsTab control={control} />
							</TabPanel>
							<TabPanel value={activeTab} index={2}>
								<LinkedMastersTab
									control={control}
									setValue={setValue}
									operationsPartId={operationsQueryPartId}
									selectedPlant={selectedPlant}
									onPlantChange={setSelectedPlant}
									gallery={gallery}
								/>
							</TabPanel>
							<TabPanel value={activeTab} index={3}>
								<InspectionImageMappingTab control={control} setValue={setValue} gallery={gallery} />
							</TabPanel>
						</Paper>
					</Box>
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

				<FullScreenFormSavingOverlay
					open={isFullScreenBusy}
					message={isUploadingImages ? 'Uploading images…' : 'Saving…'}
				/>
			</>
		</FormProvider>
	);
};

export default CreatePart;
