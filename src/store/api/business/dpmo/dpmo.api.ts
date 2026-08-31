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
import { buildDpmoQueryParams, parseDpmoResponse, type DpmoData, type DpmoQueryParams } from './dpmo.legacy.validators';

export const dpmoApi = createApi({
	reducerPath: 'dpmoApi',
	baseQuery,
	tagTypes: ['DpmoMetrics'],
	endpoints: builder => ({
		/**
		 * Superseded by the three dpmometrics endpoints below, but still served by the
		 * backend and still used by the hidden legacy DPMO dashboard route.
		 */
		fetchDpmoMetrics: builder.query<DpmoData, DpmoQueryParams>({
			query: args => ({
				url: 'dashboard/metrics/dpmo',
				method: 'GET',
				params: buildDpmoQueryParams(args)
			}),
			transformResponse: (response: unknown) => parseDpmoResponse(response),
			providesTags: ['DpmoMetrics']
		}),
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

export const {
	useFetchDpmoMetricsQuery,
	useFetchDpmoSummaryQuery,
	useFetchDpmoBreakdownQuery,
	useFetchDpmoTrendsQuery
} = dpmoApi;
