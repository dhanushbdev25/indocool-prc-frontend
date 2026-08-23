import * as yup from 'yup';
import { CRITICALITY_TAGS } from '../../../../../utils/criticality';

// Table configuration schemas
const tableRowConfigSchema = yup.object({
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
});

const tableColumnSchema = yup.object({
	name: yup.string().required('Column name is required'),
	type: yup
		.string()
		.required('Column type is required')
		.oneOf(['text', 'number', 'ok/not ok', 'date', 'datetime', 'shift', 'workstation'], 'Invalid column type')
});

const tableConfigSchema = yup
	.object({
		columns: yup.array(tableColumnSchema).min(1, 'At least one column is required'),
		rows: yup.array(tableRowConfigSchema).min(1, 'At least one row is required')
	})
	.nullable()
	.default(null);

// Process Step validation schema
export const processStepSchema = yup
	.object({
		// Database id of an existing step row. Absent for newly added steps. Update
		// deletes and re-inserts every step, so an omitted id makes the backend mint
		// a new one and orphans execution answers keyed by it.
		id: yup.number().optional(),
		parameterDescription: yup.string().required('Parameter description is required'),
		stepNumber: yup
			.number()
			.required('Step number is required')
			.min(1, 'Step number must be at least 1')
			.integer('Step number must be a whole number'),
		evaluationMethod: yup.string().required('Evaluation method is required'),
		targetValueType: yup
			.string()
			.required('Target value type is required')
			.oneOf(['range', 'exact value', 'ok/not ok', 'table'], 'Invalid target value type'),
		minimumAcceptanceValue: yup
			.number()
			.nullable()
			.when('targetValueType', {
				is: (val: string) => val === 'range' || val === 'exact value',
				then: schema => schema.required('Minimum acceptance value is required for this target value type'),
				otherwise: schema => schema.nullable()
			}),
		maximumAcceptanceValue: yup
			.number()
			.nullable()
			.when('targetValueType', {
				is: 'range',
				then: schema => schema.required('Maximum acceptance value is required for range target value type'),
				otherwise: schema => schema.nullable()
			}),
		multipleMeasurements: yup.boolean(),
		multipleMeasurementMaxCount: yup
			.number()
			.nullable()
			.when('multipleMeasurements', {
				is: true,
				then: schema =>
					schema
						.required('Maximum count is required when multiple measurements is enabled')
						.min(1, 'Maximum count must be at least 1'),
				otherwise: schema => schema.nullable()
			}),
		tableConfig: tableConfigSchema.when('targetValueType', {
			is: 'table',
			then: schema =>
				schema
					.nonNullable()
					.required('Table configuration is required when target value type is Table')
					.test('has-columns', 'At least one column is required', value => {
						return value !== null && value !== undefined && Array.isArray(value.columns) && value.columns.length > 0;
					})
					.test('has-rows', 'At least one row is required', value => {
						return value !== null && value !== undefined && Array.isArray(value.rows) && value.rows.length > 0;
					}),
			otherwise: schema => schema.nullable().default(null)
		}),
		uom: yup.string().optional(),
		// `ctq` and `criticalityTag` together hold the single Criticality value the user
		// picks. Only `ctq` gates execution; CTA/CTP are tags. Always write them through
		// `toCriticalityFields` so the pair can never contradict itself.
		ctq: yup.boolean(),
		criticalityTag: yup
			.string()
			.nullable()
			.optional()
			.oneOf([...CRITICALITY_TAGS, null], 'Invalid criticality tag'),
		allowAttachments: yup.boolean(),
		responsiblePerson: yup.boolean(),
		getInstrumentId: yup.boolean(),
		notes: yup.string().optional()
	})
	.test('min-max-validation', 'Minimum value must be less than or equal to maximum value', function (value) {
		const { minimumAcceptanceValue, maximumAcceptanceValue, targetValueType } = value;

		if (targetValueType === 'range' && minimumAcceptanceValue != null && maximumAcceptanceValue != null) {
			if (minimumAcceptanceValue > maximumAcceptanceValue) {
				return this.createError({
					path: 'minimumAcceptanceValue',
					message: 'Minimum value must be less than or equal to maximum value'
				});
			}
		}

		return true;
	});

// Process Step Group validation schema
export const processStepGroupSchema = yup.object({
	// Database id of an existing group row — see the note on processStepSchema.
	id: yup.number().optional(),
	sequence: yup.number().required().min(1).integer(),
	processName: yup.string().required('Process ID is required'),
	processDescription: yup.string().required('Process description is required'),
	sequenceTiming: yup
		.string()
		.required('Expected duration is required')
		.matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)')
		.test('min-duration', 'Duration must be at least 1 minute', function (value) {
			if (!value) return false;
			const [hours, minutes] = value.split(':').map(Number);
			const totalMinutes = hours * 60 + minutes;
			return totalMinutes >= 1;
		}),
	shift: yup.string().optional().nullable(),
	pfdNumber: yup.string().optional().nullable(),
	processSteps: yup
		.array(processStepSchema)
		.test('unique-step-numbers', 'Step numbers must be unique within each group', function (steps) {
			if (!steps) return true;
			const stepNumbers = steps.map(step => step.stepNumber);
			const uniqueStepNumbers = new Set(stepNumbers);
			return stepNumbers.length === uniqueStepNumbers.size;
		})
});

// Main form validation schema
export const sequenceFormSchema = yup.object({
	id: yup.number().optional(),
	sequenceId: yup.string().trim().required('Sequence ID is required'),
	sequenceName: yup.string().trim().required('Sequence name is required'),
	category: yup.string().required('Category is required'),
	type: yup.string().required('Type is required').oneOf(['Layout', 'ISP'], 'Type must be either Layout or ISP'),
	status: yup.boolean(),
	notes: yup.string().optional(),
	processStepGroups: yup.array(processStepGroupSchema),
	totalSteps: yup.number().optional(),
	ctqSteps: yup.number().optional(),
	createdAt: yup.string().optional(),
	updatedAt: yup.string().optional()
});

// Type definitions
export type ProcessStepFormData = yup.InferType<typeof processStepSchema>;
export type ProcessStepGroupFormData = yup.InferType<typeof processStepGroupSchema>;
export type SequenceFormData = yup.InferType<typeof sequenceFormSchema>;

// Default values
export const defaultProcessStep: ProcessStepFormData = {
	parameterDescription: '',
	stepNumber: 1,
	evaluationMethod: '',
	targetValueType: 'range',
	minimumAcceptanceValue: null,
	maximumAcceptanceValue: null,
	multipleMeasurements: false,
	multipleMeasurementMaxCount: null,
	tableConfig: null,
	uom: '',
	ctq: false,
	criticalityTag: null,
	allowAttachments: false,
	responsiblePerson: false,
	getInstrumentId: false,
	notes: ''
};

export const defaultProcessStepGroup: ProcessStepGroupFormData = {
	sequence: 1,
	processName: '',
	processDescription: '',
	sequenceTiming: '00:01',
	shift: '',
	pfdNumber: '',
	processSteps: []
};

export const defaultSequenceFormData: SequenceFormData = {
	sequenceId: '',
	sequenceName: '',
	category: '',
	type: 'Layout',
	status: true,
	notes: '',
	processStepGroups: []
};

// Section-specific validation schemas
export const basicInfoSchema = yup.object({
	sequenceId: yup.string().trim().required('Sequence ID is required'),
	sequenceName: yup.string().trim().required('Sequence name is required'),
	category: yup.string().required('Category is required'),
	type: yup.string().required('Type is required').oneOf(['Layout', 'ISP'], 'Type must be either Layout or ISP'),
	status: yup.boolean(),
	notes: yup.string().optional()
});

export const stepGroupsSchema = yup.object({
	processStepGroups: yup.array(processStepGroupSchema)
});
