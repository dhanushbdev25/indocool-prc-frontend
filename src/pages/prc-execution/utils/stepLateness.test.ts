/**
 * Regression tests for the delay-remarks preview bug: the card flag, the live remarks prompt,
 * and the report builders must derive lateness from the same computation (`getStepTiming` +
 * `isStepLate`), and persisted delay documentation must survive into the report preview data
 * even when the live recompute disagrees.
 */
import { describe, expect, it } from 'vitest';
import type { TimelineStep } from '../types/execution.types';
import { buildInspectionStepPreviewForReport, buildSequenceStepPreviewForReport } from './reportStepPreviewData';
import {
	getLiveStepTimingStatus,
	getStepClockStartIso,
	getStepStartTimeIso,
	getStepTiming,
	getStepTimingStatus,
	isStepLate,
	readPersistedDelayMetadata
} from './timelineCardTiming';

const inspectionStep = {
	stepNumber: 5,
	type: 'inspection',
	title: 'Final inspection',
	description: '',
	status: 'completed',
	ctq: false,
	stepData: { prcTemplateStepId: 501 },
	// Master lacks inspectionTiming (field added recently; older masters have none)
	inspectionMetadata: { id: 1, inspectionName: 'Final inspection' }
} as unknown as TimelineStep;

const inspectionTimingRoot = {
	'501': {
		startTime: '2026-06-01T08:00:00.000Z',
		endTime: '2026-06-01T08:06:40.000Z', // 400s actual
		plannedTime: 120 // planned captured at execution time
	}
};

const inspectionAggregated = {
	'501': {
		stepCompleted: true,
		timingExceeded: true,
		timingExceededRemarks: 'Machine cleaning took longer than planned',
		timingExceededReasonCode: 'RM',
		timingExceededReasonLabel: 'Raw Material Shortage'
	}
};

const sequenceStep = {
	stepNumber: 2,
	type: 'sequence',
	title: 'Mixing',
	description: '',
	status: 'completed',
	ctq: false,
	prcTemplateStepId: 300,
	stepGroup: {
		id: 40,
		processName: 'Mixing',
		processDescription: '',
		sequenceTiming: 60,
		steps: [{ id: 11 }]
	}
} as unknown as TimelineStep;

// Rollup duration only — no per-sub-step intervals persisted
const sequenceTimingRoot = { '300': { '40': { duration: 90, plannedTime: 60 } } };

const sequenceAggregated = {
	'300': {
		'40': {
			stepCompleted: true,
			timingExceeded: true,
			timingExceededRemarks: 'Mixer jammed mid-cycle',
			timingExceededReasonCode: 'WIP',
			timingExceededReasonLabel: 'Work in progress delay',
			editedAfterSubmit: true,
			editedAfterSubmitAt: '2026-06-02T10:00:00.000Z',
			editedAfterSubmitBy: 7
		}
	}
};

describe('shared lateness computation (flag + remarks gate cannot diverge)', () => {
	it('inspection: report timingExceeded matches the card computation even without master timing', () => {
		const cardLate = isStepLate(getStepTiming(inspectionStep, inspectionTimingRoot));
		expect(cardLate).toBe(true);

		const preview = buildInspectionStepPreviewForReport(inspectionStep, inspectionAggregated, inspectionTimingRoot);
		expect(preview?.timingExceeded).toBe(cardLate);
		expect(preview?.plannedDuration).toBe(120);
		expect(preview?.actualDuration).toBe(400);
		expect(preview?.persistedTimingExceeded).toBe(true);
		expect(preview?.timingExceededRemarks).toBe('Machine cleaning took longer than planned');
		expect(preview?.timingExceededReasonLabel).toBe('Raw Material Shortage');
	});

	it('sequence: report timingExceeded matches the card computation with rollup-only timing data', () => {
		const cardLate = isStepLate(getStepTiming(sequenceStep, sequenceTimingRoot));
		expect(cardLate).toBe(true);

		const preview = buildSequenceStepPreviewForReport(sequenceStep, sequenceAggregated, sequenceTimingRoot);
		expect(preview?.timingExceeded).toBe(cardLate);
		expect(preview?.persistedTimingExceeded).toBe(true);
		expect(preview?.timingExceededRemarks).toBe('Mixer jammed mid-cycle');
		expect(preview?.editedAfterSubmit).toEqual({ at: '2026-06-02T10:00:00.000Z' });
	});

	it('persisted delay metadata survives even when timing data is missing entirely', () => {
		const preview = buildInspectionStepPreviewForReport(inspectionStep, inspectionAggregated, {});
		expect(preview?.timingExceeded).toBe(false); // no timing evidence -> live recompute not late
		expect(preview?.persistedTimingExceeded).toBe(true); // ...but saved documentation still flows through
		expect(preview?.timingExceededRemarks).toBe('Machine cleaning took longer than planned');
	});
});

describe('isStepLate — no planned timing is never late', () => {
	it('missing planned timing (no bucket plannedTime, no master timing)', () => {
		const root = {
			'501': { startTime: '2026-06-01T08:00:00.000Z', endTime: '2026-06-01T08:06:40.000Z' }
		};
		expect(isStepLate(getStepTiming(inspectionStep, root))).toBe(false);
	});

	it('planned timing of zero', () => {
		expect(isStepLate({ plannedSec: 0, actualSec: 500 })).toBe(false);
	});

	it('actual within planned', () => {
		expect(isStepLate({ plannedSec: 120, actualSec: 100 })).toBe(false);
	});

	it('no actual recorded', () => {
		expect(isStepLate({ plannedSec: 120, actualSec: null })).toBe(false);
	});
});

describe('getLiveStepTimingStatus — wall clock from the delay-clock start', () => {
	it('sequence: late when now exceeds planned even though entry intervals were short', () => {
		// Sub-step entered in 30s, but 5 minutes have passed since it started (planned 60s)
		const root = {
			'300': {
				'40': {
					'11': { startTime: '2026-06-01T08:00:00.000Z', endTime: '2026-06-01T08:00:30.000Z' },
					duration: 30,
					plannedTime: 60
				}
			}
		};
		const now = new Date('2026-06-01T08:05:00.000Z').getTime();
		const status = getLiveStepTimingStatus(sequenceStep, root, undefined, now);
		expect(status.timingExceeded).toBe(true);
		expect(status.actualDuration).toBe(300);
		expect(status.plannedDuration).toBe(60);
		// The stored-interval computation would NOT flag this — that is exactly the old gap
		expect(getStepTimingStatus(sequenceStep, root).timingExceeded).toBe(false);
	});

	it('sequence: anchor is the earliest sub-step start (enriched stepStartTime preferred)', () => {
		const root = {
			'300': {
				'40': {
					stepStartTime: '2026-06-01T07:59:00.000Z',
					'11': { startTime: '2026-06-01T08:00:00.000Z', endTime: '2026-06-01T08:00:30.000Z' }
				}
			}
		};
		expect(getStepStartTimeIso(sequenceStep, root)).toBe('2026-06-01T07:59:00.000Z');
	});

	it('inspection: anchored to bucket startTime, not the entry-session end', () => {
		const root = {
			'501': { startTime: '2026-06-01T08:00:00.000Z', endTime: '2026-06-01T08:00:40.000Z', plannedTime: 120 }
		};
		const withinPlan = new Date('2026-06-01T08:01:00.000Z').getTime();
		expect(getLiveStepTimingStatus(inspectionStep, root, undefined, withinPlan).timingExceeded).toBe(false);
		const overrun = new Date('2026-06-01T08:03:00.000Z').getTime();
		expect(getLiveStepTimingStatus(inspectionStep, root, undefined, overrun).timingExceeded).toBe(true);
	});

	it('no recorded start yet -> not late', () => {
		const status = getLiveStepTimingStatus(sequenceStep, {}, undefined, new Date('2026-06-01T08:00:00.000Z').getTime());
		expect(status.timingExceeded).toBe(false);
		expect(status.actualDuration).toBe(0);
	});

	it('no planned timing -> never late regardless of elapsed time', () => {
		const stepWithoutPlan = {
			...(sequenceStep as unknown as Record<string, unknown>),
			stepGroup: { id: 40, processName: 'Mixing', processDescription: '', sequenceTiming: 0, steps: [{ id: 11 }] }
		} as unknown as TimelineStep;
		const root = {
			'300': { '40': { '11': { startTime: '2026-06-01T08:00:00.000Z', endTime: '2026-06-01T08:00:30.000Z' } } }
		};
		const muchLater = new Date('2026-06-01T18:00:00.000Z').getTime();
		expect(getLiveStepTimingStatus(stepWithoutPlan, root, undefined, muchLater).timingExceeded).toBe(false);
	});
});

describe('delay clock starts at the previous step’s completion', () => {
	// Previous timeline step: another sequence group completed at 08:00
	const previousSequenceStep = {
		stepNumber: 1,
		type: 'sequence',
		title: 'Prep',
		description: '',
		status: 'completed',
		ctq: false,
		prcTemplateStepId: 299,
		stepGroup: { id: 39, processName: 'Prep', processDescription: '', sequenceTiming: 60, steps: [{ id: 10 }] }
	} as unknown as TimelineStep;

	const setupStep = { stepNumber: 0, type: 'setup', title: 'Setup', description: '', status: 'completed', ctq: false } as unknown as TimelineStep;

	it('sequence: idle time after the previous step completed counts against this step', () => {
		const root = {
			'299': { '39': { stepCompleted: '2026-06-01T08:00:00.000Z' } },
			// Own entry only started at 08:20 and took 30s (planned 60s)
			'300': {
				'40': { '11': { startTime: '2026-06-01T08:20:00.000Z', endTime: '2026-06-01T08:20:30.000Z' }, plannedTime: 60 }
			}
		};
		expect(getStepClockStartIso(sequenceStep, previousSequenceStep, root)).toBe('2026-06-01T08:00:00.000Z');
		const now = new Date('2026-06-01T08:21:00.000Z').getTime();
		const status = getLiveStepTimingStatus(sequenceStep, root, previousSequenceStep, now);
		// 21 minutes since the previous step completed, not 60s since own entry started
		expect(status.actualDuration).toBe(1260);
		expect(status.timingExceeded).toBe(true);
		// Without the previous step, the same moment would NOT be late
		expect(getLiveStepTimingStatus(sequenceStep, root, undefined, now).timingExceeded).toBe(false);
	});

	it('first template step: anchored to setup completion (prcmetadata endTime)', () => {
		const root = {
			prcmetadata: { startTime: '2026-06-01T07:50:00.000Z', endTime: '2026-06-01T07:55:00.000Z' },
			'300': { '40': { plannedTime: 60 } }
		};
		expect(getStepClockStartIso(sequenceStep, setupStep, root)).toBe('2026-06-01T07:55:00.000Z');
		const now = new Date('2026-06-01T08:00:00.000Z').getTime();
		expect(getLiveStepTimingStatus(sequenceStep, root, setupStep, now).actualDuration).toBe(300);
	});

	it('previous step has no completion timestamp -> falls back to own first recorded start', () => {
		const root = {
			'299': { '39': {} },
			'300': {
				'40': { '11': { startTime: '2026-06-01T08:20:00.000Z', endTime: '2026-06-01T08:20:30.000Z' }, plannedTime: 60 }
			}
		};
		expect(getStepClockStartIso(sequenceStep, previousSequenceStep, root)).toBe('2026-06-01T08:20:00.000Z');
	});

	it('inspection: previous step completion anchors the clock too', () => {
		const root = {
			'299': { '39': { stepCompleted: '2026-06-01T08:00:00.000Z' } },
			'501': { startTime: '2026-06-01T08:10:00.000Z', endTime: '2026-06-01T08:10:40.000Z', plannedTime: 120 }
		};
		const now = new Date('2026-06-01T08:03:00.000Z').getTime();
		// 3 minutes after the previous step completed (planned 2 min) — late before entry even began
		expect(getLiveStepTimingStatus(inspectionStep, root, previousSequenceStep, now).timingExceeded).toBe(true);
	});
});

describe('getStepTimingStatus / readPersistedDelayMetadata', () => {
	it('maps nulls to zero durations for the preview shape', () => {
		const status = getStepTimingStatus(inspectionStep, {});
		expect(status).toEqual({ timingExceeded: false, actualDuration: 0, plannedDuration: 0 });
	});

	it('reads sequence delay metadata from the nested aggregated bucket', () => {
		const meta = readPersistedDelayMetadata(sequenceStep, sequenceAggregated);
		expect(meta.persistedTimingExceeded).toBe(true);
		expect(meta.timingExceededReasonCode).toBe('WIP');
		expect(meta.editedAfterSubmit?.at).toBe('2026-06-02T10:00:00.000Z');
	});

	it('returns empty metadata when the bucket is absent', () => {
		const meta = readPersistedDelayMetadata(sequenceStep, {});
		expect(meta.persistedTimingExceeded).toBe(false);
		expect(meta.timingExceededRemarks).toBe('');
		expect(meta.editedAfterSubmit).toBeUndefined();
	});
});
