import { describe, expect, it } from 'vitest';
import type { ExecutionData, TimelineStep } from '../../../types/execution.types';
import { mapHeader } from './mapHeader';
import { mapSectionShell } from './mapSectionShell';

const execution = {
	orderId: 1000123,
	date: '2026-11-21',
	partNumber: 'FG-20418',
	sapReferenceNumber: '',
	partDescription: 'Nacelle cover',
	drawingNumber: 'DRW-1',
	customer: 'Vestas',
	customerVariantName: null,
	mouldCode: 'MC1',
	mouldId: 'M1',
	productionSetId: '77',
	reservation: null,
	status: 'completed',
	remarks: '',
	prcAggregatedSteps: { prcmetadata: { prcSetId: '1933', productionSetId: '119' } }
} as unknown as ExecutionData;

describe('mapHeader', () => {
	it('lists the header fields with dashes for blanks', () => {
		const header = mapHeader(execution);
		const byLabel = Object.fromEntries(header.fields.map(f => [f.label, f.value]));
		expect(header.subtitle).toBeUndefined();
		expect(header.orderNo).toBe('1000123');
		expect(header.date).toBe('21/11/2026');
		expect(byLabel['SAP no.']).toBe('—');
		expect(byLabel['Mould']).toBe('MC1 · M1');
		expect(byLabel['PRC Set ID']).toBe('1933');
		expect(byLabel['SAP Set ID']).toBe('119');
		expect(header.remarks).toBe('—');
	});

	it('falls back to the execution SAP set when setup saved none', () => {
		const header = mapHeader({ ...execution, prcAggregatedSteps: {} } as unknown as ExecutionData);
		expect(header.fields.find(f => f.label === 'SAP Set ID')?.value).toBe('77');
	});

	it('names the step in a single-step report', () => {
		const step = { stepNumber: 4, title: 'Final inspection' } as TimelineStep;
		expect(mapHeader(execution, step).subtitle).toBe('4. Final inspection');
	});
});

describe('mapSectionShell', () => {
	const inspection = {
		stepNumber: 5,
		title: 'FIR',
		type: 'inspection',
		status: 'in-progress',
		ctq: true,
		stepData: { prcTemplateStepId: 31 },
		inspectionMetadata: { approveByQuality: true, approveByProduction: false }
	} as unknown as TimelineStep;

	it('builds status, gate, timing, quality approval and notices', () => {
		const tim = {
			31: {
				startTime: '2026-11-21T08:00:00Z',
				endTime: '2026-11-21T08:30:00Z',
				plannedTime: 1200,
				productionApprovedBy: { name: 'Priya', employeeNo: 'E9' }
			}
		};
		const agg = {
			31: {
				timingExceeded: true,
				timingExceededReasonLabel: 'Machine down',
				timingExceededRemarks: 'Pump',
				editedAfterSubmit: true
			}
		};
		const shell = mapSectionShell(inspection, 's5', agg, tim);
		expect(shell.status).toBe('In progress');
		expect(shell.gate).toBe(true);
		expect(shell.meta.map(m => m.label)).toEqual(['Start time', 'Planned duration', 'Actual duration']);
		expect(shell.meta[1].value).toBe('00:20:00');
		expect(shell.meta[2].value).toBe('00:30:00');
		expect(shell.approvals).toEqual([{ label: 'Quality approved by', value: 'Priya (E9)' }]);
		expect(shell.notices).toEqual(['Timing exceeded — reason: Machine down, remarks: Pump', 'Edited after submission']);
	});

	it('leaves out timing cells that were never recorded', () => {
		const shell = mapSectionShell({ ...inspection, inspectionMetadata: {} } as TimelineStep, 's5', {}, {});
		expect(shell.meta).toEqual([]);
		expect(shell.approvals).toEqual([]);
		expect(shell.notices).toEqual([]);
	});
});
