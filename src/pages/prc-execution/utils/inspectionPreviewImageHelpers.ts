import { toFileRenderUrl } from '../../../utils/fileUrl';

const extractBaseName = (value: string): string => {
	const normalized = value.replace(/\\/g, '/').trim();
	const parts = normalized.split('/');
	return (parts[parts.length - 1] || '').trim();
};

const normalizeImageToken = (value: unknown): string => {
	if (typeof value !== 'string') return '';
	return extractBaseName(value).toLowerCase();
};

const collectImageTokens = (values: unknown[]): string[] => {
	const unique = new Set<string>();
	values.forEach(value => {
		const token = normalizeImageToken(value);
		if (token) unique.add(token);
	});
	return Array.from(unique);
};

export type PreviewImageFile = {
	fileName?: string;
	filePath?: string;
	originalFileName?: string;
};

export type PreviewAnnotation = {
	imageFileName?: string;
	imageUrl?: string;
	regions?: unknown[];
};

const buildFileTokens = (file?: PreviewImageFile): string[] =>
	collectImageTokens([file?.fileName, file?.originalFileName, file?.filePath]);

const buildAnnotationTokens = (annotation?: PreviewAnnotation): string[] =>
	collectImageTokens([annotation?.imageFileName, annotation?.imageUrl]);

export const findMatchingPreviewFile = (
	files: PreviewImageFile[],
	annotation?: PreviewAnnotation
): PreviewImageFile | undefined => {
	const annotationTokens = new Set(buildAnnotationTokens(annotation));
	if (annotationTokens.size === 0) return undefined;
	return files.find(file => buildFileTokens(file).some(token => annotationTokens.has(token)));
};

/**
 * Annotations persist the full API URL the image had when it was marked (e.g.
 * `http://<old-host>:8080/web/files/part_drawings/x.jpg`). Reduce such URLs to their storage
 * path so they resolve through the authenticated signed-URL fetch on the current API host;
 * loading the saved URL directly hits a protected JSON endpoint and never renders.
 */
const toStoragePathIfApiFileUrl = (url: string): string => {
	const match = url.replace(/\\/g, '/').match(/^https?:\/\/[^/]+\/(?:.*\/)?web\/(files\/.+)$/i);
	return match ? match[1] : url;
};

export const buildPreviewImageUrl = (annotation?: PreviewAnnotation, matchedFile?: PreviewImageFile): string => {
	const rawUrl = matchedFile?.filePath || toStoragePathIfApiFileUrl(annotation?.imageUrl || '');
	return toFileRenderUrl(rawUrl).replace(/\\/g, '/');
};

/** Attached files that none of the given annotations were drawn on. */
export const getUnannotatedPreviewFiles = (
	files: PreviewImageFile[] | undefined,
	annotations: PreviewAnnotation[]
): PreviewImageFile[] =>
	(files || []).filter(file => !annotations.some(annotation => findMatchingPreviewFile([file], annotation)));
