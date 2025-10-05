import { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import baseFetch from '../utils/baseFetch';
import downloadFile from '../utils/downloadFile';
import Cookie from '../utils/Cookie';

const useBaseDownload = () => {
	const [loading, setLoading] = useState(false);
	const controllerRef = useRef<AbortController | null>(null);

	const token = Cookie.getToken();

	useEffect(() => {
		return () => {
			if (controllerRef.current) {
				controllerRef.current.abort();
			}
		};
	}, []);

	const handleDownloadFile = async (filePath: string) => {
		if (!token) {
			Swal.fire({
				title: 'API Error',
				text: 'Missing Authorization token',
				icon: 'error'
			});
			return;
		}

		setLoading(true);
		const controller = new AbortController();
		controllerRef.current = controller;

		try {
			const response = await baseFetch(`files/${filePath}`, controller, token);
			const blob = await response.blob();

			await downloadFile(blob, filePath);
		} catch (error: any) {
			if (error.name === 'AbortError') {
			} else {
				Swal.fire({
					title: 'Download Failed',
					text: error.message ?? "Couldn't download the file.",
					icon: 'error'
				});
			}
		} finally {
			setLoading(false);
			controllerRef.current = null;
		}
	};

	return { loading, handleDownloadFile };
};

export default useBaseDownload;
