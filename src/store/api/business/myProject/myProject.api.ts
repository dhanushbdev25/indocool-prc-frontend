import { createApi } from '@reduxjs/toolkit/query/react';
import z from 'zod';
import { createPrefixedBaseQuery } from '../../baseApi';
import {
	AllReqSchema,
	PendingReqSchema,
	NavReqSchema,
	RequestByIdSchema,
	RequestById,
	RequestModuleByIdSchema,
	RequestSearchSchema,
	AllocatedReq,
	AllocatedReqSchema,
	PaginatedAllReqSchema,
	type PaginatedAllReq,
	updateStageStatusResponse,
	updateStageStatusBody
} from './myProjectParser';

interface ProjectFilters {
	user?: string;
	domain?: string;
	sbu?: string;
	priority?: string;
	status?: string;
	company?: string;
	createDate?: string;
	startDate?: string;
	endDate?: string;
	completionDate?: string;
}
type AllReq = z.infer<typeof AllReqSchema>;
type PendingReq = z.infer<typeof PendingReqSchema>;
type NavReq = z.infer<typeof NavReqSchema>;

export const myProjectAPI = createApi({
	reducerPath: 'myProjectAPI',
	baseQuery: createPrefixedBaseQuery('/projects'),
	tagTypes: ['VIEW_REQUEST', 'PROJECT_PLAN', 'DEFFAULT_STAGES'],
	endpoints: builder => ({
		getAllRequests: builder.query<PaginatedAllReq, ProjectFilters>({
			query: (filters = {}) => {
				const queryParams = new URLSearchParams();
				Object.entries(filters).forEach(([key, value]) => {
					if (value !== undefined && value !== null && value !== '') {
						queryParams.append(key, value.toString());
					}
				});

				const queryString = queryParams.toString();
				return `/all?${queryString || ''}`;
			},
			transformResponse: response => {
				const parsed = PaginatedAllReqSchema.safeParse(response);
				if (!parsed.success) {
					console.error('❌ Invalid response from getAllRequests:', z.prettifyError(parsed.error));
					throw new Error('Invalid response from getAllRequests');
				}
				return parsed.data;
			}
		}),

		getPendingRequests: builder.query<PendingReq, void>({
			query: () => `/pending`,
			transformResponse: response => {
				const parsed = PendingReqSchema.safeParse(response);
				if (!parsed.success) {
					console.error('❌ Invalid response from getPendingRequests:', z.prettifyError(parsed.error));
					throw new Error('Invalid response from getPendingRequests');
				}
				return parsed.data;
			}
		}),
		getAllocatedRequests: builder.query<AllocatedReq, void>({
			query: () => `/allocated`,
			transformResponse: response => {
				const parsed = AllocatedReqSchema.safeParse(response);
				if (!parsed.success) {
					console.error('❌ Invalid response from getPendingRequests:', z.prettifyError(parsed.error));
					throw new Error('Invalid response from getPendingRequests');
				}
				return parsed.data;
			}
		}),
		getNavigationRequests: builder.query<NavReq, void>({
			query: () => `/requests/navigation`,
			transformResponse: response => {
				const parsed = NavReqSchema.safeParse(response);
				if (!parsed.success) {
					console.error('❌ Invalid response from getPendingRequests:', z.prettifyError(parsed.error));
					throw new Error('Invalid response from getPendingRequests');
				}
				return parsed.data;
			},
			providesTags: ['VIEW_REQUEST']
		}),

		requestById: builder.query<RequestById, string>({
			query: id => `/requests/${id}`,
			transformResponse: response => {
				const parsed = RequestByIdSchema.safeParse(response);
				if (!parsed.success) {
					console.error('❌ Invalid response from requestById:', z.prettifyError(parsed.error));
					throw new Error('Invalid response from requestById');
				}
				return parsed.data;
			},
			providesTags: (_result, _error, id) => [{ type: 'VIEW_REQUEST', id }]
		}),

		changeRequestStatus: builder.mutation<any, { id: number; currentlyWith: string; action: string }>({
			query: ({ id, currentlyWith, action }) => ({
				url: `/requests/${id}/status`,
				method: 'PUT',
				body: {
					currentlyWith,
					action
				}
			}),
			invalidatesTags: (_result, _error, { id }) => [{ type: 'VIEW_REQUEST', id }]
		}),

		assignPmo: builder.mutation<any, { projectId: string | number; assigned: { id: string; pmoId: string }[] }>({
			query: ({ projectId, assigned }) => ({
				url: `/${projectId}/pmo`,
				method: 'PATCH',
				body: assigned
			}),
			invalidatesTags: (_result, _error, { projectId }) => [{ type: 'VIEW_REQUEST', projectId }]
		}),

		createNewProjectPlan: builder.mutation<any, { id: any; data: any }>({
			query: ({ id, data }) => ({
				url: `/module/${id}/planner`,
				method: 'POST',
				body: data
			}),
			async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
				try {
					await queryFulfilled;
					dispatch(myProjectAPI.util.invalidateTags([{ type: 'PROJECT_PLAN', id }]));
				} catch {}
			}
		}),

		getProjectPlanById: builder.query<string[], string>({
			query: id => `/${id}/project-plan`,
			providesTags: (_result, _error, projectId) => [{ type: 'PROJECT_PLAN', projectId }]
		}),

		updateProjectPlanStatus: builder.mutation({
			query: ({ id, action }) => ({
				url: `/module/${id}/project-plan/status`,
				method: 'PATCH',
				body: { action }
			}),
			invalidatesTags: (_result, _error, { id }) => [{ type: 'PROJECT_PLAN', id }]
		}),

		updateStageStatus: builder.mutation<updateStageStatusResponse, updateStageStatusBody & { projectId?: string }>({
			query: ({ id, action, hrs, projectId }) => ({
				url: `/phase-stages/status`,
				method: 'PATCH',
				body: {
					id,
					action,
					...(hrs && hrs.length > 0 ? { hrs } : {})
				}
			}),
			invalidatesTags: (_result, _error, { projectId }) => (projectId ? [{ type: 'PROJECT_PLAN', id: projectId }] : [])
		}),

		sendMessage: builder.mutation<any, { id: any; data: any }>({
			query: ({ id, data }) => ({
				url: `/${id}/messages`,
				method: 'POST',
				body: data
			}),
			invalidatesTags: (_result, _error, { id }) => [{ type: 'VIEW_REQUEST', id }]
		}),

		replyToMessage: builder.mutation<any, { id: any; data: any }>({
			query: ({ id, data }) => ({
				url: `/${id}/messages/replies`,
				method: 'POST',
				body: data
			}),
			invalidatesTags: (_result, _error, { id }) => [{ type: 'VIEW_REQUEST', id }]
		}),

		//HELPERS
		getAllPmos: builder.query<{ id: string; name: string }[], void>({
			query: () => `/pmos`
		}),

		getAllResourceDetails: builder.query<string[], string>({
			query: () => `/resources/all`,
			transformResponse: response => {
				const parsed = RequestSearchSchema.safeParse(response);
				if (!parsed.success) {
					console.error('❌ Invalid response from default-stages:', z.prettifyError(parsed.error));
					throw new Error('Invalid response');
				}
				return parsed.data;
			}
		}),

		getDefaultStagesByModuleId: builder.query<string[], string>({
			query: id => `/module/${id}/planner/default-stages`,
			transformResponse: response => {
				const parsed = RequestModuleByIdSchema.safeParse(response);
				if (!parsed.success) {
					console.error('❌ Invalid response from default-stages:', z.prettifyError(parsed.error));
					throw new Error('Invalid response');
				}
				return parsed.data;
			},
			providesTags: (_result, _error, id) => [{ type: 'DEFFAULT_STAGES', id }]
		})
	})
});

export const {
	useGetAllRequestsQuery,
	useGetPendingRequestsQuery,
	useLazyGetPendingRequestsQuery,
	useLazyGetAllocatedRequestsQuery,
	useGetNavigationRequestsQuery,
	useRequestByIdQuery,
	useChangeRequestStatusMutation,
	useGetAllPmosQuery,
	useAssignPmoMutation,
	useGetDefaultStagesByModuleIdQuery,
	useGetAllResourceDetailsQuery,
	useUpdateStageStatusMutation,
	useSendMessageMutation,
	useReplyToMessageMutation,
	useGetProjectPlanByIdQuery,
	useCreateNewProjectPlanMutation,
	useUpdateProjectPlanStatusMutation
} = myProjectAPI;
