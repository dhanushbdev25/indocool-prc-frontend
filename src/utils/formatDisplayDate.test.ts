import { describe, expect, it } from 'vitest';
import { formatDisplayDate, formatDisplayDateTime, isIsoDateOnly } from './formatDisplayDate';

describe('formatDisplayDate', () => {
	it('formats an ISO date as DD/MM/YYYY', () => {
		expect(formatDisplayDate('2026-06-17')).toBe('17/06/2026');
	});

	// Local-time input so the assertion does not depend on the runner's timezone.
	it('formats an ISO timestamp as DD/MM/YYYY', () => {
		expect(formatDisplayDate('2026-06-17T14:30:00')).toBe('17/06/2026');
	});

	it('returns the fallback for empty input', () => {
		expect(formatDisplayDate(null)).toBe('—');
		expect(formatDisplayDate('')).toBe('—');
		expect(formatDisplayDate(undefined, '')).toBe('');
	});

	it('passes through an unparseable value', () => {
		expect(formatDisplayDate('not-a-date')).toBe('not-a-date');
	});
});

describe('formatDisplayDateTime', () => {
	it('formats a timestamp as DD/MM/YYYY hh:mm A', () => {
		expect(formatDisplayDateTime('2026-06-17T09:05:00')).toBe('17/06/2026 09:05 AM');
	});

	it('uses 12-hour clock with a PM marker', () => {
		expect(formatDisplayDateTime('2026-06-17T14:05:00')).toBe('17/06/2026 02:05 PM');
	});

	it('returns the fallback for empty input', () => {
		expect(formatDisplayDateTime(null)).toBe('—');
	});
});

describe('isIsoDateOnly', () => {
	it('accepts a bare YYYY-MM-DD string', () => {
		expect(isIsoDateOnly('2026-06-17')).toBe(true);
	});

	it('rejects timestamps, order numbers and other strings', () => {
		expect(isIsoDateOnly('2026-06-17T14:30:00Z')).toBe(false);
		expect(isIsoDateOnly('2084531')).toBe(false);
		expect(isIsoDateOnly('SAP-2026-01-01-X')).toBe(false);
		expect(isIsoDateOnly('2026-13-45')).toBe(false);
		expect(isIsoDateOnly(20260617)).toBe(false);
		expect(isIsoDateOnly(null)).toBe(false);
	});
});
