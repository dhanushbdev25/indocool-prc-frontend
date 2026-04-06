import { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { PartMasterFormData, PrcTemplateStepFormData } from './schemas';

// Extended types for linked masters selection
export interface SelectableCatalyst {
	id: number;
	chartId: string;
	chartSupplier: string;
	status: string;
	version: number;
	isLatest: boolean;
}

export interface SelectablePrcTemplate {
	id: number;
	templateId: string;
	templateName: string;
	status: string;
	version: number;
	isLatest: boolean;
}

// Union type for linked master selectable items
export type LinkedMasterSelectableItem = SelectableCatalyst | SelectablePrcTemplate;

// Type guards for linked masters
export const isCatalystItem = (item: LinkedMasterSelectableItem): item is SelectableCatalyst => {
	return 'chartId' in item;
};

export const isPrcTemplateItem = (item: LinkedMasterSelectableItem): item is SelectablePrcTemplate => {
	return 'templateId' in item;
};

// --- Operation Groups (fetched from prcTemplate/operations/combo API) ---

export interface OperationGroup {
	id: string;
	name: string;
	label: string;
}

// --- PRC Template Step types (adapted from prc-template-master) ---

export interface SequenceItem {
	id: number;
	sequenceId: string;
	sequenceName: string;
	status: string;
	category: string;
	type: string;
	version: number;
	isLatest: boolean;
}

export interface InspectionItem {
	id: number;
	inspectionId: string;
	inspectionName: string;
	status: string;
	type: string;
	version: number;
	isLatest: boolean;
}

export type StepSelectableItem = SequenceItem | InspectionItem;

export const isSequenceItem = (item: StepSelectableItem): item is SequenceItem => {
	return 'sequenceId' in item && 'sequenceName' in item;
};

export const isInspectionItem = (item: StepSelectableItem): item is InspectionItem => {
	return 'inspectionId' in item && 'inspectionName' in item;
};

export interface ExtendedPrcTemplateStep extends PrcTemplateStepFormData {
	itemName: string;
	itemId: string;
	itemType: 'sequence' | 'inspection';
	group: string;
}

export interface StepSelectionCardProps {
	item: StepSelectableItem;
	onClick: (item: StepSelectableItem) => void;
	isSelected: boolean;
}

export interface SelectedStepItemProps {
	step: ExtendedPrcTemplateStep;
	index: number;
	totalSteps: number;
	onReorder: (fromIndex: number, toIndex: number) => void;
	onRemove: (index: number) => void;
	onUpdateStep: (index: number, updatedStep: Partial<ExtendedPrcTemplateStep>) => void;
}

// --- Part Master Form Props ---

export interface ExtendedPartMasterFormData {
	id?: number;
	partNumber: string;
	drawingNumber: string;
	drawingRevision: number;
	partRevision: number;
	isActive: boolean;
	customer: string;
	description: string;
	notes?: string;
	layupType?: string;
	model?: string;
	sapReferenceNumber?: string;
	version: number;
	isLatest: boolean;
	catalyst?: number;
	prcTemplate?: number;
	rawMaterials: RawMaterialFormData[];
	drilling: DrillingFormData[];
	cutting: CuttingFormData[];
	moulds: MouldFormData[];
	createdAt?: string;
	updatedAt?: string;
	catalystName?: string;
	prcTemplateName?: string;
	customerName?: string;
}

export interface MouldFormData {
	mouldCode: string;
	reconciliationCount: number;
	currentCount?: number;
}

export interface RawMaterialFormData {
	id?: number;
	materialName: string;
	materialCode: string;
	quantity: string;
	uom: string;
	batching: boolean;
	splitting: boolean;
	splittingConfiguration: Array<{
		order: number;
		splitQuantity: string;
	}> | null;
	version: number;
	isLatest: boolean;
}

export interface DrillingFormData {
	id?: number;
	characteristics: string;
	specification: string;
	noOfHoles: string;
	diaOfHoles: string;
	tolerance: string;
	version: number;
	isLatest: boolean;
}

export interface CuttingFormData {
	id?: number;
	characteristics: string;
	specification: string;
	tolerance: string;
	version: number;
	isLatest: boolean;
}

export interface LinkedMastersTabProps {
	control: Control<PartMasterFormData>;
	errors: FieldErrors<PartMasterFormData>;
	setValue: UseFormSetValue<PartMasterFormData>;
}

export interface GeneralInfoProps {
	control: Control<PartMasterFormData>;
	errors: FieldErrors<PartMasterFormData>;
	gallery: import('../../../../../hooks/useImageGallery').ImageItem[];
	onAddImage: (file: File) => void;
	onRemoveImage: (id: number | string) => void;
}

export interface RawMaterialsTabProps {
	control: Control<PartMasterFormData>;
	errors: FieldErrors<PartMasterFormData>;
}

export interface TechnicalDataTabProps {
	control: Control<PartMasterFormData>;
	errors: FieldErrors<PartMasterFormData>;
}

// Part drawing types
export interface PartDrawing {
	id?: number;
	fileName: string;
	filePath: string;
}

// Inspection diagram mapping types
export interface InspectionDiagram {
	partId: number;
	files: Array<{
		inspectionParameterId: number;
		fileName: string[];
	}>;
}

export interface InspectionParameter {
	id: number;
	order: number;
	parameterName: string;
	specification?: string;
	tolerance?: string;
	type: string;
	role: string;
	ctq: boolean;
}
