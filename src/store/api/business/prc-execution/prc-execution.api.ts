import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';

export const prcExecutionApi = createApi({
	reducerPath: 'prcExecutionApi',
	baseQuery,
	tagTypes: ['PrcExecution', 'PartsCombo'],
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
		})
	})
});

export const {
	useFetchPrcExecutionsQuery,
	useFetchPrcExecutionByIdQuery,
	useCreatePrcExecutionMutation,
	useFetchPartsByCustomerQuery,
	useFetchPrcExecutionDetailsQuery,
	useUpdatePrcExecutionProgressMutation
} = prcExecutionApi;
