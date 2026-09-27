/**
 * Demoulding inspection is exempt from planned timing. The part cures in the mould for hours,
 * so a planned duration there is meaningless and the step would always read as overrun — which
 * forced a delay reason + remarks out of the operator on every single PRC.
 *
 * The exemption is applied once, in `getStepTiming`, so it reaches the card flag, the live
 * remarks prompt and the report builders together. These tests pin both halves: demould never
 * carries planned timing or a delay gate, and every other inspection is untouched.
 */
import { describe, expect, it } from 'vitest';
import type { TimelineStep } from '../types/execution.types';
import {
	getLiveStepTimingStatus,
	getStepTiming,
	getStepTimingStatus,
	readPersistedDelayMetadata
} from './timelineCardTiming';

const TEMPLATE_STEP_ID = 612;

/** An inspection step keyed at `TEMPLATE_STEP_ID`; `type` is what marks it as demould. */
const inspectionStep = (inspectionType: string): TimelineStep =>
	({
		stepNumber: 4,
		type: 'inspection',
		title: inspectionType,
		description: '',
		status: 'completed',
		ctq: false,
		stepData: { prcTemplateStepId: TEMPLATE_STEP_ID },
		inspectionMetadata: {
			id: 378,
			type: inspectionType,
			inspectionName: inspectionType,
			inspectionTiming: 60 // master planned duration
		}
	}) as unknown as TimelineStep;

const demouldStep = inspectionStep('Demould Inspection');
const firStep = inspectionStep('FIR');

/** Ran 400s against a 120s plan — comfortably late by the shared rule. */
const timingRoot = {
	[TEMPLATE_STEP_ID]: {
		startTime: '2026-06-01T08:00:00.000Z',
		endTime: '2026-06-01T08:06:40.000Z',
		plannedTime: 120
	}
};

describe('getStepTiming — demould planned timing', () => {
	it('reports no planned time for demould even when the bucket carries one', () => {
		expect(getStepTiming(demouldStep, timingRoot).plannedSec).toBeNull();
	});

	it('ignores the master inspectionTiming fallback for demould', () => {
		expect(getStepTiming(demouldStep, {}).plannedSec).toBeNull();
	});

	it('still measures how long demould actually took', () => {
		expect(getStepTiming(demouldStep, timingRoot).actualSec).toBe(400);
	});

	it('leaves the planned timing of every other inspection alone', () => {
		expect(getStepTiming(firStep, timingRoot).plannedSec).toBe(120);
		expect(getStepTiming(firStep, {}).plannedSec).toBe(60);
	});
});

describe('timing validation — demould is never late', () => {
	it('does not flag a completed demould step that ran past the plan', () => {
		const status = getStepTimingStatus(demouldStep, timingRoot);

		expect(status.timingExceeded).toBe(false);
		expect(status.plannedDuration).toBe(0);
		expect(status.actualDuration).toBe(400);
	});

	it('does not flag an in-progress demould step however long it stays open', () => {
		const tenHoursLater = new Date('2026-06-01T18:00:00.000Z').getTime();

		expect(getLiveStepTimingStatus(demouldStep, timingRoot, undefined, tenHoursLater).timingExceeded).toBe(false);
	});

	it('still flags a non-demould inspection that ran past the plan', () => {
		expect(getStepTimingStatus(firStep, timingRoot).timingExceeded).toBe(true);
		const tenHoursLater = new Date('2026-06-01T18:00:00.000Z').getTime();
		expect(getLiveStepTimingStatus(firStep, timingRoot, undefined, tenHoursLater).timingExceeded).toBe(true);
	});
});

describe('readPersistedDelayMetadata — demould', () => {
	const aggregated = {
		[TEMPLATE_STEP_ID]: {
			stepCompleted: true,
			timingExceeded: true,
			timingExceededRemarks: 'Waited for the mould to cool',
			timingExceededReasonCode: 'RM',
			timingExceededReasonLabel: 'Raw Material Shortage',
			editedAfterSubmit: true,
			editedAfterSubmitAt: '2026-06-02T09:00:00.000Z'
		}
	};

	it('drops delay documentation saved before the exemption', () => {
		const meta = readPersistedDelayMetadata(demouldStep, aggregated);

		// Surfacing it would put a Timing Exceeded panel back on the one step meant to have none.
		expect(meta.persistedTimingExceeded).toBe(false);
		expect(meta.timingExceededRemarks).toBe('');
		expect(meta.timingExceededReasonCode).toBeUndefined();
		expect(meta.timingExceededReasonLabel).toBeUndefined();
	});

	it('keeps the unrelated edited-after-submit marker', () => {
		expect(readPersistedDelayMetadata(demouldStep, aggregated).editedAfterSubmit).toEqual({
			at: '2026-06-02T09:00:00.000Z'
		});
	});

	it('leaves delay documentation on other inspections intact', () => {
		const meta = readPersistedDelayMetadata(firStep, aggregated);

		expect(meta.persistedTimingExceeded).toBe(true);
		expect(meta.timingExceededRemarks).toBe('Waited for the mould to cool');
		expect(meta.timingExceededReasonCode).toBe('RM');
		expect(meta.timingExceededReasonLabel).toBe('Raw Material Shortage');
	});
});
