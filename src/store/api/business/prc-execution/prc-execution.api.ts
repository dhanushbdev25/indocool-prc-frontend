import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	isOperationDelayReasonComboResponse,
	isWebComboResponse,
	type OperationDelayReasonComboItem,
	type WebComboItem
} from './prc-execution.validators';

export interface PrcExecutionsListArgs {
	/** Inclusive lower bound, `YYYY-MM-DD`. */
	fromDate?: string;
	/** Inclusive upper bound, `YYYY-MM-DD`. */
	toDate?: string;
	/** Exact match, case-sensitive. */
	orderId?: string;
	/** Multi-select; serialized as comma-separated list. */
	customer?: string[];
	/** Multi-select; serialized as comma-separated list. */
	plantCode?: string[];
	/** Multi-select; serialized as comma-separated list. */
	sapReferenceNumber?: string[];
}

export const prcExecutionApi = createApi({
	reducerPath: 'prcExecutionApi',
	baseQuery,
	tagTypes: ['PrcExecution', 'PartsCombo', 'Plant', 'OperationDelayReasonCombo', 'WorkstationsCombo'],
	endpoints: builder => ({
		// Fetch all PRC executions (server-side filtered)
		fetchPrcExecutions: builder.query<unknown, PrcExecutionsListArgs | void>({
			query: (args) => {
				const a: PrcExecutionsListArgs = args ?? {};
				const params: Record<string, string> = {};
				const trim = (s?: string) => s?.trim();
				const csv = (xs?: string[]) => {
					const cleaned = (xs ?? []).map(s => s.trim()).filter(Boolean);
					return cleaned.length ? cleaned.join(',') : undefined;
				};
				const fromDate = trim(a.fromDate);
				if (fromDate) params.fromDate = fromDate;
				const toDate = trim(a.toDate);
				if (toDate) params.toDate = toDate;
				const orderId = trim(a.orderId);
				if (orderId) params.orderId = orderId;
				const customer = csv(a.customer);
				if (customer) params.customer = customer;
				const plantCode = csv(a.plantCode);
				if (plantCode) params.plantCode = plantCode;
				const sap = csv(a.sapReferenceNumber);
				if (sap) params.sapReferenceNumber = sap;
				return {
					url: '/prcExecution',
					method: 'GET',
					params
				};
			},
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

		/** GET /web/combo/workstations?plantCode=&plantCode= — workstations for one or more plants */
		fetchWorkstationsCombo: builder.query<WebComboItem[], { plantCodes: (string | number)[] }>({
			query: ({ plantCodes }) => {
				const searchParams = new URLSearchParams();
				for (const code of plantCodes) {
					const normalized = String(code).trim();
					if (normalized) searchParams.append('plantCode', normalized);
				}
				const queryString = searchParams.toString();
				return {
					url: queryString ? `combo/workstations?${queryString}` : 'combo/workstations',
					method: 'GET'
				};
			},
			serializeQueryArgs: ({ queryArgs }) => ({
				plantCodes: queryArgs.plantCodes
					.map(code => String(code).trim())
					.filter(Boolean)
					.join('\0')
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
			providesTags: (_r, _e, { plantCodes }) =>
				plantCodes.map(code => ({ type: 'WorkstationsCombo', id: String(code) }))
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
