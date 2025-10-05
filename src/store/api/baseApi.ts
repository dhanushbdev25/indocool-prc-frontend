import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

export const rawBaseQuery = fetchBaseQuery({
	baseUrl: process.env.API_BASE_URL,
	credentials: 'include'
});

export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
	args,
	api,
	extraOptions
) => {
	let result = await rawBaseQuery(args, api, extraOptions);

	if (result.error?.status === 401) {
		const refresh = await rawBaseQuery('auth/refresh', api, extraOptions);
		if (refresh.data) {
			result = await rawBaseQuery(args, api, extraOptions);
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
