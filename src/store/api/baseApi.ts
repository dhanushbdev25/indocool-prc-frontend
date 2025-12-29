import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import Cookie from '../../utils/Cookie';

// Helper to get auth mode
const getAuthMode = (): 'cookie' | 'localStorage' => {
	const authMode = (import.meta.env.AUTH_MODE || process.env.AUTH_MODE || 'cookie') as 'cookie' | 'localStorage';
	return authMode === 'localStorage' ? 'localStorage' : 'cookie';
};

export const rawBaseQuery = fetchBaseQuery({
	baseUrl: process.env.API_BASE_URL,
	credentials: 'include',
	prepareHeaders: (headers) => {
		// Add Authorization header for localStorage mode
		if (getAuthMode() === 'localStorage') {
			const token = Cookie.getToken();
			if (token) {
				headers.set('Authorization', `Bearer ${token}`);
			}
		}
		return headers;
	}
});

export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
	args,
	api,
	extraOptions
) => {
	const authMode = getAuthMode();
	let result = await rawBaseQuery(args, api, extraOptions);

		if (result.error?.status === 401) {
		// Attempt to refresh token
		if (authMode === 'localStorage') {
			// For localStorage mode, send refresh token in header or query
			const refreshToken = Cookie.getRefreshToken();
			if (!refreshToken) {
				return result; // Can't refresh without refresh token
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
				// Update tokens in localStorage
				const data = refresh.data as { accessToken: string; refreshToken?: string };
				Cookie.setToken(data.accessToken);
				if (data.refreshToken) {
					Cookie.setRefreshToken(data.refreshToken);
				}
				// Retry original request
				result = await rawBaseQuery(args, api, extraOptions);
			}
		} else {
			// For cookie mode, refresh token is in cookie
			const refresh = await rawBaseQuery('auth/refresh', api, extraOptions);
			if (refresh.data) {
				result = await rawBaseQuery(args, api, extraOptions);
			}
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
