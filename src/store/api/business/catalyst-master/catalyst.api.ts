import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import { 
	catalystChartResponseSchema, 
	catalystByIdResponseSchema,
	type CatalystChartResponse,
	type CatalystByIdResponse,
	type CreateCatalystRequest,
	type UpdateCatalystRequest
} from './catalyst.validators';

// API parameters
export interface FetchCatalystByIdParams {
	id: number;
}

export const catalystApi = createApi({
	reducerPath: 'catalystApi',
	baseQuery,
	tagTypes: ['Catalyst'],
	endpoints: builder => ({
		// Fetch all catalyst charts
		fetchCatalystCharts: builder.query<CatalystChartResponse, void>({
			query: () => ({
				url: 'catalyst/',
				method: 'GET'
			}),
			transformResponse: (response: unknown) => {
				const parsed = catalystChartResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for catalyst charts response:', parsed.error);
					throw new Error('Invalid catalyst charts response structure');
				}
				return parsed.data;
			}
		}),
		// Fetch single catalyst by ID
		fetchCatalystById: builder.query<CatalystByIdResponse, FetchCatalystByIdParams>({
			query: ({ id }) => ({
				url: `catalyst/${id}`,
				method: 'GET'
			}),
			transformResponse: (response: unknown) => {
				const parsed = catalystByIdResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for catalyst by ID response:', parsed.error);
					throw new Error('Invalid catalyst by ID response structure');
				}
				return parsed.data;
			}
		}),
		// Create new catalyst
		createCatalyst: builder.mutation<CatalystByIdResponse, CreateCatalystRequest>({
			query: (data) => ({
				url: 'catalyst',
				method: 'POST',
				body: data
			}),
			transformResponse: (response: unknown) => {
				const parsed = catalystByIdResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for create catalyst response:', parsed.error);
					throw new Error('Invalid create catalyst response structure');
				}
				return parsed.data;
			},
			invalidatesTags: ['Catalyst']
		}),
		// Update existing catalyst
		updateCatalyst: builder.mutation<CatalystByIdResponse, UpdateCatalystRequest>({
			query: ({ id, ...data }) => ({
				url: `catalyst/${id}`,
				method: 'PUT',
				body: data
			}),
			transformResponse: (response: unknown) => {
				const parsed = catalystByIdResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for update catalyst response:', parsed.error);
					throw new Error('Invalid update catalyst response structure');
				}
				return parsed.data;
			},
			invalidatesTags: ['Catalyst']
		})
	})
});

export const { 
	useFetchCatalystChartsQuery,
	useFetchCatalystByIdQuery,
	useCreateCatalystMutation,
	useUpdateCatalystMutation
} = catalystApi;
