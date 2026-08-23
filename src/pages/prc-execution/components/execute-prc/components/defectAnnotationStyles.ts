import type { ImageAnnotation } from '../../../types/execution.types';

const PALETTE_STROKE = [
	'#d32f2f',
	'#1976d2',
	'#388e3c',
	'#7b1fa2',
	'#f57c00',
	'#00796b',
	'#c2185b',
	'#5d4037',
	'#455a64',
	'#fbc02d',
	'#512da8',
	'#c62828'
];

function hashString(s: string): number {
	let h = 0;
	for (let i = 0; i < s.length; i++) {
		h = (h << 5) - h + s.charCodeAt(i);
		h |= 0;
	}
	return Math.abs(h);
}

export interface DefectStyle {
	stroke: string;
	fillSolid: string;
	fillSoft: string;
	label: string;
}

/**
 * Stroke, fills, and label color for Konva / MUI based on defect category.
 *
 * The colour is hashed from the name, so it is stable for a given defect without needing a
 * list of known categories — the categories now come from the demould inspection master.
 */
export function getDefectStyle(category: string | undefined): DefectStyle {
	const trimmed = category?.trim();
	if (!trimmed) {
		return {
			stroke: '#757575',
			fillSolid: 'rgba(117, 117, 117, 0.25)',
			fillSoft: 'rgba(117, 117, 117, 0.12)',
			label: '#616161'
		};
	}
	const stroke = PALETTE_STROKE[hashString(trimmed) % PALETTE_STROKE.length];

	const r = parseInt(stroke.slice(1, 3), 16);
	const g = parseInt(stroke.slice(3, 5), 16);
	const b = parseInt(stroke.slice(5, 7), 16);

	return {
		stroke,
		fillSolid: `rgba(${r}, ${g}, ${b}, 0.22)`,
		fillSoft: `rgba(${r}, ${g}, ${b}, 0.1)`,
		label: stroke
	};
}

/** Count regions with a non-empty category across all images */
export function countAnnotationsByCategory(imageAnnotations: ImageAnnotation[]): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const img of imageAnnotations) {
		for (const r of img.regions) {
			const c = r.category?.trim();
			if (!c) continue;
			counts[c] = (counts[c] ?? 0) + 1;
		}
	}
	return counts;
}
