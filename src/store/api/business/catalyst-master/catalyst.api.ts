import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import { catalystChartResponseSchema, type CatalystChartResponse } from './catalyst.validators';

// API parameters
export interface FetchCatalystChartParams {
	id: number;
}

export const catalystApi = createApi({
	reducerPath: 'catalystApi',
	baseQuery,
	endpoints: builder => ({
		fetchCatalystChart: builder.query<CatalystChartResponse, FetchCatalystChartParams>({
			query: ({ id }) => ({
				url: `catalyst/?id=${id}`,
				method: 'GET'
			}),
			transformResponse: (response: unknown) => {
				const parsed = catalystChartResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for catalyst chart response:', parsed.error);
					throw new Error('Invalid catalyst chart response structure');
				}
				return parsed.data;
			}
		})
	})
});

export const { useFetchCatalystChartQuery } = catalystApi;
