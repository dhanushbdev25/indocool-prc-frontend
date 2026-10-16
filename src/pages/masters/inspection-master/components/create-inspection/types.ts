import type { Ref } from 'react';
import { Control, FieldErrors } from 'react-hook-form';
import type { VirtualizedListHandle } from '../../../../../components/common/VirtualizedList';
import { InspectionFormData } from './schemas';

export interface InspectionBasicInfoProps {
	control: Control<InspectionFormData>;
	errors: FieldErrors<InspectionFormData>;
}

export interface InspectionParametersProps {
	control: Control<InspectionFormData>;
	errors: FieldErrors<InspectionFormData>;
	/** Lets the form scroll an off-screen (virtualized, unmounted) parameter card into view. */
	listRef?: Ref<VirtualizedListHandle>;
}

export interface InspectionReviewProps {
	control: Control<InspectionFormData>;
	errors: FieldErrors<InspectionFormData>;
}
