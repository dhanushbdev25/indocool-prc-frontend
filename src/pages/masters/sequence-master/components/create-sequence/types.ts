import { Control, FieldErrors } from 'react-hook-form';
import { SequenceFormData } from './schemas';
import { OK_NOT_OK_TYPE_KEY, OK_NOT_OK_TYPE_LABEL } from '../../../../../utils/okNotOkLabels';

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

// Target value type options
export const targetValueTypeOptions = [
	{ value: 'range', label: 'Range' },
	{ value: 'exact value', label: 'Exact Value' },
	{ value: OK_NOT_OK_TYPE_KEY, label: OK_NOT_OK_TYPE_LABEL },
	{ value: 'table', label: 'Table' }
];

// Column type options for table target value type
export const tableColumnTypeOptions = [
	{ value: 'text', label: 'Text' },
	{ value: 'number', label: 'Number' },
	{ value: OK_NOT_OK_TYPE_KEY, label: OK_NOT_OK_TYPE_LABEL },
	{ value: 'date', label: 'Date' },
	{ value: 'datetime', label: 'Date & Time' },
	{ value: 'shift', label: 'Shift' }
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
	// { value: 'Centipoise (cP)', label: 'Centipoise (cP)' },
	// { value: 'Pascal (Pa)', label: 'Pascal (Pa)' },
	// { value: 'Bar', label: 'Bar' },
	// { value: 'PSI', label: 'PSI' },
	{ value: 'Hours', label: 'Hours (hr)' },
	{ value: 'mm Hg', label: 'Millimeters of Mercury (mm Hg)' },
	{ value: 'Microns (µm)', label: 'Microns (µm)' }
];
