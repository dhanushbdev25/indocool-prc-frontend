import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const requestPasswordOtp = vi.fn();
const resetPasswordWithOtp = vi.fn();
const navigate = vi.fn();
const swalFire = vi.fn();

// The stepper pulls in the @mui/icons-material barrel, which exhausts the file
// handle limit under vitest. Same guard as PartSapSyncActions.test.tsx.
vi.mock('@mui/icons-material', () => ({ Code: () => null }));

vi.mock('react-router-dom', () => ({
	useNavigate: () => navigate
}));

vi.mock('sweetalert2', () => ({
	default: { fire: (...args: unknown[]) => swalFire(...args) }
}));

vi.mock('../../../store/api/auth/auth.api', () => ({
	useRequestPasswordOtpMutation: () => [requestPasswordOtp, { isLoading: false }],
	useResetPasswordWithOtpMutation: () => [resetPasswordWithOtp, { isLoading: false }]
}));

import AuthForgotPassword from './AuthForgotPassword';

/** Shapes an RTK Query rejection the way fetchBaseQuery returns one. */
const apiError = (status: number | string, message: string, errors?: Record<string, string[]>) => ({
	status,
	data: errors ? { message, errors } : { message }
});

const resolved = (value: unknown) => ({ unwrap: () => Promise.resolve(value) });
const rejected = (err: unknown) => ({ unwrap: () => Promise.reject(err) });

function typeEmployeeId(value: string) {
	fireEvent.change(screen.getByLabelText('Emp ID'), { target: { value } });
}

function submitEmployeeId() {
	fireEvent.click(screen.getByRole('button', { name: 'Send code' }));
}

/** The OTP widget renders one input per digit. */
function typeOtp(code: string) {
	const boxes = screen.getAllByLabelText('Verification code digit');
	code.split('').forEach((digit, index) => {
		fireEvent.change(boxes[index], { target: { value: digit } });
	});
}

function typePasswords(password: string, confirmation = password) {
	fireEvent.change(screen.getByLabelText('New password'), { target: { value: password } });
	fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: confirmation } });
}

/** Drives step 1 to completion so a test can start on the reset step. */
async function reachResetStep(employeeId = '0001') {
	typeEmployeeId(employeeId);
	submitEmployeeId();
	await screen.findByText(`Employee ID: ${employeeId}`);
}

describe('AuthForgotPassword', () => {
	beforeEach(() => {
		// The countdowns read the wall clock, so pin it here rather than inherit
		// whatever ambient time another test file left behind. shouldAdvanceTime
		// keeps promises and Testing Library's waitFor working normally.
		vi.useFakeTimers({ shouldAdvanceTime: true });
		vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'));

		requestPasswordOtp.mockReset();
		resetPasswordWithOtp.mockReset();
		navigate.mockReset();
		swalFire.mockReset();

		requestPasswordOtp.mockReturnValue(resolved({ message: 'ok' }));
		resetPasswordWithOtp.mockReturnValue(resolved({ message: 'ok' }));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('sends the trimmed employee id and advances to the code step', async () => {
		render(<AuthForgotPassword />);

		typeEmployeeId('  0001  ');
		submitEmployeeId();

		await waitFor(() => {
			expect(requestPasswordOtp).toHaveBeenCalledWith({ employeeId: '0001' });
		});
		expect(await screen.findByText('Employee ID: 0001')).toBeInTheDocument();
	});

	it('shows non-committal copy that never confirms the account exists', async () => {
		render(<AuthForgotPassword />);
		await reachResetStep();

		expect(screen.getByText(/If that Employee ID exists/i)).toBeInTheDocument();
	});

	it('stays on step 1 when requesting the code fails', async () => {
		requestPasswordOtp.mockReturnValue(rejected(apiError(500, 'Something went wrong')));
		render(<AuthForgotPassword />);

		typeEmployeeId('0001');
		submitEmployeeId();

		expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
		expect(screen.getByRole('button', { name: 'Send code' })).toBeInTheDocument();
	});

	it('submits the employee id, code and new password in a single call', async () => {
		render(<AuthForgotPassword />);
		await reachResetStep();

		typeOtp('123456');
		typePasswords('test@123');
		fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));

		await waitFor(() => {
			expect(resetPasswordWithOtp).toHaveBeenCalledWith({
				employeeId: '0001',
				otp: '123456',
				newPassword: 'test@123'
			});
		});
	});

	it('navigates to the login page after a successful reset', async () => {
		render(<AuthForgotPassword />);
		await reachResetStep();

		typeOtp('123456');
		typePasswords('test@123');
		fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));

		await waitFor(() => {
			expect(navigate).toHaveBeenCalledWith('/', { replace: true });
		});
		expect(swalFire).toHaveBeenCalled();
	});

	it('keeps the user on the code step when the code is merely wrong', async () => {
		resetPasswordWithOtp.mockReturnValue(rejected(apiError(400, 'Incorrect OTP. 4 attempt(s) remaining.')));
		render(<AuthForgotPassword />);
		await reachResetStep();

		typeOtp('111111');
		typePasswords('test@123');
		fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));

		expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect OTP. 4 attempt(s) remaining.');
		// Still on step 2.
		expect(screen.getByText('Employee ID: 0001')).toBeInTheDocument();
	});

	it('returns to step 1 when the code has expired server-side', async () => {
		resetPasswordWithOtp.mockReturnValue(rejected(apiError(400, 'OTP has expired. Please request a new one.')));
		render(<AuthForgotPassword />);
		await reachResetStep();

		typeOtp('123456');
		typePasswords('test@123');
		fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));

		expect(await screen.findByRole('button', { name: 'Send code' })).toBeInTheDocument();
		expect(screen.getByRole('alert')).toHaveTextContent('OTP has expired');
	});

	it('returns to step 1 after too many incorrect attempts', async () => {
		resetPasswordWithOtp.mockReturnValue(
			rejected(apiError(429, 'Too many incorrect attempts. Please request a new OTP.'))
		);
		render(<AuthForgotPassword />);
		await reachResetStep();

		typeOtp('123456');
		typePasswords('test@123');
		fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));

		expect(await screen.findByRole('button', { name: 'Send code' })).toBeInTheDocument();
	});

	it('maps a server validation error onto the password field', async () => {
		resetPasswordWithOtp.mockReturnValue(
			rejected(
				apiError(400, 'Validation Error', {
					newPassword: ['New password must be at least 6 characters']
				})
			)
		);
		render(<AuthForgotPassword />);
		await reachResetStep();

		typeOtp('123456');
		typePasswords('test@123');
		fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));

		expect(await screen.findByText('New password must be at least 6 characters')).toBeInTheDocument();
	});

	it('rejects a confirmation that does not match before calling the API', async () => {
		render(<AuthForgotPassword />);
		await reachResetStep();

		typeOtp('123456');
		typePasswords('test@123', 'different');
		fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));

		expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
		expect(resetPasswordWithOtp).not.toHaveBeenCalled();
	});

	it('disables resending until the cooldown elapses, then re-enables it', async () => {
		render(<AuthForgotPassword />);
		await reachResetStep();

		expect(screen.getByRole('button', { name: /Resend in \d+s/ })).toBeDisabled();

		await act(async () => {
			vi.advanceTimersByTime(30_000);
		});

		expect(await screen.findByRole('button', { name: 'Resend code' })).toBeEnabled();
	});

	it('shows how long the code remains valid', async () => {
		render(<AuthForgotPassword />);
		await reachResetStep();

		// 10-minute server-side TTL.
		expect(screen.getByText(/Code expires in/)).toHaveTextContent('10:00');
	});

	it('requests a fresh code when resending', async () => {
		render(<AuthForgotPassword />);
		await reachResetStep();

		await act(async () => {
			vi.advanceTimersByTime(30_000);
		});
		fireEvent.click(await screen.findByRole('button', { name: 'Resend code' }));

		await waitFor(() => {
			expect(requestPasswordOtp).toHaveBeenCalledTimes(2);
		});
		expect(requestPasswordOtp).toHaveBeenLastCalledWith({ employeeId: '0001' });
	});

	it('disables submission once the code has expired', async () => {
		render(<AuthForgotPassword />);
		await reachResetStep();

		await act(async () => {
			vi.advanceTimersByTime(10 * 60 * 1000);
		});

		expect(await screen.findByText(/This code has expired/)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Reset password' })).toBeDisabled();
		// The cooldown is lifted, since a new code is the only way forward.
		expect(screen.getByRole('button', { name: 'Resend code' })).toBeEnabled();
	});

	it('clears a typed code when a new one is requested', async () => {
		render(<AuthForgotPassword />);
		await reachResetStep();

		typeOtp('123456');
		fireEvent.click(screen.getByRole('button', { name: 'Use a different Employee ID' }));
		submitEmployeeId();
		await screen.findByText('Employee ID: 0001');

		// The previously emailed code is invalid once a new one is issued.
		screen.getAllByLabelText('Verification code digit').forEach(box => {
			expect(box).toHaveValue('');
		});
	});
});
