import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import { buildDashboardQueryParams, type DashboardQueryParams } from '../dashboard/dashboard.validators';
import {
	parseDpmoBreakdown,
	parseDpmoSummary,
	parseDpmoTrends,
	type DpmoBreakdownData,
	type DpmoSummaryData,
	type DpmoTrendsData
} from './dpmo.validators';

export const dpmoApi = createApi({
	reducerPath: 'dpmoApi',
	baseQuery,
	tagTypes: ['DpmoMetrics'],
	endpoints: builder => ({
		fetchDpmoSummary: builder.query<DpmoSummaryData, DashboardQueryParams>({
			query: args => ({
				url: 'dashboard/metrics/dpmometrics/summary',
				method: 'GET',
				params: buildDashboardQueryParams(args)
			}),
			transformResponse: (response: unknown) => parseDpmoSummary(response),
			providesTags: ['DpmoMetrics']
		}),
		fetchDpmoBreakdown: builder.query<DpmoBreakdownData, DashboardQueryParams>({
			query: args => ({
				url: 'dashboard/metrics/dpmometrics/breakdown',
				method: 'GET',
				params: buildDashboardQueryParams(args)
			}),
			transformResponse: (response: unknown) => parseDpmoBreakdown(response),
			providesTags: ['DpmoMetrics']
		}),
		fetchDpmoTrends: builder.query<DpmoTrendsData, DashboardQueryParams>({
			query: args => ({
				url: 'dashboard/metrics/dpmometrics/trends',
				method: 'GET',
				params: buildDashboardQueryParams(args)
			}),
			transformResponse: (response: unknown) => parseDpmoTrends(response),
			providesTags: ['DpmoMetrics']
		})
	})
});

export const { useFetchDpmoSummaryQuery, useFetchDpmoBreakdownQuery, useFetchDpmoTrendsQuery } = dpmoApi;
