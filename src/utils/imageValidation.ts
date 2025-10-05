/**
 * Validates an image file based on type and size.
 *
 * Allowed types: JPEG, PNG
 * Max size: 5MB
 *
 * @param file - The image file to validate
 * @returns Validation result with a boolean flag and optional error message
 */
export const validateImage = (file: File): { isValid: boolean; error: string | null } => {
	const allowedTypes = ['image/jpeg', 'image/png'];
	const maxFileSize = 5 * 1024 * 1024; // 5MB

	if (!allowedTypes.includes(file.type)) {
		return {
			isValid: false,
			error: 'Only JPEG and PNG image formats are allowed.'
		};
	}

	if (file.size > maxFileSize) {
		return {
			isValid: false,
			error: 'Image size must be less than 5MB.'
		};
	}

	return { isValid: true, error: null };
};

/**
 * Async wrapper for image validation for consistent API usage.
 *
 * @param file - The image file to validate
 * @returns Promise with validation result
 */
export const validateImageFile = async (file: File): Promise<{ isValid: boolean; error: string | null }> => {
	return validateImage(file);
};
