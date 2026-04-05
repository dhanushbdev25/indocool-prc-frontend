import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	isPrcTemplateListResponse,
	isPrcTemplateByIdResponse,
	isPrcTemplateInspectionsResponse,
	isPrcTemplateMutationResponse,
	isOperationsComboResponse,
	type PrcTemplateListResponse,
	type PrcTemplateByIdResponse,
	type PrcTemplateInspectionsResponse,
	type CreatePrcTemplateRequest,
	type UpdatePrcTemplateRequest,
	type CreatePrcTemplateResponse,
	type UpdatePrcTemplateResponse,
	type DeletePrcTemplateTaskRequest,
	type DeletePrcTemplateTaskResponse,
	type OperationsComboResponse
} from './prc-template.validators';

// API parameters
export interface FetchPrcTemplateByIdParams {
	id: number;
}

export interface FetchPrcTemplateInspectionsParams {
	id: number;
}

export interface FetchOperationsComboParams {
	partId?: number;
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
				if (!isPrcTemplateListResponse(response)) {
					console.error('Invalid PRC templates response structure', response);
					throw new Error('Invalid PRC templates response structure');
				}
				return response;
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
				if (!isPrcTemplateByIdResponse(response)) {
					console.error('Invalid PRC template by ID response structure', response);
					throw new Error('Invalid PRC template by ID response structure');
				}
				return response;
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
				if (!isPrcTemplateInspectionsResponse(response)) {
					console.error('Invalid PRC template inspections response structure', response);
					throw new Error('Invalid PRC template inspections response structure');
				}
				return response;
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
				if (!isPrcTemplateMutationResponse(response)) {
					console.error('Invalid create PRC template response structure', response);
					throw new Error('Invalid create PRC template response structure');
				}
				return response;
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
				if (!isPrcTemplateMutationResponse(response)) {
					console.error('Invalid update PRC template response structure', response);
					throw new Error('Invalid update PRC template response structure');
				}
				return response;
			},
			invalidatesTags: (_, __, { id }) => [
				{ type: 'PrcTemplate', id },
				{ type: 'PrcTemplate', id: 'LIST' },
				'PrcTemplate'
			]
		}),
		// Fetch operations combo for a part
		fetchOperationsCombo: builder.query<OperationsComboResponse, FetchOperationsComboParams>({
			query: ({ partId }) => ({
				url: 'prcTemplate/operations/combo',
				method: 'GET',
				params: partId ? { partId } : undefined
			}),
			transformResponse: (response: unknown) => {
				if (!isOperationsComboResponse(response)) {
					console.error('Invalid operations combo response structure', response);
					throw new Error('Invalid operations combo response structure');
				}
				return response;
			}
		}),
		// Delete PRC template task (set status to INACTIVE)
		deletePrcTemplateTask: builder.mutation<DeletePrcTemplateTaskResponse, DeletePrcTemplateTaskRequest>({
			query: data => ({
				url: `prcTemplate/${data?.prcTemplate?.id}`,
				method: 'PUT',
				body: { data: { ...data, prcTemplate: { ...data.prcTemplate, status: 'INACTIVE' } } }
			}),
			transformResponse: (response: unknown) => {
				if (!isPrcTemplateMutationResponse(response)) {
					console.error('Invalid delete PRC template task response structure', response);
					throw new Error('Invalid delete PRC template task response structure');
				}
				return response;
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
	useFetchOperationsComboQuery,
	useCreatePrcTemplateMutation,
	useUpdatePrcTemplateMutation,
	useDeletePrcTemplateTaskMutation
} = prcTemplateApi;
