import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	inspectionListResponseSchema,
	inspectionByIdResponseSchema,
	createInspectionResponseSchema,
	updateInspectionResponseSchema,
	deleteInspectionTaskResponseSchema,
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
				const parsed = inspectionListResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for inspections response:', parsed.error);
					throw new Error('Invalid inspections response structure');
				}
				return parsed.data;
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
				const parsed = inspectionByIdResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for inspection by ID response:', parsed.error);
					throw new Error('Invalid inspection by ID response structure');
				}
				return parsed.data;
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
				const parsed = createInspectionResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for create inspection response:', parsed.error);
					throw new Error('Invalid create inspection response structure');
				}
				return parsed.data;
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
				const parsed = updateInspectionResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for update inspection response:', parsed.error);
					throw new Error('Invalid update inspection response structure');
				}
				return parsed.data;
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
				const parsed = deleteInspectionTaskResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for delete inspection task response:', parsed.error);
					throw new Error('Invalid delete inspection task response structure');
				}
				return parsed.data;
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
