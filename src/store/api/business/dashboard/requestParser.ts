import { z } from 'zod';

export const companyNames = z.enum([
	'ARPN',
	'MCPL',
	'Kelloggs',
	'Lush',
	'CPT',
	'Dufil',
	'Tolaram - Other',
	'MPL Ghana',
	'Guinness'
]);

export const reqType = z.enum([
	'Power BI Dashboard',
	'Power APP',
	'Web Application',
	'Mobile Application',
	'IIOT',
	'RPA',
	'Data Science',
	'Oracle Apex',
	'Third Party Integration',
	'Bots'
]);

export const cardTypes = z.enum(['totalRequest', 'development', 'awaitingApproval', 'uat', 'onHold', 'completed']);

export const statusType = z.enum(['PENDING', 'ON_HOLD', 'REJECTED', 'COMPLETED', 'PMO_ASSIGNED']);

export const currentlyWith = z.enum(['L1', 'L2', 'L3', 'L4', 'L5', 'SPOC', 'PMO']);
const requestTableSchema = z.object({
	page: z.number(),
	limit: z.number(),
	total: z.number(),
	totalPages: z.number(),
	data: z.array(
		z.object({
			id: z.string(),
			description: z.string(),
			company: companyNames,
			status: statusType,
			actionOwner: z.email(),
			currentlyWith: currentlyWith
		})
	)
});

export const requestTabSchema = z.object({
	cards: z.array(
		z.object({
			name: cardTypes,
			cr: z.number(),
			nr: z.number()
		})
	),

	overdue: z.array(
		z.union([
			z.object({
				name: z.literal('requestOverdue'),
				cr: z.number(),
				nr: z.number()
			}),
			z.object({
				name: z.literal('stagesOverdue'),
				count: z.number()
			})
		])
	),

	companywiseDistribution: z.array(
		z.object({
			name: companyNames,
			value: z.number()
		})
	),

	requirementWise: z.array(
		z.object({
			name: reqType,
			value: z.number()
		})
	),

	companyWiseOpenAndClose: z.array(
		z.object({
			name: companyNames,
			closed: z.number(),
			open: z.number()
		})
	),
	requestListTable: requestTableSchema,
	stagesTimelineProjects: z.array(
		z.object({
			projectId: z.string(),
			projectName: z.string(),
			completionDate: z.string(),
			modules: z.array(
				z.object({
					moduleId: z.string(),
					moduleName: z.string(),
					stages: z.array(
						z.object({
							stageId: z.number(),
							stageName: z.string(),
							plannedStart: z.string().nullable(),
							plannedEnd: z.string().nullable(),
							actualStart: z.string().nullable(),
							actualEnd: z.string().nullable()
						})
					)
				})
			)
		})
	)
});

export type RequestTabType = z.infer<typeof requestTabSchema>;
export type RequestTableType = z.infer<typeof requestTableSchema>;
