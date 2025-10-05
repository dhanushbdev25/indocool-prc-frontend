import { createApi } from '@reduxjs/toolkit/query/react';
import { sessionData, userSessionContextparser } from '../userSessionContextParser';
import { baseQuery } from '../baseApi';

export const sessionApi = createApi({
	reducerPath: 'sessionApi',
	baseQuery,
	endpoints: builder => ({
		userSessionContext: builder.query<sessionData, null>({
			query: () => '/session',

			// Keep cached for 0.5 hours
			keepUnusedDataFor: 1800,

			transformResponse: (response: unknown) => {
				const parsed = userSessionContextparser.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed', parsed.error);
					throw new Error('Invalid session context structure');
				}
				return parsed.data;
			}
		})
	})
});

const { useUserSessionContextQuery } = sessionApi;

const useSessionContextQuery = (token: string | null) => {
	const query = useUserSessionContextQuery(null, {
		skip: !token,
		refetchOnMountOrArgChange: false,
		refetchOnReconnect: false
	});

	let errorMessage: string | undefined;

	if (query.error) {
		if ('status' in query.error) {
			if (typeof query.error.data === 'string') {
				errorMessage = query.error.data;
			} else if (query.error.data && typeof query.error.data === 'object' && 'message' in query.error.data) {
				errorMessage = String(query.error.data.message);
			} else {
				errorMessage = `Error ${query.error.status}`;
			}
		} else if ('message' in query.error) {
			errorMessage = query.error.message;
		}
	}

	return { ...query, errorMessage };
};

export { useSessionContextQuery };
