import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import {
	Box,
	FormHelperText,
	IconButton,
	InputAdornment,
	InputLabel,
	OutlinedInput,
	Stack,
	Typography
} from '@mui/material';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { MuiOtpInput } from 'mui-one-time-password-input';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Swal from 'sweetalert2';

import Button from '../../../components/common/button/Button';
import CustomStepper from '../../../components/common/stepper/CustomStepper';
import { FullScreenFormSavingOverlay } from '../../../components/common/FullScreenFormSavingOverlay';
import { useCountdown } from '../../../hooks/useCountdown';
import { LOGIN_PATH } from '../../../constants/authRoutes';
import { useRequestPasswordOtpMutation, useResetPasswordWithOtpMutation } from '../../../store/api/auth/auth.api';
import { applyAuthFieldErrors, mapRequestOtpError, mapResetError } from './forgotPassword.errors';
import {
	OTP_LENGTH,
	OTP_TTL_MS,
	RESEND_COOLDOWN_MS,
	requestOtpDefaults,
	requestOtpSchema,
	resetPasswordDefaults,
	resetPasswordSchema,
	type RequestOtpFormValues,
	type ResetPasswordFormValues
} from './forgotPassword.schemas';

const STEPS = [{ label: 'Employee ID' }, { label: 'Reset Password' }];

/** Non-committal by design: the API returns the same 200 for an unknown ID. */
const SENT_NOTICE = 'If that Employee ID exists, we have sent a 6-digit code to the registered email address.';

const fieldSx = {
	'& .MuiOutlinedInput-input': {
		padding: '12px 16px',
		fontSize: '0.875rem',
		'&::placeholder': { color: '#9ca3af', opacity: 1 }
	}
};

const labelSx = {
	textAlign: 'left',
	fontWeight: 500,
	fontSize: '0.875rem',
	color: '#374151',
	mb: 1
};

const helperSx = { mt: 1, fontSize: '0.75rem', fontWeight: 500 };

const primaryButtonStyle: React.CSSProperties = {
	height: '48px',
	borderRadius: '8px',
	fontSize: '1rem',
	fontWeight: 600,
	textTransform: 'none',
	background: '#0D5FDC',
	boxShadow: 'none',
	transition: 'all 0.2s ease'
};

const linkButtonStyle: React.CSSProperties = {
	textTransform: 'none',
	color: '#0D5FDC',
	fontWeight: 500
};

function formatDuration(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const AuthForgotPassword = () => {
	const navigate = useNavigate();

	const [step, setStep] = useState<'request' | 'reset'>('request');
	const [employeeId, setEmployeeId] = useState('');
	// Timestamp the OTP was issued; both countdowns derive from it. Held in memory
	// only — the code and the password never reach storage or the URL.
	const [otpRequestedAt, setOtpRequestedAt] = useState<number | null>(null);
	const [formError, setFormError] = useState('');
	const [notice, setNotice] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const employeeIdRef = useRef<HTMLInputElement | null>(null);

	const [requestPasswordOtp, { isLoading: isRequesting }] = useRequestPasswordOtpMutation();
	const [resetPasswordWithOtp, { isLoading: isResetting }] = useResetPasswordWithOtpMutation();

	const requestForm = useForm<RequestOtpFormValues>({
		resolver: yupResolver(requestOtpSchema),
		defaultValues: requestOtpDefaults
	});

	const resetForm = useForm<ResetPasswordFormValues>({
		resolver: yupResolver(resetPasswordSchema),
		defaultValues: resetPasswordDefaults
	});

	const expirySeconds = useCountdown(otpRequestedAt === null ? null : otpRequestedAt + OTP_TTL_MS);
	const resendSeconds = useCountdown(otpRequestedAt === null ? null : otpRequestedAt + RESEND_COOLDOWN_MS);

	const isExpired = otpRequestedAt !== null && expirySeconds === 0;
	// Once the code is dead the cooldown is pointless — requesting a new one is the
	// only way forward, so allow it immediately.
	const canResend = !isRequesting && (isExpired || resendSeconds === 0);

	useEffect(() => {
		if (step === 'request') employeeIdRef.current?.focus();
	}, [step]);

	const returnToRequestStep = (message: string) => {
		resetForm.reset(resetPasswordDefaults);
		setOtpRequestedAt(null);
		setNotice('');
		setFormError(message);
		setStep('request');
	};

	const onRequestSubmit = async (values: RequestOtpFormValues) => {
		if (isRequesting) return;
		setFormError('');
		try {
			await requestPasswordOtp({ employeeId: values.employeeId }).unwrap();
			setEmployeeId(values.employeeId);
			resetForm.reset(resetPasswordDefaults);
			// Reading the clock is safe here: this is a submit handler, not render.
			// eslint-disable-next-line react-hooks/purity
			setOtpRequestedAt(Date.now());
			setNotice(SENT_NOTICE);
			setStep('reset');
		} catch (err) {
			// A failure here means nothing was sent, so stay put rather than advance.
			setFormError(mapRequestOtpError(err));
		}
	};

	const onResend = async () => {
		if (!canResend) return;
		setFormError('');
		try {
			await requestPasswordOtp({ employeeId }).unwrap();
			// Requesting again invalidates the previously emailed code, so clear
			// anything already typed and restart both timers.
			resetForm.reset(resetPasswordDefaults);
			setOtpRequestedAt(Date.now());
			setNotice('A new code has been sent. The previous code no longer works.');
		} catch (err) {
			setFormError(mapRequestOtpError(err));
		}
	};

	const onResetSubmit = async (values: ResetPasswordFormValues) => {
		if (isResetting) return;
		setFormError('');
		try {
			await resetPasswordWithOtp({
				employeeId,
				otp: values.otp,
				newPassword: values.newPassword
			}).unwrap();

			requestForm.reset(requestOtpDefaults);
			resetForm.reset(resetPasswordDefaults);
			setEmployeeId('');
			setOtpRequestedAt(null);

			Swal.fire({
				icon: 'success',
				title: 'Success!',
				text: 'Password reset successfully. Please log in with your new password.',
				timer: 2000,
				showConfirmButton: false
			});
			navigate(LOGIN_PATH, { replace: true });
		} catch (err) {
			const outcome = mapResetError(err);

			if (outcome.kind === 'fieldErrors') {
				const unmapped = applyAuthFieldErrors(resetForm.setError, outcome.fieldErrors, ['otp', 'newPassword']);
				// An employeeId error is not fixable here — that field lives on step 1.
				if (unmapped.length > 0) returnToRequestStep(unmapped.join(' '));
				else setFormError(outcome.message);
				return;
			}

			if (outcome.kind === 'restartStep1') {
				returnToRequestStep(outcome.message);
				return;
			}

			setFormError(outcome.message);
			if (outcome.field === 'otp') {
				resetForm.setValue('otp', '');
				resetForm.setError('otp', { type: 'server', message: outcome.message }, { shouldFocus: true });
			}
		}
	};

	const requestErrors = requestForm.formState.errors;
	const resetErrors = resetForm.formState.errors;

	const errorBanner = formError ? (
		<Box
			role="alert"
			sx={{
				p: 2,
				borderRadius: 2,
				backgroundColor: 'error.lighter',
				border: '1px solid',
				borderColor: 'error.light'
			}}
		>
			<Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>
				{formError}
			</Typography>
		</Box>
	) : null;

	return (
		<Box>
			<FullScreenFormSavingOverlay
				open={isRequesting || isResetting}
				message={isResetting ? 'Resetting your password' : 'Sending code'}
			/>

			<Box sx={{ mb: 3 }}>
				<CustomStepper steps={STEPS} activeStep={step === 'request' ? 0 : 1} />
			</Box>

			{step === 'request' ? (
				<form noValidate onSubmit={requestForm.handleSubmit(onRequestSubmit)}>
					<Stack spacing={3}>
						<Typography variant="body2" sx={{ color: '#6b7280' }}>
							Enter your Employee ID and we will send a {OTP_LENGTH}-digit code to the email registered on your account.
						</Typography>

						<Box>
							<InputLabel htmlFor="forgot-password-employee-id" sx={labelSx}>
								Emp ID
							</InputLabel>
							<OutlinedInput
								id="forgot-password-employee-id"
								type="text"
								autoComplete="username"
								placeholder="Enter employee ID"
								fullWidth
								error={Boolean(requestErrors.employeeId)}
								{...requestForm.register('employeeId')}
								inputRef={employeeIdRef}
								inputProps={{
									'aria-invalid': Boolean(requestErrors.employeeId),
									'aria-describedby': requestErrors.employeeId ? 'forgot-password-employee-id-error' : undefined
								}}
								sx={fieldSx}
							/>
							{requestErrors.employeeId && (
								<FormHelperText error id="forgot-password-employee-id-error" sx={helperSx}>
									{requestErrors.employeeId.message}
								</FormHelperText>
							)}
						</Box>

						{errorBanner}

						<Button
							disableElevation
							disabled={isRequesting}
							label="Send code"
							fullWidth
							size="large"
							type="submit"
							variant="contained"
							color="primary"
							style={primaryButtonStyle}
						/>

						<Box sx={{ textAlign: 'center' }}>
							<Button
								label="Back to login"
								variant="text"
								size="small"
								onClick={() => navigate(LOGIN_PATH)}
								style={linkButtonStyle}
							/>
						</Box>
					</Stack>
				</form>
			) : (
				<form noValidate onSubmit={resetForm.handleSubmit(onResetSubmit)}>
					<Stack spacing={3}>
						<Box role="status" aria-live="polite">
							<Typography variant="body2" sx={{ color: '#6b7280' }}>
								{notice}
							</Typography>
							<Typography variant="body2" sx={{ color: '#374151', fontWeight: 500, mt: 1 }}>
								Employee ID: {employeeId}
							</Typography>
							{isExpired ? (
								<Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 500, mt: 1 }}>
									This code has expired. Request a new one.
								</Typography>
							) : (
								<Typography variant="body2" sx={{ color: '#6b7280', mt: 1 }}>
									Code expires in <span aria-hidden="true">{formatDuration(expirySeconds)}</span>
								</Typography>
							)}
						</Box>

						<Box>
							<InputLabel htmlFor="forgot-password-otp" sx={labelSx}>
								Verification code
							</InputLabel>
							<Controller
								name="otp"
								control={resetForm.control}
								render={({ field }) => (
									<MuiOtpInput
										id="forgot-password-otp"
										value={field.value}
										onChange={field.onChange}
										length={OTP_LENGTH}
										autoFocus
										validateChar={character => /\d/.test(character)}
										TextFieldsProps={{
											disabled: isExpired,
											placeholder: '-',
											error: Boolean(resetErrors.otp),
											inputProps: {
												inputMode: 'numeric',
												autoComplete: 'one-time-code',
												'aria-label': 'Verification code digit'
											}
										}}
										sx={{ gap: 1 }}
									/>
								)}
							/>
							{resetErrors.otp && (
								<FormHelperText error id="forgot-password-otp-error" sx={helperSx}>
									{resetErrors.otp.message}
								</FormHelperText>
							)}
						</Box>

						<Box>
							<InputLabel htmlFor="forgot-password-new" sx={labelSx}>
								New password
							</InputLabel>
							<OutlinedInput
								id="forgot-password-new"
								type={showPassword ? 'text' : 'password'}
								autoComplete="new-password"
								placeholder="Enter new password"
								fullWidth
								disabled={isExpired}
								error={Boolean(resetErrors.newPassword)}
								{...resetForm.register('newPassword')}
								inputProps={{
									'aria-invalid': Boolean(resetErrors.newPassword),
									'aria-describedby': resetErrors.newPassword ? 'forgot-password-new-error' : undefined
								}}
								endAdornment={
									<InputAdornment position="end">
										<IconButton
											aria-label={showPassword ? 'Hide password' : 'Show password'}
											aria-pressed={showPassword}
											onClick={() => setShowPassword(value => !value)}
											onMouseDown={event => event.preventDefault()}
											edge="end"
											size="medium"
											sx={{ color: '#6b7280', '&:hover': { color: '#0D5FDC' } }}
										>
											{showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
										</IconButton>
									</InputAdornment>
								}
								sx={fieldSx}
							/>
							{resetErrors.newPassword && (
								<FormHelperText error id="forgot-password-new-error" sx={helperSx}>
									{resetErrors.newPassword.message}
								</FormHelperText>
							)}
						</Box>

						<Box>
							<InputLabel htmlFor="forgot-password-confirm" sx={labelSx}>
								Confirm new password
							</InputLabel>
							<OutlinedInput
								id="forgot-password-confirm"
								type={showConfirmPassword ? 'text' : 'password'}
								autoComplete="new-password"
								placeholder="Re-enter new password"
								fullWidth
								disabled={isExpired}
								error={Boolean(resetErrors.confirmPassword)}
								{...resetForm.register('confirmPassword')}
								inputProps={{
									'aria-invalid': Boolean(resetErrors.confirmPassword),
									'aria-describedby': resetErrors.confirmPassword ? 'forgot-password-confirm-error' : undefined
								}}
								endAdornment={
									<InputAdornment position="end">
										<IconButton
											aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
											aria-pressed={showConfirmPassword}
											onClick={() => setShowConfirmPassword(value => !value)}
											onMouseDown={event => event.preventDefault()}
											edge="end"
											size="medium"
											sx={{ color: '#6b7280', '&:hover': { color: '#0D5FDC' } }}
										>
											{showConfirmPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
										</IconButton>
									</InputAdornment>
								}
								sx={fieldSx}
							/>
							{resetErrors.confirmPassword && (
								<FormHelperText error id="forgot-password-confirm-error" sx={helperSx}>
									{resetErrors.confirmPassword.message}
								</FormHelperText>
							)}
						</Box>

						{errorBanner}

						<Button
							disableElevation
							disabled={isResetting || isExpired}
							label="Reset password"
							fullWidth
							size="large"
							type="submit"
							variant="contained"
							color="primary"
							style={primaryButtonStyle}
						/>

						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<Button
								label="Use a different Employee ID"
								variant="text"
								size="small"
								onClick={() => returnToRequestStep('')}
								style={linkButtonStyle}
							/>
							<Button
								label={canResend ? 'Resend code' : `Resend in ${resendSeconds}s`}
								variant="text"
								size="small"
								disabled={!canResend}
								onClick={onResend}
								style={{ textTransform: 'none', fontWeight: 500 }}
							/>
						</Box>
					</Stack>
				</form>
			)}
		</Box>
	);
};

export default AuthForgotPassword;
