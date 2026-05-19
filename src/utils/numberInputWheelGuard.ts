/**
 * Browsers (notably Chrome) nudge the value of a focused <input type="number"> on
 * mouse wheel, so scrolling the page can accidentally change the field. This guard
 * blocks that. Page scroll is unchanged when the field is not focused.
 */
export function installNumberInputWheelGuard(): void {
	if (typeof document === 'undefined') {
		return;
	}

	const onWheel = (e: WheelEvent) => {
		const t = e.target;
		if (
			t instanceof HTMLInputElement &&
			t.type === 'number' &&
			document.activeElement === t
		) {
			e.preventDefault();
		}
	};

	document.addEventListener('wheel', onWheel, { capture: true, passive: false });
}
