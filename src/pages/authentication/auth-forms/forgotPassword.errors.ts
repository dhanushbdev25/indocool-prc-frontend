import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { extractAuthFieldErrors } from '../../../store/api/auth/auth.validators';
import { extractErrorMessage } from '../../../utils/helpers';

export type ResetErrorOutcome =
	| { kind: 'fieldErrors'; fieldErrors: Record<string, string[]>; message: string }
	| { kind: 'retryStep2'; message: string; field?: 'otp' }
	| { kind: 'restartStep1'; message: string };

/**
 * Messages meaning the current code is dead, so keeping the user on step 2 would
 * be a trap — there is nothing they can type that would succeed.
 *
 * Matched as case-insensitive regexes rather than equality: the backend wording
 * is prose and one of these strings contains an em dash, which is easy to get
 * wrong in an equality check.
 */
const RESTART_PATTERNS = [
	/no active otp/i,
	/otp has expired/i,
	/invalid or expired otp/i,
	/no attempts remaining/i,
	/too many incorrect attempts/i
];

const NETWORK_MESSAGE = 'We could not reach the server. Check your connection and try again.';

function statusOf(err: unknown): number | string | undefined {
	return (err as { status?: number | string } | null | undefined)?.status;
}

/**
 * Classifies a failed `reset-password-otp` call into what the UI should do next.
 *
 * Order matters: the "No attempts remaining" message also contains the words
 * "attempt(s) remaining", so the restart patterns have to be tested before any
 * generic incorrect-code handling.
 */
export function mapResetError(err: unknown): ResetErrorOutcome {
	const status = statusOf(err);

	if (status === 'FETCH_ERROR' || status === 'TIMEOUT_ERROR' || status === 'PARSING_ERROR') {
		return { kind: 'retryStep2', message: NETWORK_MESSAGE };
	}

	if (status === 429) {
		return { kind: 'restartStep1', message: extractErrorMessage(err) };
	}

	const fieldErrors = extractAuthFieldErrors(err);
	if (fieldErrors) {
		return { kind: 'fieldErrors', fieldErrors, message: 'Please correct the highlighted fields.' };
	}

	const message = extractErrorMessage(err);

	if (RESTART_PATTERNS.some(pattern => pattern.test(message))) {
		return { kind: 'restartStep1', message };
	}

	// A wrong code with attempts left: keep the user here and point at the field.
	if (/incorrect otp/i.test(message)) {
		return { kind: 'retryStep2', message, field: 'otp' };
	}

	return { kind: 'retryStep2', message };
}

/** Classifies a failed `request-otp` call. That endpoint has no business errors. */
export function mapRequestOtpError(err: unknown): string {
	const status = statusOf(err);
	if (status === 'FETCH_ERROR' || status === 'TIMEOUT_ERROR' || status === 'PARSING_ERROR') {
		return NETWORK_MESSAGE;
	}
	return extractErrorMessage(err);
}

/**
 * Applies a server `{ field: [messages] }` map onto a React Hook Form, focusing
 * the first field it matches. Messages for fields that are not on this form (for
 * example `employeeId`, which is not editable on step 2) are returned so the
 * caller can surface them at form level instead of dropping them.
 */
export function applyAuthFieldErrors<T extends FieldValues>(
	setError: UseFormSetError<T>,
	fieldErrors: Record<string, string[]>,
	allowedFields: readonly Path<T>[]
): string[] {
	const unmapped: string[] = [];
	let hasFocused = false;

	for (const [field, messages] of Object.entries(fieldErrors)) {
		const message = messages.find(entry => entry.trim() !== '');
		if (!message) continue;

		if ((allowedFields as readonly string[]).includes(field)) {
			setError(field as Path<T>, { type: 'server', message }, { shouldFocus: !hasFocused });
			hasFocused = true;
		} else {
			unmapped.push(message);
		}
	}

	return unmapped;
}
