import { useCallback, useEffect, useState } from 'react';

type ElementSize = { width: number; height: number };

/**
 * Tracks an element's content size with a ResizeObserver. Returns a callback ref to attach and the
 * latest size (null until the element is mounted and measured), so it also works for elements
 * that mount later, such as the contents of a dialog.
 */
export function useElementSize<T extends HTMLElement>(): [(node: T | null) => void, ElementSize | null] {
	const [node, setNode] = useState<T | null>(null);
	const [size, setSize] = useState<ElementSize | null>(null);
	const ref = useCallback((el: T | null) => setNode(el), []);

	useEffect(() => {
		if (!node || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(entries => {
			const rect = entries[0]?.contentRect;
			if (!rect) return;
			const next = { width: Math.floor(rect.width), height: Math.floor(rect.height) };
			setSize(prev => (prev && prev.width === next.width && prev.height === next.height ? prev : next));
		});
		observer.observe(node);
		return () => observer.disconnect();
	}, [node]);

	return [ref, node ? size : null];
}
