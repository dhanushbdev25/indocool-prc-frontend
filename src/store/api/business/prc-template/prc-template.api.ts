import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	isPrcTemplateListResponse,
	isPrcTemplateByIdResponse,
	isPrcTemplateInspectionsResponse,
	isPrcTemplateMutationResponse,
	isResolvePrcTemplateResponse,
	isOperationsComboResponse,
	isPlantComboResponse,
	type PrcTemplateListResponse,
	type PrcTemplateByIdResponse,
	type PrcTemplateInspectionsResponse,
	type CreatePrcTemplateRequest,
	type UpdatePrcTemplateRequest,
	type CreatePrcTemplateResponse,
	type UpdatePrcTemplateResponse,
	type DeletePrcTemplateTaskRequest,
	type DeletePrcTemplateTaskResponse,
	type OperationsComboResponse,
	type PlantComboResponse,
	type ResolvePrcTemplateResponse
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
	plant?: string | number;
}

export interface FetchPlantComboParams {
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
					console.warn('Invalid PRC templates response structure', response);
				}
				return response as PrcTemplateListResponse;
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
					console.warn('Invalid PRC template by ID response structure', response);
				}
				return response as PrcTemplateByIdResponse;
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
					console.warn('Invalid PRC template inspections response structure', response);
				}
				return response as PrcTemplateInspectionsResponse;
			},
			providesTags: (_, __, { id }) => [{ type: 'PrcTemplate', id: `inspections-${id}` }]
		}),
		// Resolve template payload into hydrated execution shape (preview / unsaved)
		resolvePrcTemplate: builder.mutation<ResolvePrcTemplateResponse, CreatePrcTemplateRequest>({
			query: data => ({
				url: 'prcTemplate/resolveTemplate',
				method: 'POST',
				body: { data }
			}),
			transformResponse: (response: unknown) => {
				if (!isResolvePrcTemplateResponse(response)) {
					console.warn('Invalid resolve PRC template response structure', response);
				}
				return response as ResolvePrcTemplateResponse;
			}
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
					console.warn('Invalid create PRC template response structure', response);
				}
				return response as CreatePrcTemplateResponse;
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
					console.warn('Invalid update PRC template response structure', response);
				}
				return response as UpdatePrcTemplateResponse;
			},
			invalidatesTags: (_, __, { id }) => [
				{ type: 'PrcTemplate', id },
				{ type: 'PrcTemplate', id: 'LIST' },
				'PrcTemplate'
			]
		}),
		// Fetch operations combo for a part (optionally filtered by plant)
		fetchOperationsCombo: builder.query<OperationsComboResponse, FetchOperationsComboParams>({
			query: ({ partId, plant }) => {
				const params: Record<string, string | number> = {};
				if (partId !== undefined && partId !== null) params.partId = partId;
				if (plant !== undefined && plant !== null && plant !== '') params.plant = plant;
				return {
					url: 'prcTemplate/operations/combo',
					method: 'GET',
					params: Object.keys(params).length > 0 ? params : undefined
				};
			},
			transformResponse: (response: unknown) => {
				if (!isOperationsComboResponse(response)) {
					console.warn('Invalid operations combo response structure', response);
				}
				return response as OperationsComboResponse;
			}
		}),
		// Fetch plant combo for a part
		fetchPlantCombo: builder.query<PlantComboResponse, FetchPlantComboParams>({
			query: ({ partId }) => ({
				url: 'prcTemplate/plant/combo',
				method: 'GET',
				params: partId ? { partId } : undefined
			}),
			transformResponse: (response: unknown) => {
				if (!isPlantComboResponse(response)) {
					console.warn('Invalid plant combo response structure', response);
				}
				return response as PlantComboResponse;
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
					console.warn('Invalid delete PRC template task response structure', response);
				}
				return response as DeletePrcTemplateTaskResponse;
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
	useFetchPlantComboQuery,
	useResolvePrcTemplateMutation,
	useCreatePrcTemplateMutation,
	useUpdatePrcTemplateMutation,
	useDeletePrcTemplateTaskMutation
} = prcTemplateApi;
