import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	buildDashboardQueryParams,
	parseMetricsResponse,
	parseMouldingAnalysisResponse,
	parseDatewiseMetricsResponse,
	type DashboardQueryParams,
	type RangedMetricsData,
	type MouldingAnalysisData,
	type DatewiseMetricsItem
} from './dashboard.validators';

export const dashboardApi = createApi({
	reducerPath: 'dashboardApi',
	baseQuery,
	tagTypes: ['DashboardMetrics', 'DashboardDatewise', 'DashboardMouldingAnalysis'],
	endpoints: builder => ({
		fetchMetrics: builder.query<RangedMetricsData, DashboardQueryParams>({
			query: args => ({
				url: 'dashboard/metrics',
				method: 'GET',
				params: buildDashboardQueryParams(args)
			}),
			transformResponse: (response: unknown) => parseMetricsResponse(response),
			providesTags: ['DashboardMetrics']
		}),
		fetchDatewiseMetrics: builder.query<DatewiseMetricsItem[], DashboardQueryParams>({
			query: args => ({
				url: 'dashboard/metrics/datewise',
				method: 'GET',
				params: buildDashboardQueryParams(args)
			}),
			transformResponse: (response: unknown) => parseDatewiseMetricsResponse(response),
			providesTags: ['DashboardDatewise']
		}),
		fetchMouldingAnalysis: builder.query<MouldingAnalysisData, DashboardQueryParams>({
			query: args => ({
				url: 'dashboard/metrics/moulding-analysis',
				method: 'GET',
				params: buildDashboardQueryParams(args)
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
