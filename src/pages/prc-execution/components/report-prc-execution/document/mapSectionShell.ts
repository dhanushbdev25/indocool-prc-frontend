import type { TimelineStep } from '../../../types/execution.types';
import { buildApproverRows } from '../../../utils/approverRows';
import {
	formatApproverDisplay,
	formatExecutionDuration,
	getStepTiming,
	getTimelineStepApprovalMeta,
	readPersistedDelayMetadata
} from '../../../utils/timelineCardTiming';
import { formatDisplayDateTime } from '../../../../../utils/formatDisplayDate';
import { statusWord } from './formatters';
import type { DocField, DocSectionShell } from './types';

function notices(step: TimelineStep, agg: Record<string, unknown>): string[] {
	const delay = readPersistedDelayMetadata(step, agg);
	const out: string[] = [];
	const reason =
		delay.timingExceededReasonLabel ??
		(delay.timingExceededReasonCode !== undefined ? String(delay.timingExceededReasonCode) : '');
	if (delay.persistedTimingExceeded || reason || delay.timingExceededRemarks) {
		const parts = [
			reason && `reason: ${reason}`,
			delay.timingExceededRemarks && `remarks: ${delay.timingExceededRemarks}`
		];
		const detail = parts.filter(Boolean).join(', ');
		out.push(detail ? `Timing exceeded — ${detail}` : 'Timing exceeded');
	}
	if (delay.editedAfterSubmit) {
		out.push(
			delay.editedAfterSubmit.at
				? `Edited after submission on ${formatDisplayDateTime(delay.editedAfterSubmit.at)}`
				: 'Edited after submission'
		);
	}
	return out;
}

/** Title bar, timing strip, approvals and notices shared by every report section. */
export function mapSectionShell(
	step: TimelineStep,
	key: string,
	agg: Record<string, unknown>,
	tim: Record<string, unknown>
): DocSectionShell {
	const approvalMeta = getTimelineStepApprovalMeta(step, tim);
	const timing = getStepTiming(step, tim);

	const meta: DocField[] = [];
	if (approvalMeta.startTime) meta.push({ label: 'Start time', value: formatDisplayDateTime(approvalMeta.startTime) });
	if (timing.plannedSec !== null) {
		meta.push({ label: 'Planned duration', value: formatExecutionDuration(timing.plannedSec) });
	}
	if ((step.type === 'sequence' || step.type === 'inspection') && timing.actualSec !== null) {
		meta.push({ label: 'Actual duration', value: formatExecutionDuration(timing.actualSec) });
	}

	return {
		key,
		number: step.stepNumber,
		title: step.title,
		status: statusWord(step.status),
		gate: step.ctq === true,
		partialGate: step.partialCtqApprove === true,
		meta,
		approvals: buildApproverRows(approvalMeta, step).map(row => ({
			label: row.label,
			value: formatApproverDisplay(row.approver)
		})),
		notices: notices(step, agg)
	};
}
