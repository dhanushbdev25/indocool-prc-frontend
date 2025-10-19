import { z } from 'zod';

// Base schemas for individual entities
export const rawMaterialSchema = z.object({
	id: z.number().optional(),
	partId: z.number().optional(),
	materialName: z.string().min(1, 'Material name is required'),
	materialCode: z.string().min(1, 'Material code is required'),
	quantity: z.string().min(1, 'Quantity is required'),
	uom: z.string().min(1, 'UOM is required'),
	version: z.number().default(1),
	isLatest: z.boolean().default(true),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional()
});

export const bomSchema = z.object({
	id: z.number().optional(),
	partId: z.number().optional(),
	materialType: z.string().min(1, 'Material type is required'),
	description: z.string().min(1, 'Description is required'),
	bomQuantity: z.string().min(1, 'BOM quantity is required'),
	version: z.number().default(1),
	isLatest: z.boolean().default(true),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional()
});

export const drillingSchema = z.object({
	id: z.number().optional(),
	partId: z.number().optional(),
	characteristics: z.string().min(1, 'Characteristics is required'),
	specification: z.string().min(1, 'Specification is required'),
	noOfHoles: z.string().min(1, 'Number of holes is required'),
	diaOfHoles: z.string().min(1, 'Diameter of holes is required'),
	tolerance: z.string().min(1, 'Tolerance is required'),
	version: z.number().default(1),
	isLatest: z.boolean().default(true),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional()
});

export const cuttingSchema = z.object({
	id: z.number().optional(),
	partId: z.number().optional(),
	characteristics: z.string().min(1, 'Characteristics is required'),
	specification: z.string().min(1, 'Specification is required'),
	tolerance: z.string().min(1, 'Tolerance is required'),
	version: z.number().default(1),
	isLatest: z.boolean().default(true),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional()
});

export const partMasterSchema = z.object({
	id: z.number().optional(),
	partNumber: z.string().min(1, 'Part number is required'),
	drawingNumber: z.string().min(1, 'Drawing number is required'),
	drawingRevision: z.number().default(1),
	partRevision: z.number().default(1),
	status: z.enum(['ACTIVE', 'NEW', 'INACTIVE']).default('NEW'),
	customer: z.string().min(1, 'Customer is required'),
	description: z.string().min(1, 'Description is required'),
	notes: z.string().nullable().optional(),
	layupType: z.string().nullable().optional(),
	model: z.string().nullable().optional(),
	version: z.number().default(1),
	isLatest: z.boolean().default(true),
	catalyst: z.number().nullable().optional(),
	prcTemplate: z.number().nullable().optional(),
	createdBy: z.number().nullable().optional(),
	updatedBy: z.number().nullable().optional(),
	createdAt: z.string().nullable().optional(),
	updatedAt: z.string().nullable().optional(),
	customerName: z.string().nullable().optional()
});

// Customer combo schema (new format)
export const customerComboSchema = z.object({
	label: z.string(),
	value: z.string(),
	data: z.record(z.string(), z.unknown()).optional()
});

// Response schemas
export const partDetailSchema = z.object({
	partMaster: partMasterSchema,
	rawMaterials: z.array(rawMaterialSchema),
	bom: z.array(bomSchema),
	drilling: z.array(drillingSchema),
	cutting: z.array(cuttingSchema),
	inspectionDiagrams: z.array(z.any()).optional()
});

export const partsResponseSchema = z.object({
	header: z.object({
		ACTIVE: z.number(),
		NEW: z.number(),
		INACTIVE: z.number()
	}),
	detail: z.array(partDetailSchema)
});

export const partByIdResponseSchema = z.object({
	header: z.object({
		ACTIVE: z.number(),
		NEW: z.number(),
		INACTIVE: z.number()
	}),
	detail: partDetailSchema
});

export const customersResponseSchema = z.object({
	data: z.array(customerComboSchema)
});

// Create/Update response schema (single part object)
export const createPartResponseSchema = z.object({
	message: z.string(),
	data: partMasterSchema
});

export const updatePartResponseSchema = z.object({
	message: z.string(),
	data: partMasterSchema
});

// Request schemas
export const createPartRequestSchema = z.object({
	data: z.object({
		partMaster: partMasterSchema.omit({ id: true, createdAt: true, updatedAt: true, customerName: true }),
		rawMaterials: z.array(rawMaterialSchema.omit({ id: true, partId: true, createdAt: true, updatedAt: true })),
		bom: z.array(bomSchema.omit({ id: true, partId: true, createdAt: true, updatedAt: true })),
		drilling: z.array(drillingSchema.omit({ id: true, partId: true, createdAt: true, updatedAt: true })),
		cutting: z.array(cuttingSchema.omit({ id: true, partId: true, createdAt: true, updatedAt: true }))
	})
});

export const updatePartRequestSchema = z.object({
	id: z.number(),
	data: z.object({
		partMaster: partMasterSchema.omit({ createdAt: true, updatedAt: true, customerName: true }),
		rawMaterials: z.array(rawMaterialSchema.omit({ id: true, partId: true, createdAt: true, updatedAt: true })),
		bom: z.array(bomSchema.omit({ id: true, partId: true, createdAt: true, updatedAt: true })),
		drilling: z.array(drillingSchema.omit({ id: true, partId: true, createdAt: true, updatedAt: true })),
		cutting: z.array(cuttingSchema.omit({ id: true, partId: true, createdAt: true, updatedAt: true }))
	})
});

export const deletePartRequestSchema = z.object({
	partMaster: partMasterSchema.omit({ createdAt: true, updatedAt: true, customerName: true }),
	rawMaterials: z.array(rawMaterialSchema.omit({ id: true, partId: true, createdAt: true, updatedAt: true })),
	bom: z.array(bomSchema.omit({ id: true, partId: true, createdAt: true, updatedAt: true })),
	drilling: z.array(drillingSchema.omit({ id: true, partId: true, createdAt: true, updatedAt: true })),
	cutting: z.array(cuttingSchema.omit({ id: true, partId: true, createdAt: true, updatedAt: true }))
});

// Type exports
export type RawMaterial = z.infer<typeof rawMaterialSchema>;
export type BOM = z.infer<typeof bomSchema>;
export type Drilling = z.infer<typeof drillingSchema>;
export type Cutting = z.infer<typeof cuttingSchema>;
export type PartMaster = z.infer<typeof partMasterSchema>;
export type CustomerCombo = z.infer<typeof customerComboSchema>;
export type PartDetail = z.infer<typeof partDetailSchema>;
export type PartsResponse = z.infer<typeof partsResponseSchema>;
export type PartByIdResponse = z.infer<typeof partByIdResponseSchema>;
export type CustomersResponse = z.infer<typeof customersResponseSchema>;
export type CreatePartResponse = z.infer<typeof createPartResponseSchema>;
export type UpdatePartResponse = z.infer<typeof updatePartResponseSchema>;
export type CreatePartRequest = z.infer<typeof createPartRequestSchema>;
export type UpdatePartRequest = z.infer<typeof updatePartRequestSchema>;
export type DeletePartRequest = z.infer<typeof deletePartRequestSchema>;
