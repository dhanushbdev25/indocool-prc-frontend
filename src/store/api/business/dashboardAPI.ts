import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../baseApi';

export const dashboardAPI = createApi({
	reducerPath: 'dashboardAPI',
	baseQuery,
	endpoints: builder => ({
		getRequestTab: builder.query<any, void>({
			query: () => `/request`
		}),

		getImpactTab: builder.query<any, void>({
			query: () => `/impact`
		}),

		getResourceTab: builder.query<any, void>({
			query: () => `/resource`
		})
	})
});

export const { useGetRequestTabQuery, useGetImpactTabQuery, useGetResourceTabQuery } = dashboardAPI;
