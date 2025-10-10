import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	catalystChartResponseSchema,
	catalystByIdResponseSchema,
	createCatalystResponseSchema,
	updateCatalystResponseSchema,
	deleteCatalystTaskResponseSchema,
	type CatalystChartResponse,
	type CatalystByIdResponse,
	type CreateCatalystRequest,
	type UpdateCatalystRequest,
	type CreateCatalystResponse,
	type UpdateCatalystResponse,
	type DeleteCatalystTaskRequest,
	type DeleteCatalystTaskResponse
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
			},
			providesTags: ['Catalyst']
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
			},
			providesTags: (_, __, { id }) => [
				{ type: 'Catalyst', id },
				{ type: 'Catalyst', id: 'LIST' }
			]
		}),
		// Create new catalyst
		createCatalyst: builder.mutation<CreateCatalystResponse, CreateCatalystRequest>({
			query: data => ({
				url: 'catalyst',
				method: 'POST',
				body: { data: data }
			}),
			transformResponse: (response: unknown) => {
				const parsed = createCatalystResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for create catalyst response:', parsed.error);
					throw new Error('Invalid create catalyst response structure');
				}
				return parsed.data;
			},
			invalidatesTags: ['Catalyst']
		}),
		// Update existing catalyst
		updateCatalyst: builder.mutation<UpdateCatalystResponse, UpdateCatalystRequest>({
			query: ({ id, ...data }) => ({
				url: `catalyst/${id}`,
				method: 'PUT',
				body: { data: data }
			}),
			transformResponse: (response: unknown) => {
				const parsed = updateCatalystResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for update catalyst response:', parsed.error);
					throw new Error('Invalid update catalyst response structure');
				}
				return parsed.data;
			},
			invalidatesTags: (_, __, { id }) => [{ type: 'Catalyst', id }, { type: 'Catalyst', id: 'LIST' }, 'Catalyst']
		}),
		// Delete catalyst task (set status to INACTIVE)
		deleteCatalystTask: builder.mutation<DeleteCatalystTaskResponse, DeleteCatalystTaskRequest>({
			query: data => ({
				url: `catalyst/${data?.catalyst?.id}`,
				method: 'PUT',
				body: { data: { ...data, catalyst: { ...data.catalyst, status: 'INACTIVE' } } }
			}),
			transformResponse: (response: unknown) => {
				const parsed = deleteCatalystTaskResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for delete catalyst task response:', parsed.error);
					throw new Error('Invalid delete catalyst task response structure');
				}
				return parsed.data;
			},
			invalidatesTags: (_, __, { catalyst }) => [
				{ type: 'Catalyst', id: catalyst?.id },
				{ type: 'Catalyst', id: 'LIST' },
				'Catalyst'
			]
		})
	})
});

export const {
	useFetchCatalystChartsQuery,
	useFetchCatalystByIdQuery,
	useCreateCatalystMutation,
	useUpdateCatalystMutation,
	useDeleteCatalystTaskMutation
} = catalystApi;
