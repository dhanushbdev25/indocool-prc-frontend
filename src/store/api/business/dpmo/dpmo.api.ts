import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	buildDpmoQueryParams,
	parseDpmoResponse,
	type DpmoData,
	type DpmoQueryParams
} from './dpmo.validators';

export const dpmoApi = createApi({
	reducerPath: 'dpmoApi',
	baseQuery,
	tagTypes: ['DpmoMetrics'],
	endpoints: builder => ({
		fetchDpmoMetrics: builder.query<DpmoData, DpmoQueryParams>({
			query: args => ({
				url: 'dashboard/metrics/dpmo',
				method: 'GET',
				params: buildDpmoQueryParams(args)
			}),
			transformResponse: (response: unknown) => parseDpmoResponse(response),
			providesTags: ['DpmoMetrics']
		})
	})
});

export const { useFetchDpmoMetricsQuery } = dpmoApi;
