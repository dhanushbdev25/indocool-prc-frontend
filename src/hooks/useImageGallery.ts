import { useState } from 'react';

export type ImageItem = {
	id: number | string;
	file: File | null;
	image: string;
	fileName?: string;
	inspectionParameterId?: number;
	filePath?: string; // Original file path for existing files (without API_BASE_URL_PRE_AUTH)
	originalFileName?: string; // Original file name for existing files
};

export function useImageGallery() {
	const [gallery, setGallery] = useState<ImageItem[]>([]);
	const [remove, setRemove] = useState<(number | string)[]>([]);

	const handleAddImage = (file: File) => {
		const newItem: ImageItem = {
			id: Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000,
			file,
			image: URL.createObjectURL(file),
			fileName: file.name
		};
		setGallery(prev => [...prev, newItem]);
	};

	const handleRemoveImage = (id: number | string) => {
		setGallery(prev => prev.filter(item => item.id !== id));
		setRemove(prev => [...prev, id]);
	};

	return {
		gallery,
		remove,
		handleAddImage,
		handleRemoveImage,
		setGallery
	};
}
