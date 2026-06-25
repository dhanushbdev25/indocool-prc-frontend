import dayjs, { type Dayjs } from './dayjsSetup';
import { APP_TIMEZONE } from './dateConfig';

/** Minimum selectable date for form date pickers (start of today in app timezone). */
export function getTodayMinDate(): Dayjs {
	return dayjs.tz(undefined, APP_TIMEZONE).subtract(1, 'day').startOf('day');
}
