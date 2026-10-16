import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildPreviewImageUrl, getUnannotatedPreviewFiles } from './inspectionPreviewImageHelpers';

const ORIGINAL_BASE = process.env.API_BASE_URL;

describe('buildPreviewImageUrl', () => {
	beforeEach(() => {
		process.env.API_BASE_URL = 'https://prc.example.com/web/';
	});
	afterEach(() => {
		process.env.API_BASE_URL = ORIGINAL_BASE;
	});

	it('prefers the matched file storage path over the saved absolute URL', () => {
		expect(
			buildPreviewImageUrl(
				{ imageUrl: 'http://43.205.188.89:8080/web/files/part_drawings/a.jpg', imageFileName: 'a.jpg' },
				{ fileName: 'a.jpg', filePath: 'files/part_drawings/a.jpg' }
			)
		).toBe('https://prc.example.com/web/files/part_drawings/a.jpg');
	});

	it('rebases a saved API file URL from another host onto the current API base', () => {
		expect(
			buildPreviewImageUrl({
				imageUrl: 'http://43.205.188.89:8080/web/files/part_drawings/a.jpg',
				imageFileName: 'a.jpg'
			})
		).toBe('https://prc.example.com/web/files/part_drawings/a.jpg');
	});

	it('leaves URLs that are not API file URLs untouched', () => {
		expect(buildPreviewImageUrl({ imageUrl: 'https://cdn.example.com/a.jpg' })).toBe('https://cdn.example.com/a.jpg');
	});
});

describe('getUnannotatedPreviewFiles', () => {
	it('returns attached files that no annotation refers to', () => {
		const files = [
			{ fileName: 'a.jpg', filePath: 'files/part_drawings/a.jpg' },
			{ fileName: 'b.jpg', filePath: 'files/part_drawings/b.jpg' }
		];
		expect(getUnannotatedPreviewFiles(files, [{ imageFileName: 'a.jpg' }])).toEqual([files[1]]);
		expect(getUnannotatedPreviewFiles(files, [])).toEqual(files);
		expect(getUnannotatedPreviewFiles(undefined, [])).toEqual([]);
	});
});
