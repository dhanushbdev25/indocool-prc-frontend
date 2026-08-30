import { useCallback, useEffect, useRef, useState } from 'react';
import { scrollToFirstError } from '../utils/scrollToFirstError';

/**
 * Wires a step form up to `scrollToFirstError`.
 *
 * Attach `containerRef` to the step's root element and call `requestScrollToError()` right
 * after a failed `validateForm()`. The scroll runs from an effect rather than inline because
 * `setErrors(...)` has not painted yet at the point the submit handler returns — the red
 * fields (and any `<Collapse>` row we just expanded to reveal them) only exist after commit.
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

		// Two frames: the first lets React's commit paint, the second lets MUI's `Collapse`
		// (timeout="auto") get far enough into its transition that the row has real height.
		let innerFrame = 0;
		const outerFrame = requestAnimationFrame(() => {
			innerFrame = requestAnimationFrame(() => {
				scrollToFirstError(containerRef.current);
			});
		});

		return () => {
			cancelAnimationFrame(outerFrame);
			if (innerFrame) cancelAnimationFrame(innerFrame);
		};
	}, [scrollRequestId]);

	return { containerRef, requestScrollToError };
};
