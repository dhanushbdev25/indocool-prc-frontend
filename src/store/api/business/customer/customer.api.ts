import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import { isCustomerComboResponse, type CustomerComboResponse } from './customer.validators';

const transformComboResponse =
	(name: string) =>
	(response: unknown): CustomerComboResponse => {
		if (!isCustomerComboResponse(response)) {
			console.warn(`Invalid ${name} combo response structure`, response);
			return response as CustomerComboResponse;
		}
		return {
			data: response.data.map(row => ({
				label: row.label,
				value: String(row.value)
			}))
		};
	};

export const customerApi = createApi({
	reducerPath: 'customerApi',
	baseQuery,
	tagTypes: ['ReservationCombo', 'PrcSetIdCombo', 'SapSetIdCombo', 'OrderIdCombo'],
	endpoints: builder => ({
		/** Distinct SAP reservation numbers. */
		fetchReservationCombo: builder.query<CustomerComboResponse, void>({
			query: () => ({
				url: '/customer/reservationCombo',
				method: 'GET'
			}),
			transformResponse: transformComboResponse('reservation'),
			providesTags: ['ReservationCombo']
		}),
		/** Distinct PRC set IDs. */
		fetchPrcSetIdCombo: builder.query<CustomerComboResponse, void>({
			query: () => ({
				url: '/customer/prcSetIdCombo',
				method: 'GET'
			}),
			transformResponse: transformComboResponse('prcSetId'),
			providesTags: ['PrcSetIdCombo']
		}),
		/** Distinct production/SAP set IDs (productionSetId values). */
		fetchSapSetIdCombo: builder.query<CustomerComboResponse, void>({
			query: () => ({
				url: '/customer/sapSetIdCombo',
				method: 'GET'
			}),
			transformResponse: transformComboResponse('sapSetId'),
			providesTags: ['SapSetIdCombo']
		}),
		/** Distinct manufacturing order IDs. */
		fetchOrderIdCombo: builder.query<CustomerComboResponse, void>({
			query: () => ({
				url: '/customer/orderIdCombo',
				method: 'GET'
			}),
			transformResponse: transformComboResponse('orderId'),
			providesTags: ['OrderIdCombo']
		})
	})
});

export const {
	useFetchReservationComboQuery,
	useFetchPrcSetIdComboQuery,
	useFetchSapSetIdComboQuery,
	useFetchOrderIdComboQuery
} = customerApi;
