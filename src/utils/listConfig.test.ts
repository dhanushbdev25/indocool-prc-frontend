import { describe, expect, it } from 'vitest';
import type { ListItemConfig } from '../types/list-config.types';
import {
	buildListSavedValue,
	createListItem,
	getListItemRangeStatus,
	initListValues,
	isListEntryDeviation,
	normalizeListConfig,
	parseListSavedValue,
	updateListValue,
	validateListValues
} from './listConfig';
import { getListItemProblems } from './listConfigSchema';

const item = (overrides: Partial<ListItemConfig>): ListItemConfig =>
	createListItem({ id: overrides.id ?? 'a', label: 'Temperature', ...overrides });

describe('getListItemRangeStatus', () => {
	const temp = item({ type: 'number', minimumAcceptanceValue: '20', maximumAcceptanceValue: '30' });

	it('judges a number against its range', () => {
		expect(getListItemRangeStatus(temp, '25')).toBe('InRange');
		expect(getListItemRangeStatus(temp, '19')).toBe('Lesser');
		expect(getListItemRangeStatus(temp, '31')).toBe('Greater');
	});

	it('supports a range open on one side', () => {
		const minOnly = item({ type: 'number', minimumAcceptanceValue: '5', maximumAcceptanceValue: '' });
		expect(getListItemRangeStatus(minOnly, '4')).toBe('Lesser');
		expect(getListItemRangeStatus(minOnly, '400')).toBe('InRange');
	});

	it('treats a blank or 0-to-0 range as no range', () => {
		expect(getListItemRangeStatus(item({ type: 'number' }), '5')).toBeNull();
		expect(
			getListItemRangeStatus(item({ type: 'number', minimumAcceptanceValue: 0, maximumAcceptanceValue: 0 }), '5')
		).toBeNull();
	});

	it('ignores non-number items and blank readings', () => {
		expect(getListItemRangeStatus(item({ type: 'text', minimumAcceptanceValue: '1' }), '5')).toBeNull();
		expect(getListItemRangeStatus(temp, '')).toBeNull();
	});
});

describe('validateListValues', () => {
	it('requires required items and skips optional and read-only ones', () => {
		const items = [
			item({ id: 'req', label: 'Operator' }),
			item({ id: 'opt', label: 'Remarks', required: false }),
			item({ id: 'ro', label: 'Mould', readOnly: true, defaultValue: 'M-1' })
		];
		const errors = validateListValues(items, initListValues(items), 'p_');
		expect(errors).toEqual({ p_req: 'Operator is required' });
	});

	it('rejects a non-number and asks to acknowledge an out-of-range number', () => {
		const temp = item({ type: 'number', minimumAcceptanceValue: '20', maximumAcceptanceValue: '30' });
		expect(validateListValues([temp], { a: { value: 'abc', comments: '', acknowledged: false } }, 'p_')).toEqual({
			p_a: 'Temperature must be a number'
		});
		expect(validateListValues([temp], { a: { value: '40', comments: '', acknowledged: false } }, 'p_')).toEqual({
			p_a_acknowledge: 'Temperature is out of range. Please acknowledge deviation.'
		});
		expect(validateListValues([temp], { a: { value: '40', comments: '', acknowledged: true } }, 'p_')).toEqual({});
	});

	it('requires a deviation number for ok with deviation', () => {
		const check = item({ type: 'ok/not ok', label: 'Surface' });
		expect(validateListValues([check], { a: { value: 'not ok', comments: '', acknowledged: false } }, 'p_')).toEqual({
			p_a_comments: 'Comment is required for OK with deviation'
		});
		expect(
			validateListValues([check], { a: { value: 'maybe', comments: '', acknowledged: false } }, 'p_')
		).toHaveProperty('p_a');
	});

	it('only accepts a known shift', () => {
		const shift = item({ type: 'shift', label: 'Shift' });
		expect(validateListValues([shift], { a: { value: 'Shift Z', comments: '', acknowledged: false } }, '')).toEqual({
			a: 'Shift must be a valid shift'
		});
	});
});

describe('saved value round trip', () => {
	const items = [
		item({ id: 't', type: 'number', minimumAcceptanceValue: '20', maximumAcceptanceValue: '30' }),
		item({ id: 'ro', label: 'Mould', readOnly: true, defaultValue: 'M-1' }),
		item({ id: 'c', label: 'Surface', type: 'ok/not ok' })
	];

	it('builds self-describing entries in master order', () => {
		let values = initListValues(items);
		values = updateListValue(values, items[0], { value: '35' });
		values = updateListValue(values, items[0], { acknowledged: true });
		values = updateListValue(values, items[2], { value: 'not ok', comments: 'DV-12' });

		expect(buildListSavedValue(items, values)).toEqual([
			{
				id: 't',
				label: 'Temperature',
				type: 'number',
				value: '35',
				validationStatus: 'Greater',
				minimumAcceptanceValue: '20',
				maximumAcceptanceValue: '30',
				acknowledged: true
			},
			{ id: 'ro', label: 'Mould', type: 'text', value: 'M-1' },
			{ id: 'c', label: 'Surface', type: 'ok/not ok', value: 'not ok', comments: 'DV-12' }
		]);
	});

	it('reloads saved answers, including the index-keyed shape a re-save produces', () => {
		const saved = { 0: { id: 't', label: 'Temperature', type: 'number', value: '22' } };
		expect(initListValues(items, saved).t).toEqual({ value: '22', comments: '', acknowledged: false });
		expect(parseListSavedValue(saved)).toHaveLength(1);
	});

	it('clears the acknowledgement and stale comment when the value changes', () => {
		let values = initListValues(items);
		values = updateListValue(values, items[2], { value: 'not ok', comments: 'DV-1' });
		values = updateListValue(values, items[2], { value: 'ok' });
		expect(values.c).toEqual({ value: 'ok', comments: '', acknowledged: false });
	});

	it('flags deviations for the preview', () => {
		expect(isListEntryDeviation({ id: 'x', label: 'x', type: 'number', value: '1', validationStatus: 'Lesser' })).toBe(
			true
		);
		expect(isListEntryDeviation({ id: 'x', label: 'x', type: 'ok/not ok', value: 'not ok' })).toBe(true);
		expect(isListEntryDeviation({ id: 'x', label: 'x', type: 'ok/not ok', value: 'ok' })).toBe(false);
	});
});

describe('normalizeListConfig', () => {
	it('fills defaults and drops junk', () => {
		expect(normalizeListConfig(null)).toBeNull();
		expect(normalizeListConfig({ items: [{ id: 'x', label: 'A', type: 'bogus' }, null] })).toEqual({
			items: [
				{
					id: 'x',
					label: 'A',
					type: 'text',
					required: true,
					readOnly: false,
					defaultValue: '',
					minimumAcceptanceValue: '',
					maximumAcceptanceValue: ''
				}
			]
		});
	});
});

describe('getListItemProblems', () => {
	it('reports blank and duplicate labels, empty read-only values and inverted ranges', () => {
		expect(
			getListItemProblems({
				items: [
					item({ id: '1', label: '' }),
					item({ id: '2', label: 'Temp' }),
					item({ id: '3', label: 'temp' }),
					item({ id: '4', label: 'Locked', readOnly: true, defaultValue: '' }),
					item({ id: '5', label: 'Range', type: 'number', minimumAcceptanceValue: '9', maximumAcceptanceValue: '1' })
				]
			})
		).toEqual({
			0: 'Label is required',
			2: 'Duplicate label "temp"',
			3: 'A read-only item needs a value',
			4: 'Minimum value cannot be greater than maximum value'
		});
	});
});
