import { createApi } from '@reduxjs/toolkit/query/react';
import { createPrefixedBaseQuery } from '../../baseApi';

export const configurationAPI = createApi({
	reducerPath: 'configurationAPI',

	baseQuery: createPrefixedBaseQuery('/config/'),
	tagTypes: ['Users', 'Roles', 'SubRoles', 'Domains'],
	endpoints: builder => ({
		getAllUsers: builder.query({
			query: () => `users`,
			providesTags: ['Users']
		}),

		getUserById: builder.query({
			query: (id: string) => `users/${id}`,
			providesTags: id => [{ type: 'Users', id }]
		}),

		getRoles: builder.query({
			query: () => `roles`,
			providesTags: ['Roles']
		}),

		getSubRoles: builder.query({
			query: roleId => ({
				url: `subroles`,
				params: { roleId }
			}),
			providesTags: ['SubRoles']
		}),

		updateUser: builder.mutation({
			query: body => ({
				url: `editUsers`,
				method: 'POST',

				body
			}),
			invalidatesTags: ['Users']
		}),

		updateUserActive: builder.mutation({
			query: ({ id, isActive }: { id: string; isActive: boolean }) => ({
				url: `users/${id}?isActive=${isActive}`,

				method: 'PUT'
			}),
			invalidatesTags: ['Users']
		}),

		//domain api

		getDomains: builder.query({
			query: () => `domains`,
			providesTags: ['Domains']
		}),

		getDomainById: builder.query({
			query: (id: number) => `domains/${id}`,
			providesTags: id => [{ type: 'Domains', id }]
		}),
		getSpoc: builder.query({
			query: () => `spoc`
		}),
		getApprover: builder.query({
			query: () => `approver`
		}),
		addDomain: builder.mutation({
			query: body => ({
				url: 'domains',
				method: 'POST',
				body
			}),
			invalidatesTags: ['Domains']
		}),
		updateDomain: builder.mutation({
			query: ({ id, name, l1Id, l2Id, spocId }) => ({
				url: `domains/${id}`,
				method: 'PUT',
				body: { name, l1Id, l2Id, spocId }
			}),
			invalidatesTags: ['Domains']
		}),
		updateDomainActive: builder.mutation({
			query: ({ id, isActive }: { id: number; isActive: boolean }) => ({
				url: `domain/${id}?isActive=${isActive}`,
				method: 'PUT'
			}),
			invalidatesTags: ['Domains']
		})
	})
});

export const {
	useGetAllUsersQuery,
	useGetUserByIdQuery,
	useGetRolesQuery,
	useGetSubRolesQuery,
	useUpdateUserMutation,
	useUpdateUserActiveMutation,
	useGetDomainsQuery,
	useGetDomainByIdQuery,
	useAddDomainMutation,
	useGetSpocQuery,
	useGetApproverQuery,
	useUpdateDomainMutation,
	useUpdateDomainActiveMutation
} = configurationAPI;
