import { describe, expect, it } from 'vitest';
import { mergeAggregatedData } from './dataBuilders';

type Nested = Record<string, Record<string, unknown>>;

const readParameter = (merged: Record<string, unknown>, stepId: string, parameterId: string) =>
	(merged[stepId] as Nested)[parameterId] as Record<string, unknown>;

describe('mergeAggregatedData', () => {
	// Arrays are `typeof === 'object'`, so merging them used to spread the rows into
	// `{ "0": {...} }`. Every read path gates on Array.isArray and silently fell back to a blank.
	it('keeps a re-saved row array an array', () => {
		const existing = { '26374': { '17174': { value: [{ 'Employee Code': '9946' }] } } };
		const incoming = { '26374': { '17174': { value: [{ 'Employee Code': '1234' }] } } };

		const merged = mergeAggregatedData(existing, incoming);

		expect(readParameter(merged, '26374', '17174').value).toEqual([{ 'Employee Code': '1234' }]);
	});

	it('replaces an annotation list instead of merging it index by index', () => {
		const existing = {
			'26383': { '17300': { annotations: [{ imageFileName: 'a.png' }, { imageFileName: 'b.png' }] } }
		};
		const incoming = { '26383': { '17300': { annotations: [{ imageFileName: 'a.png' }] } } };

		const merged = mergeAggregatedData(existing, incoming);

		expect(readParameter(merged, '26383', '17300').annotations).toEqual([{ imageFileName: 'a.png' }]);
	});

	// Existing executions already hold the index-keyed shape; the next save should hand back a
	// clean array rather than merging into it.
	it('overwrites the legacy index-keyed shape with the incoming array', () => {
		const existing = { '26374': { '17174': { value: { 0: { 'Employee Code': '9946' } } } } };
		const incoming = { '26374': { '17174': { value: [{ 'Employee Code': '9946' }] } } };

		const merged = mergeAggregatedData(existing, incoming);

		expect(readParameter(merged, '26374', '17174').value).toEqual([{ 'Employee Code': '9946' }]);
	});

	it('still deep-merges plain objects, keeping parameters the new save left out', () => {
		const existing = { '26374': { '17175': { value: '0' }, '17176': { value: '2' } } };
		const incoming = { '26374': { '17175': { value: '1' } } };

		const merged = mergeAggregatedData(existing, incoming);

		expect(merged['26374']).toEqual({ '17175': { value: '1' }, '17176': { value: '2' } });
	});

	it('still preserves responsiblePersons on sequence step data', () => {
		const existing = { '26372': { '900': { '901': { value: '5', responsiblePersons: [{ id: 7 }] } } } };
		const incoming = { '26372': { '900': { '901': { value: '6' } } } };

		const merged = mergeAggregatedData(existing, incoming);

		expect(readParameter(merged, '26372', '900')['901']).toEqual({
			value: '6',
			responsiblePersons: [{ id: 7 }]
		});
	});
});
