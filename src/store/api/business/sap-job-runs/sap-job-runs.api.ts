import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	parseSapJobConfigsResponse,
	parseSapConfirmationLogsResponse,
	parseSapJobRunsResponse,
	type SapJobConfigItem,
	type SapConfirmationLogItem,
	type SapJobRunItem
} from './sap-job-runs.validators';

export const sapJobRunsApi = createApi({
	reducerPath: 'sapJobRunsApi',
	baseQuery,
	tagTypes: ['SapJobConfig', 'SapJobRun', 'SapConfirmationLogs'],
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
		}),
		fetchSapConfirmationLogs: builder.query<SapConfirmationLogItem[], { prcExecutionId: number }>({
			query: ({ prcExecutionId }) => ({
				url: `sapJobRuns/confirmationLogs/${prcExecutionId}`,
				method: 'GET'
			}),
			transformResponse: (response: unknown) => parseSapConfirmationLogsResponse(response),
			providesTags: (_result, _err, { prcExecutionId }) => [
				{ type: 'SapConfirmationLogs', id: prcExecutionId }
			]
		}),
		retriggerSapConfirmations: builder.mutation<unknown, { prcExecutionId: number }>({
			query: ({ prcExecutionId }) => ({
				url: `sapJobRuns/retriggerConfirmations/${prcExecutionId}`,
				method: 'POST'
			}),
			invalidatesTags: (_result, _err, { prcExecutionId }) => [
				{ type: 'SapConfirmationLogs', id: prcExecutionId }
			]
		})
	})
});

export const {
	useFetchSapJobConfigsQuery,
	useFetchSapJobRunsQuery,
	useFetchSapConfirmationLogsQuery,
	useRetriggerSapConfirmationsMutation
} = sapJobRunsApi;
