import { describe, expect, it } from 'vitest';
import { calculateCanvasSize, fitCanvasToBox } from './annotationCanvasSize';

describe('calculateCanvasSize', () => {
	it('fits a large image within 800 x 600', () => {
		expect(calculateCanvasSize(1600, 900)).toEqual({ width: 800, height: 450 });
	});

	it('grows a small image up to 400 x 300', () => {
		expect(calculateCanvasSize(200, 150)).toEqual({ width: 400, height: 300 });
	});

	it('keeps a wide strip at full width instead of shrinking it', () => {
		expect(calculateCanvasSize(1034, 149)).toEqual({ width: 800, height: 115 });
		expect(calculateCanvasSize(2400, 320)).toEqual({ width: 800, height: 107 });
	});

	it('leaves an image already within bounds as it is', () => {
		expect(calculateCanvasSize(100, 400)).toEqual({ width: 100, height: 400 });
		expect(calculateCanvasSize(640, 480)).toEqual({ width: 640, height: 480 });
	});
});

describe('fitCanvasToBox', () => {
	it('fills the box width or height, whichever runs out first, keeping the aspect ratio', () => {
		expect(fitCanvasToBox(1034, 149, { width: 1800, height: 900 })).toEqual({ width: 1800, height: 259 });
		expect(fitCanvasToBox(800, 600, { width: 1800, height: 900 })).toEqual({ width: 1200, height: 900 });
	});

	it('grows with a bigger screen', () => {
		const small = fitCanvasToBox(800, 600, { width: 1200, height: 700 });
		const large = fitCanvasToBox(800, 600, { width: 2400, height: 1300 });
		expect(large!.width).toBeGreaterThan(small!.width);
	});

	it('waits for a measured box', () => {
		expect(fitCanvasToBox(800, 600, null)).toBeNull();
		expect(fitCanvasToBox(800, 600, { width: 0, height: 0 })).toBeNull();
	});
});
