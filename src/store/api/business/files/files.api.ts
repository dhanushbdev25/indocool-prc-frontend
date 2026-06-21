import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../baseApi';
import { isFileSignedUrlResponse, type FileSignedUrlResponse } from './files.validators';

export const filesApi = createApi({
	reducerPath: 'filesApi',
	baseQuery,
	tagTypes: ['FileUrl'],
	endpoints: builder => ({
		fetchFileSignedUrl: builder.query<FileSignedUrlResponse, string>({
			query: filePath => ({
				url: filePath,
				method: 'GET'
			}),
			transformResponse: (response: unknown) => {
				if (!isFileSignedUrlResponse(response)) {
					console.warn('Invalid file signed URL response structure', response);
				}
				return response as FileSignedUrlResponse;
			},
			// Presigned URLs expire (~15 min); avoid serving stale URLs from cache.
			keepUnusedDataFor: 600
		})
	})
});

export const { useFetchFileSignedUrlQuery, useLazyFetchFileSignedUrlQuery } = filesApi;
