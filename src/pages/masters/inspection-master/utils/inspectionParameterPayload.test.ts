import { describe, expect, it } from 'vitest';
import {
	stripInspectionParameterIds,
	toInspectionParameterFormValues,
	toInspectionParameterRequests,
	type InspectionParameterFormValues
} from './inspectionParameterPayload';
import type { InspectionParameter } from '../../../../store/api/business/inspection-master/inspection.validators';

const apiParameter = (overrides: Partial<InspectionParameter> = {}): InspectionParameter => ({
	id: 101,
	order: 1,
	parameterName: 'Diameter',
	specification: 'Ø 12mm',
	type: 'number',
	files: {},
	columns: [],
	role: 'QUALITY_ENGINEER',
	ctq: false,
	...overrides
});

// Same boundary cast the helper uses — the Yup-inferred form type is stricter
// than what the form actually holds at runtime.
const formValue = (overrides: Record<string, unknown> = {}): InspectionParameterFormValues =>
	({
		order: 1,
		parameterName: 'Brand new',
		type: 'text',
		files: {},
		columns: [],
		role: 'QUALITY_ENGINEER',
		ctq: false,
		...overrides
	}) as unknown as InspectionParameterFormValues;

describe('toInspectionParameterFormValues', () => {
	it('carries the database id so edits can be sent back', () => {
		const [param] = toInspectionParameterFormValues([apiParameter({ id: 4210 })]);

		expect(param.id).toBe(4210);
	});

	it('omits id when the API row has none', () => {
		const [param] = toInspectionParameterFormValues([apiParameter({ id: undefined })]);

		expect(param).not.toHaveProperty('id');
	});

	it('sorts by stored order and renumbers sequentially', () => {
		const values = toInspectionParameterFormValues([
			apiParameter({ id: 2, order: 2, parameterName: 'Second' }),
			apiParameter({ id: 1, order: 1, parameterName: 'First' })
		]);

		expect(values.map(p => [p.parameterName, p.id, p.order])).toEqual([
			['First', 1, 1],
			['Second', 2, 2]
		]);
	});
});

describe('stripInspectionParameterIds', () => {
	it('drops ids so a clone inserts new rows instead of colliding', () => {
		const cloned = stripInspectionParameterIds(toInspectionParameterFormValues([apiParameter({ id: 4210 })]));

		expect(cloned[0]).not.toHaveProperty('id');
		expect(cloned[0].parameterName).toBe('Diameter');
	});

	it('keeps the criticality tag on a clone', () => {
		const cloned = stripInspectionParameterIds(
			toInspectionParameterFormValues([apiParameter({ id: 4210, criticalityTag: 'CTA' })])
		);

		expect(cloned[0].criticalityTag).toBe('CTA');
	});
});

describe('toInspectionParameterRequests', () => {
	it('sends the id so the backend reuses the existing row', () => {
		const [request] = toInspectionParameterRequests(toInspectionParameterFormValues([apiParameter({ id: 4210 })]));

		expect(request.id).toBe(4210);
	});

	it('omits id for newly added parameters', () => {
		const [request] = toInspectionParameterRequests([formValue()]);

		expect(request).not.toHaveProperty('id');
	});

	it('preserves tableConfig and getInstrumentId', () => {
		const tableConfig = {
			columns: [{ name: 'Reading', type: 'number' as const }],
			rows: [{ cells: { Reading: { value: '', readOnly: false } } }]
		};

		const [request] = toInspectionParameterRequests(
			toInspectionParameterFormValues([
				apiParameter({ id: 7, type: 'fixed-table', tableConfig, getInstrumentId: true })
			])
		);

		expect(request.tableConfig).toEqual(tableConfig);
		expect(request.getInstrumentId).toBe(true);
	});

	it('sends a Gate parameter as ctq with no tag', () => {
		const [request] = toInspectionParameterRequests(
			toInspectionParameterFormValues([apiParameter({ ctq: true, criticalityTag: null })])
		);

		expect(request.ctq).toBe(true);
		expect(request.criticalityTag).toBeNull();
	});

	it('sends a CTA parameter as a tag with ctq off, so it never gates execution', () => {
		const [request] = toInspectionParameterRequests(
			toInspectionParameterFormValues([apiParameter({ ctq: false, criticalityTag: 'CTA' })])
		);

		expect(request.ctq).toBe(false);
		expect(request.criticalityTag).toBe('CTA');
	});

	it('clears the tag rather than omitting it, so switching CTA back to Not Gate sticks', () => {
		const [request] = toInspectionParameterRequests([formValue({ ctq: false, criticalityTag: null })]);

		expect(request).toHaveProperty('criticalityTag');
		expect(request.criticalityTag).toBeNull();
	});

	it('drops an unrecognised tag instead of forwarding it', () => {
		const [request] = toInspectionParameterRequests(
			toInspectionParameterFormValues([apiParameter({ criticalityTag: 'NOT_A_TAG' })])
		);

		expect(request.criticalityTag).toBeNull();
	});

	it('renumbers order from the array position', () => {
		const requests = toInspectionParameterRequests([
			formValue({ order: 9, parameterName: 'A' }),
			formValue({ order: 4, parameterName: 'B' })
		]);

		expect(requests.map(r => r.order)).toEqual([1, 2]);
	});
});
