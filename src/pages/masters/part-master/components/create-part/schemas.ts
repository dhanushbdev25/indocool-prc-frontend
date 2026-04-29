import * as yup from 'yup';

// Raw Material validation schema
export const rawMaterialFormSchema = yup.object({
	id: yup.mixed().optional(),
	materialName: yup.string().required('Material name is required'),
	materialCode: yup.string().required('Material code is required'),
	materialGroup: yup.string().max(100).optional().default(''),
	quantity: yup.string().required('Quantity is required'),
	uom: yup.string().required('UOM is required'),
	batching: yup.boolean().default(false),
	splitting: yup.boolean().default(false),
	splittingConfiguration: yup
		.array(
			yup.object({
				order: yup.number().required(),
				splitQuantity: yup
					.mixed()
					.test('is-string-or-number', 'Split quantity must be a string or number', function (value) {
						return typeof value === 'string' || typeof value === 'number';
					})
					.transform(value => String(value))
			})
		)
		.nullable()
		.optional(),
	version: yup.number().default(1),
	isLatest: yup.boolean().default(true)
});

// Drilling validation schema
export const drillingFormSchema = yup.object({
	id: yup.mixed().optional(),
	characteristics: yup.string().required('Characteristics is required'),
	specification: yup.string().required('Specification is required'),
	noOfHoles: yup.string().required('Number of holes is required'),
	diaOfHoles: yup.string().required('Diameter of holes is required'),
	tolerance: yup.string().required('Tolerance is required'),
	version: yup.number().default(1),
	isLatest: yup.boolean().default(true)
});

// Cutting validation schema
export const cuttingFormSchema = yup.object({
	id: yup.mixed().optional(),
	characteristics: yup.string().required('Characteristics is required'),
	specification: yup.string().required('Specification is required'),
	tolerance: yup.string().required('Tolerance is required'),
	version: yup.number().default(1),
	isLatest: yup.boolean().default(true)
});

// Part drawing validation schema
export const partDrawingSchema = yup.object({
	fileName: yup.string().optional(),
	filePath: yup.string().optional(),
	originalFileName: yup.string().optional()
});

const inspectionDiagramFileEntrySchema = yup.object({
	fileName: yup.string().optional(),
	filePath: yup.string().optional(),
	originalFileName: yup.string().optional()
});

const inspectionDiagramRowMappingSchema = yup.object({
	rowIndex: yup.number().required(),
	fileName: yup.array(inspectionDiagramFileEntrySchema).optional()
});

// Inspection image mapping validation schema
export const inspectionDiagramSchema = yup.object({
	partId: yup.number().optional(),
	files: yup
		.array(
			yup.object({
				inspectionParameterId: yup.number().optional(),
				fileName: yup.array(inspectionDiagramFileEntrySchema).optional(),
				rowMappings: yup.array(inspectionDiagramRowMappingSchema).optional()
			})
		)
		.nullable()
		.default([])
});

export const mouldSchema = yup.object({
	mouldCode: yup.string().required('Mould code is required'),
	reconciliationCount: yup
		.number()
		.typeError('Reconciliation count must be a number')
		.min(1, 'Reconciliation count must be at least 1')
		.required('Reconciliation count is required'),
	currentCount: yup.number().default(0)
});

// PRC Template Step schema (inline within part master)
export const prcTemplateStepFormSchema = yup.object({
	id: yup.number().optional(),
	version: yup.number().default(1),
	isLatest: yup.boolean().default(true),
	sequence: yup.number().required('Sequence number is required').min(1, 'Sequence must be at least 1'),
	stepId: yup.number().required('Step ID is required'),
	type: yup
		.string()
		.required('Step type is required')
		.oneOf(['sequence', 'inspection'], 'Type must be either sequence or inspection'),
	blockCatalystMixing: yup.boolean().default(false),
	requestSupervisorApproval: yup.boolean().default(false),
	group: yup.string().required('Operation group is required'),
	createdAt: yup.string().optional(),
	updatedAt: yup.string().optional()
});

/** Empty field in UI → undefined; no default 0/1 until user enters a value */
const optionalNonNegSkillInt = () =>
	yup
		.mixed<number | undefined>()
		.transform((val: unknown) => {
			if (val === '' || val === null || val === undefined) return undefined;
			if (typeof val === 'string' && val.trim() === '') return undefined;
			const n = Number(val);
			return Number.isFinite(n) ? n : undefined;
		})
		.test('nonneg-int', 'Must be a non-negative whole number', val => {
			if (val === undefined) return true;
			return typeof val === 'number' && Number.isInteger(val) && val >= 0;
		});

export const operationWiseRowFormSchema = yup
	.object({
		id: yup.mixed<string | number>().required(),
		operationID: yup.number().required(),
		operationName: yup.string().required(),
		l1Count: optionalNonNegSkillInt(),
		l2Count: optionalNonNegSkillInt(),
		l3Count: optionalNonNegSkillInt(),
		l4Count: optionalNonNegSkillInt()
	})
	.test('skill-sum', 'At least one member is required across L1–L4', function (row) {
		if (!row) return false;
		const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
		return n(row.l1Count) + n(row.l2Count) + n(row.l3Count) + n(row.l4Count) >= 1;
	});

// Main form validation schema
export const partMasterFormSchema = yup.object({
	id: yup.number().optional(),
	partNumber: yup
		.string()
		.required('Part number is required')
		.min(3, 'Part number must be at least 3 characters')
		.max(50, 'Part number must be less than 50 characters')
		.matches(/^[A-Z0-9-]+$/, 'Part number must contain only uppercase letters, numbers, and hyphens'),
	drawingNumber: yup
		.string()
		.required('Drawing number is required')
		.min(3, 'Drawing number must be at least 3 characters')
		.max(50, 'Drawing number must be less than 50 characters'),
	drawingRevision: yup.number().default(1),
	partRevision: yup.number().default(1),
	isActive: yup.boolean().default(true),
	customer: yup.string().required('Customer is required'),
	customerVariantId: yup.number().nullable().optional(),
	description: yup
		.string()
		.required('Description is required')
		.min(3, 'Description must be at least 3 characters')
		.max(200, 'Description must be less than 200 characters'),
	notes: yup.string().max(500, 'Notes must be less than 500 characters').optional(),
	layupType: yup.string().max(100, 'Layup type must be less than 100 characters').optional(),
	model: yup.string().max(100, 'Model must be less than 100 characters').optional(),
	sapReferenceNumber: yup.string().max(50, 'SAP reference number must be less than 50 characters').optional(),
	version: yup.number().default(1),
	isLatest: yup.boolean().default(true),
	catalyst: yup.number().optional(),
	prcTemplate: yup.number().optional(),
	// Inline PRC template fields
	templateId: yup
		.string()
		.optional()
		.max(50, 'Template ID must be less than 50 characters'),
	templateName: yup
		.string()
		.optional()
		.max(100, 'Template name must be less than 100 characters'),
	templateNotes: yup.string().max(500, 'Template notes must be less than 500 characters').optional(),
	isTemplateActive: yup.boolean().default(true),
	templateVersion: yup.number().default(1),
	templateIsLatest: yup.boolean().default(true),
	prcTemplateSteps: yup.array(prcTemplateStepFormSchema).default([]),
	rawMaterials: yup.array(rawMaterialFormSchema).default([]),
	drilling: yup.array(drillingFormSchema).default([]),
	cutting: yup.array(cuttingFormSchema).default([]),
	moulds: yup.array(mouldSchema).default([]),
	operationWiseData: yup.array(operationWiseRowFormSchema).default([]),
	/** Synced from Linked Masters: operation group ids included in the template (for member count scope) */
	operationGroupIdsForHeadcount: yup.array(yup.string()).default([]),
	files: yup.array(partDrawingSchema).default([]),
	inspectionDiagrams: inspectionDiagramSchema.optional(),
	createdAt: yup.string().optional(),
	updatedAt: yup.string().optional()
});

// Type definitions
export type RawMaterialFormData = yup.InferType<typeof rawMaterialFormSchema>;
export type DrillingFormData = yup.InferType<typeof drillingFormSchema>;
export type CuttingFormData = yup.InferType<typeof cuttingFormSchema>;
export type PartDrawingFormData = yup.InferType<typeof partDrawingSchema>;
export type InspectionDiagramFormData = yup.InferType<typeof inspectionDiagramSchema>;
export type MouldFormData = yup.InferType<typeof mouldSchema>;
export type PrcTemplateStepFormData = yup.InferType<typeof prcTemplateStepFormSchema>;
export type PartMasterFormData = yup.InferType<typeof partMasterFormSchema>;

// Default values
export const defaultRawMaterial: RawMaterialFormData = {
	materialName: '',
	materialCode: '',
	materialGroup: '',
	quantity: '',
	uom: '',
	batching: false,
	splitting: false,
	splittingConfiguration: null,
	version: 1,
	isLatest: true
};

export const defaultDrilling: DrillingFormData = {
	characteristics: '',
	specification: '',
	noOfHoles: '',
	diaOfHoles: '',
	tolerance: '',
	version: 1,
	isLatest: true
};

export const defaultCutting: CuttingFormData = {
	characteristics: '',
	specification: '',
	tolerance: '',
	version: 1,
	isLatest: true
};

export const defaultPartDrawing: PartDrawingFormData = {
	fileName: '',
	filePath: ''
};

export const defaultInspectionDiagram: InspectionDiagramFormData = {
	partId: 0,
	files: []
};

export const defaultPartMasterFormData: PartMasterFormData = {
	partNumber: '',
	drawingNumber: '',
	drawingRevision: 1,
	partRevision: 1,
	isActive: true,
	customer: '',
	customerVariantId: undefined,
	description: '',
	notes: '',
	layupType: '',
	model: '',
	sapReferenceNumber: '',
	version: 1,
	isLatest: true,
	catalyst: undefined,
	prcTemplate: undefined,
	templateId: '',
	templateName: '',
	templateNotes: '',
	isTemplateActive: true,
	templateVersion: 1,
	templateIsLatest: true,
	prcTemplateSteps: [],
	rawMaterials: [],
	drilling: [],
	cutting: [],
	moulds: [],
	operationWiseData: [],
	operationGroupIdsForHeadcount: [],
	files: [],
	inspectionDiagrams: undefined
};

// Section-specific validation schemas
export const generalInfoSchema = yup.object({
	partNumber: yup
		.string()
		.required('Part number is required')
		.min(3, 'Part number must be at least 3 characters')
		.max(50, 'Part number must be less than 50 characters')
		.matches(/^[A-Z0-9-]+$/, 'Part number must contain only uppercase letters, numbers, and hyphens'),
	drawingNumber: yup
		.string()
		.required('Drawing number is required')
		.min(3, 'Drawing number must be at least 3 characters')
		.max(50, 'Drawing number must be less than 50 characters'),
	isActive: yup.boolean().default(true),
	customer: yup.string().required('Customer is required'),
	customerVariantId: yup.number().nullable().optional(),
	description: yup
		.string()
		.required('Description is required')
		.min(3, 'Description must be at least 3 characters')
		.max(200, 'Description must be less than 200 characters'),
	notes: yup.string().max(500, 'Notes must be less than 500 characters').optional(),
	layupType: yup.string().max(100, 'Layup type must be less than 100 characters').optional(),
	model: yup.string().max(100, 'Model must be less than 100 characters').optional(),
	sapReferenceNumber: yup.string().max(50, 'SAP reference number must be less than 50 characters').optional(),
	moulds: yup.array(mouldSchema).default([])
});

export const rawMaterialsSchema = yup.object({
	rawMaterials: yup.array(rawMaterialFormSchema)
});

export const technicalDataSchema = yup.object({
	drilling: yup.array(drillingFormSchema),
	cutting: yup.array(cuttingFormSchema)
});

export const linkedMastersSchema = yup.object({
	catalyst: yup.number().optional(),
	prcTemplate: yup.number().optional(),
	templateId: yup.string().optional(),
	templateName: yup.string().optional(),
	templateVersion: yup.number().default(1),
	templateIsLatest: yup.boolean().default(true),
	prcTemplateSteps: yup.array(prcTemplateStepFormSchema).default([])
});
