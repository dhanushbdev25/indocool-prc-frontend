import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	isOperationDelayReasonComboResponse,
	isWebComboResponse,
	parsePrcExecutionListResponse,
	type OperationDelayReasonComboItem,
	type PrcExecutionListResponse,
	type WebComboItem
} from './prc-execution.validators';

export interface PrcExecutionsListArgs {
	/** 1-based server page. */
	page: number;
	/** Rows per page; server clamps to 1..100. */
	pageSize: number;
	/** Inclusive lower bound on `updatedAt`, `YYYY-MM-DD`. Server forces a last-80-days window when absent. */
	fromDate?: string;
	/** Inclusive upper bound on `updatedAt`, `YYYY-MM-DD`. */
	toDate?: string;
	/** Exact match, case-sensitive. */
	orderId?: string;
	/** Customer names; server does partial match (ILIKE) on customerName. */
	customer?: string[];
	/** Exact match. */
	plantCode?: string[];
	/** Partial match (ILIKE). */
	sapReferenceNumber?: string[];
	/** Exact match: ACTIVE | IN_PROGRESS | COMPLETED. */
	status?: string[];
	/** Exact match. */
	reservation?: string[];
	/** Exact match. */
	prcSetId?: string[];
	/** Exact match. */
	productionSetId?: string[];
}

const LIST_ARRAY_FILTER_KEYS = [
	'customer',
	'plantCode',
	'sapReferenceNumber',
	'status',
	'reservation',
	'prcSetId',
	'productionSetId'
] as const;

export const prcExecutionApi = createApi({
	reducerPath: 'prcExecutionApi',
	baseQuery,
	tagTypes: ['PrcExecution', 'PartsCombo', 'Plant', 'OperationDelayReasonCombo', 'WorkstationsCombo'],
	endpoints: builder => ({
		// Paginated PRC execution list (server-side filters; POST body, not a create)
		fetchPrcExecutions: builder.query<PrcExecutionListResponse, PrcExecutionsListArgs>({
			query: args => {
				const body: Record<string, unknown> = {
					page: args.page,
					pageSize: args.pageSize
				};
				const trim = (s?: string) => s?.trim();
				const fromDate = trim(args.fromDate);
				if (fromDate) body.fromDate = fromDate;
				const toDate = trim(args.toDate);
				if (toDate) body.toDate = toDate;
				const orderId = trim(args.orderId);
				if (orderId) body.orderId = orderId;
				for (const key of LIST_ARRAY_FILTER_KEYS) {
					const cleaned = (args[key] ?? []).map(s => s.trim()).filter(Boolean);
					if (cleaned.length) body[key] = cleaned;
				}
				return {
					url: '/prcExecution/list',
					method: 'POST',
					body
				};
			},
			transformResponse: (response: unknown) => parsePrcExecutionListResponse(response),
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
	useLazyFetchPrcExecutionsQuery,
	useFetchPrcExecutionByIdQuery,
	useCreatePrcExecutionMutation,
	useFetchPartsByCustomerQuery,
	useFetchPrcExecutionDetailsQuery,
	useLazyFetchPrcExecutionDetailsQuery,
	useUpdatePrcExecutionProgressMutation,
	useFetchPlantsQuery,
	useFetchOperationDelayReasonComboQuery,
	useFetchWorkstationsComboQuery
} = prcExecutionApi;
