import { z } from 'zod/v4';

// Zod schemas for sequence response validation
export const processStepSchema = z.object({
	id: z.number(),
	processStepGroupId: z.number(),
	version: z.number(),
	isLatest: z.boolean(),
	parameterDescription: z.string(),
	stepNumber: z.number(),
	stepType: z.string(),
	evaluationMethod: z.string(),
	targetValueType: z.string(),
	minimumAcceptanceValue: z.string().nullable(),
	maximumAcceptanceValue: z.string().nullable(),
	multipleMeasurements: z.boolean(),
	multipleMeasurementMaxCount: z.number().nullable(),
	uom: z.string().optional(),
	ctq: z.boolean(),
	allowAttachments: z.boolean(),
	notes: z.string(),
	createdAt: z.string(),
	updatedAt: z.string()
});

export const processStepGroupSchema = z.object({
	id: z.number(),
	processSequenceId: z.number(),
	version: z.number(),
	isLatest: z.boolean(),
	processName: z.string(),
	processDescription: z.string(),
	sequenceTiming: z.number(),
	createdAt: z.string(),
	updatedAt: z.string(),
	steps: z.array(processStepSchema)
});

export const processSequenceSchema = z.object({
	id: z.number(),
	status: z.string(),
	sequenceId: z.string(),
	sequenceName: z.string(),
	version: z.number(),
	isLatest: z.boolean(),
	category: z.string(),
	type: z.string(),
	notes: z.string(),
	totalSteps: z.number(),
	ctqSteps: z.number(),
	createdAt: z.string(),
	updatedAt: z.string(),
	stepGroups: z.array(processStepGroupSchema)
});

export const sequenceHeaderSchema = z.object({
	ACTIVE: z.number(),
	INACTIVE: z.number()
});

export const sequenceListResponseSchema = z.object({
	header: sequenceHeaderSchema,
	detail: z.array(processSequenceSchema)
});

// Schema for single sequence response (has header and detail structure)
export const sequenceByIdResponseSchema = z.object({
	header: sequenceHeaderSchema,
	detail: processSequenceSchema
});

// Request schemas for create/update operations
export const processStepRequestSchema = z.object({
	parameterDescription: z.string(),
	stepNumber: z.number(),
	stepType: z.string(),
	evaluationMethod: z.string(),
	targetValueType: z.string(),
	minimumAcceptanceValue: z.number().nullable(),
	maximumAcceptanceValue: z.number().nullable(),
	multipleMeasurements: z.boolean(),
	multipleMeasurementMaxCount: z.number().nullable(),
	uom: z.string().optional(),
	ctq: z.boolean(),
	allowAttachments: z.boolean(),
	notes: z.string()
});

export const processStepGroupRequestSchema = z.object({
	processName: z.string(),
	processDescription: z.string(),
	sequenceTiming: z.number(),
	processSteps: z.array(processStepRequestSchema)
});

export const processSequenceRequestSchema = z.object({
	status: z.string(),
	sequenceId: z.string(),
	sequenceName: z.string(),
	version: z.number(),
	isLatest: z.boolean(),
	category: z.string(),
	type: z.string(),
	notes: z.string(),
	totalSteps: z.number(),
	ctqSteps: z.number()
});

export const createSequenceRequestSchema = z.object({
	data: z.object({
		processSequence: processSequenceRequestSchema,
		processStepGroups: z.array(processStepGroupRequestSchema)
	})
});

export const updateSequenceRequestSchema = z.object({
	id: z.number(),
	data: z.object({
		processSequence: processSequenceRequestSchema,
		processStepGroups: z.array(processStepGroupRequestSchema)
	})
});

// Response schemas for create/update operations
// Create response doesn't include stepGroups, only basic sequence info
export const processSequenceBasicSchema = z.object({
	id: z.number(),
	status: z.string(),
	sequenceId: z.string(),
	sequenceName: z.string(),
	version: z.number(),
	isLatest: z.boolean(),
	category: z.string(),
	type: z.string(),
	notes: z.string(),
	totalSteps: z.number(),
	ctqSteps: z.number(),
	createdAt: z.string(),
	updatedAt: z.string()
});

export const createSequenceResponseSchema = z.object({
	message: z.string(),
	data: processSequenceBasicSchema
});

export const updateSequenceResponseSchema = z.object({
	message: z.string(),
	data: processSequenceBasicSchema
});

// Delete task request schema - sets status to INACTIVE and sends remaining data
export const deleteSequenceTaskRequestSchema = z.object({
	id: z.number(),
	data: z.object({
		processSequence: processSequenceRequestSchema,
		processStepGroups: z.array(processStepGroupRequestSchema)
	})
});

// Delete task response schema
export const deleteSequenceTaskResponseSchema = z.object({
	message: z.string(),
	data: processSequenceBasicSchema
});

// TypeScript types inferred from Zod schemas
export type ProcessStep = z.infer<typeof processStepSchema>;
export type ProcessStepGroup = z.infer<typeof processStepGroupSchema>;
export type ProcessSequence = z.infer<typeof processSequenceSchema>;
export type ProcessSequenceBasic = z.infer<typeof processSequenceBasicSchema>;
export type SequenceHeader = z.infer<typeof sequenceHeaderSchema>;
export type SequenceListResponse = z.infer<typeof sequenceListResponseSchema>;
export type SequenceByIdResponse = z.infer<typeof sequenceByIdResponseSchema>;

// Request types
export type ProcessStepRequest = z.infer<typeof processStepRequestSchema>;
export type ProcessStepGroupRequest = z.infer<typeof processStepGroupRequestSchema>;
export type ProcessSequenceRequest = z.infer<typeof processSequenceRequestSchema>;
export type CreateSequenceRequest = z.infer<typeof createSequenceRequestSchema>;
export type UpdateSequenceRequest = z.infer<typeof updateSequenceRequestSchema>;

// Response types
export type CreateSequenceResponse = z.infer<typeof createSequenceResponseSchema>;
export type UpdateSequenceResponse = z.infer<typeof updateSequenceResponseSchema>;

// Delete task types
export type DeleteSequenceTaskRequest = z.infer<typeof deleteSequenceTaskRequestSchema>;
export type DeleteSequenceTaskResponse = z.infer<typeof deleteSequenceTaskResponseSchema>;
