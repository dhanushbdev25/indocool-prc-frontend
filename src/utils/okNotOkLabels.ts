/**
 * User-facing labels for the persisted type `ok/not ok` and its values.
 *
 * Three values are stored: `ok`, `not ok` and `not applicable`. Only `not ok` counts as a
 * deviation — `not applicable` is a neutral answer, so it never flags a row, never feeds the
 * "any column is not ok" rollup, and does not trip the backend's First Yield latch (which
 * matches the literal string `not ok`).
 *
 * Prefer the predicates below to comparing against the value constants directly, so a fourth
 * value would only have to be handled here.
 */

export const OK_NOT_OK_TYPE_KEY = 'ok/not ok' as const;

export const OK_NOT_OK_POSITIVE_VALUE = 'ok' as const;

export const OK_NOT_OK_NEGATIVE_VALUE = 'not ok' as const;

export const OK_NOT_OK_NA_VALUE = 'not applicable' as const;

export const OK_NOT_OK_TYPE_LABEL = 'OK / OK with deviation / Not Applicable';

export const OK_NOT_OK_POSITIVE_LABEL = 'OK';

export const OK_NOT_OK_NEGATIVE_LABEL = 'OK with deviation';

export const OK_NOT_OK_NA_LABEL = 'Not Applicable';

export type OkNotOkValue =
	| typeof OK_NOT_OK_POSITIVE_VALUE
	| typeof OK_NOT_OK_NEGATIVE_VALUE
	| typeof OK_NOT_OK_NA_VALUE;

export interface OkNotOkOption {
	value: OkNotOkValue;
	label: string;
	/** MUI radio colour, so every one of the inputs renders the choices identically. */
	color: 'success' | 'warning' | 'default';
}

/** The choices in display order. Every ok/not ok input renders from this list. */
export const OK_NOT_OK_OPTIONS: readonly OkNotOkOption[] = [
	{ value: OK_NOT_OK_POSITIVE_VALUE, label: OK_NOT_OK_POSITIVE_LABEL, color: 'success' },
	{ value: OK_NOT_OK_NEGATIVE_VALUE, label: OK_NOT_OK_NEGATIVE_LABEL, color: 'warning' },
	{ value: OK_NOT_OK_NA_VALUE, label: OK_NOT_OK_NA_LABEL, color: 'default' }
];

/** The choices spelled out, for validation messages. Stays in step with OK_NOT_OK_OPTIONS. */
export const OK_NOT_OK_CHOICE_LIST_LABEL = OK_NOT_OK_OPTIONS.map(option => option.label).join(', ');

/** Label colour for the selected choice, for the inputs that tint the picked option. */
export const OK_NOT_OK_SELECTED_COLORS: Record<OkNotOkValue, string> = {
	[OK_NOT_OK_POSITIVE_VALUE]: '#2e7d32',
	[OK_NOT_OK_NEGATIVE_VALUE]: '#ed6c02',
	[OK_NOT_OK_NA_VALUE]: '#616161'
};

export function isNegativeOkNotOk(value: unknown): boolean {
	return value === OK_NOT_OK_NEGATIVE_VALUE;
}

export function isNotApplicableOkNotOk(value: unknown): boolean {
	return value === OK_NOT_OK_NA_VALUE;
}

/** True for any answered value. Validation uses this rather than listing the values inline. */
export function isValidOkNotOkValue(value: unknown): boolean {
	return value === OK_NOT_OK_POSITIVE_VALUE || value === OK_NOT_OK_NEGATIVE_VALUE || value === OK_NOT_OK_NA_VALUE;
}

/**
 * True when the value shows a comment box. A deviation requires one; Not Applicable offers it
 * but never blocks. Switching between the two keeps whatever was already typed.
 */
export function acceptsOkNotOkComment(value: unknown): boolean {
	return isNegativeOkNotOk(value) || isNotApplicableOkNotOk(value);
}

/** True when the value cannot be submitted without a comment. */
export function requiresOkNotOkComment(value: unknown): boolean {
	return isNegativeOkNotOk(value);
}

export function formatOkNotOkTypeForDisplay(type: string): string {
	return type === OK_NOT_OK_TYPE_KEY ? OK_NOT_OK_TYPE_LABEL : type;
}

export function formatOkNotOkValueForDisplay(value: string): string {
	if (value === OK_NOT_OK_POSITIVE_VALUE) return OK_NOT_OK_POSITIVE_LABEL;
	if (isNegativeOkNotOk(value)) return OK_NOT_OK_NEGATIVE_LABEL;
	if (isNotApplicableOkNotOk(value)) return OK_NOT_OK_NA_LABEL;
	return value;
}
