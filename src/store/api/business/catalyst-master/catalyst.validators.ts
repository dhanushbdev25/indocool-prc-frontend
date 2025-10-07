import { z } from 'zod/v4';

// Zod schemas for catalyst response validation
export const catalystConfigurationSchema = z.object({
	id: z.number(),
	catalystId: z.number(),
	chartId: z.string(),
	version: z.number(),
	isLatest: z.boolean(),
	minTemperature: z.string(),
	maxTemperature: z.string(),
	minHumidity: z.string(),
	maxHumidity: z.string(),
	minGelcoat: z.string(),
	maxGelcoat: z.string(),
	gelcoatLabel: z.string(),
	minResinDosage: z.string(),
	maxResinDosage: z.string(),
	resinLabel: z.string(),
	blockCatalystMixing: z.boolean(),
	requestSupervisorApproval: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string()
});

export const catalystSchema = z.object({
	id: z.number(),
	status: z.string(),
	chartId: z.string(),
	version: z.number(),
	isLatest: z.boolean(),
	chartSupplier: z.string(),
	notes: z.string(),
	mekpDensity: z.string(),
	isActive: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string()
});

export const catalystDetailSchema = z.object({
	catalyst: catalystSchema,
	catalystConfiguration: z.array(catalystConfigurationSchema)
});

export const catalystHeaderSchema = z.object({
	ACTIVE: z.number(),
	NEW: z.number(),
	INACTIVE: z.number()
});

export const catalystChartResponseSchema = z.object({
	header: catalystHeaderSchema,
	detail: z.array(catalystDetailSchema)
});

// Schema for single catalyst response (has header and detail structure)
export const catalystByIdResponseSchema = z.object({
	header: catalystHeaderSchema,
	detail: catalystDetailSchema
});

// Request schemas for create/update operations
export const catalystConfigurationRequestSchema = z.object({
	minTemperature: z.number(),
	maxTemperature: z.number(),
	minHumidity: z.number(),
	maxHumidity: z.number(),
	minGelcoat: z.number(),
	maxGelcoat: z.number(),
	gelcoatLabel: z.string(),
	minResinDosage: z.number(),
	maxResinDosage: z.number(),
	resinLabel: z.string(),
	blockCatalystMixing: z.boolean(),
	requestSupervisorApproval: z.boolean()
});

export const catalystRequestSchema = z.object({
	status: z.string(),
	chartId: z.string(),
	chartSupplier: z.string(),
	notes: z.string().optional(),
	mekpDensity: z.number(),
	isActive: z.boolean()
});

export const createCatalystRequestSchema = z.object({
	catalyst: catalystRequestSchema,
	catalystConfiguration: z.array(catalystConfigurationRequestSchema)
});

export const updateCatalystRequestSchema = z.object({
	id: z.number(),
	catalyst: catalystRequestSchema,
	catalystConfiguration: z.array(catalystConfigurationRequestSchema)
});

// TypeScript types inferred from Zod schemas
export type CatalystConfiguration = z.infer<typeof catalystConfigurationSchema>;
export type Catalyst = z.infer<typeof catalystSchema>;
export type CatalystDetail = z.infer<typeof catalystDetailSchema>;
export type CatalystHeader = z.infer<typeof catalystHeaderSchema>;
export type CatalystChartResponse = z.infer<typeof catalystChartResponseSchema>;
export type CatalystByIdResponse = z.infer<typeof catalystByIdResponseSchema>;

// Request types
export type CatalystConfigurationRequest = z.infer<typeof catalystConfigurationRequestSchema>;
export type CatalystRequest = z.infer<typeof catalystRequestSchema>;
export type CreateCatalystRequest = z.infer<typeof createCatalystRequestSchema>;
export type UpdateCatalystRequest = z.infer<typeof updateCatalystRequestSchema>;
