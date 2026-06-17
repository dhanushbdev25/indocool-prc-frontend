import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import {
	formatDateColumnStorageValue,
	formatTableCellDisplay
} from './formatTableCellDisplay';

describe('formatDateColumnStorageValue', () => {
	it('stores date as YYYY-MM-DD', () => {
		expect(formatDateColumnStorageValue(dayjs('2026-06-17'))).toBe('2026-06-17');
	});

	it('returns empty string for null', () => {
		expect(formatDateColumnStorageValue(null)).toBe('');
	});
});

describe('formatTableCellDisplay', () => {
	it('formats date column values for display', () => {
		expect(formatTableCellDisplay('date', '2026-06-17')).toBe('17 Jun 2026');
	});

	it('returns em dash for empty date values', () => {
		expect(formatTableCellDisplay('date', '')).toBe('—');
		expect(formatTableCellDisplay('date', null)).toBe('—');
	});

	it('passes through non-date column values unchanged', () => {
		expect(formatTableCellDisplay('text', 'hello')).toBe('hello');
		expect(formatTableCellDisplay('datetime', '2026-06-17T14:30')).toBe('2026-06-17T14:30');
	});

	it('returns raw value when date parse fails', () => {
		expect(formatTableCellDisplay('date', 'not-a-date')).toBe('not-a-date');
	});
});
