import { useEffect, useRef, useState } from 'react';
import Cookie from '../utils/Cookie';
import { toFileStoragePath } from '../utils/fileUrl';

const isDirectDisplayUrl = (url: string) => url.startsWith('blob:') || url.startsWith('data:');

const toFetchEndpoint = (filePathOrUrl: string): string => {
	if (isDirectDisplayUrl(filePathOrUrl)) {
		return filePathOrUrl;
	}

	if (/^https?:\/\//i.test(filePathOrUrl)) {
		const base = (process.env.API_BASE_URL || '').replace(/\/+$/, '');
		if (base && filePathOrUrl.startsWith(base)) {
			return filePathOrUrl.slice(base.length).replace(/^\/+/, '');
		}
		return filePathOrUrl;
	}

	return toFileStoragePath(filePathOrUrl);
};

export function useAuthenticatedFileUrl(filePathOrUrl: string | undefined, options?: { enabled?: boolean }) {
	const enabled = options?.enabled !== false;
	const objectUrlRef = useRef('');
	const [src, setSrc] = useState('');
	const [loading, setLoading] = useState(Boolean(filePathOrUrl && enabled));
	const [error, setError] = useState(false);

	useEffect(() => {
		const revokeObjectUrl = () => {
			if (objectUrlRef.current) {
				URL.revokeObjectURL(objectUrlRef.current);
				objectUrlRef.current = '';
			}
		};

		if (!enabled || !filePathOrUrl) {
			revokeObjectUrl();
			setSrc('');
			setLoading(false);
			setError(false);
			return;
		}

		if (isDirectDisplayUrl(filePathOrUrl)) {
			revokeObjectUrl();
			setSrc(filePathOrUrl);
			setLoading(false);
			setError(false);
			return;
		}

		const controller = new AbortController();

		const load = async () => {
			setLoading(true);
			setError(false);
			setSrc('');
			revokeObjectUrl();

			const token = Cookie.getToken();
			if (!token) {
				setError(true);
				setLoading(false);
				return;
			}

			const endpoint = toFetchEndpoint(filePathOrUrl);
			const baseUrl = process.env.API_BASE_URL || '';

			try {
				const response = await fetch(`${baseUrl}${endpoint}`, {
					headers: { Authorization: `Bearer ${token}` },
					signal: controller.signal
				});

				if (!response.ok) {
					throw new Error(`Failed to load file: ${response.status}`);
				}

				const blob = await response.blob();
				const objectUrl = URL.createObjectURL(blob);
				objectUrlRef.current = objectUrl;
				setSrc(objectUrl);
			} catch (err) {
				if (err instanceof Error && err.name === 'AbortError') {
					return;
				}
				setError(true);
			} finally {
				setLoading(false);
			}
		};

		void load();

		return () => {
			controller.abort();
			revokeObjectUrl();
		};
	}, [filePathOrUrl, enabled]);

	return { src, loading, error };
}
