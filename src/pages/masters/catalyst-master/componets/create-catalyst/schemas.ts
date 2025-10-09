import * as yup from 'yup';

// Configuration validation schema
export const catalystConfigurationSchema = yup
	.object({
		id: yup.number().optional(),
		catalystId: yup.number().optional(),
		chartId: yup.string().optional(),
		minTemperature: yup
			.string()
			.required('Minimum temperature is required')
			.test('is-valid-number', 'Minimum temperature must be a valid number >= -50°C', value => {
				if (!value) return false;
				const num = Number(value);
				return !isNaN(num) && num >= -50;
			}),
		maxTemperature: yup
			.string()
			.required('Maximum temperature is required')
			.test('is-valid-number', 'Maximum temperature must be a valid number <= 100°C', value => {
				if (!value) return false;
				const num = Number(value);
				return !isNaN(num) && num <= 100;
			}),
		minHumidity: yup
			.string()
			.required('Minimum humidity is required')
			.test('is-valid-number', 'Minimum humidity must be a valid number >= 0%', value => {
				if (!value) return false;
				const num = Number(value);
				return !isNaN(num) && num >= 0;
			}),
		maxHumidity: yup
			.string()
			.required('Maximum humidity is required')
			.test('is-valid-number', 'Maximum humidity must be a valid number <= 100%', value => {
				if (!value) return false;
				const num = Number(value);
				return !isNaN(num) && num <= 100;
			}),
		minGelcoat: yup
			.string()
			.required('Minimum gelcoat is required')
			.test('is-valid-number', 'Minimum gelcoat must be a valid number > 0', value => {
				if (!value) return false;
				const num = Number(value);
				return !isNaN(num) && num > 0;
			}),
		maxGelcoat: yup
			.string()
			.required('Maximum gelcoat is required')
			.test('is-valid-number', 'Maximum gelcoat must be a valid number > 0', value => {
				if (!value) return false;
				const num = Number(value);
				return !isNaN(num) && num > 0;
			}),
		gelcoatLabel: yup
			.string()
			.required('Gelcoat label is required')
			.min(3, 'Gelcoat label must be at least 3 characters')
			.max(100, 'Gelcoat label must be less than 100 characters'),
		minResinDosage: yup
			.string()
			.required('Minimum resin dosage is required')
			.test('is-valid-number', 'Minimum resin dosage must be a valid number > 0', value => {
				if (!value) return false;
				const num = Number(value);
				return !isNaN(num) && num > 0;
			}),
		maxResinDosage: yup
			.string()
			.required('Maximum resin dosage is required')
			.test('is-valid-number', 'Maximum resin dosage must be a valid number > 0', value => {
				if (!value) return false;
				const num = Number(value);
				return !isNaN(num) && num > 0;
			}),
		resinLabel: yup
			.string()
			.required('Resin label is required')
			.min(3, 'Resin label must be at least 3 characters')
			.max(100, 'Resin label must be less than 100 characters'),
		blockCatalystMixing: yup.boolean(),
		requestSupervisorApproval: yup.boolean(),
		createdAt: yup.string().optional(),
		updatedAt: yup.string().optional()
	})
	.test('min-max-validation', 'Minimum values must be less than or equal to maximum values', function (value) {
		const {
			minTemperature,
			maxTemperature,
			minHumidity,
			maxHumidity,
			minGelcoat,
			maxGelcoat,
			minResinDosage,
			maxResinDosage
		} = value;

		const minTemp = Number(minTemperature);
		const maxTemp = Number(maxTemperature);
		const minHum = Number(minHumidity);
		const maxHum = Number(maxHumidity);
		const minGel = Number(minGelcoat);
		const maxGel = Number(maxGelcoat);
		const minResin = Number(minResinDosage);
		const maxResin = Number(maxResinDosage);

		if (minTemp > maxTemp || minHum > maxHum || minGel > maxGel || minResin > maxResin) {
			return this.createError({
				path: 'minTemperature',
				message: 'Minimum values must be less than or equal to maximum values'
			});
		}
		return true;
	});

// Main form validation schema
export const catalystFormSchema = yup.object({
	id: yup.number().optional(),
	chartId: yup
		.string()
		.required('Chart ID is required')
		.min(3, 'Chart ID must be at least 3 characters')
		.max(50, 'Chart ID must be less than 50 characters')
		.matches(/^[A-Z0-9-]+$/, 'Chart ID must contain only uppercase letters, numbers, and hyphens'),
	chartSupplier: yup
		.string()
		.required('Chart supplier is required')
		.min(2, 'Chart supplier must be at least 2 characters')
		.max(100, 'Chart supplier must be less than 100 characters'),
	notes: yup.string().max(500, 'Notes must be less than 500 characters').optional(),
	mekpDensity: yup
		.string()
		.required('MEKP density is required')
		.test('is-valid-density', 'MEKP density must be a valid number between 0 and 10 g/cm³', value => {
			if (!value) return false;
			const num = Number(value);
			return !isNaN(num) && num > 0 && num <= 10;
		}),
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
	blockCatalystMixing: false,
	requestSupervisorApproval: false
};

export const defaultCatalystFormData: CatalystFormData = {
	chartId: '',
	chartSupplier: '',
	notes: '',
	mekpDensity: '',
	isActive: true,
	catalystConfiguration: [defaultCatalystConfiguration]
};

// Section-specific validation schemas
export const basicInfoSchema = yup.object({
	chartId: yup
		.string()
		.required('Chart ID is required')
		.min(3, 'Chart ID must be at least 3 characters')
		.max(50, 'Chart ID must be less than 50 characters')
		.matches(/^[A-Z0-9-]+$/, 'Chart ID must contain only uppercase letters, numbers, and hyphens'),
	chartSupplier: yup
		.string()
		.required('Chart supplier is required')
		.min(2, 'Chart supplier must be at least 2 characters')
		.max(100, 'Chart supplier must be less than 100 characters'),
	notes: yup.string().max(500, 'Notes must be less than 500 characters').optional(),
	mekpDensity: yup
		.string()
		.required('MEKP density is required')
		.test('is-valid-density', 'MEKP density must be a valid number between 0 and 10 g/cm³', value => {
			if (!value) return false;
			const num = Number(value);
			return !isNaN(num) && num > 0 && num <= 10;
		}),
	isActive: yup.boolean()
});

export const configurationSchema = yup.object({
	catalystConfiguration: yup.array(catalystConfigurationSchema).min(1, 'At least one configuration is required')
});
