import type { Store } from '@reduxjs/toolkit';
import {
	LIST_VIEW_SCREENS,
	initialListViewState,
	type ListViewEntry,
	type ListViewPagination,
	type ListViewScreen,
	type ListViewState
} from './slices/listView';

export const LIST_VIEW_STORAGE_KEY = 'indocool:listView:v1';

const isPlainStringRecord = (value: unknown): value is Record<string, string> => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	for (const v of Object.values(value)) {
		if (typeof v !== 'string') return false;
	}
	return true;
};

const isPagination = (value: unknown): value is ListViewPagination => {
	if (!value || typeof value !== 'object') return false;
	const v = value as Record<string, unknown>;
	return typeof v.pageIndex === 'number' && typeof v.pageSize === 'number';
};

const sanitizeEntry = (raw: unknown): ListViewEntry | null => {
	if (!raw || typeof raw !== 'object') return null;
	const v = raw as Record<string, unknown>;
	if (typeof v.searchTerm !== 'string') return null;
	if (!isPlainStringRecord(v.filters)) return null;
	if (!isPagination(v.pagination)) return null;
	return {
		searchTerm: v.searchTerm,
		filters: { ...v.filters },
		pagination: { pageIndex: v.pagination.pageIndex, pageSize: v.pagination.pageSize }
	};
};

export const loadPersistedListView = (): ListViewState | undefined => {
	if (typeof window === 'undefined') return undefined;
	try {
		const raw = window.localStorage.getItem(LIST_VIEW_STORAGE_KEY);
		if (!raw) return undefined;
		const parsed = JSON.parse(raw) as unknown;
		if (!parsed || typeof parsed !== 'object') return undefined;
		const next: ListViewState = { ...initialListViewState };
		for (const screen of LIST_VIEW_SCREENS) {
			const entry = sanitizeEntry((parsed as Record<string, unknown>)[screen]);
			if (entry) next[screen as ListViewScreen] = entry;
		}
		return next;
	} catch {
		return undefined;
	}
};

interface StoreLike {
	getState: () => { listView: ListViewState };
	subscribe: Store['subscribe'];
}

export const attachListViewPersistence = (store: StoreLike, debounceMs = 150): (() => void) => {
	if (typeof window === 'undefined') return () => {};
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let lastSerialized = '';

	const unsubscribe = store.subscribe(() => {
		const slice = store.getState().listView;
		if (timeoutId) clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			try {
				const serialized = JSON.stringify(slice);
				if (serialized !== lastSerialized) {
					window.localStorage.setItem(LIST_VIEW_STORAGE_KEY, serialized);
					lastSerialized = serialized;
				}
			} catch {
				/* localStorage quota / disabled — ignore */
			}
		}, debounceMs);
	});

	return () => {
		if (timeoutId) clearTimeout(timeoutId);
		unsubscribe();
	};
};

export const clearPersistedListView = (): void => {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.removeItem(LIST_VIEW_STORAGE_KEY);
	} catch {
		/* ignore */
	}
};
