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

const useSessionContextQuery = (token: string | null | undefined) => {
	// Always attempt session API call - cookies are sent automatically with credentials: 'include'
	// In cross-origin scenarios, we can't read the cookie via JS, but the browser sends it automatically
	const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' ? true : false;
	console.log('isLoggedIn', isLoggedIn);
	const query = useUserSessionContextQuery(null, {
		skip: !isLoggedIn, // Always attempt - let server determine auth status
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

	return { ...query, errorMessage, error: query.error };
};

export { useSessionContextQuery };
