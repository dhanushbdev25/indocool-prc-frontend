/**
 * The "list" input type: a two-column form whose left column is a fixed label from the master
 * and whose right column is the value entered at execution. Used by both Process Sequence steps
 * (`targetValueType: 'list'`) and Inspection parameters (`type: 'list'`), stored in each row's
 * `listConfig` column.
 */
export type ListItemType = 'text' | 'number' | 'ok/not ok' | 'date' | 'datetime' | 'shift' | 'workstation';

export interface ListItemConfig {
	/** Stable key, generated once when the item is added, so renaming a label keeps saved answers. */
	id: string;
	label: string;
	type: ListItemType;
	required: boolean;
	/** Shown at execution but not editable; the value is `defaultValue`. */
	readOnly: boolean;
	defaultValue?: string;
	/** Acceptance range for a `number` item. Blank (or a 0-to-0 band) means no range. */
	minimumAcceptanceValue?: string | number | null;
	maximumAcceptanceValue?: string | number | null;
}

export interface ListConfig {
	items: ListItemConfig[];
}

export type ListRangeStatus = 'InRange' | 'Lesser' | 'Greater';

/**
 * One answered item as persisted in the execution. Self-describing (label, type, range) so the
 * preview and report render it without needing the master.
 */
export interface ListSavedEntry {
	id: string;
	label: string;
	type: ListItemType;
	value: string;
	comments?: string;
	validationStatus?: ListRangeStatus;
	minimumAcceptanceValue?: string | number | null;
	maximumAcceptanceValue?: string | number | null;
	acknowledged?: boolean;
}

/** Execution-time state of one item while the operator fills the form. */
export interface ListValueState {
	value: string;
	comments: string;
	acknowledged: boolean;
}

export type ListValues = Record<string, ListValueState>;
