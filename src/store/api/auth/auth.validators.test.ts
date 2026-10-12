import { describe, expect, it } from 'vitest';
import { extractAuthFieldErrors, isAuthMessageResponse, isAuthValidationErrorBody } from './auth.validators';

describe('isAuthMessageResponse', () => {
	it('accepts the bare message envelope the auth endpoints return', () => {
		expect(isAuthMessageResponse({ message: 'Password reset successfully.' })).toBe(true);
	});

	it.each([[null], [undefined], [[]], [{}], [{ message: 1 }], ['message']])('rejects %s', value => {
		expect(isAuthMessageResponse(value)).toBe(false);
	});
});

describe('isAuthValidationErrorBody', () => {
	it('accepts a flattened Zod fieldErrors body', () => {
		expect(
			isAuthValidationErrorBody({
				message: 'Validation Error',
				errors: { otp: ['OTP must be exactly 6 digits'] }
			})
		).toBe(true);
	});

	it('rejects a body with no errors map', () => {
		expect(isAuthValidationErrorBody({ message: 'Invalid or expired OTP' })).toBe(false);
	});

	it('rejects an errors map whose values are not string lists', () => {
		expect(isAuthValidationErrorBody({ message: 'Validation Error', errors: { otp: 'nope' } })).toBe(false);
		expect(isAuthValidationErrorBody({ message: 'Validation Error', errors: { otp: [1] } })).toBe(false);
	});
});

describe('extractAuthFieldErrors', () => {
	it('pulls the fieldErrors map out of an RTK Query rejection', () => {
		const err = { status: 400, data: { message: 'Validation Error', errors: { otp: ['Bad code'] } } };

		expect(extractAuthFieldErrors(err)).toEqual({ otp: ['Bad code'] });
	});

	it('returns null for a plain business error', () => {
		expect(extractAuthFieldErrors({ status: 400, data: { message: 'Invalid or expired OTP' } })).toBeNull();
	});

	it('returns null when there is no data at all', () => {
		expect(extractAuthFieldErrors({ status: 'FETCH_ERROR' })).toBeNull();
		expect(extractAuthFieldErrors(undefined)).toBeNull();
	});
});
