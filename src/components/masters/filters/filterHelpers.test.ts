import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import { matchesDateRange, toIsoDateOnly } from './filterHelpers';

describe('toIsoDateOnly', () => {
	it('keeps the picked calendar day', () => {
		expect(toIsoDateOnly(dayjs('2026-09-01'))).toBe('2026-09-01');
		expect(toIsoDateOnly(dayjs('2026-09-10'))).toBe('2026-09-10');
	});

	/**
	 * Regression: the picker hands back a local midnight. `toISOString()` on that shifts the
	 * calendar day backwards in any timezone ahead of UTC, which sent dates a day early.
	 */
	it('does not shift the day for a local midnight', () => {
		const localMidnight = dayjs(new Date(2026, 8, 1, 0, 0, 0));
		expect(toIsoDateOnly(localMidnight)).toBe('2026-09-01');
		// The old implementation produced 2026-08-31 here whenever the runner was ahead of UTC.
		expect(toIsoDateOnly(localMidnight)).not.toBe('2026-08-31');
	});

	it('keeps the day for an end-of-day local time', () => {
		expect(toIsoDateOnly(dayjs(new Date(2026, 8, 1, 23, 59, 59)))).toBe('2026-09-01');
	});

	it('returns null for empty or invalid input', () => {
		expect(toIsoDateOnly(null)).toBeNull();
		expect(toIsoDateOnly(dayjs('not-a-date'))).toBeNull();
	});
});

describe('matchesDateRange', () => {
	it('includes both bounds inclusively for date-only filter values', () => {
		const filter = { from: '2026-09-01', to: '2026-09-10' };
		expect(matchesDateRange('2026-09-01T00:00:00', filter)).toBe(true);
		expect(matchesDateRange('2026-09-10T23:30:00', filter)).toBe(true);
		expect(matchesDateRange('2026-08-31T23:59:00', filter)).toBe(false);
		expect(matchesDateRange('2026-09-11T00:01:00', filter)).toBe(false);
	});

	it('does not narrow when the filter is empty', () => {
		expect(matchesDateRange('2026-09-01', { from: null, to: null })).toBe(true);
		expect(matchesDateRange('2026-09-01', undefined)).toBe(true);
	});
});
