import type { TimelineStep } from '../types/execution.types';
import type { ApproverInfo, TimelineStepApprovalMeta } from './timelineCardTiming';

export type ApproverRow = { key: 'production' | 'quality' | 'recorded'; label: string; approver: ApproverInfo };

/**
 * An inspection signed off by Quality only. Its single "Approve Inspection" button saves through the
 * production-approval call, so the approver arrives as `productionApprovedBy` even though Quality signed it.
 */
function isQualityOnlyInspection(step: TimelineStep): boolean {
	return (
		step.type === 'inspection' &&
		step.inspectionMetadata?.approveByQuality === true &&
		step.inspectionMetadata?.approveByProduction !== true
	);
}

export function buildApproverRows(approvalMeta: TimelineStepApprovalMeta, step: TimelineStep): ApproverRow[] {
	const rows: ApproverRow[] = [];
	const qualityOnlyInspection = isQualityOnlyInspection(step);
	if (approvalMeta.productionApprovedBy) {
		rows.push(
			qualityOnlyInspection
				? { key: 'quality', label: 'Quality approved by', approver: approvalMeta.productionApprovedBy }
				: { key: 'production', label: 'Production approved by', approver: approvalMeta.productionApprovedBy }
		);
	}
	if (approvalMeta.qualityApprovedBy && !(qualityOnlyInspection && approvalMeta.productionApprovedBy)) {
		rows.push({ key: 'quality', label: 'Quality approved by', approver: approvalMeta.qualityApprovedBy });
	}
	if (approvalMeta.dataEnteredBy && !approvalMeta.productionApprovedBy) {
		rows.push({ key: 'recorded', label: 'Recorded by', approver: approvalMeta.dataEnteredBy });
	}
	return rows;
}
