import dayjs from './dayjsSetup';
import { DATE_PICKER_FORMAT, DATETIME_PICKER_FORMAT } from './dateConfig';

/** Matches a bare calendar date with no time component. */
const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const format = (value: string | null | undefined, pattern: string, fallback: string): string => {
	if (!value) return fallback;
	const parsed = dayjs(value);
	return parsed.isValid() ? parsed.format(pattern) : String(value);
};

/** Date only, e.g. 17/06/2026. Returns `fallback` when empty, or the raw value when unparseable. */
export const formatDisplayDate = (value: string | null | undefined, fallback = '—'): string =>
	format(value, DATE_PICKER_FORMAT, fallback);

/** Date and time, e.g. 17/06/2026 09:05 AM. */
export const formatDisplayDateTime = (value: string | null | undefined, fallback = '—'): string =>
	format(value, DATETIME_PICKER_FORMAT, fallback);

/**
 * True for a real `YYYY-MM-DD` calendar date and nothing else.
 * Used to spot date columns in report responses, whose headers carry no type information —
 * so the check must be strict enough not to catch order numbers or SAP codes.
 */
export const isIsoDateOnly = (value: unknown): value is string => {
	if (typeof value !== 'string' || !ISO_DATE_ONLY.test(value)) return false;
	const parsed = dayjs(value);
	// Round-trip guards against dayjs accepting out-of-range parts like 2026-13-45.
	return parsed.isValid() && parsed.format('YYYY-MM-DD') === value;
};
