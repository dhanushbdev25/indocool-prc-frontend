import { Control, FieldErrors } from 'react-hook-form';
import { InspectionFormData } from './schemas';

export interface InspectionBasicInfoProps {
	control: Control<InspectionFormData>;
	errors: FieldErrors<InspectionFormData>;
}

export interface InspectionParametersProps {
	control: Control<InspectionFormData>;
	errors: FieldErrors<InspectionFormData>;
}

export interface InspectionReviewProps {
	control: Control<InspectionFormData>;
	errors: FieldErrors<InspectionFormData>;
}
