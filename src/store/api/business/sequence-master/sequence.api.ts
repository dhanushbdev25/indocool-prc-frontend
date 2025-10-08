import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	sequenceListResponseSchema,
	sequenceByIdResponseSchema,
	createSequenceResponseSchema,
	updateSequenceResponseSchema,
	type SequenceListResponse,
	type SequenceByIdResponse,
	type CreateSequenceRequest,
	type UpdateSequenceRequest,
	type CreateSequenceResponse,
	type UpdateSequenceResponse
} from './sequence.validators';

// API parameters
export interface FetchSequenceByIdParams {
	id: number;
}

export const sequenceApi = createApi({
	reducerPath: 'sequenceApi',
	baseQuery,
	tagTypes: ['Sequence'],
	endpoints: builder => ({
		// Fetch all process sequences
		fetchProcessSequences: builder.query<SequenceListResponse, void>({
			query: () => ({
				url: 'processSequence/',
				method: 'GET'
			}),
			transformResponse: (response: unknown) => {
				const parsed = sequenceListResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for process sequences response:', parsed.error);
					throw new Error('Invalid process sequences response structure');
				}
				return parsed.data;
			}
		}),
		// Fetch single process sequence by ID
		fetchProcessSequenceById: builder.query<SequenceByIdResponse, FetchSequenceByIdParams>({
			query: ({ id }) => ({
				url: `processSequence/${id}`,
				method: 'GET'
			}),
			transformResponse: (response: unknown) => {
				const parsed = sequenceByIdResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for process sequence by ID response:', parsed.error);
					throw new Error('Invalid process sequence by ID response structure');
				}
				return parsed.data;
			}
		}),
		// Create new process sequence
		createProcessSequence: builder.mutation<CreateSequenceResponse, CreateSequenceRequest>({
			query: data => ({
				url: 'processSequence',
				method: 'POST',
				body: data
			}),
			transformResponse: (response: unknown) => {
				const parsed = createSequenceResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for create process sequence response:', parsed.error);
					throw new Error('Invalid create process sequence response structure');
				}
				return parsed.data;
			},
			invalidatesTags: ['Sequence']
		}),
		// Update existing process sequence
		updateProcessSequence: builder.mutation<UpdateSequenceResponse, UpdateSequenceRequest>({
			query: ({ id, ...data }) => ({
				url: `processSequence/${id}`,
				method: 'PUT',
				body: data
			}),
			transformResponse: (response: unknown) => {
				const parsed = updateSequenceResponseSchema.safeParse(response);
				if (!parsed.success) {
					console.error('Zod validation failed for update process sequence response:', parsed.error);
					throw new Error('Invalid update process sequence response structure');
				}
				return parsed.data;
			},
			invalidatesTags: ['Sequence']
		})
	})
});

export const {
	useFetchProcessSequencesQuery,
	useFetchProcessSequenceByIdQuery,
	useCreateProcessSequenceMutation,
	useUpdateProcessSequenceMutation
} = sequenceApi;
