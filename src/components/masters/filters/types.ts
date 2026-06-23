import type { DateRangeFilterValue, FilterValue } from '../../../store/slices/listView';

export type { DateRangeFilterValue, FilterValue };

export type FilterFieldKind = 'autocomplete' | 'dateRange' | 'search';

interface BaseFieldConfig {
	key: string;
	label: string;
}

export interface AutocompleteFieldConfig extends BaseFieldConfig {
	kind: 'autocomplete';
	options: string[];
	placeholder?: string;
}

export interface DateRangeFieldConfig extends BaseFieldConfig {
	kind: 'dateRange';
}

export interface DateRangePresetOption {
	id: string;
	label: string;
	/** Returns inclusive `YYYY-MM-DD` strings; custom preset returns empty strings. */
	resolve: () => { from: string; to: string };
}

export interface DateRangePresetFieldConfig extends BaseFieldConfig {
	kind: 'dateRangePreset';
	presets: DateRangePresetOption[];
	/** Sibling filter key under which the preset id is stored (string FilterValue). */
	presetKey: string;
	/** Preset id used when the filter has no stored value yet. */
	defaultPresetId?: string;
	/** Id of the preset that lets the user pick start/end dates manually. */
	customPresetId?: string;
}

export type FilterFieldConfig =
	| AutocompleteFieldConfig
	| DateRangeFieldConfig
	| DateRangePresetFieldConfig;

export const EMPTY_DATE_RANGE: DateRangeFilterValue = { from: null, to: null };

export const isDateRangeValue = (value: FilterValue | undefined): value is DateRangeFilterValue =>
	typeof value === 'object' && value !== null && !Array.isArray(value) && 'from' in value && 'to' in value;

export const isStringArrayValue = (value: FilterValue | undefined): value is string[] => Array.isArray(value);

export const isFilterValueEmpty = (value: FilterValue | undefined): boolean => {
	if (value === undefined || value === null) return true;
	if (typeof value === 'string') return value.trim() === '';
	if (Array.isArray(value)) return value.length === 0;
	if (isDateRangeValue(value)) return !value.from && !value.to;
	return true;
};
