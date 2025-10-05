import { z } from 'zod';

export const CompanyNamesEnum = z.enum([
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

export const ReqTypeEnum = z.enum([
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

export const DurationEnum = z.enum([
	'january 2025',
	'february 2025',
	'march 2025',
	'april 2025',
	'may 2025',
	'june 2025',
	'july 2025',
	'august 2025'
]);

export const DomainNamesEnum = z.enum([
	'Finance',
	'Logistics',
	'Supply chain',
	'IT',
	'Manufacturing',
	'Marketing',
	'Sales & Distribution',
	'Farm',
	'Dummy Domain',
	'Dummy dev Domain',
	'Dummy QAS Domain',
	'IT Marketing',
	'HR-Module'
]);

export const ImpactTabInfoSchema = z.object({
	cards: z.object({
		totalRequest: z.number(),
		totalManHours: z.number(),
		estCostReduction: z.number(),
		estRevenueGrowth: z.number(),
		avgDeliveryTime: z.number(),
		avgRiskReduction: z.number()
	}),

	companyWiseImpact: z.array(
		z.object({
			name: CompanyNamesEnum,
			costReduction: z.number(),
			manHoursSaved: z.number(),
			revenueGrowth: z.number()
		})
	),
	requirementWiseImpact: z.array(
		z.object({
			name: ReqTypeEnum,
			totalRequest: z.number(),
			costReduction: z.number(),
			manHoursSaved: z.number(),
			revenueGrowth: z.number()
		})
	),
	domainWiseImpact: z.array(
		z.object({
			name: DomainNamesEnum,
			value: z.number()
		})
	),

	timelineTrends: z.array(
		z.object({
			duration: DurationEnum,
			costReduction: z.number(),
			manHoursSaved: z.number(),
			revenueGrowth: z.number()
		})
	),
	impactTableType: z.object({
		page: z.number(),
		limit: z.number(),
		total: z.number(),
		totalPages: z.number(),
		data: z.array(
			z.object({
				id: z.string(),
				description: z.string(),
				company: CompanyNamesEnum,
				estGrowth: z.number(),
				costReduction: z.number(),
				totalManHours: z.number()
			})
		)
	})
});

export type ImpactTabInfoType = z.infer<typeof ImpactTabInfoSchema>;
