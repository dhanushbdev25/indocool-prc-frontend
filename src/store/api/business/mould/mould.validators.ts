import { z } from 'zod';

/** Raw item from GET /mould */
export const mouldApiItemSchema = z
	.object({
		id: z.number(),
		partId: z.number(),
		partCode: z.string(),
		mouldId: z.string(),
		reconciliationCount: z.number(),
		currentCount: z.number(),
		totalCount: z.number().optional(),
		lastReconciled: z.string().nullable().optional(),
		reconcileNowFlag: z.boolean(),
		createdAt: z.string().optional(),
		updatedAt: z.string().optional()
	})
	.loose();

export const mouldListResponseSchema = z
	.object({
		data: z.array(mouldApiItemSchema)
	})
	.loose();

export type MouldApiItem = z.infer<typeof mouldApiItemSchema>;
export type MouldListResponse = z.infer<typeof mouldListResponseSchema>;

/** Row shape for the mould reconciliation table */
export interface MouldReconciliationRow {
	id: number;
	partId: number;
	partNumber: string;
	mouldCode: string;
	reconciliationCount: number;
	currentCount: number;
	lastReconciledAt?: string | null;
	reconcileNowFlag: boolean;
}

export const mapMouldApiItemToRow = (item: MouldApiItem): MouldReconciliationRow => ({
	id: item.id,
	partId: item.partId,
	partNumber: item.partCode,
	mouldCode: item.mouldId,
	reconciliationCount: item.reconciliationCount,
	currentCount: item.currentCount,
	lastReconciledAt: item.lastReconciled ?? null,
	reconcileNowFlag: item.reconcileNowFlag
});

export const isMouldDueForReconciliation = (row: MouldReconciliationRow): boolean =>
	row.reconcileNowFlag || row.currentCount >= row.reconciliationCount;

/** GET /mould/combo?partId= — comboFormatter formatComboData */
export const mouldComboDataSchema = z
	.object({
		mouldId: z.string(),
		partCode: z.string().optional(),
		reconciliationCount: z.number().optional(),
		currentCount: z.number().optional(),
		totalCount: z.number().optional()
	})
	.passthrough();

export const mouldComboItemSchema = z.object({
	label: z.string(),
	value: z.union([z.number(), z.string()]),
	data: mouldComboDataSchema
});

export const mouldComboResponseSchema = z.object({
	data: z.array(mouldComboItemSchema)
});

export type MouldComboItem = z.infer<typeof mouldComboItemSchema>;
