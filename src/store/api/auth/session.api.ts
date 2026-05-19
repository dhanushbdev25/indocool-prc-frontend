import { createApi } from '@reduxjs/toolkit/query/react';
import { sessionData, isSessionData } from '../userSessionContextParser';
import { baseQuery } from '../baseApi';
import Cookie from '../../../utils/Cookie';

export const sessionApi = createApi({
	reducerPath: 'sessionApi',
	baseQuery,
	endpoints: builder => ({
		userSessionContext: builder.query<sessionData, null>({
			query: () => '/session',

			// Keep cached for 0.5 hours
			keepUnusedDataFor: 1800,

			transformResponse: (response: unknown) => {
				if (!isSessionData(response)) {
					console.error('Invalid session context structure', response);
					throw new Error('Invalid session context structure');
				}
				return response;
			}
		})
	})
});

const { useUserSessionContextQuery } = sessionApi;

const useSessionContextQuery = (token: string | null | undefined) => {
	const resolvedToken = token ?? Cookie.getToken();
	const query = useUserSessionContextQuery(null, {
		skip: !resolvedToken,
		refetchOnMountOrArgChange: true,
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
