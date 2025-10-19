import { Control, FieldErrors } from 'react-hook-form';
import { SequenceFormData } from './schemas';

export interface SequenceBasicInfoProps {
	control: Control<SequenceFormData>;
	errors: FieldErrors<SequenceFormData>;
}

export interface SequenceStepGroupsProps {
	control: Control<SequenceFormData>;
	errors: FieldErrors<SequenceFormData>;
}

export interface SequenceReviewProps {
	control: Control<SequenceFormData>;
	errors: FieldErrors<SequenceFormData>;
}

// Step type options
export const stepTypeOptions = [
	{ value: 'Measurement', label: 'Measurement' },
	{ value: 'Check', label: 'Check' },
	{ value: 'Inspection', label: 'Inspection' },
	{ value: 'Operation', label: 'Operation' }
];

// Target value type options
export const targetValueTypeOptions = [
	{ value: 'range', label: 'Range' },
	{ value: 'exact value', label: 'Exact Value' },
	{ value: 'ok/not ok', label: 'OK/Not OK' }
];

// Common UOM options
export const uomOptions = [
	{ value: 'None', label: 'None' },
	{ value: 'Percentage (%)', label: 'Percentage (%)' },
	{ value: 'Celsius (°C)', label: 'Celsius (°C)' },
	{ value: 'Fahrenheit (°F)', label: 'Fahrenheit (°F)' },
	{ value: 'Minutes (min)', label: 'Minutes (min)' },
	{ value: 'Seconds (sec)', label: 'Seconds (sec)' },
	{ value: 'Grams (g)', label: 'Grams (g)' },
	{ value: 'Kilograms (kg)', label: 'Kilograms (kg)' },
	{ value: 'Milliliters (ml)', label: 'Milliliters (ml)' },
	{ value: 'Liters (l)', label: 'Liters (l)' },
	{ value: 'Millimeters (mm)', label: 'Millimeters (mm)' },
	{ value: 'Centimeters (cm)', label: 'Centimeters (cm)' },
	{ value: 'Meters (m)', label: 'Meters (m)' },
	{ value: 'Pieces (pcs)', label: 'Pieces (pcs)' },
	{ value: 'Centipoise (cP)', label: 'Centipoise (cP)' },
	{ value: 'Pascal (Pa)', label: 'Pascal (Pa)' },
	{ value: 'Bar', label: 'Bar' },
	{ value: 'PSI', label: 'PSI' }
];
