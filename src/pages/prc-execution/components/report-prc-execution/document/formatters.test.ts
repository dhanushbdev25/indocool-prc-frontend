import { describe, expect, it } from 'vitest';
import {
	aggregateResult,
	dash,
	exactResult,
	isNotOk,
	okNotOkResult,
	rangeResult,
	readingsResult,
	statusWord,
	withUnit
} from './formatters';

describe('dash', () => {
	it('prints empty values as a dash and keeps zero', () => {
		expect(dash(undefined)).toBe('—');
		expect(dash(null)).toBe('—');
		expect(dash('  ')).toBe('—');
		expect(dash(0)).toBe('0');
		expect(dash('7.03')).toBe('7.03');
	});
});

describe('withUnit', () => {
	it('appends a real unit only', () => {
		expect(withUnit('12', 'mm')).toBe('12 mm');
		expect(withUnit('12', 'None')).toBe('12');
		expect(withUnit('12', '')).toBe('12');
		expect(withUnit('', 'mm')).toBe('—');
		expect(withUnit(0, 'mm')).toBe('0 mm');
	});
});

describe('statusWord', () => {
	it('maps timeline statuses to words', () => {
		expect(statusWord('completed')).toBe('Completed');
		expect(statusWord('in-progress')).toBe('In progress');
		expect(statusWord('pending')).toBe('Pending');
	});
});

describe('result rules', () => {
	it('maps range statuses', () => {
		expect(rangeResult('Accepted')).toBe('OK');
		expect(rangeResult('InRange')).toBe('OK');
		expect(rangeResult('Lesser')).toBe('Low');
		expect(rangeResult('Greater')).toBe('High');
		expect(rangeResult('Greater', true)).toBe('High (ack.)');
		expect(rangeResult(undefined)).toBe('—');
	});

	it('compares exact-value targets', () => {
		expect(exactResult('5', '5')).toBe('OK');
		expect(exactResult('5.2', '5')).toBe('Deviation +0.2');
		expect(exactResult('4.75', '5')).toBe('Deviation -0.25');
		expect(exactResult('', '5')).toBe('—');
	});

	it('labels ok / not ok values', () => {
		expect(okNotOkResult('ok')).toBe('OK');
		expect(okNotOkResult('not ok')).toBe('OK with deviation');
		expect(okNotOkResult('not applicable')).toBe('Not applicable');
		expect(okNotOkResult('')).toBe('—');
	});

	it('aggregates entries of a list or table', () => {
		expect(aggregateResult(['OK', 'High'])).toBe('Not OK');
		expect(aggregateResult(['OK', 'OK with deviation'])).toBe('Not OK');
		expect(aggregateResult(['OK', '—'])).toBe('OK');
		expect(aggregateResult(['—'])).toBe('—');
		expect(aggregateResult([])).toBe('—');
	});

	it('summarises several readings', () => {
		expect(readingsResult(['OK', 'OK'])).toBe('OK');
		expect(readingsResult(['OK', 'Low', 'Deviation +1'])).toBe('Not OK (2 of 3)');
		expect(readingsResult(['—'])).toBe('—');
	});

	it('flags results that need attention', () => {
		expect(isNotOk('High (ack.)')).toBe(true);
		expect(isNotOk('Deviation +0.2')).toBe(true);
		expect(isNotOk('Not OK (1 of 2)')).toBe(true);
		expect(isNotOk('OK with deviation')).toBe(true);
		expect(isNotOk('OK')).toBe(false);
		expect(isNotOk('Not applicable')).toBe(false);
		expect(isNotOk('—')).toBe(false);
	});
});
