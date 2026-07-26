import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	parseSapJobConfigsResponse,
	parseSapConfirmationLogsResponse,
	parseSapJobRunsResponse,
	parseFetchRmResponse,
	type SapJobConfigItem,
	type SapConfirmationLogItem,
	type SapJobRunItem,
	type FetchRmResponse
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
			providesTags: (_result, _err, { prcExecutionId }) => [{ type: 'SapConfirmationLogs', id: prcExecutionId }]
		}),
		retriggerSapConfirmations: builder.mutation<unknown, { prcExecutionId: number }>({
			query: ({ prcExecutionId }) => ({
				url: `sapJobRuns/retriggerConfirmations/${prcExecutionId}`,
				method: 'POST'
			}),
			invalidatesTags: (_result, _err, { prcExecutionId }) => [{ type: 'SapConfirmationLogs', id: prcExecutionId }]
		}),
		fetchRawMaterials: builder.mutation<FetchRmResponse, { orderId: string }>({
			query: ({ orderId }) => ({
				url: `sapJobRuns/fetch-rm/${encodeURIComponent(orderId)}`,
				method: 'POST'
			}),
			transformResponse: (response: unknown) => parseFetchRmResponse(response)
		}),
		syncSapBom: builder.mutation<unknown, { partId: number }>({
			query: ({ partId }) => ({
				url: `sapJobRuns/sync-bom/${partId}`,
				method: 'POST'
			})
		}),
		syncSapOperations: builder.mutation<unknown, { partId: number }>({
			query: ({ partId }) => ({
				url: `sapJobRuns/sync-routing/${partId}`,
				method: 'POST'
			})
		})
	})
});

export const {
	useFetchSapJobConfigsQuery,
	useFetchSapJobRunsQuery,
	useFetchSapConfirmationLogsQuery,
	useRetriggerSapConfirmationsMutation,
	useFetchRawMaterialsMutation,
	useSyncSapBomMutation,
	useSyncSapOperationsMutation
} = sapJobRunsApi;
