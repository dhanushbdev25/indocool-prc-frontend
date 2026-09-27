import { useCallback, useEffect, useRef, useState } from 'react';
import { findExpandingCollapse, findFirstErrorElement, scrollToFirstError } from '../utils/scrollToFirstError';

/** Safety net for the case where the height transition never reports back. */
const TRANSITION_FALLBACK_MS = 800;

/**
 * Wires a step form up to `scrollToFirstError`.
 *
 * Attach `containerRef` to the step's root element and call `requestScrollToError()` right
 * after a failed `validateForm()`. The scroll runs from an effect rather than inline because
 * `setErrors(...)` has not painted yet at the point the submit handler returns — the red
 * fields (and any `<Collapse>` row we just expanded to reveal them) only exist after commit.
 *
 * When the error sits inside a row we have just expanded, the scroll waits for that row's
 * height transition to finish — see `findExpandingCollapse` for why scrolling mid-transition
 * drops the error below the fold.
 */
export const useScrollToFirstError = <T extends HTMLElement = HTMLDivElement>() => {
	const containerRef = useRef<T | null>(null);
	const [scrollRequestId, setScrollRequestId] = useState(0);
	const pendingRef = useRef(false);

	const requestScrollToError = useCallback(() => {
		pendingRef.current = true;
		setScrollRequestId(id => id + 1);
	}, []);

	useEffect(() => {
		if (!pendingRef.current) return;
		pendingRef.current = false;

		let innerFrame = 0;
		let stopWaiting: (() => void) | undefined;

		// Two frames: the first lets React's commit paint, the second lets MUI's `Collapse`
		// (timeout="auto") actually start its transition so we can tell whether to wait for it.
		const outerFrame = requestAnimationFrame(() => {
			innerFrame = requestAnimationFrame(() => {
				const collapse = findExpandingCollapse(findFirstErrorElement(containerRef.current));
				if (!collapse) {
					scrollToFirstError(containerRef.current);
					return;
				}

				const scrollNow = () => {
					stopWaiting?.();
					scrollToFirstError(containerRef.current);
				};

				const onTransitionEnd = (event: TransitionEvent) => {
					// Only the collapse's own height settling means the layout is final; inner
					// elements have their own transitions that bubble through here.
					if (event.target !== collapse || event.propertyName !== 'height') return;
					scrollNow();
				};

				const fallback = window.setTimeout(scrollNow, TRANSITION_FALLBACK_MS);
				collapse.addEventListener('transitionend', onTransitionEnd);
				stopWaiting = () => {
					window.clearTimeout(fallback);
					collapse.removeEventListener('transitionend', onTransitionEnd);
					stopWaiting = undefined;
				};
			});
		});

		return () => {
			cancelAnimationFrame(outerFrame);
			if (innerFrame) cancelAnimationFrame(innerFrame);
			stopWaiting?.();
		};
	}, [scrollRequestId]);

	return { containerRef, requestScrollToError };
};
