import { describe, expect, it } from 'vitest';
import { requestOtpSchema, resetPasswordSchema } from './forgotPassword.schemas';

describe('requestOtpSchema', () => {
	it('trims the employee id and returns the trimmed value', async () => {
		await expect(requestOtpSchema.validate({ employeeId: '  0001  ' })).resolves.toMatchObject({
			employeeId: '0001'
		});
	});

	it('rejects an empty employee id', async () => {
		await expect(requestOtpSchema.validate({ employeeId: '' })).rejects.toThrow(/Employee Id is required/);
	});

	it('rejects a whitespace-only employee id', async () => {
		await expect(requestOtpSchema.validate({ employeeId: '   ' })).rejects.toThrow(/Employee Id is required/);
	});

	it('rejects an employee id longer than the employee_no column', async () => {
		await expect(requestOtpSchema.validate({ employeeId: 'x'.repeat(51) })).rejects.toThrow(/at most 50/);
	});
});

describe('resetPasswordSchema', () => {
	const valid = { otp: '123456', newPassword: 'test@123', confirmPassword: 'test@123' };

	it('accepts a six-digit code with a matching password pair', async () => {
		await expect(resetPasswordSchema.validate(valid)).resolves.toMatchObject({ otp: '123456' });
	});

	it('preserves leading zeros in the code as a string', async () => {
		await expect(resetPasswordSchema.validate({ ...valid, otp: '012345' })).resolves.toMatchObject({
			otp: '012345'
		});
	});

	it('rejects a code that is not exactly six digits', async () => {
		await expect(resetPasswordSchema.validate({ ...valid, otp: '12345' })).rejects.toThrow(/exactly 6 digits/);
		await expect(resetPasswordSchema.validate({ ...valid, otp: '1234567' })).rejects.toThrow(/exactly 6 digits/);
	});

	it('rejects a non-numeric code', async () => {
		await expect(resetPasswordSchema.validate({ ...valid, otp: '12a456' })).rejects.toThrow(/exactly 6 digits/);
	});

	it('reports "required" rather than a format message for an empty code', async () => {
		await expect(resetPasswordSchema.validate({ ...valid, otp: '' })).rejects.toThrow(/Enter the 6-digit code/);
	});

	it('rejects a password shorter than the backend minimum of six', async () => {
		await expect(
			resetPasswordSchema.validate({ ...valid, newPassword: 'abcde', confirmPassword: 'abcde' })
		).rejects.toThrow(/at least 6 characters/);
	});

	it('accepts a six-character password, matching the backend floor exactly', async () => {
		await expect(
			resetPasswordSchema.validate({ ...valid, newPassword: 'abcdef', confirmPassword: 'abcdef' })
		).resolves.toBeDefined();
	});

	it('rejects a confirmation that does not match', async () => {
		await expect(resetPasswordSchema.validate({ ...valid, confirmPassword: 'different' })).rejects.toThrow(
			/Passwords do not match/
		);
	});

	it('requires the confirmation field', async () => {
		await expect(resetPasswordSchema.validate({ ...valid, confirmPassword: '' })).rejects.toThrow(
			/Please confirm your new password/
		);
	});
});
