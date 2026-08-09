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
	'editedAfterSubmit',
	'editedAfterSubmitAt',
	'editedAfterSubmitBy',
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

/** Format seconds like StepPreview HH:MM:SS (rounded whole seconds remainder). */
export function formatExecutionDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = Math.round(seconds % 60);
	return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function plannedFromTimingBlob(blob: Record<string, unknown> | undefined): number | null {
	if (!blob) return null;
	return coercePositiveSeconds(blob.plannedTime);
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

/**
 * Resolved start of a step: enriched `stepStartTime`, then the bucket's own `startTime`,
 * then the earliest sub-step interval start (sequence groups have no group-level start).
 */
function resolveBucketStartIso(bucket: Record<string, unknown> | undefined): string | null {
	if (!bucket) return null;
	return (
		firstTimestampString(bucket.stepStartTime) ??
		firstTimestampString(bucket.startTime) ??
		nestedIntervalBounds(bucket).start
	);
}

/**
 * Resolved end of a step: the approval/completion click (`stepCompleted`). A step is only
 * finished once it has been approved, so the entry-session `endTime` is a fallback for steps
 * with no approval flow (setup, catalyst mixing, SAP), and the latest sub-step interval end
 * is the last resort for legacy buckets that never recorded a completion.
 */
function resolveBucketEndIso(bucket: Record<string, unknown> | undefined): string | null {
	if (!bucket) return null;
	return (
		firstTimestampString(bucket.stepCompleted) ??
		firstTimestampString(bucket.endTime) ??
		nestedIntervalBounds(bucket).end
	);
}

/**
 * Authoritative planned vs actual seconds for a step. Single source used by the card flag,
 * the live delay-remarks prompt, and the report/preview builders (via `getStepTimingStatus`).
 *
 * Actual is measured start → approval from the same pair of timestamps the card's window shows,
 * so the two can never disagree. The backend `duration` rollup is only a fallback for buckets
 * with no usable timestamps at all — it is computed with a different end anchor per step type
 * (sequence: completion, inspection: entry-session end), which is what made them diverge.
 *
 * Planned: bucket `plannedTime`, falling back to the master timing
 * (`stepGroup.sequenceTiming` / `inspectionMetadata.inspectionTiming`).
 */
export function getStepTiming(
	step: TimelineStep,
	stepStartEndTime: Record<string, unknown> | undefined
): TimelineCardTiming {
	const bucket = resolveStepTimingBucket(step, stepStartEndTime ?? {});

	const actualSec =
		deltaSeconds(resolveBucketStartIso(bucket), resolveBucketEndIso(bucket)) ??
		coercePositiveSeconds(bucket?.duration);

	let plannedSec = plannedFromTimingBlob(bucket);
	if (plannedSec === null) {
		if (step.type === 'sequence') {
			plannedSec = coercePositiveSeconds(step.stepGroup?.sequenceTiming);
		} else if (step.type === 'inspection') {
			plannedSec = coercePositiveSeconds(step.inspectionMetadata?.inspectionTiming);
		}
	}

	return { plannedSec, actualSec };
}

/** True when the step ran past a positive planned duration. No/zero planned timing ⇒ never late. */
export function isStepLate(timing: TimelineCardTiming): boolean {
	return (
		timing.plannedSec !== null && timing.plannedSec > 0 && timing.actualSec !== null && timing.actualSec > timing.plannedSec
	);
}

export interface StepTimingStatus {
	timingExceeded: boolean;
	/** Actual seconds (0 when no timing recorded). */
	actualDuration: number;
	/** Planned seconds (0 when the step has no planned timing). */
	plannedDuration: number;
}

/** `getStepTiming` + `isStepLate` in the shape consumed by `StepPreviewData`. */
export function getStepTimingStatus(
	step: TimelineStep,
	stepStartEndTime: Record<string, unknown> | undefined
): StepTimingStatus {
	const timing = getStepTiming(step, stepStartEndTime);
	return {
		timingExceeded: isStepLate(timing),
		actualDuration: timing.actualSec ?? 0,
		plannedDuration: timing.plannedSec ?? 0
	};
}

/**
 * Earliest recorded start for a step: enriched `stepStartTime` / bucket `startTime`,
 * falling back to the earliest sub-step interval start (sequence groups).
 */
export function getStepStartTimeIso(
	step: TimelineStep,
	stepStartEndTime: Record<string, unknown> | undefined
): string | null {
	return resolveBucketStartIso(resolveStepTimingBucket(step, stepStartEndTime ?? {}));
}

/** Completion timestamp for a step from the timing root (Complete Step click; setup uses its endTime). */
export function getStepCompletionTimeIso(
	step: TimelineStep,
	stepStartEndTime: Record<string, unknown> | undefined
): string | null {
	const bucket = resolveStepTimingBucket(step, stepStartEndTime ?? {});
	if (!bucket) return null;
	if (step.type === 'setup') {
		return firstTimestampString(bucket.endTime);
	}
	return firstTimestampString(bucket.stepCompleted);
}

/**
 * Start of a step's delay clock: the previous step's completion time — a step is "open" from
 * the moment the step before it finished, so idle time between steps counts against it.
 * Falls back to the step's own first recorded start when the previous step's completion
 * timestamp is unavailable (legacy data / no previous step).
 */
export function getStepClockStartIso(
	step: TimelineStep,
	previousStep: TimelineStep | undefined,
	stepStartEndTime: Record<string, unknown> | undefined
): string | null {
	if (previousStep) {
		const prevDone = getStepCompletionTimeIso(previousStep, stepStartEndTime);
		if (prevDone) return prevDone;
	}
	return getStepStartTimeIso(step, stepStartEndTime);
}

/**
 * Wall-clock lateness for an in-progress step: actual = now − delay-clock start
 * (previous step's completion, falling back to the step's own first recorded start).
 * This is the single clock used by the preview checkpoints (render, approve clicks,
 * Complete Step) so overrun anywhere before completion is caught — not just time
 * spent inside the entry form. Completed steps keep `getStepTimingStatus` (stored duration).
 */
export function getLiveStepTimingStatus(
	step: TimelineStep,
	stepStartEndTime: Record<string, unknown> | undefined,
	previousStep?: TimelineStep,
	nowMs: number = Date.now()
): StepTimingStatus {
	const plannedSec = getStepTiming(step, stepStartEndTime).plannedSec;
	const startIso = getStepClockStartIso(step, previousStep, stepStartEndTime);
	const startMs = startIso ? new Date(startIso).getTime() : Number.NaN;
	const actualSec = Number.isNaN(startMs) ? null : Math.max(0, Math.round(((nowMs - startMs) / 1000) * 10) / 10);
	return {
		timingExceeded: isStepLate({ plannedSec, actualSec }),
		actualDuration: actualSec ?? 0,
		plannedDuration: plannedSec ?? 0
	};
}

export interface PersistedDelayMetadata {
	/** `timingExceeded === true` saved in the step's aggregated bucket at execution time. */
	persistedTimingExceeded: boolean;
	timingExceededRemarks: string;
	timingExceededReasonCode?: string | number;
	timingExceededReasonLabel?: string;
	/** Present when the step was re-submitted after completion (admin edit). */
	editedAfterSubmit?: { at?: string };
}

const EMPTY_DELAY_METADATA: PersistedDelayMetadata = { persistedTimingExceeded: false, timingExceededRemarks: '' };

/**
 * Resolve the step's `prcAggregatedSteps` bucket, mirroring the keying used when persisting:
 * sequence -> [prcTemplateStepId][stepGroupId], inspection -> [prcTemplateStepId].
 * Only sequence/inspection steps carry delay metadata.
 */
function resolveAggregatedStepBucket(
	step: TimelineStep,
	aggregated: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
	if (!aggregated) return undefined;
	if (step.type === 'sequence') {
		if (!step.stepGroup || step.prcTemplateStepId === undefined || step.prcTemplateStepId === null) {
			return undefined;
		}
		const tplBucket = aggregated[step.prcTemplateStepId.toString()];
		if (!isPlainObject(tplBucket)) return undefined;
		const groupBucket = tplBucket[step.stepGroup.id.toString()];
		return isPlainObject(groupBucket) ? groupBucket : undefined;
	}
	if (step.type === 'inspection') {
		const tid = step.stepData?.prcTemplateStepId;
		if (tid === undefined || tid === null) return undefined;
		const bucket = aggregated[String(tid)];
		return isPlainObject(bucket) ? bucket : undefined;
	}
	return undefined;
}

/** Delay remarks/reason (+ edited-after-submit marker) saved in the step's `prcAggregatedSteps` bucket. */
export function readPersistedDelayMetadata(
	step: TimelineStep,
	aggregated: Record<string, unknown> | undefined
): PersistedDelayMetadata {
	const bucket = resolveAggregatedStepBucket(step, aggregated);
	if (!bucket) return EMPTY_DELAY_METADATA;

	const result: PersistedDelayMetadata = {
		persistedTimingExceeded: bucket.timingExceeded === true,
		timingExceededRemarks: typeof bucket.timingExceededRemarks === 'string' ? bucket.timingExceededRemarks : ''
	};
	const reasonCode = bucket.timingExceededReasonCode;
	if (typeof reasonCode === 'string' || typeof reasonCode === 'number') {
		result.timingExceededReasonCode = reasonCode;
	}
	const reasonLabel = bucket.timingExceededReasonLabel;
	if (typeof reasonLabel === 'string') {
		result.timingExceededReasonLabel = reasonLabel;
	}
	if (bucket.editedAfterSubmit === true) {
		result.editedAfterSubmit = {
			at: typeof bucket.editedAfterSubmitAt === 'string' ? bucket.editedAfterSubmitAt : undefined
		};
	}
	return result;
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

	return {
		startTime: resolveBucketStartIso(bucket),
		endTime: resolveBucketEndIso(bucket),
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

/** Elapsed execution runtime (ms) from setup completion until last template step close. */
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
