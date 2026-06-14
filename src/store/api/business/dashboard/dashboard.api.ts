import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	parseMetricsResponse,
	parseMouldingAnalysisResponse,
	parseDatewiseMetricsResponse,
	type DashboardDateRangeParams,
	type MetricsData,
	type MouldingAnalysisData,
	type DatewiseMetricsItem
} from './dashboard.validators';

export const dashboardApi = createApi({
	reducerPath: 'dashboardApi',
	baseQuery,
	tagTypes: ['DashboardMetrics', 'DashboardDatewise', 'DashboardMouldingAnalysis'],
	endpoints: builder => ({
		fetchMetrics: builder.query<MetricsData, DashboardDateRangeParams>({
			query: ({ from, to }) => ({
				url: 'dashboardPre/metrics',
				method: 'GET',
				params: { from, to }
			}),
			transformResponse: (response: unknown) => parseMetricsResponse(response),
			providesTags: ['DashboardMetrics']
		}),
		fetchDatewiseMetrics: builder.query<DatewiseMetricsItem[], DashboardDateRangeParams>({
			query: ({ from, to }) => ({
				url: 'dashboardPre/metrics/datewise',
				method: 'GET',
				params: { from, to }
			}),
			transformResponse: (response: unknown) => parseDatewiseMetricsResponse(response),
			providesTags: ['DashboardDatewise']
		}),
		fetchMouldingAnalysis: builder.query<MouldingAnalysisData, DashboardDateRangeParams>({
			query: ({ from, to }) => ({
				url: 'dashboardPre/metrics/moulding-analysis',
				method: 'GET',
				params: { from, to }
			}),
			transformResponse: (response: unknown) => parseMouldingAnalysisResponse(response),
			providesTags: ['DashboardMouldingAnalysis']
		})
	})
});

export const {
	useFetchMetricsQuery,
	useFetchDatewiseMetricsQuery,
	useFetchMouldingAnalysisQuery
} = dashboardApi;
