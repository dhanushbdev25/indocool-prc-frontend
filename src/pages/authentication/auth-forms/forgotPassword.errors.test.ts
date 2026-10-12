import { describe, expect, it, vi } from 'vitest';
import { applyAuthFieldErrors, mapRequestOtpError, mapResetError } from './forgotPassword.errors';

/** Shapes an RTK Query rejection the way fetchBaseQuery actually returns one. */
const apiError = (status: number | string, data?: unknown) => ({ status, data });

describe('mapResetError', () => {
	it('maps a 400 Validation Error onto per-field errors', () => {
		const outcome = mapResetError(
			apiError(400, {
				message: 'Validation Error',
				errors: { newPassword: ['New password must be at least 6 characters'] }
			})
		);

		expect(outcome).toMatchObject({
			kind: 'fieldErrors',
			fieldErrors: { newPassword: ['New password must be at least 6 characters'] }
		});
	});

	it('keeps the user on step 2 for a wrong code that still has attempts left', () => {
		const outcome = mapResetError(apiError(400, { message: 'Incorrect OTP. 4 attempt(s) remaining.' }));

		expect(outcome).toMatchObject({ kind: 'retryStep2', field: 'otp' });
		expect(outcome.message).toBe('Incorrect OTP. 4 attempt(s) remaining.');
	});

	it('restarts at step 1 for the em-dash "no attempts remaining" message', () => {
		// This string also contains "attempt(s) remaining", so pattern order matters.
		const outcome = mapResetError(
			apiError(400, { message: 'Incorrect OTP. No attempts remaining — please request a new OTP.' })
		);

		expect(outcome.kind).toBe('restartStep1');
	});

	it.each([
		'No active OTP found. Please request a new one.',
		'OTP has expired. Please request a new one.',
		'Invalid or expired OTP'
	])('restarts at step 1 for: %s', message => {
		expect(mapResetError(apiError(400, { message })).kind).toBe('restartStep1');
	});

	it('restarts at step 1 on a 429', () => {
		const outcome = mapResetError(apiError(429, { message: 'Too many incorrect attempts. Please request a new OTP.' }));

		expect(outcome).toMatchObject({
			kind: 'restartStep1',
			message: 'Too many incorrect attempts. Please request a new OTP.'
		});
	});

	it('keeps an inactive account on step 2, since step 1 cannot fix it', () => {
		expect(mapResetError(apiError(400, { message: 'Your account is inactive' })).kind).toBe('retryStep2');
	});

	it('returns a connection message for a network failure', () => {
		const outcome = mapResetError(apiError('FETCH_ERROR'));

		expect(outcome.kind).toBe('retryStep2');
		expect(outcome.message).toMatch(/could not reach the server/i);
	});

	it('falls back to the server message for an unrecognised 400', () => {
		const outcome = mapResetError(apiError(400, { message: 'Something unexpected' }));

		expect(outcome).toMatchObject({ kind: 'retryStep2', message: 'Something unexpected' });
	});
});

describe('mapRequestOtpError', () => {
	it('surfaces the masked server message for a 500', () => {
		expect(mapRequestOtpError(apiError(500, { message: 'Something went wrong' }))).toBe('Something went wrong');
	});

	it('returns a connection message for a network failure', () => {
		expect(mapRequestOtpError(apiError('TIMEOUT_ERROR'))).toMatch(/could not reach the server/i);
	});
});

describe('applyAuthFieldErrors', () => {
	it('sets the first message per allowed field and focuses only the first', () => {
		const setError = vi.fn();

		const unmapped = applyAuthFieldErrors(
			setError,
			{ otp: ['OTP must be exactly 6 digits', 'OTP must contain only digits'], newPassword: ['Too short'] },
			['otp', 'newPassword']
		);

		expect(unmapped).toEqual([]);
		expect(setError).toHaveBeenNthCalledWith(
			1,
			'otp',
			{ type: 'server', message: 'OTP must be exactly 6 digits' },
			{ shouldFocus: true }
		);
		expect(setError).toHaveBeenNthCalledWith(
			2,
			'newPassword',
			{ type: 'server', message: 'Too short' },
			{ shouldFocus: false }
		);
	});

	it('returns messages for fields that are not on this form', () => {
		const setError = vi.fn();

		const unmapped = applyAuthFieldErrors(setError, { employeeId: ['Employee ID is required'] }, ['otp']);

		expect(unmapped).toEqual(['Employee ID is required']);
		expect(setError).not.toHaveBeenCalled();
	});
});
