import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	isCatalystChartResponse,
	isCatalystByIdResponse,
	isCatalystMutationResponse,
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
				if (!isCatalystChartResponse(response)) {
					console.warn('Invalid catalyst charts response structure', response);
				}
				return response as CatalystChartResponse;
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
				if (!isCatalystByIdResponse(response)) {
					console.warn('Invalid catalyst by ID response structure', response);
				}
				return response as CatalystByIdResponse;
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
				if (!isCatalystMutationResponse(response)) {
					console.warn('Invalid create catalyst response structure', response);
				}
				return response as CreateCatalystResponse;
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
				if (!isCatalystMutationResponse(response)) {
					console.warn('Invalid update catalyst response structure', response);
				}
				return response as UpdateCatalystResponse;
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
				if (!isCatalystMutationResponse(response)) {
					console.warn('Invalid delete catalyst task response structure', response);
				}
				return response as DeleteCatalystTaskResponse;
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
