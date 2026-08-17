import dayjs from 'dayjs';
import { formatDisplayDate } from './formatDisplayDate';

export function formatDateColumnStorageValue(value: dayjs.Dayjs | null): string {
	return value ? value.format('YYYY-MM-DD') : '';
}

export function formatTableCellDisplay(columnType: string | undefined, rawValue: unknown): string {
	const value = rawValue == null ? '' : String(rawValue).trim();
	if (!value) return '—';

	if (columnType === 'date') {
		return formatDisplayDate(value, '—');
	}

	return value;
}
