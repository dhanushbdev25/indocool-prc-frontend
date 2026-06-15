import { useCallback, useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';

export type DateRangePreset = 'today' | 'yesterday' | 'thisMonth' | 'last7' | 'last30' | 'last90' | 'custom';

export interface DashboardDateRange {
	from: string;
	to: string;
}

const toIsoDate = (d: Dayjs): string => d.format('YYYY-MM-DD');

const rangeForPreset = (preset: Exclude<DateRangePreset, 'custom'>): DashboardDateRange => {
	const today = dayjs().startOf('day');
	const endToday = dayjs().endOf('day');

	switch (preset) {
		case 'today':
			return { from: toIsoDate(today), to: toIsoDate(endToday) };
		case 'yesterday': {
			const day = today.subtract(1, 'day');
			return { from: toIsoDate(day), to: toIsoDate(day.endOf('day')) };
		}
		case 'thisMonth':
			return { from: toIsoDate(today.startOf('month')), to: toIsoDate(endToday) };
		case 'last7':
			return { from: toIsoDate(today.subtract(6, 'day')), to: toIsoDate(endToday) };
		case 'last30':
			return { from: toIsoDate(today.subtract(29, 'day')), to: toIsoDate(endToday) };
		case 'last90':
			return { from: toIsoDate(today.subtract(89, 'day')), to: toIsoDate(endToday) };
	}
};

export const PRESET_OPTIONS: { id: DateRangePreset; label: string; description: string }[] = [
	{ id: 'today', label: 'Today', description: 'Metrics for the current day' },
	{ id: 'yesterday', label: 'Yesterday', description: 'Metrics for the previous day' },
	{ id: 'thisMonth', label: 'This month', description: 'From the 1st of the month through today' },
	{ id: 'last7', label: 'Last 7 days', description: 'Rolling 7-day window including today' },
	{ id: 'last30', label: 'Last 30 days', description: 'Rolling 30-day window including today' },
	{ id: 'last90', label: 'Last 90 days', description: 'Rolling 90-day window including today' },
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
		if (range.from === range.to) return fromLabel;
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
