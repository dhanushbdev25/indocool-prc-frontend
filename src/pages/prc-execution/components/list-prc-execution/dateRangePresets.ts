import type { Dayjs } from 'dayjs';
import dayjs from '../../../../utils/dayjsSetup';
import { APP_TIMEZONE } from '../../../../utils/dateConfig';
import type { DateRangePresetOption } from '../../../../components/masters/filters/types';

export type PrcDateRangePresetId = 'today' | 'yesterday' | 'lastWeek' | 'lastMonth' | 'lastYear' | 'custom';

export const PRC_DATE_RANGE_CUSTOM_ID: PrcDateRangePresetId = 'custom';
export const PRC_DATE_RANGE_DEFAULT_ID: PrcDateRangePresetId = 'lastMonth';

const toIsoDate = (d: Dayjs): string => d.format('YYYY-MM-DD');
const startOfToday = (): Dayjs => dayjs.tz(undefined, APP_TIMEZONE).startOf('day');

export const PRC_DATE_RANGE_PRESETS: DateRangePresetOption[] = [
	{
		id: 'today',
		label: 'Today',
		resolve: () => {
			const today = startOfToday();
			return { from: toIsoDate(today), to: toIsoDate(today) };
		}
	},
	{
		id: 'yesterday',
		label: 'Yesterday',
		resolve: () => {
			const day = startOfToday().subtract(1, 'day');
			return { from: toIsoDate(day), to: toIsoDate(day) };
		}
	},
	{
		id: 'lastWeek',
		label: 'Last Week',
		resolve: () => {
			const today = startOfToday();
			return { from: toIsoDate(today.subtract(6, 'day')), to: toIsoDate(today) };
		}
	},
	{
		id: 'lastMonth',
		label: 'Last Month',
		resolve: () => {
			const today = startOfToday();
			return { from: toIsoDate(today.subtract(29, 'day')), to: toIsoDate(today) };
		}
	},
	{
		id: 'lastYear',
		label: 'Last Year',
		resolve: () => {
			const today = startOfToday();
			return { from: toIsoDate(today.subtract(364, 'day')), to: toIsoDate(today) };
		}
	},
	{
		id: 'custom',
		label: 'Custom Range',
		resolve: () => ({ from: '', to: '' })
	}
];

export const getPrcDateRangePreset = (id: string | null | undefined): DateRangePresetOption | undefined =>
	PRC_DATE_RANGE_PRESETS.find(p => p.id === id);
