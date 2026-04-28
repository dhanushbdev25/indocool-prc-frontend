import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	extractMouldListArray,
	coerceMouldApiItem,
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
			transformResponse: (response: unknown) =>
				extractMouldListArray(response).map((raw, i) =>
					mapMouldApiItemToRow(coerceMouldApiItem(raw, i))
				),
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
					console.warn('Invalid mould combo response structure', response);
					if (Array.isArray(response)) {
						return response as MouldComboItem[];
					}
					if (
						typeof response === 'object' &&
						response !== null &&
						'data' in response &&
						Array.isArray((response as { data?: unknown }).data)
					) {
						return (response as { data: MouldComboItem[] }).data;
					}
					return [];
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
