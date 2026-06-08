import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
	setFilter,
	setFilters,
	setPagination,
	setSearchTerm,
	type FilterValue,
	type ListViewPagination,
	type ListViewScreen
} from '../store/slices/listView';

type PaginationUpdater = ListViewPagination | ((prev: ListViewPagination) => ListViewPagination);

export interface UseListViewReturn<FilterKey extends string = string> {
	searchTerm: string;
	filters: Record<FilterKey, FilterValue>;
	pagination: ListViewPagination;
	setSearchTerm: (value: string) => void;
	setFilter: (key: FilterKey, value: FilterValue) => void;
	setFilters: (values: Record<FilterKey, FilterValue>) => void;
	setPagination: (value: PaginationUpdater) => void;
}

export function useListView<FilterKey extends string = string>(screen: ListViewScreen): UseListViewReturn<FilterKey> {
	const dispatch = useAppDispatch();
	const entry = useAppSelector(state => state.listView[screen]);

	const setSearch = useCallback(
		(value: string) => {
			dispatch(setSearchTerm({ screen, value }));
		},
		[dispatch, screen]
	);

	const setFilterValue = useCallback(
		(key: FilterKey, value: FilterValue) => {
			dispatch(setFilter({ screen, key, value }));
		},
		[dispatch, screen]
	);

	const setFiltersValue = useCallback(
		(values: Record<FilterKey, FilterValue>) => {
			dispatch(setFilters({ screen, values }));
		},
		[dispatch, screen]
	);

	const setPaginationValue = useCallback(
		(value: PaginationUpdater) => {
			const next = typeof value === 'function' ? value(entry.pagination) : value;
			dispatch(setPagination({ screen, value: next }));
		},
		[dispatch, screen, entry.pagination]
	);

	return {
		searchTerm: entry.searchTerm,
		filters: entry.filters as Record<FilterKey, FilterValue>,
		pagination: entry.pagination,
		setSearchTerm: setSearch,
		setFilter: setFilterValue,
		setFilters: setFiltersValue,
		setPagination: setPaginationValue
	};
}
