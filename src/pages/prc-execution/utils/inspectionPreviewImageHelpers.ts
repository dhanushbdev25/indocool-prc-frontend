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

export const buildPreviewImageUrl = (annotation?: PreviewAnnotation, matchedFile?: PreviewImageFile): string => {
	const rawUrl = annotation?.imageUrl || matchedFile?.filePath || '';
	return toFileRenderUrl(rawUrl).replace(/\\/g, '/');
};
