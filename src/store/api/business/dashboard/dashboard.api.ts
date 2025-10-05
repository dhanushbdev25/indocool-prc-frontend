import { createApi } from '@reduxjs/toolkit/query/react';
import { createPrefixedBaseQuery } from '../../baseApi';
import z from 'zod';
import { requestTabSchema, type RequestTabType } from './requestParser';
import { ImpactTabInfoSchema, type ImpactTabInfoType } from './impactParser';
type DashBoardQueries = {
	page?: number;
	limit?: number;
	company?: string;
	requirement?: string;
	sbu?: string;
	domain?: string;
	priority?: string;
} | void;

export const dashboardApi = createApi({
	reducerPath: 'dashboardApi',
	baseQuery: createPrefixedBaseQuery('/dashboard'),
	endpoints: builder => ({
		getRequestTabInfo: builder.query<RequestTabType, DashBoardQueries>({
			query: ({ page = 1, limit = 6, company, requirement, sbu, domain, priority } = {}) => {
				const params = new URLSearchParams();
				params.set('page', page.toString());
				params.set('limit', limit.toString());
				if (company) params.set('company', company);
				if (requirement) params.set('requirement', requirement);
				if (sbu) params.set('sbu', sbu);
				if (domain) params.set('domain', domain);
				if (priority) params.set('priority', priority);

				return `/request?${params.toString()}`;
			},
			transformResponse: response => {
				const parsed = requestTabSchema.safeParse(response);
				if (!parsed.success) {
					console.error('❌ Invalid response from getRequestTabInfo:', z.prettifyError(parsed.error));
					throw new Error('Invalid response from getRequestTabInfo');
				}
				return parsed.data;
			}
		}),

		getImpactTabInfo: builder.query<ImpactTabInfoType, DashBoardQueries>({
			query: ({ page = 1, limit = 6, company, requirement, sbu, domain, priority } = {}) => {
				const params = new URLSearchParams();
				params.set('page', page.toString());
				params.set('limit', limit.toString());
				if (company) params.set('company', company);
				if (requirement) params.set('requirement', requirement);
				if (sbu) params.set('sbu', sbu);
				if (domain) params.set('domain', domain);
				if (priority) params.set('priority', priority);

				return `/impact?${params.toString()}`;
			},
			transformResponse: response => {
				const parsed = ImpactTabInfoSchema.safeParse(response);
				if (!parsed.success) {
					console.error('❌ Invalid response from getImpactTabInfo:', z.prettifyError(parsed.error));
					throw new Error('Invalid response from getImpactTabInfo');
				}
				return parsed.data;
			}
		})
	})
});

export const { useGetRequestTabInfoQuery, useGetImpactTabInfoQuery } = dashboardApi;
