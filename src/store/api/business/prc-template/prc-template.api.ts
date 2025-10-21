import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	prcTemplateListResponseSchema,
	prcTemplateByIdResponseSchema,
	prcTemplateInspectionsResponseSchema,
	createPrcTemplateResponseSchema,
	updatePrcTemplateResponseSchema,
	deletePrcTemplateTaskResponseSchema,
	type PrcTemplateListResponse,
	type PrcTemplateByIdResponse,
	type PrcTemplateInspectionsResponse,
	type CreatePrcTemplateRequest,
	type UpdatePrcTemplateRequest,
	type CreatePrcTemplateResponse,
	type UpdatePrcTemplateResponse,
	type DeletePrcTemplateTaskRequest,
	type DeletePrcTemplateTaskResponse
} from './prc-template.validators';

// API parameters
export interface FetchPrcTemplateByIdParams {
	id: number;
}

export interface FetchPrcTemplateInspectionsParams {
	id: number;
}

export const prcTemplateApi = createApi({
	reducerPath: 'prcTemplateApi',
	baseQuery,
	tagTypes: ['PrcTemplate'],
	endpoints: builder => ({
		// Fetch all PRC templates
		fetchPrcTemplates: builder.query<PrcTemplateListResponse, void>({
			query: () => ({
				url: 'prcTemplate/',
				method: 'GET'
			}),
			transformResponse: (response: unknown) => {
				const parsed = prcTemplateListResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for PRC templates response:', parsed.error);
					throw new Error('Invalid PRC templates response structure');
				}
				return parsed.data;
			},
			providesTags: ['PrcTemplate']
		}),
		// Fetch single PRC template by ID
		fetchPrcTemplateById: builder.query<PrcTemplateByIdResponse, FetchPrcTemplateByIdParams>({
			query: ({ id }) => ({
				url: `prcTemplate/${id}`,
				method: 'GET'
			}),
			transformResponse: (response: unknown) => {
				const parsed = prcTemplateByIdResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for PRC template by ID response:', parsed.error);
					throw new Error('Invalid PRC template by ID response structure');
				}
				return parsed.data;
			},
			providesTags: (_, __, { id }) => [
				{ type: 'PrcTemplate', id },
				{ type: 'PrcTemplate', id: 'LIST' }
			]
		}),
		// Fetch PRC template inspections
		fetchPrcTemplateInspections: builder.query<PrcTemplateInspectionsResponse, FetchPrcTemplateInspectionsParams>({
			query: ({ id }) => ({
				url: `prcTemplate/inspections/${id}`,
				method: 'GET'
			}),
			transformResponse: (response: unknown) => {
				const parsed = prcTemplateInspectionsResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for PRC template inspections response:', parsed.error);
					throw new Error('Invalid PRC template inspections response structure');
				}
				return parsed.data;
			},
			providesTags: (_, __, { id }) => [{ type: 'PrcTemplate', id: `inspections-${id}` }]
		}),
		// Create new PRC template
		createPrcTemplate: builder.mutation<CreatePrcTemplateResponse, CreatePrcTemplateRequest>({
			query: data => ({
				url: 'prcTemplate/',
				method: 'POST',
				body: { data: data }
			}),
			transformResponse: (response: unknown) => {
				const parsed = createPrcTemplateResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for create PRC template response:', parsed.error);
					throw new Error('Invalid create PRC template response structure');
				}
				return parsed.data;
			},
			invalidatesTags: ['PrcTemplate']
		}),
		// Update existing PRC template
		updatePrcTemplate: builder.mutation<UpdatePrcTemplateResponse, UpdatePrcTemplateRequest>({
			query: ({ id, ...data }) => ({
				url: `prcTemplate/${id}`,
				method: 'PUT',
				body: { data: data }
			}),
			transformResponse: (response: unknown) => {
				const parsed = updatePrcTemplateResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for update PRC template response:', parsed.error);
					throw new Error('Invalid update PRC template response structure');
				}
				return parsed.data;
			},
			invalidatesTags: (_, __, { id }) => [
				{ type: 'PrcTemplate', id },
				{ type: 'PrcTemplate', id: 'LIST' },
				'PrcTemplate'
			]
		}),
		// Delete PRC template task (set status to INACTIVE)
		deletePrcTemplateTask: builder.mutation<DeletePrcTemplateTaskResponse, DeletePrcTemplateTaskRequest>({
			query: data => ({
				url: `prcTemplate/${data?.prcTemplate?.id}`,
				method: 'PUT',
				body: { data: { ...data, prcTemplate: { ...data.prcTemplate, status: 'INACTIVE' } } }
			}),
			transformResponse: (response: unknown) => {
				const parsed = deletePrcTemplateTaskResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for delete PRC template task response:', parsed.error);
					throw new Error('Invalid delete PRC template task response structure');
				}
				return parsed.data;
			},
			invalidatesTags: (_, __, { prcTemplate }) => [
				{ type: 'PrcTemplate', id: prcTemplate?.id },
				{ type: 'PrcTemplate', id: 'LIST' },
				'PrcTemplate'
			]
		})
	})
});

export const {
	useFetchPrcTemplatesQuery,
	useFetchPrcTemplateByIdQuery,
	useFetchPrcTemplateInspectionsQuery,
	useCreatePrcTemplateMutation,
	useUpdatePrcTemplateMutation,
	useDeletePrcTemplateTaskMutation
} = prcTemplateApi;
