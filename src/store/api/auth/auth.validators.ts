/** Every auth endpoint in this slice answers with a bare `{ message }` envelope. */
export interface AuthMessageResponse {
	message: string;
}

export function isAuthMessageResponse(value: unknown): value is AuthMessageResponse {
	return (
		value !== null &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		typeof (value as Record<string, unknown>).message === 'string'
	);
}

/**
 * Body of a 400 "Validation Error": Zod's flattened `fieldErrors`, where only the
 * fields that actually failed are present and each maps to a list of messages.
 */
export interface AuthValidationErrorBody extends AuthMessageResponse {
	errors: Record<string, string[]>;
}

export function isAuthValidationErrorBody(value: unknown): value is AuthValidationErrorBody {
	if (!isAuthMessageResponse(value)) return false;
	const errors = (value as AuthMessageResponse & { errors?: unknown }).errors;
	if (errors === null || typeof errors !== 'object' || Array.isArray(errors)) return false;
	return Object.values(errors as Record<string, unknown>).every(
		messages => Array.isArray(messages) && messages.every(message => typeof message === 'string')
	);
}

/** Pulls the Zod `fieldErrors` map out of an RTK Query error, or null when it is not one. */
export function extractAuthFieldErrors(err: unknown): Record<string, string[]> | null {
	const data = (err as { data?: unknown } | null | undefined)?.data;
	return isAuthValidationErrorBody(data) ? data.errors : null;
}
