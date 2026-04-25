import type { ExecutionData } from '../types/execution.types';

/** True when GET raw-materials rows include actuals needed to treat the step as done without aggregated payload. */
export function rawMaterialsRowsHaveRequiredActuals(executionData: ExecutionData): boolean {
	const rows = executionData.rawMaterials;
	if (!rows?.length) return false;
	return rows.every(rm => {
		const hasQty = rm.actualQuantity != null && String(rm.actualQuantity).trim() !== '';
		if (!hasQty) return false;
		if (rm.batching) {
			const bn = rm.batchNumber;
			return bn != null && String(bn).trim() !== '';
		}
		return true;
	});
}

/** Aggregated key from API, or GET rows populated with actual quantity (and batch when batching). */
export function isRawMaterialsStepCompleteForNavigation(executionData: ExecutionData): boolean {
	if (executionData.prcAggregatedSteps?.rawMaterials !== undefined) return true;
	return rawMaterialsRowsHaveRequiredActuals(executionData);
}
