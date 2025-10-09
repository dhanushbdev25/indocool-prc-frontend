import * as yup from 'yup';

// Process Step validation schema
export const processStepSchema = yup
	.object({
		parameterDescription: yup
			.string()
			.required('Parameter description is required')
			.min(3, 'Parameter description must be at least 3 characters')
			.max(200, 'Parameter description must be less than 200 characters'),
		stepNumber: yup
			.number()
			.required('Step number is required')
			.min(1, 'Step number must be at least 1')
			.integer('Step number must be a whole number'),
		stepType: yup
			.string()
			.required('Step type is required')
			.oneOf(['Measurement', 'Check', 'Inspection', 'Operation'], 'Invalid step type'),
		evaluationMethod: yup
			.string()
			.required('Evaluation method is required')
			.min(2, 'Evaluation method must be at least 2 characters')
			.max(100, 'Evaluation method must be less than 100 characters'),
		targetValueType: yup
			.string()
			.required('Target value type is required')
			.oneOf(['range', 'exact value', 'ok/not ok'], 'Invalid target value type'),
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
				is: (val: string) => val === 'range' || val === 'exact value',
				then: schema => schema.required('Maximum acceptance value is required for this target value type'),
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
		uom: yup
			.string()
			.required('Unit of measurement is required')
			.max(20, 'Unit of measurement must be less than 20 characters'),
		ctq: yup.boolean(),
		allowAttachments: yup.boolean(),
		notes: yup.string().max(500, 'Notes must be less than 500 characters').optional()
	})
	.test('min-max-validation', 'Minimum value must be less than or equal to maximum value', function (value) {
		const { minimumAcceptanceValue, maximumAcceptanceValue, targetValueType } = value;

		if (targetValueType === 'range' && minimumAcceptanceValue && maximumAcceptanceValue) {
			if (minimumAcceptanceValue > maximumAcceptanceValue) {
				return this.createError({
					path: 'minimumAcceptanceValue',
					message: 'Minimum value must be less than or equal to maximum value'
				});
			}
		}

		if (targetValueType === 'exact value' && minimumAcceptanceValue && maximumAcceptanceValue) {
			if (minimumAcceptanceValue !== maximumAcceptanceValue) {
				return this.createError({
					path: 'minimumAcceptanceValue',
					message: 'Minimum and maximum values must be equal for exact value type'
				});
			}
		}

		return true;
	});

// Process Step Group validation schema
export const processStepGroupSchema = yup.object({
	processName: yup
		.string()
		.required('Process name is required')
		.min(3, 'Process name must be at least 3 characters')
		.max(100, 'Process name must be less than 100 characters'),
	processDescription: yup
		.string()
		.required('Process description is required')
		.min(10, 'Process description must be at least 10 characters')
		.max(500, 'Process description must be less than 500 characters'),
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
	sequenceId: yup
		.string()
		.required('Sequence ID is required')
		.min(3, 'Sequence ID must be at least 3 characters')
		.max(50, 'Sequence ID must be less than 50 characters')
		.matches(/^[A-Z0-9-]+$/, 'Sequence ID must contain only uppercase letters, numbers, and hyphens'),
	sequenceName: yup
		.string()
		.required('Sequence name is required')
		.min(3, 'Sequence name must be at least 3 characters')
		.max(100, 'Sequence name must be less than 100 characters'),
	category: yup
		.string()
		.required('Category is required')
		.min(2, 'Category must be at least 2 characters')
		.max(50, 'Category must be less than 50 characters'),
	type: yup.string().required('Type is required').oneOf(['Layout', 'ISP'], 'Type must be either Layout or ISP'),
	status: yup.boolean(),
	notes: yup.string().max(500, 'Notes must be less than 500 characters').optional(),
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
	stepType: 'Measurement',
	evaluationMethod: '',
	targetValueType: 'range',
	minimumAcceptanceValue: null,
	maximumAcceptanceValue: null,
	multipleMeasurements: false,
	multipleMeasurementMaxCount: null,
	uom: '',
	ctq: false,
	allowAttachments: false,
	notes: ''
};

export const defaultProcessStepGroup: ProcessStepGroupFormData = {
	processName: '',
	processDescription: '',
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
	sequenceId: yup
		.string()
		.required('Sequence ID is required')
		.min(3, 'Sequence ID must be at least 3 characters')
		.max(50, 'Sequence ID must be less than 50 characters')
		.matches(/^[A-Z0-9-]+$/, 'Sequence ID must contain only uppercase letters, numbers, and hyphens'),
	sequenceName: yup
		.string()
		.required('Sequence name is required')
		.min(3, 'Sequence name must be at least 3 characters')
		.max(100, 'Sequence name must be less than 100 characters'),
	category: yup
		.string()
		.required('Category is required')
		.min(2, 'Category must be at least 2 characters')
		.max(50, 'Category must be less than 50 characters'),
	type: yup.string().required('Type is required').oneOf(['Layout', 'ISP'], 'Type must be either Layout or ISP'),
	status: yup.boolean(),
	notes: yup.string().max(500, 'Notes must be less than 500 characters').optional()
});

export const stepGroupsSchema = yup.object({
	processStepGroups: yup.array(processStepGroupSchema)
});
