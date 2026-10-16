import type {
	ListConfig,
	ListItemConfig,
	ListItemType,
	ListRangeStatus,
	ListSavedEntry,
	ListValueState,
	ListValues
} from '../types/list-config.types';
import type { TableConfig } from '../types/table-config.types';
import {
	OK_NOT_OK_CHOICE_LIST_LABEL,
	OK_NOT_OK_NEGATIVE_LABEL,
	OK_NOT_OK_TYPE_KEY,
	OK_NOT_OK_TYPE_LABEL,
	acceptsOkNotOkComment,
	isValidOkNotOkValue,
	requiresOkNotOkComment
} from './okNotOkLabels';

export const LIST_TYPE_KEY = 'list' as const;

export const LIST_SHIFT_OPTIONS = ['Shift A', 'Shift B', 'Shift C', 'Shift G'] as const;

export const LIST_ITEM_TYPE_OPTIONS: ReadonlyArray<{ value: ListItemType; label: string }> = [
	{ value: 'text', label: 'Text' },
	{ value: 'number', label: 'Number' },
	{ value: OK_NOT_OK_TYPE_KEY, label: OK_NOT_OK_TYPE_LABEL },
	{ value: 'date', label: 'Date' },
	{ value: 'datetime', label: 'Date & Time' },
	{ value: 'shift', label: 'Shift' },
	{ value: 'workstation', label: 'Workstation' }
];

const LIST_ITEM_TYPES = new Set<string>(LIST_ITEM_TYPE_OPTIONS.map(option => option.value));

export const isListItemType = (value: unknown): value is ListItemType =>
	typeof value === 'string' && LIST_ITEM_TYPES.has(value);

let idCounter = 0;
export const generateListItemId = (): string => {
	idCounter += 1;
	const random =
		typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
			? crypto.randomUUID().slice(0, 8)
			: Math.random().toString(36).slice(2, 10);
	return `li_${Date.now().toString(36)}_${random}_${idCounter}`;
};

export const createListItem = (overrides: Partial<ListItemConfig> = {}): ListItemConfig => ({
	id: generateListItemId(),
	label: '',
	type: 'text',
	required: true,
	readOnly: false,
	defaultValue: '',
	minimumAcceptanceValue: '',
	maximumAcceptanceValue: '',
	...overrides
});

/**
 * A list's config is persisted in the row's existing `tableConfig` JSONB column (process_step
 * and inspection_parameters), so lists need no backend change. Rows of type `list` hold a
 * `ListConfig` there instead of a `TableConfig`; these two helpers convert at the API boundary.
 */
export const readStoredListConfig = (storedTableConfig: unknown): ListConfig | null =>
	normalizeListConfig(storedTableConfig);

export const toStoredListConfig = (config: ListConfig | null | undefined): TableConfig | null =>
	config ? (config as unknown as TableConfig) : null;

/** Coerces whatever the API returned into a usable config, or null when there is none. */
export const normalizeListConfig = (raw: unknown): ListConfig | null => {
	if (!raw || typeof raw !== 'object') return null;
	const items = (raw as { items?: unknown }).items;
	if (!Array.isArray(items)) return null;
	return {
		items: items
			.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
			.map((item, index) => ({
				id: typeof item.id === 'string' && item.id ? item.id : `li_${index}`,
				label: typeof item.label === 'string' ? item.label : '',
				type: isListItemType(item.type) ? item.type : 'text',
				required: item.required !== false,
				readOnly: item.readOnly === true,
				defaultValue: item.defaultValue == null ? '' : String(item.defaultValue),
				minimumAcceptanceValue: (item.minimumAcceptanceValue as string | number | null | undefined) ?? '',
				maximumAcceptanceValue: (item.maximumAcceptanceValue as string | number | null | undefined) ?? ''
			}))
	};
};

const toBound = (value: string | number | null | undefined): number | null => {
	if (value === null || value === undefined || value === '') return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

/** True when a number item carries a real acceptance range (a 0-to-0 band means none). */
export const hasListItemRange = (item: Pick<ListItemConfig, 'minimumAcceptanceValue' | 'maximumAcceptanceValue'>) => {
	const min = toBound(item.minimumAcceptanceValue);
	const max = toBound(item.maximumAcceptanceValue);
	if (min === null && max === null) return false;
	return !(min === 0 && max === 0);
};

/**
 * Range status of a number reading. Either bound may be left open. Returns null when the item is
 * not a number, has no range, or the value is not a number.
 */
export const getListItemRangeStatus = (
	item: Pick<ListItemConfig, 'type' | 'minimumAcceptanceValue' | 'maximumAcceptanceValue'>,
	value: string | undefined
): ListRangeStatus | null => {
	if (item.type !== 'number' || !hasListItemRange(item)) return null;
	const text = (value ?? '').trim();
	if (text === '') return null;
	const reading = Number(text);
	if (!Number.isFinite(reading)) return null;
	const min = toBound(item.minimumAcceptanceValue);
	const max = toBound(item.maximumAcceptanceValue);
	if (min !== null && reading < min) return 'Lesser';
	if (max !== null && reading > max) return 'Greater';
	return 'InRange';
};

const emptyState = (value = ''): ListValueState => ({ value, comments: '', acknowledged: false });

/** Reads a saved list answer: an array of entries, or the index-keyed object a re-save spreads it into. */
export const parseListSavedValue = (raw: unknown): ListSavedEntry[] => {
	const entries = Array.isArray(raw)
		? raw
		: raw && typeof raw === 'object'
			? Object.keys(raw as Record<string, unknown>)
					.filter(key => /^\d+$/.test(key))
					.sort((a, b) => Number(a) - Number(b))
					.map(key => (raw as Record<string, unknown>)[key])
			: [];
	return entries
		.filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
		.filter(entry => typeof entry.id === 'string')
		.map(entry => ({
			...(entry as unknown as ListSavedEntry),
			value: entry.value == null ? '' : String(entry.value)
		}));
};

/** Execution form state: saved answers when there are any, otherwise each item's default value. */
export const initListValues = (items: readonly ListItemConfig[], saved?: unknown): ListValues => {
	const savedById = new Map(parseListSavedValue(saved).map(entry => [entry.id, entry]));
	const values: ListValues = {};
	items.forEach(item => {
		const entry = savedById.get(item.id);
		if (item.readOnly) {
			values[item.id] = emptyState(item.defaultValue ?? '');
		} else if (entry) {
			values[item.id] = {
				value: entry.value,
				comments: typeof entry.comments === 'string' ? entry.comments : '',
				acknowledged: entry.acknowledged === true
			};
		} else {
			values[item.id] = emptyState(item.defaultValue ?? '');
		}
	});
	return values;
};

/** Applies one edit, dropping the comment when the new ok/not ok value no longer takes one. */
export const updateListValue = (
	values: ListValues,
	item: ListItemConfig,
	patch: Partial<ListValueState>
): ListValues => {
	const previous = values[item.id] ?? emptyState();
	const next: ListValueState = { ...previous, ...patch };
	if (patch.value !== undefined && patch.value !== previous.value) {
		// A new reading has to be judged (and acknowledged) again.
		next.acknowledged = false;
		if (item.type === OK_NOT_OK_TYPE_KEY && !acceptsOkNotOkComment(patch.value)) next.comments = '';
	}
	return { ...values, [item.id]: next };
};

export const listErrorKeys = (prefix: string, itemId: string) => ({
	value: `${prefix}${itemId}`,
	comments: `${prefix}${itemId}_comments`,
	acknowledge: `${prefix}${itemId}_acknowledge`
});

/**
 * Validates the answers. Error keys are `<prefix><itemId>` for the value, plus `_comments` and
 * `_acknowledge` suffixes; callers pick a prefix that fits their own error-key scheme.
 */
export const validateListValues = (
	items: readonly ListItemConfig[],
	values: ListValues,
	prefix: string,
	shiftOptions: readonly string[] = LIST_SHIFT_OPTIONS
): Record<string, string> => {
	const errors: Record<string, string> = {};
	items.forEach(item => {
		if (item.readOnly) return;
		const keys = listErrorKeys(prefix, item.id);
		const state = values[item.id] ?? emptyState();
		const value = state.value.trim();
		const label = item.label || 'Value';

		if (value === '') {
			if (item.required) errors[keys.value] = `${label} is required`;
			return;
		}

		if (item.type === 'number') {
			if (!Number.isFinite(Number(value))) {
				errors[keys.value] = `${label} must be a number`;
				return;
			}
			const status = getListItemRangeStatus(item, value);
			if (status && status !== 'InRange' && !state.acknowledged) {
				errors[keys.acknowledge] = `${label} is out of range. Please acknowledge deviation.`;
			}
		} else if (item.type === OK_NOT_OK_TYPE_KEY) {
			if (!isValidOkNotOkValue(value)) {
				errors[keys.value] = `${label} must be one of: ${OK_NOT_OK_CHOICE_LIST_LABEL}`;
			} else if (requiresOkNotOkComment(value) && !state.comments.trim()) {
				errors[keys.comments] = `Comment is required for ${OK_NOT_OK_NEGATIVE_LABEL}`;
			}
		} else if (item.type === 'shift' && !shiftOptions.includes(value)) {
			errors[keys.value] = `${label} must be a valid shift`;
		}
	});
	return errors;
};

/** The payload saved for a list: one self-describing entry per item, in master order. */
export const buildListSavedValue = (items: readonly ListItemConfig[], values: ListValues): ListSavedEntry[] =>
	items.map(item => {
		const state = values[item.id] ?? emptyState();
		const value = item.readOnly ? (item.defaultValue ?? '') : state.value.trim();
		const entry: ListSavedEntry = { id: item.id, label: item.label, type: item.type, value };
		if (item.type === OK_NOT_OK_TYPE_KEY && acceptsOkNotOkComment(value)) {
			entry.comments = state.comments.trim();
		}
		const status = getListItemRangeStatus(item, value);
		if (status) {
			entry.validationStatus = status;
			entry.minimumAcceptanceValue = item.minimumAcceptanceValue;
			entry.maximumAcceptanceValue = item.maximumAcceptanceValue;
			entry.acknowledged = status !== 'InRange' && state.acknowledged;
		}
		return entry;
	});

/** True when any entry is out of range or an ok/not ok deviation, for preview/report highlighting. */
export const isListEntryDeviation = (entry: ListSavedEntry): boolean =>
	(entry.validationStatus !== undefined && entry.validationStatus !== 'InRange') ||
	(entry.type === OK_NOT_OK_TYPE_KEY && requiresOkNotOkComment(entry.value));
