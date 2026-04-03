import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import Cookie from '../../utils/Cookie';
import { logoutApp } from '../reducers/actions';

export const rawBaseQuery = fetchBaseQuery({
	baseUrl: process.env.API_BASE_URL,
	prepareHeaders: (headers) => {
		const token = Cookie.getToken();
		if (token) {
			headers.set('Authorization', `Bearer ${token}`);
		}
		return headers;
	}
});

export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
	args,
	api,
	extraOptions
) => {
	let result = await rawBaseQuery(args, api, extraOptions);

	if (result.error?.status === 401) {
		const refreshToken = Cookie.getRefreshToken();
		if (!refreshToken) {
			Cookie.removeToken();
			api.dispatch(logoutApp());
			return result;
		}

		const refresh = await rawBaseQuery(
			{
				url: 'auth/refresh',
				method: 'POST',
				body: { refreshToken },
				headers: {
					'x-refresh-token': refreshToken
				}
			},
			api,
			extraOptions
		);

		if (refresh.data && typeof refresh.data === 'object' && 'accessToken' in refresh.data) {
			const data = refresh.data as { accessToken: string; refreshToken?: string };
			Cookie.setToken(data.accessToken);
			if (data.refreshToken) {
				Cookie.setRefreshToken(data.refreshToken);
			}
			result = await rawBaseQuery(args, api, extraOptions);
		} else {
			Cookie.removeToken();
			api.dispatch(logoutApp());
		}
	}

	return result;
};

export const createPrefixedBaseQuery =
	(prefix: string): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =>
	async (args, api, extraOptions) => {
		const modifiedArgs = typeof args === 'string' ? `${prefix}${args}` : { ...args, url: `${prefix}${args.url}` };

		return baseQuery(modifiedArgs, api, extraOptions);
	};
