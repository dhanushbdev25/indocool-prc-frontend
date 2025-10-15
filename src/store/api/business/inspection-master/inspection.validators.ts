import { z } from 'zod/v4';

// Column schema for inspection parameters
export const columnSchema = z.object({
	name: z.string(),
	type: z.string(),
	defaultValue: z.union([z.string(), z.number()]).optional(),
	tolerance: z.union([z.string(), z.number()]).optional()
});

// Part image schema
export const partImageSchema = z.object({
	name: z.string(),
	url: z.string().url()
});

// Files schema for inspection parameters
export const filesSchema = z.record(z.string(), z.string()).optional();

// Inspection parameter schema
export const inspectionParameterSchema = z.object({
	id: z.number().optional(),
	inspectionId: z.number().optional(),
	order: z.number(),
	version: z.number().optional(),
	isLatest: z.boolean().optional(),
	parameterName: z.string(),
	specification: z.string().optional(),
	tolerance: z.union([z.string(), z.number()]).optional(),
	type: z.string(),
	files: filesSchema,
	columns: z.array(columnSchema),
	role: z.string(),
	ctq: z.boolean(),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional()
});

// Inspection schema
export const inspectionSchema = z.object({
	id: z.number().optional(),
	inspectionName: z.string(),
	status: z.string(),
	inspectionId: z.string(),
	type: z.string(),
	version: z.number(),
	isLatest: z.boolean(),
	showPartImages: z.boolean().optional(),
	partImages: z.array(partImageSchema).optional(),
	createdBy: z.number().nullable().optional(),
	updatedBy: z.number().nullable().optional(),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional()
});

// Inspection detail schema combining inspection + inspectionParameters
export const inspectionDetailSchema = z.object({
	inspection: inspectionSchema,
	inspectionParameters: z.array(inspectionParameterSchema)
});

// Header schema for counts
export const inspectionHeaderSchema = z.object({
	ACTIVE: z.number(),
	NEW: z.number(),
	INACTIVE: z.number()
});

// List response schema
export const inspectionListResponseSchema = z.object({
	header: inspectionHeaderSchema,
	detail: z.array(inspectionDetailSchema)
});

// Single inspection response schema
export const inspectionByIdResponseSchema = z.object({
	header: inspectionHeaderSchema,
	detail: inspectionDetailSchema
});

// Request schemas for create/update operations
export const columnRequestSchema = z.object({
	name: z.string(),
	type: z.string(),
	defaultValue: z.union([z.string(), z.number()]).optional(),
	tolerance: z.union([z.string(), z.number()]).optional()
});

export const inspectionParameterRequestSchema = z.object({
	order: z.number(),
	parameterName: z.string(),
	specification: z.string().optional(),
	tolerance: z.union([z.string(), z.number()]).optional(),
	type: z.string(),
	files: filesSchema,
	columns: z.array(columnRequestSchema),
	role: z.string(),
	ctq: z.boolean()
});

export const inspectionRequestSchema = z.object({
	inspectionName: z.string(),
	status: z.string(),
	inspectionId: z.string(),
	type: z.string(),
	version: z.number(),
	isLatest: z.boolean(),
	showPartImages: z.boolean().optional(),
	partImages: z.array(partImageSchema).optional(),
	createdBy: z.number().nullable().optional(),
	updatedBy: z.number().nullable().optional()
});

export const inspectionRequestWithIdSchema = z.object({
	id: z.number(),
	inspectionName: z.string(),
	status: z.string(),
	inspectionId: z.string(),
	type: z.string(),
	version: z.number(),
	isLatest: z.boolean(),
	showPartImages: z.boolean().optional(),
	partImages: z.array(partImageSchema).optional(),
	createdBy: z.number().nullable().optional(),
	updatedBy: z.number().nullable().optional()
});

export const createInspectionRequestSchema = z.object({
	inspection: inspectionRequestSchema,
	inspectionParameters: z.array(inspectionParameterRequestSchema)
});

export const updateInspectionRequestSchema = z.object({
	id: z.number(),
	inspection: inspectionRequestWithIdSchema,
	inspectionParameters: z.array(inspectionParameterRequestSchema)
});

// Response schemas for create/update operations
export const inspectionBasicSchema = z.object({
	id: z.number(),
	inspectionName: z.string(),
	status: z.string(),
	inspectionId: z.string(),
	type: z.string(),
	version: z.number(),
	isLatest: z.boolean(),
	showPartImages: z.boolean().optional(),
	partImages: z.array(partImageSchema).optional(),
	createdBy: z.number().nullable().optional(),
	updatedBy: z.number().nullable().optional(),
	createdAt: z.string(),
	updatedAt: z.string()
});

export const createInspectionResponseSchema = z.object({
	message: z.string(),
	data: inspectionBasicSchema
});

export const updateInspectionResponseSchema = z.object({
	message: z.string(),
	data: inspectionBasicSchema
});

// Delete task request schema - sets status to INACTIVE and sends remaining data
export const deleteInspectionTaskRequestSchema = z.object({
	inspection: inspectionRequestWithIdSchema,
	inspectionParameters: z.array(inspectionParameterRequestSchema)
});

// Delete task response schema
export const deleteInspectionTaskResponseSchema = z.object({
	message: z.string(),
	data: inspectionBasicSchema
});

// TypeScript types inferred from Zod schemas
export type Column = z.infer<typeof columnSchema>;
export type PartImage = z.infer<typeof partImageSchema>;
export type Files = z.infer<typeof filesSchema>;
export type InspectionParameter = z.infer<typeof inspectionParameterSchema>;
export type Inspection = z.infer<typeof inspectionSchema>;
export type InspectionDetail = z.infer<typeof inspectionDetailSchema>;
export type InspectionHeader = z.infer<typeof inspectionHeaderSchema>;
export type InspectionListResponse = z.infer<typeof inspectionListResponseSchema>;
export type InspectionByIdResponse = z.infer<typeof inspectionByIdResponseSchema>;

// Request types
export type ColumnRequest = z.infer<typeof columnRequestSchema>;
export type InspectionParameterRequest = z.infer<typeof inspectionParameterRequestSchema>;
export type InspectionRequest = z.infer<typeof inspectionRequestSchema>;
export type InspectionRequestWithId = z.infer<typeof inspectionRequestWithIdSchema>;
export type CreateInspectionRequest = z.infer<typeof createInspectionRequestSchema>;
export type UpdateInspectionRequest = z.infer<typeof updateInspectionRequestSchema>;

// Response types
export type InspectionBasic = z.infer<typeof inspectionBasicSchema>;
export type CreateInspectionResponse = z.infer<typeof createInspectionResponseSchema>;
export type UpdateInspectionResponse = z.infer<typeof updateInspectionResponseSchema>;

// Delete task types
export type DeleteInspectionTaskRequest = z.infer<typeof deleteInspectionTaskRequestSchema>;
export type DeleteInspectionTaskResponse = z.infer<typeof deleteInspectionTaskResponseSchema>;
