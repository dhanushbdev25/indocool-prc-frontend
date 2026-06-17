import * as yup from 'yup';
import { OK_NOT_OK_TYPE_KEY, OK_NOT_OK_TYPE_LABEL } from '../../../../../utils/okNotOkLabels';

// Column validation schema
export const columnSchema = yup
	.object({
	name: yup.string().required('Column name is required'),
	type: yup
		.string()
		.required('Column type is required')
		.oneOf(['text', 'number', 'boolean', 'ok/not ok', 'date', 'datetime', 'shift'], 'Invalid column type'),
	defaultValue: yup.mixed().when('type', {
		is: (val: string) => val === 'number' || val === 'datetime',
		then: (schema: yup.MixedSchema) => {
			return schema
				.transform((value: unknown) => {
					if (value === '' || value === null || value === undefined) return undefined;
					const num = Number(value);
					return isNaN(num) ? undefined : num;
				})
				.test('is-number', 'Default value must be a valid number', (value: unknown) => {
					return value === undefined || typeof value === 'number';
				});
		},
		otherwise: () => yup.string().optional()
	}),
	minimumAcceptanceValue: yup.mixed().when('type', {
		is: 'number',
		then: schema =>
			schema.transform(value => {
				if (value === '' || value === null || value === undefined) return undefined;
				const num = Number(value);
				return isNaN(num) ? undefined : num;
			}),
		otherwise: schema => schema.optional()
	}),
	maximumAcceptanceValue: yup.mixed().when('type', {
		is: 'number',
		then: schema =>
			schema.transform(value => {
				if (value === '' || value === null || value === undefined) return undefined;
				const num = Number(value);
				return isNaN(num) ? undefined : num;
			}),
		otherwise: schema => schema.optional()
	})
	})
	.test('column-min-max-range', 'Minimum value cannot be greater than maximum value', value => {
		if (!value || value.type !== 'number') return true;
		if (value.minimumAcceptanceValue === undefined || value.maximumAcceptanceValue === undefined) return true;
		return Number(value.minimumAcceptanceValue) <= Number(value.maximumAcceptanceValue);
	});

// Part image validation schema
export const partImageSchema = yup.object({
	name: yup.string().required('Image name is required'),
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
	parameterName: yup.string().required('Parameter name is required'),
	specification: yup.string().optional(),
	minimumAcceptanceValue: yup.mixed().when('type', {
		is: 'number',
		then: schema =>
			schema.transform(value => {
				if (value === '' || value === null || value === undefined) return undefined;
				const num = Number(value);
				return isNaN(num) ? undefined : num;
			}),
		otherwise: schema => schema.optional()
	}),
	maximumAcceptanceValue: yup.mixed().when('type', {
		is: 'number',
		then: schema =>
			schema.transform(value => {
				if (value === '' || value === null || value === undefined) return undefined;
				const num = Number(value);
				return isNaN(num) ? undefined : num;
			}),
		otherwise: schema => schema.optional()
	}),
	type: yup
		.string()
		.required('Parameter type is required')
		.oneOf(
			['text', 'number', 'boolean', 'files', 'table', 'ok/not ok', 'datetime', 'fixed-table', 'shift'],
			'Invalid parameter type'
		),
	files: filesSchema.optional(),
	columns: yup.array(columnSchema).min(0, 'Columns array cannot be negative'),
	tableConfig: yup
		.object({
			columns: yup
				.array(
					yup.object({
						name: yup.string().required('Column name is required'),
						type: yup
							.string()
							.required('Column type is required')
							.oneOf(['text', 'number', 'ok/not ok', 'date', 'datetime', 'shift'])
					})
				)
				.min(1, 'At least one column is required'),
			rows: yup
				.array(
					yup.object({
						cells: yup.lazy(() =>
							yup.object().test('valid-cells', 'Each cell must have value and readOnly fields', value => {
								if (!value || typeof value !== 'object') return true;
								return Object.values(value).every(
									cell =>
										cell !== null &&
										typeof cell === 'object' &&
										'readOnly' in (cell as Record<string, unknown>) &&
										'value' in (cell as Record<string, unknown>)
								);
							})
						)
					})
				)
				.min(1, 'At least one row is required')
		})
		.nullable()
		.default(undefined)
		.when('type', {
			is: 'fixed-table',
			then: schema =>
				schema
					.nonNullable()
					.required('Table configuration is required for fixed-table type')
					.test('has-columns', 'At least one column is required', value => {
						return (
							value !== null &&
							value !== undefined &&
							Array.isArray(value.columns) &&
							value.columns.length > 0
						);
					})
					.test('has-rows', 'At least one row is required', value => {
						return (
							value !== null && value !== undefined && Array.isArray(value.rows) && value.rows.length > 0
						);
					}),
			otherwise: schema => schema.nullable().optional()
		}),
	role: yup
		.string()
		.required('Role is required')
		.oneOf(['QUALITY_ENGINEER', 'SUPERVISOR', 'QUALITY_INSPECTOR', 'OPERATOR', 'MANAGER'], 'Invalid role'),
	ctq: yup.boolean(),
	getInstrumentId: yup.boolean()
}).test('min-max-range', 'Minimum value cannot be greater than maximum value', value => {
	if (!value || value.type !== 'number') return true;
	if (value.minimumAcceptanceValue === undefined || value.maximumAcceptanceValue === undefined) return true;
	return Number(value.minimumAcceptanceValue) <= Number(value.maximumAcceptanceValue);
});

// Main form validation schema
export const inspectionFormSchema = yup.object({
	id: yup.number().optional(),
	inspectionName: yup.string().trim().required('Inspection name is required'),
	status: yup.boolean(),
	inspectionId: yup.string().trim().required('Inspection ID is required'),
	type: yup.string().optional(),
	version: yup.number().optional(),
	isLatest: yup.boolean().optional(),
	showPartImages: yup.boolean(),
	partImages: yup.array().when('showPartImages', {
		is: true,
		then: schema =>
			schema.of(partImageSchema).min(1, 'At least one part image is required when Show Part Images is enabled'),
		otherwise: schema => schema.of(partImageSchema).min(0, 'Part images array cannot be negative')
	}),
	approveByProduction: yup.boolean().optional(),
	approveByQuality: yup.boolean().optional(),
	inspectionParameters: yup.array(inspectionParameterSchema).min(1, 'At least one inspection parameter is required'),
	notes: yup.string().optional(),
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
	minimumAcceptanceValue: '',
	maximumAcceptanceValue: ''
};

export const defaultPartImage: PartImageFormData = {
	name: '',
	url: ''
};

export const defaultInspectionParameter: InspectionParameterFormData = {
	order: 1,
	parameterName: '',
	specification: '',
	minimumAcceptanceValue: '',
	maximumAcceptanceValue: '',
	type: 'text',
	files: {},
	columns: [],
	tableConfig: undefined,
	role: 'QUALITY_ENGINEER',
	ctq: false,
	getInstrumentId: false
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
	approveByProduction: false,
	approveByQuality: true,
	inspectionParameters: [defaultInspectionParameter],
	notes: ''
};

// Section-specific validation schemas
export const basicInfoSchema = yup.object({
	inspectionName: yup.string().trim().required('Inspection name is required'),
	status: yup.boolean(),
	inspectionId: yup.string().trim().required('Inspection ID is required'),
	showPartImages: yup.boolean(),
	partImages: yup.array().when('showPartImages', {
		is: true,
		then: schema =>
			schema.of(partImageSchema).min(1, 'At least one part image is required when Show Part Images is enabled'),
		otherwise: schema => schema.of(partImageSchema).min(0, 'Part images array cannot be negative')
	}),
	approveByProduction: yup.boolean().optional(),
	approveByQuality: yup.boolean().optional(),
	notes: yup.string().optional()
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
	{ value: OK_NOT_OK_TYPE_KEY, label: OK_NOT_OK_TYPE_LABEL },
	{ value: 'datetime', label: 'Date & Time' },
	{ value: 'shift', label: 'Shift' },
	{ value: 'table', label: 'Table (dynamic rows at execution)' },
	{ value: 'fixed-table', label: 'Fixed table' }
];

// Column type options
export const columnTypeOptions = [
	{ value: 'text', label: 'Text' },
	{ value: 'number', label: 'Number' },
	{ value: 'boolean', label: 'Boolean' },
	{ value: OK_NOT_OK_TYPE_KEY, label: OK_NOT_OK_TYPE_LABEL },
	{ value: 'date', label: 'Date' },
	{ value: 'datetime', label: 'Date & Time' },
	{ value: 'shift', label: 'Shift' }
];

export const shiftOptions = [
	{ value: 'Shift A', label: 'Shift A' },
	{ value: 'Shift B', label: 'Shift B' },
	{ value: 'Shift C', label: 'Shift C' },
	{ value: 'Shift G', label: 'Shift G' }
];
