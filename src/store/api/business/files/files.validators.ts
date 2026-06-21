export interface FileSignedUrlResponse {
	data: {
		url: string;
	};
}

export const isFileSignedUrlResponse = (response: unknown): response is FileSignedUrlResponse => {
	if (typeof response !== 'object' || response === null) return false;
	const data = (response as FileSignedUrlResponse).data;
	return typeof data === 'object' && data !== null && typeof data.url === 'string';
};
