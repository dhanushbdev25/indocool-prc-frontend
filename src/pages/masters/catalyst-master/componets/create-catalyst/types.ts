import { Control, FieldErrors } from 'react-hook-form';
import { CatalystFormData } from './schemas';

export interface CatalystConfigurationData {
	id?: number;
	catalystId?: number;
	chartId?: string;
	minTemperature: string;
	maxTemperature: string;
	minHumidity: string;
	maxHumidity: string;
	minGelcoat: string;
	maxGelcoat: string;
	gelcoatLabel: string;
	minResinDosage: string;
	maxResinDosage: string;
	resinLabel: string;
	minTopCoat: string;
	maxTopCoat: string;
	topCoatLabel: string;
	blockCatalystMixing: boolean;
	requestSupervisorApproval: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface CatalystBasicInfoProps {
	control: Control<CatalystFormData>;
	errors: FieldErrors<CatalystFormData>;
}

export interface CatalystConfigurationProps {
	control: Control<CatalystFormData>;
	errors: FieldErrors<CatalystFormData>;
}
