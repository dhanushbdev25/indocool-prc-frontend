import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	isPartsResponse,
	isPartByIdResponse,
	isCustomersResponse,
	isCustomerVariantComboResponse,
	isSapComboResponse,
	isPartMutationResponse,
	type PartsResponse,
	type PartByIdResponse,
	type CustomersResponse,
	type CustomerVariantComboResponse,
	type SapComboResponse,
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

export interface FetchCustomerVariantComboParams {
	customerCode: string;
}

export const partApi = createApi({
	reducerPath: 'partApi',
	baseQuery,
	tagTypes: ['Part', 'Customer', 'CustomerVariant', 'SapCombo'],
	endpoints: builder => ({
		// Fetch all parts
		fetchParts: builder.query<PartsResponse, void>({
			query: () => ({
				url: 'parts/',
				method: 'GET'
			}),
			transformResponse: (response: unknown) => {
				if (!isPartsResponse(response)) {
					console.warn('Invalid parts response structure', response);
				}
				return response as PartsResponse;
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
				if (!isPartByIdResponse(response)) {
					console.warn('Invalid part by ID response structure', response);
				}
				return response as PartByIdResponse;
			},
			providesTags: (_, __, { id }) => [
				{ type: 'Part', id },
				{ type: 'Part', id: 'LIST' }
			]
		}),
		// Fetch customers
		fetchCustomers: builder.query<CustomersResponse, void>({
			query: () => ({
				url: '/customer/combo',
				method: 'GET'
			}),
			transformResponse: (response: unknown) => {
				if (!isCustomersResponse(response)) {
					console.warn('Invalid customers response structure', response);
				}
				return response as CustomersResponse;
			},
			providesTags: ['Customer']
		}),
		fetchCustomerVariantCombo: builder.query<CustomerVariantComboResponse, FetchCustomerVariantComboParams>({
			query: ({ customerCode }) => ({
				url: `/customer/variantCombo?customerCode=${encodeURIComponent(customerCode)}`,
				method: 'GET'
			}),
			transformResponse: (response: unknown): CustomerVariantComboResponse => {
				if (!isCustomerVariantComboResponse(response)) {
					console.warn('Invalid customer variant combo response structure', response);
					return response as CustomerVariantComboResponse;
				}
				return {
					data: response.data.map(row => ({
						...row,
						value: String(row.value)
					}))
				};
			},
			providesTags: (_, __, { customerCode }) => [{ type: 'CustomerVariant', id: customerCode }]
		}),
		fetchSapCombo: builder.query<SapComboResponse, void>({
			query: () => ({
				url: 'parts/sapCombo',
				method: 'GET'
			}),
			transformResponse: (response: unknown): SapComboResponse => {
				if (!isSapComboResponse(response)) {
					console.warn('Invalid SAP combo response structure', response);
					return response as SapComboResponse;
				}
				return {
					data: response.data.map(row => ({
						...row,
						value: String(row.value)
					}))
				};
			},
			providesTags: ['SapCombo']
		}),
		// Create new part
		createPart: builder.mutation<CreatePartResponse, CreatePartRequest>({
			query: data => ({
				url: 'parts',
				method: 'POST',
				body: data
			}),
			transformResponse: (response: unknown) => {
				if (!isPartMutationResponse(response)) {
					console.warn('Invalid create part response structure', response);
				}
				return response as CreatePartResponse;
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
				if (!isPartMutationResponse(response)) {
					console.warn('Invalid update part response structure', response);
				}
				return response as UpdatePartResponse;
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
				if (!isPartMutationResponse(response)) {
					console.warn('Invalid delete part task response structure', response);
				}
				return response as UpdatePartResponse;
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
	useFetchCustomerVariantComboQuery,
	useFetchSapComboQuery,
	useCreatePartMutation,
	useUpdatePartMutation,
	useDeletePartTaskMutation
} = partApi;
