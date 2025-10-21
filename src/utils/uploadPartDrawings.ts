import Cookie from './Cookie';
import { PartDrawingFormData } from '../pages/masters/part-master/components/create-part/schemas';

export interface UploadResponse {
	message: string;
	fileName: string;
	filePath: string;
}

export interface UploadError {
	fileName: string;
	error: string;
}

/**
 * Upload multiple part drawing files to the API
 * @param files Array of File objects to upload
 * @returns Promise with array of successful uploads and errors
 */
export const uploadPartDrawings = async (
	files: File[]
): Promise<{ uploads: PartDrawingFormData[]; errors: UploadError[] }> => {
	const token = Cookie.getToken();

	if (!token) {
		throw new Error('Missing Authorization token');
	}

	const uploads: PartDrawingFormData[] = [];
	const errors: UploadError[] = [];

	// Upload files sequentially to avoid overwhelming the server
	for (const file of files) {
		try {
			const formData = new FormData();
			formData.append('file', file);

			const response = await fetch(`${process.env.API_BASE_URL}files/part_drawings`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: formData
			});

			if (!response.ok) {
				throw new Error(`Upload failed with status: ${response.status}`);
			}

			const result: UploadResponse = await response.json();

			uploads.push({
				fileName: result.fileName,
				filePath: result.filePath,
				originalFileName: file.name
			});
		} catch (error) {
			errors.push({
				fileName: file.name,
				error: error instanceof Error ? error.message : 'Unknown error occurred'
			});
		}
	}

	return { uploads, errors };
};

/**
 * Upload a single part drawing file to the API
 * @param file File object to upload
 * @returns Promise with upload result
 */
export const uploadSinglePartDrawing = async (file: File): Promise<PartDrawingFormData> => {
	const token = Cookie.getToken();

	if (!token) {
		throw new Error('Missing Authorization token');
	}

	const formData = new FormData();
	formData.append('file', file);

	const response = await fetch(`${process.env.API_BASE_URL}files/part_drawings`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`
		},
		body: formData
	});

	if (!response.ok) {
		throw new Error(`Upload failed with status: ${response.status}`);
	}

	const result: UploadResponse = await response.json();

	return {
		fileName: result.fileName,
		filePath: result.filePath
	};
};
