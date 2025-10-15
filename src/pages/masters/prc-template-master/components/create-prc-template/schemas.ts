import * as yup from 'yup';

// PRC Template Step validation schema
export const prcTemplateStepSchema = yup.object({
	id: yup.number().optional(),
	version: yup.number().required('Version is required'),
	isLatest: yup.boolean().required('Is latest flag is required'),
	sequence: yup.number().required('Sequence number is required').min(1, 'Sequence must be at least 1'),
	stepId: yup.number().required('Step ID is required'),
	type: yup
		.string()
		.required('Step type is required')
		.oneOf(['sequence', 'inspection'], 'Type must be either sequence or inspection'),
	blockCatalystMixing: yup.boolean().default(false),
	requestSupervisorApproval: yup.boolean().default(false),
	createdAt: yup.string().optional(),
	updatedAt: yup.string().optional()
});

// Main form validation schema
export const prcTemplateFormSchema = yup.object({
	id: yup.number().optional(),
	templateId: yup
		.string()
		.required('Template ID is required')
		.min(3, 'Template ID must be at least 3 characters')
		.max(50, 'Template ID must be less than 50 characters')
		.matches(/^[A-Z0-9-]+$/, 'Template ID must contain only uppercase letters, numbers, and hyphens'),
	templateName: yup
		.string()
		.required('Template name is required')
		.min(3, 'Template name must be at least 3 characters')
		.max(100, 'Template name must be less than 100 characters'),
	notes: yup.string().max(500, 'Notes must be less than 500 characters').optional(),
	version: yup.number().required('Version is required').min(1, 'Version must be at least 1'),
	isLatest: yup.boolean().default(true),
	isActive: yup.boolean().default(true),
	prcTemplateSteps: yup
		.array(prcTemplateStepSchema)
		.min(1, 'At least one step is required')
		.test('unique-sequence', 'Step sequence numbers must be unique', function (steps) {
			if (!steps) return true;
			const sequences = steps.map(step => step.sequence);
			const uniqueSequences = new Set(sequences);
			return sequences.length === uniqueSequences.size;
		}),
	createdAt: yup.string().optional(),
	updatedAt: yup.string().optional()
});

// Type definitions
export type PrcTemplateStepFormData = yup.InferType<typeof prcTemplateStepSchema>;
export type PrcTemplateFormData = yup.InferType<typeof prcTemplateFormSchema>;

// Default values
export const defaultPrcTemplateStep: PrcTemplateStepFormData = {
	version: 1,
	isLatest: true,
	sequence: 1,
	stepId: 0,
	type: 'sequence',
	blockCatalystMixing: false,
	requestSupervisorApproval: false
};

export const defaultPrcTemplateFormData: PrcTemplateFormData = {
	templateId: '',
	templateName: '',
	notes: '',
	version: 1,
	isLatest: true,
	isActive: true,
	prcTemplateSteps: []
};

// Section-specific validation schemas
export const basicInfoSchema = yup.object({
	templateId: yup
		.string()
		.required('Template ID is required')
		.min(3, 'Template ID must be at least 3 characters')
		.max(50, 'Template ID must be less than 50 characters')
		.matches(/^[A-Z0-9-]+$/, 'Template ID must contain only uppercase letters, numbers, and hyphens'),
	templateName: yup
		.string()
		.required('Template name is required')
		.min(3, 'Template name must be at least 3 characters')
		.max(100, 'Template name must be less than 100 characters'),
	notes: yup.string().max(500, 'Notes must be less than 500 characters').optional(),
	isActive: yup.boolean()
});

export const templateStepsSchema = yup.object({
	prcTemplateSteps: yup
		.array(prcTemplateStepSchema)
		.min(1, 'At least one step is required')
		.test('unique-sequence', 'Step sequence numbers must be unique', function (steps) {
			if (!steps) return true;
			const sequences = steps.map(step => step.sequence);
			const uniqueSequences = new Set(sequences);
			return sequences.length === uniqueSequences.size;
		})
});
