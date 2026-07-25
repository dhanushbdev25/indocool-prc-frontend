import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ViewOnlyImageGallery from './ViewOnlyImageGallery';

vi.mock('../../../hooks/useAuthenticatedFileUrl', () => ({
	useAuthenticatedFileUrl: (path?: string) => ({
		src: path ? `https://example.test/${path}` : '',
		loading: false,
		error: !path
	})
}));

describe('ViewOnlyImageGallery', () => {
	it('prefers the original filename and opens a read-only preview', async () => {
		render(
			<ViewOnlyImageGallery
				images={[
					{
						fileName: 'stored-123.png',
						filePath: 'files/part_drawings/stored-123.png',
						originalFileName: 'original-drawing.png'
					}
				]}
			/>
		);

		expect(screen.getByText('original-drawing.png')).toBeInTheDocument();
		expect(screen.queryByText('stored-123.png')).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /remove|add|upload/i })).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'View original-drawing.png' }));

		expect(screen.getByRole('dialog')).toBeInTheDocument();
		expect(screen.getAllByAltText('original-drawing.png')).toHaveLength(2);

		fireEvent.click(screen.getByRole('button', { name: 'Close image preview' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	});

	it('falls back to the local file name, stored name, and generated label', () => {
		const localFile = new File(['image'], 'local-drawing.jpg', { type: 'image/jpeg' });
		render(
			<ViewOnlyImageGallery
				images={[
					{ file: localFile, image: 'blob:local' },
					{ fileName: 'stored-name.jpg', filePath: 'files/stored-name.jpg' },
					{ image: 'blob:unnamed' }
				]}
			/>
		);

		expect(screen.getByText('local-drawing.jpg')).toBeInTheDocument();
		expect(screen.getByText('stored-name.jpg')).toBeInTheDocument();
		expect(screen.getByText('Image 3')).toBeInTheDocument();
	});
});
