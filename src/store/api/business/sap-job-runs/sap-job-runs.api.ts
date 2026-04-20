import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	parseSapJobConfigsResponse,
	parseSapJobRunsResponse,
	type SapJobConfigItem,
	type SapJobRunItem
} from './sap-job-runs.validators';

export const sapJobRunsApi = createApi({
	reducerPath: 'sapJobRunsApi',
	baseQuery,
	tagTypes: ['SapJobConfig', 'SapJobRun'],
	endpoints: builder => ({
		fetchSapJobConfigs: builder.query<SapJobConfigItem[], void>({
			query: () => ({
				url: 'sapJobRuns/configs',
				method: 'GET'
			}),
			transformResponse: (response: unknown) => parseSapJobConfigsResponse(response),
			providesTags: ['SapJobConfig']
		}),
		fetchSapJobRuns: builder.query<SapJobRunItem[], { jobKey: string }>({
			query: ({ jobKey }) => ({
				url: 'sapJobRuns',
				method: 'GET',
				params: { jobKey }
			}),
			transformResponse: (response: unknown) => parseSapJobRunsResponse(response),
			providesTags: (_result, _err, { jobKey }) => [{ type: 'SapJobRun', id: jobKey }]
		})
	})
});

export const { useFetchSapJobConfigsQuery, useFetchSapJobRunsQuery } = sapJobRunsApi;
