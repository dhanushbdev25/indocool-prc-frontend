import { current } from '@reduxjs/toolkit';
import { z } from 'zod';

const ModuleSchema = z.object({
	id: z.string(),
	name: z.string(),
	requirement: z.string(),
	priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
	status: z.enum([
		'NOT_STARTED',
		'REJECTED',
		'SUBMITTED',
		'APPROVED',
		'PENDING',
		'PMO_ASSIGNED',
		'ON_HOLD',
		'COMPLETED',
		'SUBMITTED'
	])
});

const AllReqItemSchema = z.object({
	id: z.number(),
	name: z.string(),
	currentlyWith: z.enum(['L1', 'L2', 'L3', 'L4', 'L5', 'SPOC', 'PMO']),
	status: z.enum(['PENDING', 'ON_HOLD', 'REJECTED', 'PMO_ASSIGNED', 'COMPLETED']),
	modules: z.array(ModuleSchema)
});

export const AllReqSchema = z.array(AllReqItemSchema);

export const PaginatedAllReqSchema = z.object({
	page: z.number(),
	limit: z.number(),
	total: z.number(),
	totalPages: z.number(),
	data: z.array(AllReqItemSchema)
});

export type PaginatedAllReq = z.infer<typeof PaginatedAllReqSchema>;

const PendingReqItemSchema = z.object({
	id: z.union([z.string(), z.number()]).transform(String),
	name: z.string(),
	createdAt: z.string().refine(s => !Number.isNaN(Date.parse(s)), {
		message: 'createdAt must be a valid ISO date string'
	}),
	users: z.string(),
	org: z.string(),
	sbu: z.string(),
	domain: z.string(),
	status: z.enum(['PENDING', 'ON_HOLD', 'REJECTED', 'PMO_ASSIGNED', 'COMPLETED']),
	currentlyWith: z.enum(['L1', 'L2', 'L3', 'L4', 'L5', 'SPOC', 'PMO'])
});

const AllocatedReqItemSchema = z.object({
	id: z.union([z.string(), z.number()]).transform(String),
	name: z.string(),
	createdAt: z.string().refine(s => !Number.isNaN(Date.parse(s)), {
		message: 'createdAt must be a valid ISO date string'
	}),
	users: z.string(),
	org: z.string(),
	sbu: z.string(),
	domain: z.string(),
	status: z.enum(['PENDING', 'ON_HOLD', 'REJECTED', 'PMO_ASSIGNED', 'COMPLETED']),
	currentlyWith: z.enum(['L1', 'L2', 'L3', 'L4', 'L5', 'SPOC', 'PMO'])
});

const AllNavSchema = z.object({
	id: z.number(),
	name: z.string(),
	currentlyWith: z.string(),
	status: z.string(),
	moduleCount: z.string()
});

const PendingNavSchema = z.object({
	id: z.number(),
	name: z.string(),
	currentlyWith: z.string(),
	status: z.string(),
	moduleCount: z.string()
});
const AllocatedNavSchema = z.object({
	id: z.number(),
	name: z.string(),
	currentlyWith: z.string(),
	status: z.string(),
	moduleCount: z.string()
});

const NavReqItemSchema = z.object({
	all: z.array(AllNavSchema),
	pending: z.array(PendingNavSchema),
	allocated: z.array(AllocatedNavSchema)
});

export const PendingReqSchema = z.array(PendingReqItemSchema);
export const AllocatedReqSchema = z.array(AllocatedReqItemSchema);
export const NavReqSchema = NavReqItemSchema;

export type AllReq = z.infer<typeof AllReqSchema>;
export type PendingReq = z.infer<typeof PendingReqSchema>;
export type AllocatedReq = z.infer<typeof AllocatedReqSchema>;
export type NavReq = z.infer<typeof NavReqSchema>;

//  Impact Details inside each module
const ImpactDetailsSchema = z
	.object({
		moduleId: z.string(),
		riskReduction: z.string().nullable(),
		frequencyOfUse: z.string().nullable(),
		revenueGrowth: z.number().nullable(),
		costReduction: z.number().nullable(),
		manhourReduction: z.number().nullable()
	})
	.nullable();

//  Module structure
const ModuleInfoSchema = z.object({
	id: z.string(),
	desc: z.string(),
	objective: z.string(),
	requirement: z.string(),
	thirdParty: z.string().nullable(),
	priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
	productOwner: z.string(),
	createdOn: z.string(),
	pmo: z.string().nullable(),
	planStatus: z.string(),
	isInternal: z.boolean(),
	sme: z.string().nullable(),
	poc: z.string(),
	cc: z.string(),
	impactDetails: ImpactDetailsSchema
});

//  Stakeholders
const StakeHolderInfoSchema = z.object({
	requestor: z.string(),
	l1: z.string().nullable(),
	l2: z.string().nullable(),
	l3: z.string().nullable(),
	l4: z.string().nullable(),
	l5: z.string().nullable(),
	spoc: z.string()
	// pmo: z.string().nullable()
});

//  Project Info
const ProjectInfoSchema = z.object({
	id: z.number(),
	name: z.string(),
	company: z.string(),
	sbu: z.string(),
	domain: z.string()
});

// Status Info
const StatusInfoSchema = z.object({
	currentlyWith: z.string(),
	status: z.string()
});

// Main schema for single request
export const RequestByIdSchema = z.object({
	requestedUserEmail: z.string(),
	projectInfo: ProjectInfoSchema,
	stakeHolderInfo: StakeHolderInfoSchema,
	moduleInfo: z.array(ModuleInfoSchema),
	messages: z.any().nullable(),
	files: z.any().nullable(),
	statusInfo: StatusInfoSchema
});

export const RequestModuleByIdSchema = z.array(z.string());
export const RequestSearchSchema = z.array(z.string());

// NEW: Create Project Response Schema
export const CreateProjectResponseSchema = z.object({
	message: z.string(),
	phases: z.array(
		z.object({
			id: z.number(),
			description: z.string()
		})
	)
});

//  NEW: View Project Response Schema
const ResourceAllocationSchema = z.object({
	email: z.string(),
	hrs: z.number()
});

const StageSchema = z.object({
	startDate: z.string(),
	endDate: z.string(),
	name: z.string(),
	approvalRequired: z.boolean(),
	resourceAllocation: z.array(ResourceAllocationSchema),
	status: z.string().optional()
});

const PhaseSchema = z.object({
	startDate: z.string(),
	endDate: z.string(),
	description: z.string(),
	stage: z.array(StageSchema)
});

const ProjectModuleSchema = z.object({
	moduleId: z.string(),
	startDate: z.string(),
	endDate: z.string(),
	phase: z.array(PhaseSchema)
});

const ResourceHoursSchema = z.object({
	resourceId: z.string(),
	actHrs: z.number().min(0)
});

export const updateStageStatusBodySchema = z.object({
	id: z.number(),
	action: z.enum(['NEXT', 'SKIPPED', 'APPROVE', 'REJECT']),
	hrs: z.array(ResourceHoursSchema).optional()
});

export const updateStageStatusResponseSchema = z.object({
	message: z.string(),
	action: z.string(),
	newState: z.string()
});

export const ViewProjectResponseSchema = z.object({
	id: z.string(),
	len: z.number(),
	output: z.array(ProjectModuleSchema)
});

export const updateProjectPlanStatusBodySchema = z.object({
	action: z.enum(['APPROVE', 'REJECT'])
});

export const updateProjectPlanStatusResponseSchema = z.object({
	message: z.string(),
	modules: z.array(ModuleInfoSchema)
});

export type RequestById = z.infer<typeof RequestByIdSchema>;
export type RequestModuleById = z.infer<typeof RequestModuleByIdSchema>;
export type CreateProjectResponse = z.infer<typeof CreateProjectResponseSchema>;
export type ViewProjectResponse = z.infer<typeof ViewProjectResponseSchema>;
export type updateProjectPlanStatusBody = z.infer<typeof updateProjectPlanStatusBodySchema>;
export type updateProjectPlanStatusResponse = z.infer<typeof updateProjectPlanStatusResponseSchema>;
export type updateStageStatusBody = z.infer<typeof updateStageStatusBodySchema>;
export type updateStageStatusResponse = z.infer<typeof updateStageStatusResponseSchema>;
