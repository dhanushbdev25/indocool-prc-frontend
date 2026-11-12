/**
 * Canvas size for an annotated image: fits within max, grows small images up to min. Shared by
 * the annotator and the read-only display so a drawing is shown at the size it was drawn.
 */
export function calculateCanvasSize(
	imgWidth: number,
	imgHeight: number,
	opts?: { maxWidth?: number; maxHeight?: number; minWidth?: number; minHeight?: number }
) {
	const maxWidth = opts?.maxWidth ?? 800;
	const maxHeight = opts?.maxHeight ?? 600;
	const minWidth = opts?.minWidth ?? 400;
	const minHeight = opts?.minHeight ?? 300;

	let s = 1;
	if (imgWidth > maxWidth || imgHeight > maxHeight) {
		s = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
	}
	// Grow a small image towards min, but never shrink: a wide strip (e.g. 1034 x 149) used to
	// end up at 400 x 58 here instead of 800 x 115.
	const growScale = Math.min(minWidth / imgWidth, minHeight / imgHeight);
	if (growScale > s) s = growScale;

	return { width: Math.round(imgWidth * s), height: Math.round(imgHeight * s) };
}

/**
 * Largest size with the image's aspect ratio that fits in a box (scales up as well as down), for
 * the fullscreen views that should fill the space they have. Null until the box has been measured.
 */
export function fitCanvasToBox(
	imgWidth: number,
	imgHeight: number,
	box: { width: number; height: number } | null
): { width: number; height: number } | null {
	if (!box || imgWidth <= 0 || imgHeight <= 0 || box.width <= 0 || box.height <= 0) return null;
	const s = Math.min(box.width / imgWidth, box.height / imgHeight);
	return { width: Math.floor(imgWidth * s), height: Math.floor(imgHeight * s) };
}
