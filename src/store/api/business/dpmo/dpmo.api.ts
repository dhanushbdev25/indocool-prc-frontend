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
import { isWebComboResponse, type WebComboItem } from '../prc-execution/prc-execution.validators';

export const dpmoApi = createApi({
	reducerPath: 'dpmoApi',
	baseQuery,
	tagTypes: ['DpmoMetrics', 'IssueTypeCombo'],
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
		/**
		 * Same payload as `dashboard/metrics/dpmo` minus the `itemwise` array. Built on the
		 * backend's shared `buildDashboardFilters`, so it takes the full dashboard filter set
		 * plus `issueType` — the Overview tab passes it the same args as the dpmometrics queries.
		 */
		fetchDpmoMetricsv2: builder.query<DpmoData, DashboardQueryParams>({
			query: args => ({
				url: 'dashboard/metrics/dpmo/v2',
				method: 'GET',
				params: buildDashboardQueryParams(args)
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
		}),
		/** GET /web/combo/issue-types — distinct inspection issue types, label === value */
		fetchIssueTypesCombo: builder.query<WebComboItem[], void>({
			query: () => ({
				url: 'combo/issue-types',
				method: 'GET'
			}),
			transformResponse: (response: unknown) => {
				if (!isWebComboResponse(response)) {
					console.warn('Invalid issue types combo response structure', response);
					return [];
				}
				return response.data;
			},
			providesTags: ['IssueTypeCombo']
		})
	})
});

export const {
	useFetchDpmoMetricsQuery,
	useFetchDpmoSummaryQuery,
	useFetchDpmoBreakdownQuery,
	useFetchDpmoTrendsQuery,
	useFetchDpmoMetricsv2Query,
	useFetchIssueTypesComboQuery
} = dpmoApi;
