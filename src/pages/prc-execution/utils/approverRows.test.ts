import { describe, expect, it } from 'vitest';
import type { TimelineStep } from '../types/execution.types';
import { buildApproverRows } from './approverRows';

const meta = (over: Partial<Parameters<typeof buildApproverRows>[0]> = {}) => ({
	startTime: null,
	endTime: null,
	productionApprovedBy: null,
	qualityApprovedBy: null,
	dataEnteredBy: null,
	...over
});

describe('buildApproverRows', () => {
	it('labels a quality-only inspection approval as quality', () => {
		const step = {
			type: 'inspection',
			inspectionMetadata: { approveByQuality: true, approveByProduction: false }
		} as unknown as TimelineStep;
		const rows = buildApproverRows(meta({ productionApprovedBy: { name: 'Priya' } }), step);
		expect(rows.map(r => r.label)).toEqual(['Quality approved by']);
	});

	it('labels a sequence approval as production', () => {
		const step = { type: 'sequence' } as unknown as TimelineStep;
		const rows = buildApproverRows(meta({ productionApprovedBy: { name: 'Kumar' } }), step);
		expect(rows.map(r => r.label)).toEqual(['Production approved by']);
	});

	it('shows who recorded the data when nobody approved it', () => {
		const step = { type: 'bom' } as unknown as TimelineStep;
		const rows = buildApproverRows(meta({ dataEnteredBy: { name: 'Ravi' } }), step);
		expect(rows.map(r => r.label)).toEqual(['Recorded by']);
	});
});
