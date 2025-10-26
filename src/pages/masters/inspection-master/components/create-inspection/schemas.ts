import * as yup from 'yup';

// Column validation schema
export const columnSchema = yup.object({
	name: yup
		.string()
		.required('Column name is required')
		.min(2, 'Column name must be at least 2 characters')
		.max(50, 'Column name must be less than 50 characters'),
	type: yup
		.string()
		.required('Column type is required')
		.oneOf(['text', 'number', 'boolean', 'ok/not ok', 'datetime'], 'Invalid column type'),
	defaultValue: yup.mixed().when('type', {
		is: (val: string) => val === 'number' || val === 'datetime',
		then: (schema, { parent }) => {
			if (parent?.type === 'number') {
				return schema
					.transform(value => {
						if (value === '' || value === null || value === undefined) return undefined;
						const num = Number(value);
						return isNaN(num) ? undefined : num;
					})
					.test('is-number', 'Default value must be a valid number', value => {
						return value === undefined || typeof value === 'number';
					});
			}
			return yup.string().optional();
		},
		otherwise: () => yup.string().max(100, 'Default value must be less than 100 characters').optional()
	}),
	tolerance: yup.mixed().when('type', {
		is: 'number',
		then: schema =>
			schema
				.transform(value => {
					if (value === '' || value === null || value === undefined) return undefined;
					const num = Number(value);
					return isNaN(num) ? undefined : num;
				})
				.test('is-number', 'Tolerance must be a valid number', value => {
					return value === undefined || typeof value === 'number';
				}),
		otherwise: () => yup.string().max(50, 'Tolerance must be less than 50 characters').optional()
	})
});

// Part image validation schema
export const partImageSchema = yup.object({
	name: yup
		.string()
		.required('Image name is required')
		.min(2, 'Image name must be at least 2 characters')
		.max(100, 'Image name must be less than 100 characters'),
	url: yup.string().required('Image URL is required').url('Must be a valid URL')
});

// Files validation schema (key-value pairs)
export const filesSchema = yup.object().test('valid-files', 'Files must be valid key-value pairs', function (value) {
	if (!value) return true; // Optional field
	for (const [key, val] of Object.entries(value)) {
		if (typeof key !== 'string' || typeof val !== 'string') {
			return this.createError({
				path: 'files',
				message: 'Files must contain only string key-value pairs'
			});
		}
	}
	return true;
});

// Inspection parameter validation schema
export const inspectionParameterSchema = yup.object({
	order: yup
		.number()
		.required('Order is required')
		.min(1, 'Order must be at least 1')
		.integer('Order must be a whole number'),
	parameterName: yup
		.string()
		.required('Parameter name is required')
		.min(3, 'Parameter name must be at least 3 characters')
		.max(100, 'Parameter name must be less than 100 characters'),
	specification: yup.string().optional().max(500, 'Specification must be less than 500 characters'),
	tolerance: yup.mixed().when('type', {
		is: 'number',
		then: schema =>
			schema
				.transform(value => {
					if (value === '' || value === null || value === undefined) return undefined;
					const num = Number(value);
					return isNaN(num) ? undefined : num;
				})
				.test('is-number', 'Tolerance must be a valid number', value => {
					return value === undefined || typeof value === 'number';
				}),
		otherwise: () => yup.string().max(100, 'Tolerance must be less than 100 characters').optional()
	}),
	type: yup
		.string()
		.required('Parameter type is required')
		.oneOf(['text', 'number', 'boolean', 'files', 'table', 'ok/not ok', 'datetime'], 'Invalid parameter type'),
	files: filesSchema.optional(),
	columns: yup.array(columnSchema).min(0, 'Columns array cannot be negative'),
	role: yup
		.string()
		.required('Role is required')
		.oneOf(['QUALITY_ENGINEER', 'SUPERVISOR', 'QUALITY_INSPECTOR', 'OPERATOR', 'MANAGER'], 'Invalid role'),
	ctq: yup.boolean()
});

// Main form validation schema
export const inspectionFormSchema = yup.object({
	id: yup.number().optional(),
	inspectionName: yup
		.string()
		.required('Inspection name is required')
		.min(3, 'Inspection name must be at least 3 characters')
		.max(100, 'Inspection name must be less than 100 characters'),
	status: yup.boolean(),
	inspectionId: yup
		.string()
		.required('Inspection ID is required')
		.min(3, 'Inspection ID must be at least 3 characters')
		.max(50, 'Inspection ID must be less than 50 characters')
		.matches(/^[A-Z0-9-]+$/, 'Inspection ID must contain only uppercase letters, numbers, and hyphens'),
	type: yup
		.string()
		.required('Type is required')
		.min(2, 'Type must be at least 2 characters')
		.max(50, 'Type must be less than 50 characters'),
	version: yup.number().optional(),
	isLatest: yup.boolean().optional(),
	showPartImages: yup.boolean(),
	partImages: yup.array().when('showPartImages', {
		is: true,
		then: schema =>
			schema.of(partImageSchema).min(1, 'At least one part image is required when Show Part Images is enabled'),
		otherwise: schema => schema.of(partImageSchema).min(0, 'Part images array cannot be negative')
	}),
	inspectionParameters: yup.array(inspectionParameterSchema).min(1, 'At least one inspection parameter is required'),
	notes: yup.string().max(1000, 'Notes must be less than 1000 characters').optional(),
	createdAt: yup.string().optional(),
	updatedAt: yup.string().optional()
});

// Type definitions
export type ColumnFormData = yup.InferType<typeof columnSchema>;
export type PartImageFormData = yup.InferType<typeof partImageSchema>;
export type FilesFormData = yup.InferType<typeof filesSchema>;
export type InspectionParameterFormData = yup.InferType<typeof inspectionParameterSchema>;
export type InspectionFormData = yup.InferType<typeof inspectionFormSchema>;

// Force TypeScript to recognize the updated schema
export type _InspectionFormDataWithNotes = InspectionFormData & { notes: string };

// Default values
export const defaultColumn: ColumnFormData = {
	name: '',
	type: 'text',
	defaultValue: '',
	tolerance: ''
};

export const defaultPartImage: PartImageFormData = {
	name: '',
	url: ''
};

export const defaultInspectionParameter: InspectionParameterFormData = {
	order: 1,
	parameterName: '',
	specification: '',
	tolerance: '',
	type: 'text',
	files: {},
	columns: [],
	role: 'QUALITY_ENGINEER',
	ctq: false
};

export const defaultInspectionFormData: InspectionFormData = {
	inspectionName: '',
	status: true,
	inspectionId: '',
	type: '',
	version: 1,
	isLatest: true,
	showPartImages: false,
	partImages: [],
	inspectionParameters: [defaultInspectionParameter],
	notes: ''
};

// Section-specific validation schemas
export const basicInfoSchema = yup.object({
	inspectionName: yup
		.string()
		.required('Inspection name is required')
		.min(3, 'Inspection name must be at least 3 characters')
		.max(100, 'Inspection name must be less than 100 characters'),
	status: yup.boolean(),
	inspectionId: yup
		.string()
		.required('Inspection ID is required')
		.min(3, 'Inspection ID must be at least 3 characters')
		.max(50, 'Inspection ID must be less than 50 characters')
		.matches(/^[A-Z0-9-]+$/, 'Inspection ID must contain only uppercase letters, numbers, and hyphens'),
	type: yup
		.string()
		.required('Type is required')
		.min(2, 'Type must be at least 2 characters')
		.max(50, 'Type must be less than 50 characters'),
	showPartImages: yup.boolean(),
	partImages: yup.array().when('showPartImages', {
		is: true,
		then: schema =>
			schema.of(partImageSchema).min(1, 'At least one part image is required when Show Part Images is enabled'),
		otherwise: schema => schema.of(partImageSchema).min(0, 'Part images array cannot be negative')
	}),
	notes: yup.string().max(1000, 'Notes must be less than 1000 characters').optional()
});

export const parametersSchema = yup.object({
	inspectionParameters: yup.array(inspectionParameterSchema).min(1, 'At least one inspection parameter is required')
});

// Role options for dropdowns
export const roleOptions = [
	{ value: 'QUALITY_ENGINEER', label: 'Quality Engineer' },
	{ value: 'SUPERVISOR', label: 'Supervisor' },
	{ value: 'QUALITY_INSPECTOR', label: 'Quality Inspector' },
	{ value: 'OPERATOR', label: 'Operator' },
	{ value: 'MANAGER', label: 'Manager' }
];

// Parameter type options
export const parameterTypeOptions = [
	{ value: 'text', label: 'Text' },
	{ value: 'number', label: 'Number' },
	{ value: 'boolean', label: 'Boolean' },
	{ value: 'files', label: 'Files' },
	{ value: 'table', label: 'Table' },
	{ value: 'ok/not ok', label: 'Ok/Not Ok' },
	{ value: 'datetime', label: 'Date & Time' }
];

// Column type options
export const columnTypeOptions = [
	{ value: 'text', label: 'Text' },
	{ value: 'number', label: 'Number' },
	{ value: 'boolean', label: 'Boolean' },
	{ value: 'ok/not ok', label: 'Ok/Not Ok' },
	{ value: 'datetime', label: 'Date & Time' }
];
