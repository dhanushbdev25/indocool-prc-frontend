import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import {
	isSequenceListResponse,
	isSequenceByIdResponse,
	isSequenceMutationResponse,
	type SequenceListResponse,
	type SequenceByIdResponse,
	type CreateSequenceRequest,
	type UpdateSequenceRequest,
	type CreateSequenceResponse,
	type UpdateSequenceResponse,
	type DeleteSequenceTaskRequest,
	type DeleteSequenceTaskResponse
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
				if (!isSequenceListResponse(response)) {
					console.warn('Invalid process sequences response structure', response);
				}
				return response as SequenceListResponse;
			},
			providesTags: ['Sequence']
		}),
		// Fetch single process sequence by ID
		fetchProcessSequenceById: builder.query<SequenceByIdResponse, FetchSequenceByIdParams>({
			query: ({ id }) => ({
				url: `processSequence/${id}`,
				method: 'GET'
			}),
			transformResponse: (response: unknown) => {
				if (!isSequenceByIdResponse(response)) {
					console.warn('Invalid process sequence by ID response structure', response);
				}
				return response as SequenceByIdResponse;
			},
			providesTags: ['Sequence']
		}),
		// Create new process sequence
		createProcessSequence: builder.mutation<CreateSequenceResponse, CreateSequenceRequest>({
			query: data => ({
				url: 'processSequence',
				method: 'POST',
				body: data
			}),
			transformResponse: (response: unknown) => {
				if (!isSequenceMutationResponse(response)) {
					console.warn('Invalid create process sequence response structure', response);
				}
				return response as CreateSequenceResponse;
			},
			invalidatesTags: ['Sequence']
		}),
		// Update existing process sequence
		updateProcessSequence: builder.mutation<UpdateSequenceResponse, UpdateSequenceRequest>({
			query: ({ id, ...data }) => ({
				url: `processSequence/${id}`,
				method: 'PUT',
				body: { id, ...data }
			}),
			transformResponse: (response: unknown) => {
				if (!isSequenceMutationResponse(response)) {
					console.warn('Invalid update process sequence response structure', response);
				}
				return response as UpdateSequenceResponse;
			},
			invalidatesTags: ['Sequence']
		}),
		// Delete sequence task (set status to INACTIVE)
		deleteSequenceTask: builder.mutation<DeleteSequenceTaskResponse, DeleteSequenceTaskRequest>({
			query: ({ id, ...data }) => ({
				url: `processSequence/${id}`,
				method: 'PUT',
				body: {
					id,
					...data,
					data: {
						...data.data,
						processSequence: {
							...data.data.processSequence,
							status: 'INACTIVE'
						}
					}
				}
			}),
			transformResponse: (response: unknown) => {
				if (!isSequenceMutationResponse(response)) {
					console.warn('Invalid delete sequence task response structure', response);
				}
				return response as DeleteSequenceTaskResponse;
			},
			invalidatesTags: ['Sequence']
		})
	})
});

export const {
	useFetchProcessSequencesQuery,
	useFetchProcessSequenceByIdQuery,
	useCreateProcessSequenceMutation,
	useUpdateProcessSequenceMutation,
	useDeleteSequenceTaskMutation
} = sequenceApi;
