import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	isMouldListResponse,
	isMouldComboResponse,
	mapMouldApiItemToRow,
	type MouldReconciliationRow,
	type MouldComboItem
} from './mould.validators';

export const mouldApi = createApi({
	reducerPath: 'mouldApi',
	baseQuery,
	tagTypes: ['Mould', 'MouldCombo'],
	endpoints: builder => ({
		fetchMoulds: builder.query<MouldReconciliationRow[], void>({
			query: () => ({
				url: 'mould',
				method: 'GET'
			}),
			transformResponse: (response: unknown) => {
				if (!isMouldListResponse(response)) {
					console.error('Invalid mould list response structure', response);
					throw new Error('Invalid mould list response structure');
				}
				return response.data.map(mapMouldApiItemToRow);
			},
			providesTags: ['Mould']
		}),
		/** Moulds for a part (label = mouldId per backend template). Query: partId (part master id). */
		fetchMouldCombo: builder.query<MouldComboItem[], { partId: number }>({
			query: ({ partId }) => ({
				url: 'mould/combo',
				method: 'GET',
				params: { partId }
			}),
			transformResponse: (response: unknown) => {
				if (!isMouldComboResponse(response)) {
					console.error('Invalid mould combo response structure', response);
					throw new Error('Invalid mould combo response structure');
				}
				return response.data;
			},
			providesTags: (_result, _err, { partId }) => [{ type: 'MouldCombo', id: partId }]
		}),
		/** PUT /web/mould/reconcile/:id — id is part_moulds.id (mould row id). */
		reconcileMould: builder.mutation<void, number>({
			query: id => ({
				url: `mould/reconcile/${id}`,
				method: 'PUT'
			}),
			invalidatesTags: ['Mould']
		})
	})
});

export const { useFetchMouldsQuery, useFetchMouldComboQuery, useReconcileMouldMutation } = mouldApi;
