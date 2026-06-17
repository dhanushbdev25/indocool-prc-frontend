import dayjs from 'dayjs';

export function formatDateColumnStorageValue(value: dayjs.Dayjs | null): string {
	return value ? value.format('YYYY-MM-DD') : '';
}

export function formatTableCellDisplay(columnType: string | undefined, rawValue: unknown): string {
	const value = rawValue == null ? '' : String(rawValue).trim();
	if (!value) return '—';

	if (columnType === 'date') {
		const parsed = dayjs(value);
		return parsed.isValid() ? parsed.format('DD MMM YYYY') : value;
	}

	return value;
}
