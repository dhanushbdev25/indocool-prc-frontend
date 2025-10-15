import { PrcTemplateStepFormData, PrcTemplateFormData } from './schemas';
import { Control, FieldErrors } from 'react-hook-form';

// Types for sequence and inspection items from their respective APIs
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

// Union type for selectable items
export type SelectableItem = SequenceItem | InspectionItem;

// Type guard functions
export const isSequenceItem = (item: SelectableItem): item is SequenceItem => {
	return 'sequenceId' in item && 'sequenceName' in item;
};

export const isInspectionItem = (item: SelectableItem): item is InspectionItem => {
	return 'inspectionId' in item && 'inspectionName' in item;
};

// Extended step data for the form
export interface ExtendedPrcTemplateStep extends PrcTemplateStepFormData {
	// Additional fields for display and management
	itemName: string;
	itemId: string;
	itemType: 'sequence' | 'inspection';
}

// Props for step selection components
export interface StepSelectionCardProps {
	item: SelectableItem;
	onClick: (item: SelectableItem) => void;
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

// Props for the main steps component
export interface PrcTemplateStepsProps {
	control: Control<PrcTemplateFormData>;
	errors: FieldErrors<PrcTemplateFormData>;
}

// Props for the review component
export interface PrcTemplateReviewProps {
	control: Control<PrcTemplateFormData>;
}
