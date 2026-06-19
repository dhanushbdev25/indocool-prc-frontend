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
	'qualityApprovedBy',
	'qualityApproved',
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
 * Matches historical `calculateStepGroupTiming` in execute-prc (per-step rounding, then summed).
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

/** Sequence step-group timing vs planned sequence duration (preview + report). */
export function calculateSequenceStepGroupTiming(
	step: TimelineStep,
	stepStartEndTime: Record<string, unknown>
): { timingExceeded: boolean; actualDuration: number; expectedDuration: number } {
	if (!step.stepGroup || !step.prcTemplateStepId || !step.stepGroup.sequenceTiming) {
		return { timingExceeded: false, actualDuration: 0, expectedDuration: 0 };
	}

	const prcTemplateStepId = step.prcTemplateStepId.toString();
	const stepGroupId = step.stepGroup.id.toString();

	const templateTimingData = stepStartEndTime[prcTemplateStepId] as Record<string, unknown> | undefined;
	if (!templateTimingData) {
		return { timingExceeded: false, actualDuration: 0, expectedDuration: step.stepGroup.sequenceTiming };
	}

	const groupTimingData = templateTimingData[stepGroupId] as Record<string, unknown> | undefined;
	if (!groupTimingData) {
		return { timingExceeded: false, actualDuration: 0, expectedDuration: step.stepGroup.sequenceTiming };
	}

	const { totalSeconds: totalActiveDuration, intervalsCount: stepsWithTiming } = sumSequenceSubStepIntervalsSeconds(
		groupTimingData,
		step.stepGroup.steps
	);

	if (stepsWithTiming === 0) {
		return { timingExceeded: false, actualDuration: 0, expectedDuration: step.stepGroup.sequenceTiming };
	}

	const expectedDuration = step.stepGroup.sequenceTiming;
	const timingExceeded = totalActiveDuration > expectedDuration;

	return { timingExceeded, actualDuration: totalActiveDuration, expectedDuration };
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

/**
 * Resolve the per-step timing/approval bucket from the `stepStartEndTime` root.
 * Mirrors the keying used when persisting timing data:
 * setup -> prcmetadata, rawMaterials/bom/sapConfirmations -> own key,
 * sequence -> [prcTemplateStepId][stepGroupId], inspection -> [prcTemplateStepId].
 */
function resolveStepTimingBucket(
	step: TimelineStep,
	root: Record<string, unknown>
): Record<string, unknown> | undefined {
	switch (step.type) {
		case 'setup':
			return root.prcmetadata as Record<string, unknown> | undefined;
		case 'rawMaterials':
			return root.rawMaterials as Record<string, unknown> | undefined;
		case 'bom':
			return root.bom as Record<string, unknown> | undefined;
		case 'sapConfirmations':
			return root.sapConfirmations as Record<string, unknown> | undefined;
		case 'sequence': {
			if (!step.stepGroup || step.prcTemplateStepId === undefined || step.prcTemplateStepId === null) {
				return undefined;
			}
			const templateTiming = root[step.prcTemplateStepId.toString()] as Record<string, unknown> | undefined;
			return templateTiming?.[step.stepGroup.id.toString()] as Record<string, unknown> | undefined;
		}
		case 'inspection': {
			const tid = step.stepData?.prcTemplateStepId;
			if (tid === undefined || tid === null) return undefined;
			return root[String(tid)] as Record<string, unknown> | undefined;
		}
		default:
			return undefined;
	}
}

export function getTimelineStepPlannedVsActual(
	step: TimelineStep,
	stepStartEndTime: Record<string, unknown> | undefined
): TimelineCardTiming {
	const root = stepStartEndTime ?? {};

	switch (step.type) {
		case 'setup':
		case 'rawMaterials':
		case 'bom':
		case 'sapConfirmations': {
			const blob = resolveStepTimingBucket(step, root);
			return {
				plannedSec: plannedFromTimingBlob(blob),
				actualSec: actualFromTimingBlob(blob)
			};
		}
		case 'sequence': {
			if (!step.stepGroup?.steps || !step.prcTemplateStepId) {
				return { plannedSec: null, actualSec: null };
			}
			const groupTiming = resolveStepTimingBucket(step, root);
			let plannedSec = plannedFromTimingBlob(groupTiming);
			const seqFall = coercePositiveSeconds(step.stepGroup.sequenceTiming);
			if (plannedSec === null && seqFall !== null) plannedSec = seqFall;
			const actualSec = getSequenceGroupActualSeconds(groupTiming, step.stepGroup.steps);
			return { plannedSec, actualSec };
		}
		case 'inspection': {
			const tid = step.stepData?.prcTemplateStepId;
			if (tid === undefined || tid === null) return { plannedSec: null, actualSec: null };
			const bucket = resolveStepTimingBucket(step, root);
			return inspectionTimingFromBucket(bucket);
		}
		default:
			return { plannedSec: null, actualSec: null };
	}
}

export interface ApproverInfo {
	name: string;
	employeeNo?: string;
}

export interface TimelineStepApprovalMeta {
	startTime: string | null;
	endTime: string | null;
	productionApprovedBy: ApproverInfo | null;
	/** From `qualityApprovedBy` (API) with `ctqApprovedBy` fallback for older payloads. */
	qualityApprovedBy: ApproverInfo | null;
	dataEnteredBy: ApproverInfo | null;
}

/** Parse a `*By` field: backend now returns `{ name, employeeNo }`; legacy numeric ids are ignored. */
function parseApproverInfo(value: unknown): ApproverInfo | null {
	if (!isPlainObject(value)) return null;
	const name = value.name;
	if (typeof name !== 'string' || name.trim() === '') return null;
	const employeeNo =
		typeof value.employeeNo === 'string'
			? value.employeeNo
			: typeof value.employeeNo === 'number'
				? String(value.employeeNo)
				: undefined;
	return { name, employeeNo };
}

function resolveQualityApprovedBy(bucket: Record<string, unknown>): ApproverInfo | null {
	return parseApproverInfo(bucket.qualityApprovedBy) ?? parseApproverInfo(bucket.ctqApprovedBy);
}

function firstTimestampString(value: unknown): string | null {
	return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/**
 * Earliest sub-step `startTime` / latest sub-step `endTime` among nested interval leaves,
 * skipping timing metadata keys. Used as a fallback for sequence groups (which have no
 * group-level start/end).
 */
function nestedIntervalBounds(bucket: Record<string, unknown>): { start: string | null; end: string | null } {
	let start: number | null = null;
	let startIso: string | null = null;
	let end: number | null = null;
	let endIso: string | null = null;

	for (const [key, value] of Object.entries(bucket)) {
		if (TIMING_META_KEYS.has(key) || !isPlainObject(value)) continue;
		if (!hasStartEndIntervalsShape(value)) continue;
		const s = new Date(value.startTime as string).getTime();
		const e = new Date(value.endTime as string).getTime();
		if (!Number.isNaN(s) && (start === null || s < start)) {
			start = s;
			startIso = value.startTime as string;
		}
		if (!Number.isNaN(e) && (end === null || e > end)) {
			end = e;
			endIso = value.endTime as string;
		}
	}

	return { start: startIso, end: endIso };
}

/** Approval people + overall start/end for a step's timing bucket (sidebar step cards). */
export function getTimelineStepApprovalMeta(
	step: TimelineStep,
	stepStartEndTime: Record<string, unknown> | undefined
): TimelineStepApprovalMeta {
	const empty: TimelineStepApprovalMeta = {
		startTime: null,
		endTime: null,
		productionApprovedBy: null,
		qualityApprovedBy: null,
		dataEnteredBy: null
	};

	const root = stepStartEndTime ?? {};
	const bucket = resolveStepTimingBucket(step, root);
	if (!bucket) return empty;

	const nested = nestedIntervalBounds(bucket);
	const startTime =
		firstTimestampString(bucket.stepStartTime) ?? firstTimestampString(bucket.startTime) ?? nested.start;
	const endTime =
		firstTimestampString(bucket.endTime) ?? nested.end ?? firstTimestampString(bucket.stepCompleted);

	return {
		startTime,
		endTime,
		productionApprovedBy: parseApproverInfo(bucket.productionApprovedBy),
		qualityApprovedBy: resolveQualityApprovedBy(bucket),
		dataEnteredBy: parseApproverInfo(bucket.dataEnteredBy)
	};
}

/** Compact locale date+time for step cards; empty string when unparseable/missing. */
export function formatStepTimestamp(iso: string | null | undefined): string {
	if (!iso) return '';
	const ms = new Date(iso).getTime();
	if (Number.isNaN(ms)) return '';
	return new Date(ms).toLocaleString();
}

export interface StepTimestampParts {
	date: string;
	time: string;
}

/** Split ISO timestamp into compact date + time lines for step-card layout. */
export function formatStepTimestampParts(iso: string | null | undefined): StepTimestampParts | null {
	if (!iso) return null;
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return null;
	return {
		date: d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' }),
		time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
	};
}

export function formatApproverDisplay(approver: ApproverInfo): string {
	return approver.employeeNo ? `${approver.name} (${approver.employeeNo})` : approver.name;
}

/** Elapsed execution runtime (ms) from first template step open until last template step close. */
export function getExecutionRuntimeMs(
	executionData: { stepStartEndTime?: Record<string, unknown> },
	now: number = Date.now()
): number {
	const root = executionData.stepStartEndTime;
	if (!root || typeof root !== 'object') return 0;

	const runtime = root.executionRuntime as Record<string, unknown> | undefined;
	if (!runtime || typeof runtime.startTime !== 'string') return 0;

	const startMs = new Date(runtime.startTime).getTime();
	if (Number.isNaN(startMs)) return 0;

	if (typeof runtime.endTime === 'string') {
		const endMs = new Date(runtime.endTime).getTime();
		if (!Number.isNaN(endMs)) return Math.max(0, endMs - startMs);
	}

	return Math.max(0, now - startMs);
}

/** Last sequence or inspection step in the timeline (excludes setup, BOM, SAP, etc.). */
export function findLastTemplateStepIndex(steps: ReadonlyArray<TimelineStep>): number {
	for (let i = steps.length - 1; i >= 0; i -= 1) {
		if (steps[i].type === 'sequence' || steps[i].type === 'inspection') return i;
	}
	return -1;
}
