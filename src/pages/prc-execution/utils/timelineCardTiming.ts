/**
 * Helpers for sidebar Execution Steps timing.
 * Reads `plannedTime`, `duration`, and `startTime`/`endTime` from `ExecutionData.stepStartEndTime`
 * (GET `/prcExecution/:id`).
 */

import type { TimelineStep } from '../types/execution.types';

const TIMING_META_KEYS = new Set([
	'stepCompleted',
	'productionApproved',
	'ctqApproved',
	'partialCtqApprove',
	'timingExceeded',
	'timingExceededRemarks',
	'timingExceededReasonCode',
	'timingExceededReasonLabel',
	'plannedTime',
	'duration',
	'startTime',
	'endTime',
	'dataEnteredBy',
	'productionApprovedBy',
	'ctqApprovedBy',
	'stepCompletedBy'
]);

function isPlainObject(u: unknown): u is Record<string, unknown> {
	return typeof u === 'object' && u !== null && !Array.isArray(u);
}

function coercePositiveSeconds(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
		return value;
	}
	if (typeof value === 'string' && value.trim() !== '') {
		const n = Number(value);
		if (Number.isFinite(n) && n >= 0) return n;
	}
	return null;
}

function deltaSeconds(start: unknown, end: unknown): number | null {
	if (typeof start !== 'string' || typeof end !== 'string') return null;
	const s = new Date(start).getTime();
	const e = new Date(end).getTime();
	if (Number.isNaN(s) || Number.isNaN(e)) return null;
	const sec = (e - s) / 1000;
	return sec >= 0 ? Math.round(sec * 10) / 10 : null;
}

function hasStartEndIntervalsShape(obj: Record<string, unknown>): boolean {
	return typeof obj.startTime === 'string' && typeof obj.endTime === 'string';
}

/**
 * Sum active seconds for sequence measurements that have `startTime`/`endTime` per known step ids.
 * Matches `calculateStepGroupTiming` in execute-prc (per-step rounding, then summed).
 */
export function sumSequenceSubStepIntervalsSeconds(
	groupTimingData: Record<string, unknown>,
	subSteps: ReadonlyArray<{ id: number }>
): { totalSeconds: number; intervalsCount: number } {
	let totalActiveDuration = 0;
	let intervalsCount = 0;
	for (const subStep of subSteps) {
		const stepTiming = groupTimingData[subStep.id.toString()] as { startTime?: string; endTime?: string } | undefined;
		if (stepTiming?.startTime && stepTiming?.endTime) {
			const startTime = new Date(stepTiming.startTime);
			const endTime = new Date(stepTiming.endTime);
			const stepDurationMs = endTime.getTime() - startTime.getTime();
			const stepDuration = Math.round((stepDurationMs / 1000) * 10) / 10;
			totalActiveDuration += stepDuration;
			intervalsCount += 1;
		}
	}
	return { totalSeconds: totalActiveDuration, intervalsCount };
}

/**
 * Actual seconds for a sequence step group timing bucket: rollup `duration` when present,
 * otherwise summed sub-step intervals.
 */
export function getSequenceGroupActualSeconds(
	groupTiming: Record<string, unknown> | undefined,
	subSteps: ReadonlyArray<{ id: number }>
): number | null {
	if (!groupTiming) return null;
	const rollup = coercePositiveSeconds(groupTiming.duration);
	if (rollup !== null) return rollup;
	const { totalSeconds, intervalsCount } = sumSequenceSubStepIntervalsSeconds(groupTiming, subSteps);
	if (intervalsCount === 0) return null;
	return totalSeconds;
}

/** Format seconds like StepPreview HH:MM:SS (rounded whole seconds remainder). */
export function formatExecutionDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = Math.round(seconds % 60);
	return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function actualFromTimingBlob(blob: Record<string, unknown> | undefined): number | null {
	if (!blob) return null;
	const d = coercePositiveSeconds(blob.duration);
	if (d !== null) return d;
	const dt = deltaSeconds(blob.startTime, blob.endTime);
	if (dt !== null) return dt;
	return null;
}

function plannedFromTimingBlob(blob: Record<string, unknown> | undefined): number | null {
	if (!blob) return null;
	return coercePositiveSeconds(blob.plannedTime);
}

/** Sum nested `{ startTime, endTime }` leaves; skips timing metadata keys during descent. */
function sumNestedLeafIntervals(value: unknown, depth = 0): number {
	if (depth > 10 || !isPlainObject(value)) return 0;
	if (hasStartEndIntervalsShape(value)) {
		const d = deltaSeconds(value.startTime, value.endTime);
		return d ?? 0;
	}
	let sum = 0;
	for (const [k, v] of Object.entries(value)) {
		if (TIMING_META_KEYS.has(k)) continue;
		if (typeof v !== 'object' || v === null) continue;
		sum += sumNestedLeafIntervals(v, depth + 1);
	}
	return sum;
}

function inspectionTimingFromBucket(bucket: Record<string, unknown> | undefined): TimelineCardTiming {
	if (!bucket) return { plannedSec: null, actualSec: null };

	const plannedSec = plannedFromTimingBlob(bucket);
	let actualSec = actualFromTimingBlob(bucket);

	const canTryNestedIntervals =
		!hasStartEndIntervalsShape(bucket) && coercePositiveSeconds(bucket.duration) === null;

	if (actualSec === null && canTryNestedIntervals) {
		const nested = sumNestedLeafIntervals(bucket);
		if (nested > 0) actualSec = nested;
	}

	return { plannedSec, actualSec };
}

export interface TimelineCardTiming {
	plannedSec: number | null;
	actualSec: number | null;
}

export function getTimelineStepPlannedVsActual(
	step: TimelineStep,
	stepStartEndTime: Record<string, unknown> | undefined
): TimelineCardTiming {
	const root = stepStartEndTime ?? {};

	switch (step.type) {
		case 'setup': {
			const blob = root.prcmetadata as Record<string, unknown> | undefined;
			return {
				plannedSec: plannedFromTimingBlob(blob),
				actualSec: actualFromTimingBlob(blob)
			};
		}
		case 'rawMaterials': {
			const blob = root.rawMaterials as Record<string, unknown> | undefined;
			return {
				plannedSec: plannedFromTimingBlob(blob),
				actualSec: actualFromTimingBlob(blob)
			};
		}
		case 'bom': {
			const blob = root.bom as Record<string, unknown> | undefined;
			return {
				plannedSec: plannedFromTimingBlob(blob),
				actualSec: actualFromTimingBlob(blob)
			};
		}
		case 'sapConfirmations': {
			const blob = root.sapConfirmations as Record<string, unknown> | undefined;
			return {
				plannedSec: plannedFromTimingBlob(blob),
				actualSec: actualFromTimingBlob(blob)
			};
		}
		case 'sequence': {
			if (!step.stepGroup?.steps || !step.prcTemplateStepId) {
				return { plannedSec: null, actualSec: null };
			}
			const templateTiming = root[step.prcTemplateStepId.toString()] as Record<string, unknown> | undefined;
			const groupTiming = templateTiming?.[step.stepGroup.id.toString()] as Record<string, unknown> | undefined;
			let plannedSec = plannedFromTimingBlob(groupTiming);
			const seqFall = coercePositiveSeconds(step.stepGroup.sequenceTiming);
			if (plannedSec === null && seqFall !== null) plannedSec = seqFall;
			const actualSec = getSequenceGroupActualSeconds(groupTiming, step.stepGroup.steps);
			return { plannedSec, actualSec };
		}
		case 'inspection': {
			const tid = step.stepData?.prcTemplateStepId;
			if (tid === undefined || tid === null) return { plannedSec: null, actualSec: null };
			const bucket = root[String(tid)] as Record<string, unknown> | undefined;
			return inspectionTimingFromBucket(bucket);
		}
		default:
			return { plannedSec: null, actualSec: null };
	}
}
