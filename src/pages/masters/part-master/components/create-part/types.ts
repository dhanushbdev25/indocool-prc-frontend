import { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { PartMasterFormData } from './schemas';

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

// Union type for selectable items
export type SelectableItem = SelectableCatalyst | SelectablePrcTemplate;

// Type guards
export const isCatalystItem = (item: SelectableItem): item is SelectableCatalyst => {
	return 'chartId' in item;
};

export const isPrcTemplateItem = (item: SelectableItem): item is SelectablePrcTemplate => {
	return 'templateId' in item;
};

// Extended types for form data with additional fields
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
	version: number;
	isLatest: boolean;
	catalyst?: number;
	prcTemplate?: number;
	rawMaterials: RawMaterialFormData[];
	bom: BOMFormData[];
	drilling: DrillingFormData[];
	cutting: CuttingFormData[];
	createdAt?: string;
	updatedAt?: string;
	// Additional fields for display
	catalystName?: string;
	prcTemplateName?: string;
	customerName?: string;
}

export interface RawMaterialFormData {
	id?: number;
	materialName: string;
	materialCode: string;
	quantity: string;
	uom: string;
	version: number;
	isLatest: boolean;
}

export interface BOMFormData {
	id?: number;
	materialType: string;
	description: string;
	bomQuantity: string;
	actualQuantity: string;
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

// Props interfaces for components
export interface StepSelectionCardProps {
	item: SelectableItem;
	onClick: (item: SelectableItem) => void;
	isSelected: boolean;
}

export interface LinkedMastersTabProps {
	control: Control<PartMasterFormData>;
	errors: FieldErrors<PartMasterFormData>;
	setValue: UseFormSetValue<PartMasterFormData>;
}

export interface GeneralInfoProps {
	control: Control<PartMasterFormData>;
	errors: FieldErrors<PartMasterFormData>;
}

export interface RawMaterialsTabProps {
	control: Control<PartMasterFormData>;
	errors: FieldErrors<PartMasterFormData>;
}

export interface BOMTabProps {
	control: Control<PartMasterFormData>;
	errors: FieldErrors<PartMasterFormData>;
}

export interface TechnicalDataTabProps {
	control: Control<PartMasterFormData>;
	errors: FieldErrors<PartMasterFormData>;
}
