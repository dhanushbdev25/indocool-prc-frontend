import { z } from 'zod/v4';

// PRC Template Step schema
export const prcTemplateStepSchema = z.object({
	id: z.number().optional(),
	templateId: z.number().optional(),
	version: z.number(),
	isLatest: z.boolean(),
	sequence: z.number(),
	sequenceId: z.number().nullable().optional(),
	inspectionId: z.number().nullable().optional(),
	type: z.string(),
	blockCatalystMixing: z.boolean(),
	requestSupervisorApproval: z.boolean(),
	stepId: z.number().nullable(),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional()
});

// PRC Template schema
export const prcTemplateSchema = z.object({
	id: z.number().optional(),
	status: z.string(),
	templateId: z.string(),
	templateName: z.string(),
	notes: z.string().optional(),
	version: z.number(),
	isLatest: z.boolean(),
	isActive: z.boolean(),
	createdBy: z.number().nullable().optional(),
	updatedBy: z.number().nullable().optional(),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional()
});

// PRC Template detail schema combining template + steps
export const prcTemplateDetailSchema = z.object({
	prcTemplate: prcTemplateSchema,
	prcTemplateSteps: z.array(prcTemplateStepSchema)
});

// Header schema for counts
export const prcTemplateHeaderSchema = z.object({
	ACTIVE: z.number(),
	NEW: z.number(),
	INACTIVE: z.number()
});

// List response schema
export const prcTemplateListResponseSchema = z.object({
	header: prcTemplateHeaderSchema,
	detail: z.array(prcTemplateDetailSchema)
});

// Single template response schema
export const prcTemplateByIdResponseSchema = z.object({
	header: prcTemplateHeaderSchema,
	detail: prcTemplateDetailSchema
});

// Request schemas for create/update operations
export const prcTemplateStepRequestSchema = z.object({
	version: z.number(),
	isLatest: z.boolean(),
	sequence: z.number(),
	stepId: z.number().nullable(),
	type: z.string(),
	blockCatalystMixing: z.boolean().optional(),
	requestSupervisorApproval: z.boolean().optional()
});

export const prcTemplateRequestSchema = z.object({
	status: z.string(),
	templateId: z.string(),
	templateName: z.string(),
	notes: z.string().optional(),
	version: z.number(),
	isLatest: z.boolean(),
	isActive: z.boolean()
});

// Create request schema
export const createPrcTemplateRequestSchema = z.object({
	prcTemplate: prcTemplateRequestSchema,
	prcTemplateSteps: z.array(prcTemplateStepRequestSchema)
});

// Update request schema
export const updatePrcTemplateRequestSchema = z.object({
	id: z.number(),
	prcTemplate: prcTemplateRequestSchema,
	prcTemplateSteps: z.array(prcTemplateStepRequestSchema)
});

// Delete request schema (for setting status to INACTIVE)
export const deletePrcTemplateTaskRequestSchema = z.object({
	prcTemplate: prcTemplateRequestSchema,
	prcTemplateSteps: z.array(prcTemplateStepRequestSchema)
});

// Response schemas
// Create response might return just the template without steps, or even simpler structure
export const createPrcTemplateResponseSchema = z.object({
	message: z.string(),
	data: z
		.union([
			prcTemplateDetailSchema, // Full detail with steps
			prcTemplateSchema, // Just the template
			z.object({}) // Empty object if API doesn't return data
		])
		.optional() // Data might be optional
});

export const updatePrcTemplateResponseSchema = z.object({
	message: z.string(),
	data: z
		.union([
			prcTemplateDetailSchema, // Full detail with steps
			prcTemplateSchema, // Just the template
			z.object({}) // Empty object if API doesn't return data
		])
		.optional() // Data might be optional
});

export const deletePrcTemplateTaskResponseSchema = z.object({
	message: z.string(),
	data: z
		.union([
			prcTemplateDetailSchema, // Full detail with steps
			prcTemplateSchema, // Just the template
			z.object({}) // Empty object if API doesn't return data
		])
		.optional() // Data might be optional
});

// Type exports
export type PrcTemplateStep = z.infer<typeof prcTemplateStepSchema>;
export type PrcTemplate = z.infer<typeof prcTemplateSchema>;
export type PrcTemplateDetail = z.infer<typeof prcTemplateDetailSchema>;
export type PrcTemplateHeader = z.infer<typeof prcTemplateHeaderSchema>;
export type PrcTemplateListResponse = z.infer<typeof prcTemplateListResponseSchema>;
export type PrcTemplateByIdResponse = z.infer<typeof prcTemplateByIdResponseSchema>;
export type PrcTemplateStepRequest = z.infer<typeof prcTemplateStepRequestSchema>;
export type PrcTemplateRequest = z.infer<typeof prcTemplateRequestSchema>;
export type CreatePrcTemplateRequest = z.infer<typeof createPrcTemplateRequestSchema>;
export type UpdatePrcTemplateRequest = z.infer<typeof updatePrcTemplateRequestSchema>;
export type DeletePrcTemplateTaskRequest = z.infer<typeof deletePrcTemplateTaskRequestSchema>;
export type CreatePrcTemplateResponse = z.infer<typeof createPrcTemplateResponseSchema>;
export type UpdatePrcTemplateResponse = z.infer<typeof updatePrcTemplateResponseSchema>;
export type DeletePrcTemplateTaskResponse = z.infer<typeof deletePrcTemplateTaskResponseSchema>;
