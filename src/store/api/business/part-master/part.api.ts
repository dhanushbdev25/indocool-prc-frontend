import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	partsResponseSchema,
	partByIdResponseSchema,
	customersResponseSchema,
	createPartResponseSchema,
	updatePartResponseSchema,
	type PartsResponse,
	type PartByIdResponse,
	type CustomersResponse,
	type CreatePartRequest,
	type UpdatePartRequest,
	type DeletePartRequest,
	type CreatePartResponse,
	type UpdatePartResponse
} from './part.validators';

// API parameters
export interface FetchPartByIdParams {
	id: number;
}

export const partApi = createApi({
	reducerPath: 'partApi',
	baseQuery,
	tagTypes: ['Part', 'Customer'],
	endpoints: builder => ({
		// Fetch all parts
		fetchParts: builder.query<PartsResponse, void>({
			query: () => ({
				url: 'parts/',
				method: 'GET'
			}),
			transformResponse: (response: unknown) => {
				const parsed = partsResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for parts response:', parsed.error);
					throw new Error('Invalid parts response structure');
				}
				return parsed.data;
			},
			providesTags: ['Part']
		}),
		// Fetch single part by ID
		fetchPartById: builder.query<PartByIdResponse, FetchPartByIdParams>({
			query: ({ id }) => ({
				url: `parts/${id}`,
				method: 'GET'
			}),
			transformResponse: (response: unknown) => {
				const parsed = partByIdResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for part by ID response:', parsed.error);
					throw new Error('Invalid part by ID response structure');
				}
				return parsed.data;
			},
			providesTags: (_, __, { id }) => [
				{ type: 'Part', id },
				{ type: 'Part', id: 'LIST' }
			]
		}),
		// Fetch customers
		fetchCustomers: builder.query<CustomersResponse, void>({
			query: () => ({
				url: 'customer',
				method: 'GET'
			}),
			transformResponse: (response: unknown) => {
				const parsed = customersResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for customers response:', parsed.error);
					throw new Error('Invalid customers response structure');
				}
				return parsed.data;
			},
			providesTags: ['Customer']
		}),
		// Create new part
		createPart: builder.mutation<CreatePartResponse, CreatePartRequest>({
			query: data => ({
				url: 'parts',
				method: 'POST',
				body: data
			}),
			transformResponse: (response: unknown) => {
				const parsed = createPartResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for create part response:', parsed.error);
					throw new Error('Invalid create part response structure');
				}
				return parsed.data;
			},
			invalidatesTags: ['Part']
		}),
		// Update existing part
		updatePart: builder.mutation<UpdatePartResponse, UpdatePartRequest>({
			query: ({ id, data }) => ({
				url: `parts/${id}`,
				method: 'PUT',
				body: { data }
			}),
			transformResponse: (response: unknown) => {
				const parsed = updatePartResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for update part response:', parsed.error);
					throw new Error('Invalid update part response structure');
				}
				return parsed.data;
			},
			invalidatesTags: (_, __, { id }) => [{ type: 'Part', id }, { type: 'Part', id: 'LIST' }, 'Part']
		}),
		// Delete part task (set status to INACTIVE)
		deletePartTask: builder.mutation<UpdatePartResponse, DeletePartRequest>({
			query: data => ({
				url: `parts/${data?.partMaster?.id}`,
				method: 'PUT',
				body: { data: { ...data, partMaster: { ...data.partMaster, status: 'INACTIVE' } } }
			}),
			transformResponse: (response: unknown) => {
				const parsed = updatePartResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for delete part task response:', parsed.error);
					throw new Error('Invalid delete part task response structure');
				}
				return parsed.data;
			},
			invalidatesTags: (_, __, { partMaster }) => [
				{ type: 'Part', id: partMaster?.id },
				{ type: 'Part', id: 'LIST' },
				'Part'
			]
		})
	})
});

export const {
	useFetchPartsQuery,
	useFetchPartByIdQuery,
	useFetchCustomersQuery,
	useCreatePartMutation,
	useUpdatePartMutation,
	useDeletePartTaskMutation
} = partApi;
