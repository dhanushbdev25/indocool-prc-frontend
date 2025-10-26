import * as yup from 'yup';

// Raw Material validation schema
export const rawMaterialFormSchema = yup.object({
	id: yup.mixed().optional(), // Allow both numbers and strings (UUIDs)
	materialName: yup.string().required('Material name is required'),
	materialCode: yup.string().required('Material code is required'),
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
	id: yup.mixed().optional(), // Allow both numbers and strings (UUIDs)
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
	id: yup.mixed().optional(), // Allow both numbers and strings (UUIDs)
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

// Inspection image mapping validation schema
export const inspectionDiagramSchema = yup.object({
	partId: yup.number().optional(),
	files: yup
		.array(
			yup.object({
				inspectionParameterId: yup.number().optional(),
				fileName: yup
					.array(
						yup.object({
							fileName: yup.string().optional(),
							filePath: yup.string().optional(),
							originalFileName: yup.string().optional()
						})
					)
					.optional()
			})
		)
		.nullable()
		.default([])
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
	rawMaterials: yup.array(rawMaterialFormSchema).default([]),
	drilling: yup.array(drillingFormSchema).default([]),
	cutting: yup.array(cuttingFormSchema).default([]),
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
export type PartMasterFormData = yup.InferType<typeof partMasterFormSchema>;

// Default values
export const defaultRawMaterial: RawMaterialFormData = {
	materialName: '',
	materialCode: '',
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
	description: '',
	notes: '',
	layupType: '',
	model: '',
	sapReferenceNumber: '',
	version: 1,
	isLatest: true,
	catalyst: undefined,
	prcTemplate: undefined,
	rawMaterials: [],
	drilling: [],
	cutting: [],
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
	description: yup
		.string()
		.required('Description is required')
		.min(3, 'Description must be at least 3 characters')
		.max(200, 'Description must be less than 200 characters'),
	notes: yup.string().max(500, 'Notes must be less than 500 characters').optional(),
	layupType: yup.string().max(100, 'Layup type must be less than 100 characters').optional(),
	model: yup.string().max(100, 'Model must be less than 100 characters').optional(),
	sapReferenceNumber: yup.string().max(50, 'SAP reference number must be less than 50 characters').optional()
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
	prcTemplate: yup.number().optional()
});
