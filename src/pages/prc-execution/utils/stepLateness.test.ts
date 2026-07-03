/**
 * Regression tests for the delay-remarks preview bug: the card flag, the live remarks prompt,
 * and the report builders must derive lateness from the same computation (`getStepTiming` +
 * `isStepLate`), and persisted delay documentation must survive into the report preview data
 * even when the live recompute disagrees.
 */
import { describe, expect, it } from 'vitest';
import type { TimelineStep } from '../types/execution.types';
import { buildInspectionStepPreviewForReport, buildSequenceStepPreviewForReport } from './reportStepPreviewData';
import { getStepTiming, getStepTimingStatus, isStepLate, readPersistedDelayMetadata } from './timelineCardTiming';

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
