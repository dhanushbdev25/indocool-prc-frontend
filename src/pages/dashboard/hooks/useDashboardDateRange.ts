import { useCallback, useMemo, useState } from 'react';
import type { Dayjs } from 'dayjs';
import dayjs from '../../../utils/dayjsSetup';
import { APP_TIMEZONE } from '../../../utils/dateConfig';

export type DateRangePreset = 'today' | 'yesterday' | 'thisMonth' | 'last7' | 'last30' | 'last90' | 'custom';

export interface DashboardDateRange {
	from: string;
	to: string;
}

const toIsoDate = (d: Dayjs): string => d.format('YYYY-MM-DD');

const rangeForPreset = (preset: Exclude<DateRangePreset, 'custom'>): DashboardDateRange => {
	const today = dayjs.tz(undefined, APP_TIMEZONE).startOf('day');
	const endToday = dayjs.tz(undefined, APP_TIMEZONE).endOf('day');

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

const resolveRange = (preset: DateRangePreset, customFrom: string | null, customTo: string | null): DashboardDateRange | null => {
	if (preset === 'custom') {
		if (!customFrom || !customTo) return null;
		return { from: customFrom, to: customTo };
	}
	return rangeForPreset(preset);
};

const labelForRange = (range: DashboardDateRange | null): string => {
	if (!range) return 'Select dates';
	const fromLabel = dayjs(range.from).format('MMM D, YYYY');
	if (range.from === range.to) return fromLabel;
	const toLabel = dayjs(range.to).format('MMM D, YYYY');
	return `${fromLabel} – ${toLabel}`;
};

/**
 * Date range with a draft/applied split.
 *
 * - Draft state drives the UI controls (preset picker, custom date inputs).
 * - Applied state drives the queries via `from`, `to`, `isReady`.
 * - `applyDraft()` commits draft → applied (call from the global Apply button).
 */
export const useDashboardDateRange = () => {
	const [appliedPreset, setAppliedPreset] = useState<DateRangePreset>('last30');
	const [appliedCustomFrom, setAppliedCustomFrom] = useState<string | null>(null);
	const [appliedCustomTo, setAppliedCustomTo] = useState<string | null>(null);

	const [draftPreset, setDraftPresetState] = useState<DateRangePreset>('last30');
	const [draftCustomFrom, setDraftCustomFrom] = useState<string | null>(null);
	const [draftCustomTo, setDraftCustomTo] = useState<string | null>(null);

	const appliedRange = useMemo(
		() => resolveRange(appliedPreset, appliedCustomFrom, appliedCustomTo),
		[appliedPreset, appliedCustomFrom, appliedCustomTo]
	);
	const draftRange = useMemo(
		() => resolveRange(draftPreset, draftCustomFrom, draftCustomTo),
		[draftPreset, draftCustomFrom, draftCustomTo]
	);

	const setDraftPreset = useCallback((next: DateRangePreset) => {
		setDraftPresetState(next);
		if (next !== 'custom') {
			setDraftCustomFrom(null);
			setDraftCustomTo(null);
		}
	}, []);

	const setDraftCustomRange = useCallback((from: string | null, to: string | null) => {
		setDraftPresetState('custom');
		setDraftCustomFrom(from);
		setDraftCustomTo(to);
	}, []);

	const applyDraft = useCallback(() => {
		setAppliedPreset(draftPreset);
		setAppliedCustomFrom(draftCustomFrom);
		setAppliedCustomTo(draftCustomTo);
	}, [draftPreset, draftCustomFrom, draftCustomTo]);

	const resetDraft = useCallback(() => {
		setDraftPresetState(appliedPreset);
		setDraftCustomFrom(appliedCustomFrom);
		setDraftCustomTo(appliedCustomTo);
	}, [appliedPreset, appliedCustomFrom, appliedCustomTo]);

	const clearAll = useCallback(() => {
		setAppliedPreset('last30');
		setAppliedCustomFrom(null);
		setAppliedCustomTo(null);
		setDraftPresetState('last30');
		setDraftCustomFrom(null);
		setDraftCustomTo(null);
	}, []);

	const isDirty =
		draftPreset !== appliedPreset || draftCustomFrom !== appliedCustomFrom || draftCustomTo !== appliedCustomTo;

	const appliedDisplayLabel = useMemo(() => labelForRange(appliedRange), [appliedRange]);
	const draftDisplayLabel = useMemo(() => labelForRange(draftRange), [draftRange]);

	const draftPresetLabel = getPresetLabel(draftPreset);

	return {
		// Applied (queries read these)
		from: appliedRange?.from ?? '',
		to: appliedRange?.to ?? '',
		isReady: appliedRange != null,
		appliedDisplayLabel,
		// Draft (UI controls read/write these)
		draftPreset,
		draftCustomFrom,
		draftCustomTo,
		draftDisplayLabel,
		draftPresetLabel,
		setDraftPreset,
		setDraftCustomRange,
		// Actions
		applyDraft,
		resetDraft,
		clearAll,
		isDirty
	};
};
