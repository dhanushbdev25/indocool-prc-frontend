import { FetchBaseQueryError, createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
export const isFetchBaseQueryErrorType = (error: any): error is FetchBaseQueryError => 'error' in error;

type MutateRes = {
	message: string;
};

export const newRequestAPI = createApi({
	reducerPath: 'newReq',
	baseQuery,
	endpoints: builder => ({
		fetchOrgs: builder.query({
			query: () => ({
				url: `/newReq/fetchOrgs`
			})
		}),
		fetchSbus: builder.query({
			query: ({ orgId }) => ({
				url: `/newReq/fetchSbus`,
				params: { orgId }
			})
		}),

		fetchDomains: builder.query({
			query: () => ({
				url: `/newReq/fetchDomains`
			})
		}),

		fetchRequirements: builder.query({
			query: () => ({
				url: `/newReq/fetchRequirements`
			})
		}),
		fetchObjectives: builder.query({
			query: () => ({
				url: `/newReq/fetchObjectives`
			})
		}),
		fetchPriorities: builder.query({
			query: () => ({
				url: `/newReq/fetchPriorities`
			})
		}),
		fetchThirdparty: builder.query({
			query: () => ({
				url: `/newReq/fetchThirdparty`
			})
		}),
		postRequest: builder.mutation<MutateRes, any>({
			query: formData => ({
				url: `/newReq/createNewRequest`,
				method: 'post',
				body: formData
			})
		}),
		editRequest: builder.mutation<MutateRes, any>({
			query: ({ requestId, body }) => ({
				url: `/newReq/editRequest`,
				method: 'post',
				body,
				params: { requestId }
			})
		}),
		projectDetailsById: builder.query({
			query: id => ({
				url: `/newReq/projectDetailsById`,
				params: { id }
			})
		})
	})
});

export const {
	useFetchOrgsQuery,
	useLazyFetchSbusQuery,
	useFetchSbusQuery,
	useFetchDomainsQuery,
	useFetchRequirementsQuery,
	useFetchObjectivesQuery,
	useFetchPrioritiesQuery,
	useFetchThirdpartyQuery,
	usePostRequestMutation,
	useEditRequestMutation,
	useProjectDetailsByIdQuery
} = newRequestAPI;
