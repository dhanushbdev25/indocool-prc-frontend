import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	isInspectionListResponse,
	isInspectionByIdResponse,
	isInspectionMutationResponse,
	type InspectionListResponse,
	type InspectionByIdResponse,
	type CreateInspectionRequest,
	type UpdateInspectionRequest,
	type CreateInspectionResponse,
	type UpdateInspectionResponse,
	type DeleteInspectionTaskRequest,
	type DeleteInspectionTaskResponse
} from './inspection.validators';

// API parameters
export interface FetchInspectionByIdParams {
	id: number;
}

export const inspectionApi = createApi({
	reducerPath: 'inspectionApi',
	baseQuery,
	tagTypes: ['Inspection'],
	endpoints: builder => ({
		// Fetch all inspections
		fetchInspections: builder.query<InspectionListResponse, void>({
			query: () => ({
				url: 'inspection/',
				method: 'GET'
			}),
			transformResponse: (response: unknown) => {
				if (!isInspectionListResponse(response)) {
					console.warn('Invalid inspections response structure', response);
				}
				return response as InspectionListResponse;
			},
			providesTags: ['Inspection']
		}),
		// Fetch single inspection by ID
		fetchInspectionById: builder.query<InspectionByIdResponse, FetchInspectionByIdParams>({
			query: ({ id }) => ({
				url: `inspection/${id}`,
				method: 'GET'
			}),
			transformResponse: (response: unknown) => {
				if (!isInspectionByIdResponse(response)) {
					console.warn('Invalid inspection by ID response structure', response);
				}
				return response as InspectionByIdResponse;
			},
			providesTags: (_, __, { id }) => [
				{ type: 'Inspection', id },
				{ type: 'Inspection', id: 'LIST' }
			]
		}),
		// Create new inspection
		createInspection: builder.mutation<CreateInspectionResponse, CreateInspectionRequest>({
			query: data => ({
				url: 'inspection',
				method: 'POST',
				body: { data: data }
			}),
			transformResponse: (response: unknown) => {
				if (!isInspectionMutationResponse(response)) {
					console.warn('Invalid create inspection response structure', response);
				}
				return response as CreateInspectionResponse;
			},
			invalidatesTags: ['Inspection']
		}),
		// Update existing inspection
		updateInspection: builder.mutation<UpdateInspectionResponse, UpdateInspectionRequest>({
			query: ({ id, ...data }) => ({
				url: `inspection/${id}`,
				method: 'PUT',
				body: { data: data }
			}),
			transformResponse: (response: unknown) => {
				if (!isInspectionMutationResponse(response)) {
					console.warn('Invalid update inspection response structure', response);
				}
				return response as UpdateInspectionResponse;
			},
			invalidatesTags: (_, __, { id }) => [{ type: 'Inspection', id }, { type: 'Inspection', id: 'LIST' }, 'Inspection']
		}),
		// Delete inspection task (set status to INACTIVE)
		deleteInspectionTask: builder.mutation<DeleteInspectionTaskResponse, DeleteInspectionTaskRequest>({
			query: data => ({
				url: `inspection/${data?.inspection?.id}`,
				method: 'PUT',
				body: { data: { ...data, inspection: { ...data.inspection, status: 'INACTIVE' } } }
			}),
			transformResponse: (response: unknown) => {
				if (!isInspectionMutationResponse(response)) {
					console.warn('Invalid delete inspection task response structure', response);
				}
				return response as DeleteInspectionTaskResponse;
			},
			invalidatesTags: (_, __, { inspection }) => [
				{ type: 'Inspection', id: inspection?.id },
				{ type: 'Inspection', id: 'LIST' },
				'Inspection'
			]
		})
	})
});

export const {
	useFetchInspectionsQuery,
	useFetchInspectionByIdQuery,
	useCreateInspectionMutation,
	useUpdateInspectionMutation,
	useDeleteInspectionTaskMutation
} = inspectionApi;
