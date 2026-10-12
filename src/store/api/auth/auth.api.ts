import { createApi } from '@reduxjs/toolkit/query/react';
import { rawBaseQuery } from '../baseApi';
import { isAuthMessageResponse, type AuthMessageResponse } from './auth.validators';

type LoginRes = {
	message: string;
	accessToken?: string;
	refreshToken?: string;
};
type LogoutRes = { message: string };

export type RequestPasswordOtpArgs = { employeeId: string };
export type ResetPasswordWithOtpArgs = { employeeId: string; otp: string; newPassword: string };

const warnOnUnexpectedShape =
	(endpoint: string) =>
	(response: unknown): AuthMessageResponse => {
		if (!isAuthMessageResponse(response)) {
			console.warn(`Invalid ${endpoint} response structure`, response);
		}
		return response as AuthMessageResponse;
	};

export const authApi = createApi({
	reducerPath: 'authApi',
	baseQuery: rawBaseQuery,
	endpoints: builder => ({
		loginUser: builder.mutation<LoginRes, { employeeId: string; password: string }>({
			query(data) {
				return {
					url: 'auth/login',
					method: 'post',
					body: data
				};
			}
		}),

		logoutUser: builder.mutation<LogoutRes, void>({
			query: () => ({
				url: 'auth/logout',
				method: 'post'
			})
		}),

		/**
		 * Step 1 of the forgot-password flow. Always resolves 200 with the same
		 * non-committal message, even for an unknown or inactive Employee ID, so the
		 * caller can never use it to probe whether an account exists.
		 */
		requestPasswordOtp: builder.mutation<AuthMessageResponse, RequestPasswordOtpArgs>({
			query: body => ({
				url: 'auth/request-otp',
				method: 'post',
				body
			}),
			transformResponse: warnOnUnexpectedShape('request-otp')
		}),

		/**
		 * Step 2. There is no separate verify-OTP endpoint, so the code and the new
		 * password have to be submitted together in a single call.
		 */
		resetPasswordWithOtp: builder.mutation<AuthMessageResponse, ResetPasswordWithOtpArgs>({
			query: body => ({
				url: 'auth/reset-password-otp',
				method: 'post',
				body
			}),
			transformResponse: warnOnUnexpectedShape('reset-password-otp')
		})
	})
});

export const {
	useLoginUserMutation,
	useLogoutUserMutation,
	useRequestPasswordOtpMutation,
	useResetPasswordWithOtpMutation
} = authApi;
