const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const trimLeadingSlash = (value: string) => value.replace(/^\/+/, '');

const normalizeSlashes = (value: string) => value.replace(/\\/g, '/');

const getApiBaseUrl = () => {
	const base = process.env.API_BASE_URL || '';
	return trimTrailingSlash(base);
};

/**
 * Normalizes uploaded storage key/path to the persisted API path format.
 * Examples:
 * - part_drawings/file.png -> files/part_drawings/file.png
 * - files/part_drawings/file.png -> files/part_drawings/file.png
 */
export const toFileStoragePath = (pathOrKey: string) => {
	const normalized = trimLeadingSlash(normalizeSlashes(pathOrKey));
	if (normalized.startsWith('files/')) {
		return normalized;
	}
	return `files/${normalized}`;
};

/**
 * Converts persisted file path/key to a full renderable URL.
 */
export const toFileRenderUrl = (pathOrUrl?: string) => {
	if (!pathOrUrl) return '';
	const normalized = normalizeSlashes(pathOrUrl);

	if (/^https?:\/\//i.test(normalized)) {
		return normalized;
	}

	const baseUrl = getApiBaseUrl();
	if (!baseUrl) {
		return normalized.startsWith('/') ? normalized : `/${normalized}`;
	}

	const storagePath = toFileStoragePath(normalized);
	return `${baseUrl}/${storagePath}`;
};
