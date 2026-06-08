import * as yup from 'yup';

/** True when optional string field should be validated as a number. */
const isFilled = (value: unknown): boolean =>
	value !== undefined && value !== null && String(value).trim() !== '';

// Configuration validation schema
export const catalystConfigurationSchema = yup
	.object({
		id: yup.number().optional(),
		catalystId: yup.number().optional(),
		chartId: yup.string().optional(),
		minTemperature: yup.string().test('is-valid-number', 'Minimum temperature must be a valid number >= -50°C', value => {
			if (!isFilled(value)) return true;
			const num = Number(value);
			return !isNaN(num) && num >= -50;
		}),
		maxTemperature: yup.string().test('is-valid-number', 'Maximum temperature must be a valid number <= 100°C', value => {
			if (!isFilled(value)) return true;
			const num = Number(value);
			return !isNaN(num) && num <= 100;
		}),
		minHumidity: yup.string().test('is-valid-number', 'Minimum humidity must be a valid number >= 0%', value => {
			if (!isFilled(value)) return true;
			const num = Number(value);
			return !isNaN(num) && num >= 0;
		}),
		maxHumidity: yup.string().test('is-valid-number', 'Maximum humidity must be a valid number <= 100%', value => {
			if (!isFilled(value)) return true;
			const num = Number(value);
			return !isNaN(num) && num <= 100;
		}),
		minGelcoat: yup.string().test('is-valid-number', 'Minimum gelcoat must be a valid number >= 0', value => {
			if (!isFilled(value)) return true;
			const num = Number(value);
			return !isNaN(num) && num >= 0;
		}),
		maxGelcoat: yup.string().test('is-valid-number', 'Maximum gelcoat must be a valid number >= 0', value => {
			if (!isFilled(value)) return true;
			const num = Number(value);
			return !isNaN(num) && num >= 0;
		}),
		gelcoatLabel: yup.string().optional().max(100, 'Gelcoat label must be less than 100 characters'),
		minResinDosage: yup.string().test('is-valid-number', 'Minimum resin dosage must be a valid number >= 0', value => {
			if (!isFilled(value)) return true;
			const num = Number(value);
			return !isNaN(num) && num >= 0;
		}),
		maxResinDosage: yup.string().test('is-valid-number', 'Maximum resin dosage must be a valid number >= 0', value => {
			if (!isFilled(value)) return true;
			const num = Number(value);
			return !isNaN(num) && num >= 0;
		}),
		resinLabel: yup.string().optional().max(100, 'Resin label must be less than 100 characters'),
		minTopCoat: yup.string().test('is-valid-number', 'Minimum top coat must be a valid number >= 0', value => {
			if (!isFilled(value)) return true;
			const num = Number(value);
			return !isNaN(num) && num >= 0;
		}),
		maxTopCoat: yup.string().test('is-valid-number', 'Maximum top coat must be a valid number >= 0', value => {
			if (!isFilled(value)) return true;
			const num = Number(value);
			return !isNaN(num) && num >= 0;
		}),
		topCoatLabel: yup.string().optional().max(100, 'Top coat label must be less than 100 characters'),
		blockCatalystMixing: yup.boolean(),
		requestSupervisorApproval: yup.boolean(),
		createdAt: yup.string().optional(),
		updatedAt: yup.string().optional()
	})
	.test('min-max-validation', function (value) {
		if (!value) return true;
		const {
			minTemperature,
			maxTemperature,
			minHumidity,
			maxHumidity,
			minGelcoat,
			maxGelcoat,
			minResinDosage,
			maxResinDosage,
			minTopCoat,
			maxTopCoat
		} = value;

		if (isFilled(minTemperature) && isFilled(maxTemperature) && Number(minTemperature) > Number(maxTemperature)) {
			return this.createError({
				path: 'minTemperature',
				message: 'Minimum temperature must be less than or equal to maximum temperature'
			});
		}
		if (isFilled(minHumidity) && isFilled(maxHumidity) && Number(minHumidity) > Number(maxHumidity)) {
			return this.createError({
				path: 'minHumidity',
				message: 'Minimum humidity must be less than or equal to maximum humidity'
			});
		}
		if (isFilled(minGelcoat) && isFilled(maxGelcoat) && Number(minGelcoat) > Number(maxGelcoat)) {
			return this.createError({
				path: 'minGelcoat',
				message: 'Minimum gelcoat must be less than or equal to maximum gelcoat'
			});
		}
		if (isFilled(minResinDosage) && isFilled(maxResinDosage) && Number(minResinDosage) > Number(maxResinDosage)) {
			return this.createError({
				path: 'minResinDosage',
				message: 'Minimum resin dosage must be less than or equal to maximum resin dosage'
			});
		}
		if (isFilled(minTopCoat) && isFilled(maxTopCoat) && Number(minTopCoat) > Number(maxTopCoat)) {
			return this.createError({
				path: 'minTopCoat',
				message: 'Minimum top coat must be less than or equal to maximum top coat'
			});
		}
		return true;
	});

// Main form validation schema
export const catalystFormSchema = yup.object({
	id: yup.number().optional(),
	chartId: yup.string().trim().required('Chart ID is required'),
	chartSupplier: yup
		.string()
		.required('Chart supplier is required')
		.min(2, 'Chart supplier must be at least 2 characters')
		.max(100, 'Chart supplier must be less than 100 characters'),
	notes: yup.string().max(500, 'Notes must be less than 500 characters').optional(),
	isActive: yup.boolean(),
	catalystConfiguration: yup.array(catalystConfigurationSchema).min(1, 'At least one configuration is required'),
	createdAt: yup.string().optional(),
	updatedAt: yup.string().optional()
});

// Type definitions
export type CatalystConfigurationFormData = yup.InferType<typeof catalystConfigurationSchema>;
export type CatalystFormData = yup.InferType<typeof catalystFormSchema>;

// Default values
export const defaultCatalystConfiguration: CatalystConfigurationFormData = {
	minTemperature: '',
	maxTemperature: '',
	minHumidity: '',
	maxHumidity: '',
	minGelcoat: '',
	maxGelcoat: '',
	gelcoatLabel: '',
	minResinDosage: '',
	maxResinDosage: '',
	resinLabel: '',
	minTopCoat: '',
	maxTopCoat: '',
	topCoatLabel: '',
	blockCatalystMixing: false,
	requestSupervisorApproval: false
};

export const defaultCatalystFormData: CatalystFormData = {
	chartId: '',
	chartSupplier: '',
	notes: '',
	isActive: true,
	catalystConfiguration: [defaultCatalystConfiguration]
};

// Section-specific validation schemas
export const basicInfoSchema = yup.object({
	chartId: yup.string().trim().required('Chart ID is required'),
	chartSupplier: yup
		.string()
		.required('Chart supplier is required')
		.min(2, 'Chart supplier must be at least 2 characters')
		.max(100, 'Chart supplier must be less than 100 characters'),
	notes: yup.string().max(500, 'Notes must be less than 500 characters').optional(),
	isActive: yup.boolean()
});

export const configurationSchema = yup.object({
	catalystConfiguration: yup.array(catalystConfigurationSchema).min(1, 'At least one configuration is required')
});
