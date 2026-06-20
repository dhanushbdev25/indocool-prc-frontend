import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { getTodayMinDate } from './datePickerConstraints';

describe('getTodayMinDate', () => {
	it('returns start of today', () => {
		const minDate = getTodayMinDate();
		const today = dayjs().startOf('day');

		expect(minDate.isSame(today, 'day')).toBe(true);
		expect(minDate.hour()).toBe(0);
		expect(minDate.minute()).toBe(0);
	});
});
