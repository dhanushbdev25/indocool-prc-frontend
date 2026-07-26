import { describe, expect, it } from 'vitest';
import type { ExecutionData } from '../../types/execution.types';
import { buildPrcExecutionViewUrl, mapExecutionToQrLabel, unwrapExecutionDetail } from './mapExecutionToQrLabel';

const baseExecution = {
	id: 42,
	customer: 'CUST01',
	customerName: 'ENERCON',
	partNumber: 'EP3071723',
	partDescription: 'Segment Left 1A',
	drawingNumber: 'EP3071723',
	drawingRevision: 0,
	model: 'E138',
	productionSetId: '1005',
	date: '2026-05-15',
	orderId: ''
} as unknown as ExecutionData;

describe('mapExecutionToQrLabel', () => {
	it('maps detail fields for the sticker label', () => {
		const fields = mapExecutionToQrLabel(baseExecution);
		expect(fields.customerName).toBe('ENERCON');
		expect(fields.partNumber).toBe('EP3071723');
		expect(fields.revNo).toBe('0');
		expect(fields.modelNo).toBe('E138');
		expect(fields.setIdSerialNo).toBe('1005');
		expect(fields.productionDate).toBe('15/05/2026');
		expect(fields.purchaseOrderNo).toBe('');
		expect(fields.qrUrl).toContain('/prc-execution/view/42');
	});

	it('falls back customer code and revision aliases', () => {
		const fields = mapExecutionToQrLabel({
			...baseExecution,
			customerName: null,
			drawingRevision: null,
			partRevision: null,
			revNo: '3'
		} as ExecutionData);
		expect(fields.customerName).toBe('CUST01');
		expect(fields.revNo).toBe('3');
	});

	it('reads nested partMaster and snake_case keys', () => {
		const fields = mapExecutionToQrLabel({
			...baseExecution,
			drawingRevision: null,
			model: null,
			partMaster: {
				drawing_revision: 2,
				model_no: 'E160'
			}
		} as unknown as ExecutionData);
		expect(fields.revNo).toBe('2');
		expect(fields.modelNo).toBe('E160');
	});
});

describe('unwrapExecutionDetail', () => {
	it('unwraps { data } envelope', () => {
		expect(unwrapExecutionDetail({ data: baseExecution })?.id).toBe(42);
	});
});

describe('buildPrcExecutionViewUrl', () => {
	it('builds absolute view URL', () => {
		expect(buildPrcExecutionViewUrl(7, 'https://app.example')).toBe(
			'https://app.example/prc-execution/view/7'
		);
	});
});
