import { useImperativeHandle, useLayoutEffect, useRef, useState, type Key, type ReactNode, type Ref } from 'react';
import { observeElementRect, useVirtualizer } from '@tanstack/react-virtual';

export interface VirtualizedListHandle {
	scrollToIndex: (index: number) => void;
}

interface VirtualizedListProps<T> {
	items: readonly T[];
	getItemKey: (item: T, index: number) => Key;
	renderItem: (item: T, index: number) => ReactNode;
	/** Rough height of a collapsed item in px; real heights are measured after render. */
	estimateSize?: number;
	overscan?: number;
	ref?: Ref<VirtualizedListHandle>;
}

// Used when the scroll container reports no height (no layout, e.g. jsdom/happy-dom tests),
// so the first rows still render instead of an empty list.
const FALLBACK_VIEWPORT_HEIGHT = 800;

/** Nearest ancestor that scrolls vertically (MainLayout's content box for routed pages). */
const findScrollParent = (element: HTMLElement | null): HTMLElement | null => {
	let node = element?.parentElement ?? null;
	while (node) {
		if (/(auto|scroll|overlay)/.test(getComputedStyle(node).overflowY)) return node;
		node = node.parentElement;
	}
	return (document.scrollingElement as HTMLElement | null) ?? null;
};

/**
 * Renders only the items near the viewport of the page's scroll container, so lists with
 * hundreds of heavy rows (e.g. inspection parameters) stay responsive. Items may have
 * dynamic heights (expand/collapse); each one is measured with a ResizeObserver.
 */
const VirtualizedList = <T,>({
	items,
	getItemKey,
	renderItem,
	estimateSize = 120,
	overscan = 5,
	ref
}: VirtualizedListProps<T>) => {
	const listRef = useRef<HTMLDivElement>(null);
	const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
	const [scrollMargin, setScrollMargin] = useState(0);

	useLayoutEffect(() => {
		const listElement = listRef.current;
		const scrollParent = findScrollParent(listElement);
		setScrollElement(scrollParent);
		if (!listElement || !scrollParent) return;

		// Distance from the top of the scroll content to the list; changes when content above it resizes.
		const updateScrollMargin = () => {
			const offset =
				listElement.getBoundingClientRect().top - scrollParent.getBoundingClientRect().top + scrollParent.scrollTop;
			setScrollMargin(prev => (Math.abs(prev - offset) < 1 ? prev : offset));
		};
		updateScrollMargin();

		if (typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(updateScrollMargin);
		Array.from(scrollParent.children).forEach(child => observer.observe(child));
		return () => observer.disconnect();
	}, []);

	// The compiler skipping memoization here is expected; the virtualizer is only used inside this component.
	// eslint-disable-next-line react-hooks/incompatible-library
	const virtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => scrollElement,
		estimateSize: () => estimateSize,
		overscan,
		scrollMargin,
		initialRect: { width: 0, height: FALLBACK_VIEWPORT_HEIGHT },
		observeElementRect: (instance, callback) =>
			observeElementRect(instance, rect =>
				callback(rect.height > 0 ? rect : { ...rect, height: FALLBACK_VIEWPORT_HEIGHT })
			),
		getItemKey: index => getItemKey(items[index], index)
	});

	useImperativeHandle(
		ref,
		() => ({
			scrollToIndex: (index: number) => virtualizer.scrollToIndex(index, { align: 'start' })
		}),
		[virtualizer]
	);

	return (
		<div ref={listRef} style={{ position: 'relative', width: '100%', height: virtualizer.getTotalSize() }}>
			{virtualizer.getVirtualItems().map(virtualItem => (
				<div
					key={virtualItem.key}
					data-index={virtualItem.index}
					ref={virtualizer.measureElement}
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						width: '100%',
						// flow-root keeps the item's bottom margin inside the measured height
						display: 'flow-root',
						transform: `translateY(${virtualItem.start - scrollMargin}px)`
					}}
				>
					{renderItem(items[virtualItem.index], virtualItem.index)}
				</div>
			))}
		</div>
	);
};

export default VirtualizedList;
