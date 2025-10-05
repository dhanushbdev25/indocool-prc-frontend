import { z } from 'zod/v4';

// Zod schemas for catalyst response validation
export const catalystConfigurationSchema = z.object({
	id: z.number(),
	catalystId: z.number(),
	chartId: z.string(),
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

// TypeScript types inferred from Zod schemas
export type CatalystConfiguration = z.infer<typeof catalystConfigurationSchema>;
export type Catalyst = z.infer<typeof catalystSchema>;
export type CatalystDetail = z.infer<typeof catalystDetailSchema>;
export type CatalystHeader = z.infer<typeof catalystHeaderSchema>;
export type CatalystChartResponse = z.infer<typeof catalystChartResponseSchema>;
