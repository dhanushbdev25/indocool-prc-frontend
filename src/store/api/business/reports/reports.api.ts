import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	parseAvailableReportsResponse,
	parseReportResponse,
	type AvailableReport,
	type ReportData,
	type ReportRequest
} from './reports.validators';

export const reportsApi = createApi({
	reducerPath: 'reportsApi',
	baseQuery,
	tagTypes: ['ReportsAvailable', 'ReportData'],
	endpoints: builder => ({
		fetchAvailableReports: builder.query<AvailableReport[], void>({
			query: () => ({ url: 'reports/available', method: 'GET' }),
			transformResponse: (response: unknown) => parseAvailableReportsResponse(response),
			providesTags: ['ReportsAvailable']
		}),
		fetchReport: builder.query<ReportData, ReportRequest>({
			query: ({ reportType, ...body }) => ({
				url: `reports/${encodeURIComponent(reportType)}`,
				method: 'POST',
				body
			}),
			transformResponse: (response: unknown) => parseReportResponse(response),
			providesTags: (_result, _error, arg) => [{ type: 'ReportData', id: arg.reportType }]
		})
	})
});

export const { useFetchAvailableReportsQuery, useLazyFetchReportQuery } = reportsApi;
