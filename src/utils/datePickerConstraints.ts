import dayjs, { type Dayjs } from 'dayjs';

/** Minimum selectable date for form date pickers (start of today in app timezone). */
export function getTodayMinDate(): Dayjs {
	return dayjs().startOf('day');
}
