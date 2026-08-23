import { describe, expect, it } from 'vitest';
import {
	stripProcessStepGroupIds,
	toProcessStepGroupFormValues,
	toProcessStepGroupRequests,
	toProcessStepGroupRequestsFromDetail,
	type ProcessStepGroupFormValues
} from './processStepGroupPayload';
import type { ProcessStep, ProcessStepGroup } from '../../../../store/api/business/sequence-master/sequence.validators';

const apiStep = (overrides: Partial<ProcessStep> = {}): ProcessStep =>
	({
		id: 501,
		processStepGroupId: 90,
		version: 1,
		isLatest: true,
		parameterDescription: 'Check thickness',
		stepNumber: 1,
		evaluationMethod: 'Visual',
		targetValueType: 'range',
		minimumAcceptanceValue: '1',
		maximumAcceptanceValue: '5',
		multipleMeasurements: false,
		multipleMeasurementMaxCount: null,
		uom: 'mm',
		ctq: false,
		allowAttachments: false,
		notes: '',
		createdAt: '',
		updatedAt: '',
		...overrides
	}) as ProcessStep;

const apiGroup = (overrides: Partial<ProcessStepGroup> = {}): ProcessStepGroup =>
	({
		id: 90,
		processSequenceId: 7,
		version: 1,
		isLatest: true,
		sequence: 1,
		processName: 'Moulding',
		processDescription: 'Mould the part',
		sequenceTiming: 600,
		shift: 'Shift A',
		pfdNumber: 'PFD-1',
		createdAt: '',
		updatedAt: '',
		steps: [apiStep()],
		...overrides
	}) as ProcessStepGroup;

describe('toProcessStepGroupFormValues', () => {
	it('carries group and step ids', () => {
		const [group] = toProcessStepGroupFormValues([apiGroup({ id: 90, steps: [apiStep({ id: 501 })] })]);

		expect(group.id).toBe(90);
		expect(group.processSteps?.[0]?.id).toBe(501);
	});

	it('omits ids the API did not provide', () => {
		const [group] = toProcessStepGroupFormValues([
			apiGroup({ id: undefined as unknown as number, steps: [apiStep({ id: undefined as unknown as number })] })
		]);

		expect(group).not.toHaveProperty('id');
		expect(group.processSteps?.[0]).not.toHaveProperty('id');
	});

	it('orders groups by their stored sequence', () => {
		const values = toProcessStepGroupFormValues([
			apiGroup({ id: 2, sequence: 2, processName: 'Second' }),
			apiGroup({ id: 1, sequence: 1, processName: 'First' })
		]);

		expect(values.map(g => [g.processName, g.id])).toEqual([
			['First', 1],
			['Second', 2]
		]);
	});
});

describe('stripProcessStepGroupIds', () => {
	it('drops group and nested step ids so a clone inserts new rows', () => {
		const cloned = stripProcessStepGroupIds(toProcessStepGroupFormValues([apiGroup()]));

		expect(cloned[0]).not.toHaveProperty('id');
		expect(cloned[0].processSteps?.[0]).not.toHaveProperty('id');
		expect(cloned[0].processSteps?.[0]?.parameterDescription).toBe('Check thickness');
	});
});

describe('toProcessStepGroupRequests', () => {
	it('sends group and step ids so the backend reuses the rows', () => {
		const [request] = toProcessStepGroupRequests(toProcessStepGroupFormValues([apiGroup()]));

		expect(request.id).toBe(90);
		expect(request.processSteps[0].id).toBe(501);
	});

	it('omits ids for newly added groups and steps', () => {
		const [request] = toProcessStepGroupRequests([
			{
				sequence: 1,
				processName: 'New group',
				processDescription: 'desc',
				sequenceTiming: '00:10',
				processSteps: [
					{
						parameterDescription: 'New step',
						stepNumber: 1,
						evaluationMethod: 'Visual',
						targetValueType: 'ok/not ok',
						notes: ''
					}
				]
			} as unknown as ProcessStepGroupFormValues
		]);

		expect(request).not.toHaveProperty('id');
		expect(request.processSteps[0]).not.toHaveProperty('id');
	});
});

describe('toProcessStepGroupRequestsFromDetail', () => {
	it('keeps ids without round-tripping timing through HH:MM', () => {
		const [request] = toProcessStepGroupRequestsFromDetail([
			apiGroup({ id: 90, sequenceTiming: 4788000, steps: [apiStep({ id: 501 })] })
		]);

		expect(request.id).toBe(90);
		expect(request.processSteps[0].id).toBe(501);
		// 4788000s cannot survive an HH:MM round-trip; it must pass through untouched.
		expect(request.sequenceTiming).toBe(4788000);
	});

	it('preserves a zero duration rather than promoting it to one minute', () => {
		const [request] = toProcessStepGroupRequestsFromDetail([apiGroup({ sequenceTiming: 0 })]);

		expect(request.sequenceTiming).toBe(0);
	});

	it('keeps shift, pfdNumber and tableConfig that the delete path used to drop', () => {
		const tableConfig = { columns: [{ name: 'Reading', type: 'number' as const }], rows: [] };
		const [request] = toProcessStepGroupRequestsFromDetail([
			apiGroup({
				shift: 'Shift B',
				pfdNumber: 'PFD-9',
				steps: [apiStep({ targetValueType: 'table', tableConfig })]
			})
		]);

		expect(request.shift).toBe('Shift B');
		expect(request.pfdNumber).toBe('PFD-9');
		expect(request.processSteps[0].tableConfig).toEqual(tableConfig);
	});

	it('parses numeric acceptance values out of their string form', () => {
		const [request] = toProcessStepGroupRequestsFromDetail([
			apiGroup({ steps: [apiStep({ minimumAcceptanceValue: '1.5', maximumAcceptanceValue: null })] })
		]);

		expect(request.processSteps[0].minimumAcceptanceValue).toBe(1.5);
		expect(request.processSteps[0].maximumAcceptanceValue).toBeNull();
	});
});

describe('criticality round-trip', () => {
	it('sends a CTQ step as ctq with no tag', () => {
		const [group] = toProcessStepGroupRequests(
			toProcessStepGroupFormValues([apiGroup({ steps: [apiStep({ ctq: true, criticalityTag: null })] })])
		);

		expect(group.processSteps[0].ctq).toBe(true);
		expect(group.processSteps[0].criticalityTag).toBeNull();
	});

	it.each(['CTA', 'CTP'])('sends a %s step as a tag with ctq off, so it never gates execution', tag => {
		const [group] = toProcessStepGroupRequests(
			toProcessStepGroupFormValues([apiGroup({ steps: [apiStep({ ctq: false, criticalityTag: tag })] })])
		);

		expect(group.processSteps[0].ctq).toBe(false);
		expect(group.processSteps[0].criticalityTag).toBe(tag);
	});

	it('clears the tag rather than omitting it, so switching a tag back to None sticks', () => {
		const [group] = toProcessStepGroupRequests(
			toProcessStepGroupFormValues([apiGroup({ steps: [apiStep({ ctq: false, criticalityTag: null })] })])
		);

		expect(group.processSteps[0]).toHaveProperty('criticalityTag');
		expect(group.processSteps[0].criticalityTag).toBeNull();
	});

	it('drops an unrecognised tag instead of forwarding it', () => {
		const [group] = toProcessStepGroupRequests(
			toProcessStepGroupFormValues([apiGroup({ steps: [apiStep({ criticalityTag: 'NOT_A_TAG' })] })])
		);

		expect(group.processSteps[0].criticalityTag).toBeNull();
	});

	it('keeps the tag on a clone', () => {
		const [group] = stripProcessStepGroupIds(
			toProcessStepGroupFormValues([apiGroup({ steps: [apiStep({ criticalityTag: 'CTP' })] })])
		);

		expect(group.processSteps?.[0]?.criticalityTag).toBe('CTP');
	});

	it('carries the tag through the deactivate path, which resends children untouched', () => {
		const [group] = toProcessStepGroupRequestsFromDetail([apiGroup({ steps: [apiStep({ criticalityTag: 'CTA' })] })]);

		expect(group.processSteps[0].criticalityTag).toBe('CTA');
	});
});
