import { z } from 'zod';

const impactItemSchema = z.object({
	enabled: z.boolean(),
	value: z.string().min(1, 'Value is required')
});

const moduleSchema = z.object({
	name: z.string().min(1, 'Module name is required'),
	requirement: z.string().min(1, 'Requirement is required'),
	objective: z.string().min(1, 'Objective is required'),
	priority: z.enum(['p1', 'p2', 'p3']),
	description: z.string().optional(),
	thirdParty: z.enum(['yes', 'no']),
	integrationType: z.enum(['sap', 'api', 'manual']),
	ccEmail: z.string().email('Invalid email').optional(),
	brd: z.string().nullable(),
	impact: z.object({
		riskReduction: impactItemSchema,
		frequency: impactItemSchema,
		revenueGrowth: impactItemSchema,
		costReduction: impactItemSchema,
		manhourReduction: impactItemSchema
	})
});

export const newRequestSchema = z.object({
	business: z.object({
		name: z.string().min(1, 'Business name is required'),
		company: z.string().min(1, 'Company is required'),
		sbu: z.string().min(1, 'SBU is required'),
		function: z.string().min(1, 'Function is required')
	}),
	modules: z.array(moduleSchema).min(1, 'At least one module is required'),
	isDraft: z.boolean().optional()
});

export type NewRequest = z.infer<typeof newRequestSchema>;
