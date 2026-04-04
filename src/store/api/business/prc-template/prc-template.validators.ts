import { z } from 'zod/v4';

// PRC Template Step schema
export const prcTemplateStepSchema = z
	.object({
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
		group: z.string().optional(),
		operationText: z.string().optional(),
		createdAt: z.string().optional(),
		updatedAt: z.string().optional(),
		data: z.any().optional() // Add data field to handle inspection parameters
	})
	.loose();

// PRC Template schema
export const prcTemplateSchema = z
	.object({
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
	})
	.loose();

// PRC Template detail schema combining template + steps
export const prcTemplateDetailSchema = z
	.object({
		prcTemplate: prcTemplateSchema,
		prcTemplateSteps: z.array(prcTemplateStepSchema)
	})
	.loose();

// Header schema for counts
export const prcTemplateHeaderSchema = z
	.object({
		ACTIVE: z.number(),
		NEW: z.number(),
		INACTIVE: z.number()
	})
	.loose();

// List response schema
export const prcTemplateListResponseSchema = z
	.object({
		header: prcTemplateHeaderSchema,
		detail: z.array(prcTemplateDetailSchema)
	})
	.loose();

// Single template response schema
export const prcTemplateByIdResponseSchema = z
	.object({
		header: prcTemplateHeaderSchema,
		detail: prcTemplateDetailSchema
	})
	.loose();

// PRC Template inspections response schema (without header)
export const prcTemplateInspectionsResponseSchema = z
	.object({
		detail: prcTemplateDetailSchema
	})
	.loose();

// Request schemas for create/update operations
export const prcTemplateStepRequestSchema = z.object({
	version: z.number(),
	isLatest: z.boolean(),
	sequence: z.number(),
	stepId: z.number().nullable(),
	type: z.string(),
	blockCatalystMixing: z.boolean().optional(),
	requestSupervisorApproval: z.boolean().optional(),
	/** Operation group code from operations combo (e.g. "40") */
	group: z.string().optional(),
	/** Human-readable operation label (optional, when available) */
	operationText: z.string().optional()
});

/** Step payload nested under operations (no group — parent carries operation) */
export const prcTemplateNestedStepRequestSchema = z.object({
	version: z.number(),
	isLatest: z.boolean(),
	sequence: z.number(),
	stepId: z.number().nullable(),
	type: z.string(),
	blockCatalystMixing: z.boolean().optional(),
	requestSupervisorApproval: z.boolean().optional()
});

/** One operation group with sequences and inspections (Part Master create flow) */
export const prcTemplateOperationRequestSchema = z.object({
	operation: z.string(),
	operationText: z.string().optional(),
	sequences: z.array(prcTemplateNestedStepRequestSchema),
	inspections: z.array(prcTemplateNestedStepRequestSchema)
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

// Create request: legacy flat `prcTemplateSteps` OR nested `operations` (XOR)
export const createPrcTemplateRequestSchema = z
	.object({
		prcTemplate: prcTemplateRequestSchema,
		prcTemplateSteps: z.array(prcTemplateStepRequestSchema).optional(),
		operations: z.array(prcTemplateOperationRequestSchema).optional()
	})
	.refine(
		data => {
			const hasSteps = (data.prcTemplateSteps?.length ?? 0) > 0;
			const hasOps = (data.operations?.length ?? 0) > 0;
			return (hasSteps && !hasOps) || (!hasSteps && hasOps);
		},
		{ message: 'Provide exactly one of prcTemplateSteps or operations' }
	);

// Update request schema
export const updatePrcTemplateRequestSchema = z.object({
	id: z.number(),
	prcTemplate: prcTemplateRequestSchema,
	prcTemplateSteps: z.array(prcTemplateStepRequestSchema)
});

// Delete request schema (for setting status to INACTIVE)
export const deletePrcTemplateTaskRequestSchema = z.object({
	prcTemplate: prcTemplateRequestSchema.extend({
		id: z.number()
	}),
	prcTemplateSteps: z.array(prcTemplateStepRequestSchema)
});

// Response schemas
// Create response might return just the template without steps, or even simpler structure
export const createPrcTemplateResponseSchema = z
	.object({
		message: z.string(),
		data: z
			.union([
				prcTemplateDetailSchema, // Full detail with steps
				prcTemplateSchema, // Just the template
				z.object({}).loose() // Empty object if API doesn't return data
			])
			.optional() // Data might be optional
	})
	.loose();

export const updatePrcTemplateResponseSchema = z
	.object({
		message: z.string(),
		data: z
			.union([
				prcTemplateDetailSchema, // Full detail with steps
				prcTemplateSchema, // Just the template
				z.object({}).loose() // Empty object if API doesn't return data
			])
			.optional() // Data might be optional
	})
	.loose();

export const deletePrcTemplateTaskResponseSchema = z
	.object({
		message: z.string(),
		data: z
			.union([
				prcTemplateDetailSchema, // Full detail with steps
				prcTemplateSchema, // Just the template
				z.object({}).loose() // Empty object if API doesn't return data
			])
			.optional() // Data might be optional
	})
	.loose();

// Operations combo schemas
export const operationsComboItemSchema = z
	.object({
		label: z.string(),
		value: z.string(),
		data: z
			.object({
				operation: z.string(),
				operationText: z.string()
			})
			.loose()
	})
	.loose();

export const operationsComboResponseSchema = z
	.object({
		data: z.array(operationsComboItemSchema)
	})
	.loose();

// Type exports
export type OperationsComboItem = z.infer<typeof operationsComboItemSchema>;
export type OperationsComboResponse = z.infer<typeof operationsComboResponseSchema>;
export type PrcTemplateStep = z.infer<typeof prcTemplateStepSchema>;
export type PrcTemplate = z.infer<typeof prcTemplateSchema>;
export type PrcTemplateDetail = z.infer<typeof prcTemplateDetailSchema>;
export type PrcTemplateHeader = z.infer<typeof prcTemplateHeaderSchema>;
export type PrcTemplateListResponse = z.infer<typeof prcTemplateListResponseSchema>;
export type PrcTemplateByIdResponse = z.infer<typeof prcTemplateByIdResponseSchema>;
export type PrcTemplateInspectionsResponse = z.infer<typeof prcTemplateInspectionsResponseSchema>;
export type PrcTemplateStepRequest = z.infer<typeof prcTemplateStepRequestSchema>;
export type PrcTemplateNestedStepRequest = z.infer<typeof prcTemplateNestedStepRequestSchema>;
export type PrcTemplateOperationRequest = z.infer<typeof prcTemplateOperationRequestSchema>;
export type PrcTemplateRequest = z.infer<typeof prcTemplateRequestSchema>;
export type CreatePrcTemplateRequest = z.infer<typeof createPrcTemplateRequestSchema>;
export type UpdatePrcTemplateRequest = z.infer<typeof updatePrcTemplateRequestSchema>;
export type DeletePrcTemplateTaskRequest = z.infer<typeof deletePrcTemplateTaskRequestSchema>;
export type CreatePrcTemplateResponse = z.infer<typeof createPrcTemplateResponseSchema>;
export type UpdatePrcTemplateResponse = z.infer<typeof updatePrcTemplateResponseSchema>;
export type DeletePrcTemplateTaskResponse = z.infer<typeof deletePrcTemplateTaskResponseSchema>;
