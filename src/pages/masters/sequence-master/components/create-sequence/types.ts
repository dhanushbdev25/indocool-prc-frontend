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
	{ value: '-', label: 'None' },
	{ value: '%', label: 'Percentage (%)' },
	{ value: '°C', label: 'Celsius (°C)' },
	{ value: '°F', label: 'Fahrenheit (°F)' },
	{ value: 'min', label: 'Minutes (min)' },
	{ value: 'sec', label: 'Seconds (sec)' },
	{ value: 'g', label: 'Grams (g)' },
	{ value: 'kg', label: 'Kilograms (kg)' },
	{ value: 'ml', label: 'Milliliters (ml)' },
	{ value: 'l', label: 'Liters (l)' },
	{ value: 'mm', label: 'Millimeters (mm)' },
	{ value: 'cm', label: 'Centimeters (cm)' },
	{ value: 'm', label: 'Meters (m)' },
	{ value: 'cP', label: 'Centipoise (cP)' },
	{ value: 'Pa', label: 'Pascal (Pa)' },
	{ value: 'bar', label: 'Bar' },
	{ value: 'psi', label: 'PSI' }
];
