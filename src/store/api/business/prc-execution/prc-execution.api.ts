import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	isOperationDelayReasonComboResponse,
	isWebComboResponse,
	type OperationDelayReasonComboItem,
	type WebComboItem
} from './prc-execution.validators';

export const prcExecutionApi = createApi({
	reducerPath: 'prcExecutionApi',
	baseQuery,
	tagTypes: ['PrcExecution', 'PartsCombo', 'Plant', 'OperationDelayReasonCombo', 'WorkstationsCombo'],
	endpoints: builder => ({
		// Fetch all PRC executions
		fetchPrcExecutions: builder.query<unknown, void>({
			query: () => ({
				url: '/prcExecution',
				method: 'GET'
			}),
			providesTags: ['PrcExecution']
		}),

		// Fetch single PRC execution by ID (for future view screen)
		fetchPrcExecutionById: builder.query<unknown, { id: number }>({
			query: ({ id }) => ({
				url: `/prcExecution/${id}`,
				method: 'GET'
			}),
			providesTags: (_, __, { id }) => [
				{ type: 'PrcExecution', id },
				{ type: 'PrcExecution', id: 'LIST' }
			]
		}),

		// Create new PRC execution
		createPrcExecution: builder.mutation<unknown, unknown>({
			query: data => ({
				url: '/prcExecution',
				method: 'POST',
				body: data
			}),
			invalidatesTags: ['PrcExecution']
		}),

		// Fetch parts by customer for combo
		fetchPartsByCustomer: builder.query<unknown, { customerCode: string }>({
			query: ({ customerCode }) => ({
				url: `/parts/combo?customerCode=${customerCode}`,
				method: 'GET'
			}),
			providesTags: (_, __, { customerCode }) => [{ type: 'PartsCombo', id: customerCode }]
		}),

		// Fetch PRC execution details for execution screen
		fetchPrcExecutionDetails: builder.query<unknown, number>({
			query: id => ({
				url: `/prcExecution/${id}`,
				method: 'GET'
			}),
			providesTags: (_, __, id) => [{ type: 'PrcExecution', id }]
		}),

		// Update PRC execution progress
		updatePrcExecutionProgress: builder.mutation<unknown, { id: number; data: unknown }>({
			query: ({ id, data }) => ({
				url: `/prcExecution/${id}`,
				method: 'PUT',
				body: { data: data }
			}),
			invalidatesTags: (_, __, { id }) => [{ type: 'PrcExecution', id }]
		}),

		// Fetch plants for combo
		fetchPlants: builder.query<unknown, void>({
			query: () => ({
				url: '/customer/plant',
				method: 'GET'
			}),
			providesTags: ['Plant']
		}),

		/** GET /web/combo?type=OPERATIONDELAYREASON — delay reasons for step-group timing overruns */
		fetchOperationDelayReasonCombo: builder.query<OperationDelayReasonComboItem[], void>({
			query: () => ({
				url: '/combo',
				method: 'GET',
				params: { type: 'OPERATIONDELAYREASON' }
			}),
			transformResponse: (response: unknown) => {
				if (!isOperationDelayReasonComboResponse(response)) {
					console.warn('Invalid OPERATIONDELAYREASON combo response structure', response);
					if (Array.isArray(response)) {
						return response as OperationDelayReasonComboItem[];
					}
					if (
						typeof response === 'object' &&
						response !== null &&
						'data' in response &&
						Array.isArray((response as { data?: unknown }).data)
					) {
						return (response as { data: OperationDelayReasonComboItem[] }).data;
					}
					return [];
				}
				return response.data;
			},
			providesTags: ['OperationDelayReasonCombo']
		}),

		/** GET /web/combo/workstations?plantCode= — workstations for a plant */
		fetchWorkstationsCombo: builder.query<WebComboItem[], { plantCode: string | number }>({
			query: ({ plantCode }) => ({
				url: 'combo/workstations',
				method: 'GET',
				params: { plantCode }
			}),
			transformResponse: (response: unknown) => {
				if (!isWebComboResponse(response)) {
					console.warn('Invalid workstations combo response structure', response);
					if (Array.isArray(response)) {
						return response as WebComboItem[];
					}
					if (
						typeof response === 'object' &&
						response !== null &&
						'data' in response &&
						Array.isArray((response as { data?: unknown }).data)
					) {
						return (response as { data: WebComboItem[] }).data;
					}
					return [];
				}
				return response.data;
			},
			providesTags: (_r, _e, { plantCode }) => [{ type: 'WorkstationsCombo', id: String(plantCode) }]
		})
	})
});

export const {
	useFetchPrcExecutionsQuery,
	useFetchPrcExecutionByIdQuery,
	useCreatePrcExecutionMutation,
	useFetchPartsByCustomerQuery,
	useFetchPrcExecutionDetailsQuery,
	useUpdatePrcExecutionProgressMutation,
	useFetchPlantsQuery,
	useFetchOperationDelayReasonComboQuery,
	useFetchWorkstationsComboQuery
} = prcExecutionApi;
