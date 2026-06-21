import { skipToken } from '@reduxjs/toolkit/query';
import { useMemo } from 'react';
import { useFetchFileSignedUrlQuery } from '../store/api/business/files/files.api';
import { isExternalFileUrl, toFileFetchEndpoint } from '../utils/fileUrl';

const isDirectDisplayUrl = (url: string) => url.startsWith('blob:') || url.startsWith('data:');

export function useAuthenticatedFileUrl(filePathOrUrl: string | undefined, options?: { enabled?: boolean }) {
	const enabled = options?.enabled !== false;

	const fetchPath = useMemo(() => {
		if (!enabled || !filePathOrUrl) return undefined;
		if (isDirectDisplayUrl(filePathOrUrl) || isExternalFileUrl(filePathOrUrl)) return undefined;
		return toFileFetchEndpoint(filePathOrUrl);
	}, [enabled, filePathOrUrl]);

	const { data, isLoading, isError } = useFetchFileSignedUrlQuery(fetchPath ?? skipToken);

	if (!enabled || !filePathOrUrl) {
		return { src: '', loading: false, error: false };
	}

	if (isDirectDisplayUrl(filePathOrUrl) || isExternalFileUrl(filePathOrUrl)) {
		return { src: filePathOrUrl, loading: false, error: false };
	}

	return {
		src: data?.data?.url ?? '',
		loading: isLoading,
		error: isError
	};
}
