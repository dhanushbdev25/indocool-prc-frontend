/** User-facing labels for the persisted type `ok/not ok` and value `not ok`. */

export const OK_NOT_OK_TYPE_KEY = 'ok/not ok' as const;

export const OK_NOT_OK_NEGATIVE_VALUE = 'not ok' as const;

export const OK_NOT_OK_TYPE_LABEL = 'OK / OK with deviation';

export const OK_NOT_OK_NEGATIVE_LABEL = 'OK with deviation';

export const OK_NOT_OK_POSITIVE_LABEL = 'OK';

export function isNegativeOkNotOk(value: string | undefined | null): boolean {
	return value === OK_NOT_OK_NEGATIVE_VALUE;
}

export function formatOkNotOkTypeForDisplay(type: string): string {
	return type === OK_NOT_OK_TYPE_KEY ? OK_NOT_OK_TYPE_LABEL : type;
}

export function formatOkNotOkValueForDisplay(value: string): string {
	if (value === 'ok') return OK_NOT_OK_POSITIVE_LABEL;
	if (isNegativeOkNotOk(value)) return OK_NOT_OK_NEGATIVE_LABEL;
	return value;
}
