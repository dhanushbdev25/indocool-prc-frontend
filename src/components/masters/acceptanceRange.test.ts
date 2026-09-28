import { describe, expect, it } from 'vitest';
import { formatAcceptanceRange } from './acceptanceRange';

describe('formatAcceptanceRange', () => {
	it('formats a configured band', () => {
		expect(formatAcceptanceRange(5, 10)).toBe('5 to 10');
		expect(formatAcceptanceRange('5', '10')).toBe('5 to 10');
	});

	it('treats a 0 to 0 band as no range', () => {
		// The masters coerce a blank number field to 0, so 0-to-0 means the author configured
		// nothing — printing it as "0 to 0" reads as "must equal zero", which is wrong.
		expect(formatAcceptanceRange(0, 0)).toBeNull();
		expect(formatAcceptanceRange('0', '0')).toBeNull();
	});

	it('keeps a band that legitimately starts at zero', () => {
		expect(formatAcceptanceRange(0, 10)).toBe('0 to 10');
	});

	it('reports nothing when neither bound is set', () => {
		expect(formatAcceptanceRange(undefined, undefined)).toBeNull();
		expect(formatAcceptanceRange(null, null)).toBeNull();
		expect(formatAcceptanceRange('', '  ')).toBeNull();
	});

	it('shows a one-sided band with a dash for the missing end', () => {
		expect(formatAcceptanceRange(5, null)).toBe('5 to -');
		expect(formatAcceptanceRange(null, 10)).toBe('- to 10');
	});

	it('ignores values that are not numbers', () => {
		expect(formatAcceptanceRange('abc', 'def')).toBeNull();
	});
});
