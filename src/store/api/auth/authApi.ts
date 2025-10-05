import { createApi } from '@reduxjs/toolkit/query/react';
import { rawBaseQuery } from '../baseApi';

type LoginRes = { message: string };
type LogoutRes = { message: string };

export const authApi = createApi({
	reducerPath: 'authApi',
	baseQuery: rawBaseQuery,
	endpoints: builder => ({
		loginUser: builder.mutation<LoginRes, any>({
			query(data) {
				return {
					url: 'auth/login',
					method: 'post',
					body: data,
					headers: {
						Authorization: `Bearer ${data.token}`
					}
				};
			}
		}),

		logoutUser: builder.mutation<LogoutRes, void>({
			query: () => ({
				url: 'auth/logout',
				method: 'post',
				credentials: 'include'
			})
		})
	})
});

export const { useLoginUserMutation, useLogoutUserMutation } = authApi;
