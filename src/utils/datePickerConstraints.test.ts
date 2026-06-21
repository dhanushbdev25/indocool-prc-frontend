import dayjs from './dayjsSetup';
import { describe, expect, it, vi } from 'vitest';
import { APP_TIMEZONE } from './dateConfig';
import { getTodayMinDate } from './datePickerConstraints';

describe('getTodayMinDate', () => {
	it('returns start of today in app timezone', () => {
		const minDate = getTodayMinDate();
		const today = dayjs.tz(undefined, APP_TIMEZONE).startOf('day');

		expect(minDate.isSame(today, 'day')).toBe(true);
		expect(minDate.hour()).toBe(0);
		expect(minDate.minute()).toBe(0);
		expect(minDate.format('Z')).toBe(today.format('Z'));
	});

	it('uses India calendar date at UTC midnight boundary', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-06-20T20:00:00.000Z')); // 01:30 IST on June 21

		const minDate = getTodayMinDate();

		expect(minDate.format('YYYY-MM-DD')).toBe('2026-06-21');
		expect(minDate.format('Z')).toBe('+05:30');

		vi.useRealTimers();
	});
});
