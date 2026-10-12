import * as Yup from 'yup';

/** The backend issues and expects a fixed six-digit code. */
export const OTP_LENGTH = 6;

/** Server-side OTP lifetime: `expiresAt = now + 10 minutes`. */
export const OTP_TTL_MS = 10 * 60 * 1000;

/**
 * Client-side throttle between OTP requests. The backend applies no rate limiting
 * or cooldown of its own, so this is purely a courtesy guard against impatient
 * double-clicks — not a security control.
 */
export const RESEND_COOLDOWN_MS = 30 * 1000;

/** `users.employee_no` is a varchar(50); anything longer cannot match a user. */
const EMPLOYEE_ID_MAX = 50;

/** Mirrors the backend floor exactly, so nothing valid here is rejected server-side. */
const PASSWORD_MIN = 6;

export interface RequestOtpFormValues {
	employeeId: string;
}

export const requestOtpDefaults: RequestOtpFormValues = { employeeId: '' };

export const requestOtpSchema: Yup.ObjectSchema<RequestOtpFormValues> = Yup.object({
	// A transform (rather than .trim()) so the resolver hands the trimmed value to
	// onSubmit, which is what actually gets posted.
	employeeId: Yup.string()
		.transform(value => (typeof value === 'string' ? value.trim() : value))
		.max(EMPLOYEE_ID_MAX, `Employee Id must be at most ${EMPLOYEE_ID_MAX} characters`)
		.required('Employee Id is required')
});

export interface ResetPasswordFormValues {
	otp: string;
	newPassword: string;
	confirmPassword: string;
}

export const resetPasswordDefaults: ResetPasswordFormValues = {
	otp: '',
	newPassword: '',
	confirmPassword: ''
};

export const resetPasswordSchema: Yup.ObjectSchema<ResetPasswordFormValues> = Yup.object({
	otp: Yup.string()
		.required(`Enter the ${OTP_LENGTH}-digit code from your email`)
		// excludeEmptyString keeps an empty field reporting "required" rather than
		// the format message.
		.matches(/^\d{6}$/, {
			message: `The code must be exactly ${OTP_LENGTH} digits`,
			excludeEmptyString: true
		}),
	newPassword: Yup.string()
		.required('New password is required')
		.min(PASSWORD_MIN, `New password must be at least ${PASSWORD_MIN} characters`),
	// A `.test` rather than `.oneOf`, short-circuiting on an empty value: `.oneOf`
	// fires before `.required`, so an untouched field would read "Passwords do not
	// match" instead of asking the user to fill it in.
	confirmPassword: Yup.string()
		.required('Please confirm your new password')
		.test('passwords-match', 'Passwords do not match', function (value) {
			return !value || value === this.parent.newPassword;
		})
});
