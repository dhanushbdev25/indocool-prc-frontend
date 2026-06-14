import { useCallback, useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';

export type DateRangePreset = 'last7' | 'last30' | 'last90' | 'custom';

export interface DashboardDateRange {
	from: string;
	to: string;
}

const toIsoDate = (d: Dayjs): string => d.format('YYYY-MM-DD');

const rangeForPreset = (preset: Exclude<DateRangePreset, 'custom'>): DashboardDateRange => {
	const to = dayjs().endOf('day');
	const days = preset === 'last7' ? 6 : preset === 'last30' ? 29 : 89;
	const from = dayjs().subtract(days, 'day').startOf('day');
	return { from: toIsoDate(from), to: toIsoDate(to) };
};

export const PRESET_OPTIONS: { id: DateRangePreset; label: string; description: string }[] = [
	{ id: 'last7', label: 'Last 7 days', description: 'Compare to previous 7 days' },
	{ id: 'last30', label: 'Last 30 days', description: 'Compare to previous 30 days' },
	{ id: 'last90', label: 'Last 90 days', description: 'Compare to previous 90 days' },
	{ id: 'custom', label: 'Custom range', description: 'Pick specific start and end dates' }
];

export const getPresetLabel = (preset: DateRangePreset): string =>
	PRESET_OPTIONS.find(p => p.id === preset)?.label ?? 'Custom range';

export const useDashboardDateRange = () => {
	const [preset, setPresetState] = useState<DateRangePreset>('last30');
	const [customFrom, setCustomFrom] = useState<string | null>(null);
	const [customTo, setCustomTo] = useState<string | null>(null);

	const range = useMemo((): DashboardDateRange | null => {
		if (preset === 'custom') {
			if (!customFrom || !customTo) return null;
			return { from: customFrom, to: customTo };
		}
		return rangeForPreset(preset);
	}, [preset, customFrom, customTo]);

	const setPreset = useCallback((next: DateRangePreset) => {
		setPresetState(next);
		if (next !== 'custom') {
			setCustomFrom(null);
			setCustomTo(null);
		}
	}, []);

	const setCustomRange = useCallback((from: string | null, to: string | null) => {
		setPresetState('custom');
		setCustomFrom(from);
		setCustomTo(to);
	}, []);

	const displayLabel = useMemo(() => {
		if (!range) return 'Select dates';
		const fromLabel = dayjs(range.from).format('MMM D, YYYY');
		const toLabel = dayjs(range.to).format('MMM D, YYYY');
		return `${fromLabel} – ${toLabel}`;
	}, [range]);

	const presetLabel = getPresetLabel(preset);

	return {
		from: range?.from ?? '',
		to: range?.to ?? '',
		preset,
		setPreset,
		setCustomRange,
		displayLabel,
		presetLabel,
		isReady: range != null,
		customFrom,
		customTo
	};
};
