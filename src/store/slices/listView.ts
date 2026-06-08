import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const LIST_VIEW_SCREENS = [
	'catalyst',
	'inspection',
	'sequence',
	'prcTemplate',
	'part',
	'mould',
	'prcExecution',
	'sapJobs'
] as const;

export type ListViewScreen = (typeof LIST_VIEW_SCREENS)[number];

export interface ListViewPagination {
	pageIndex: number;
	pageSize: number;
}

export interface DateRangeFilterValue {
	from: string | null;
	to: string | null;
}

export type FilterValue = string | string[] | DateRangeFilterValue;

export interface ListViewEntry {
	searchTerm: string;
	filters: Record<string, FilterValue>;
	pagination: ListViewPagination;
}

export type ListViewState = Record<ListViewScreen, ListViewEntry>;

const DEFAULT_PAGINATION: ListViewPagination = { pageIndex: 0, pageSize: 5 };

const makeInitialEntry = (): ListViewEntry => ({
	searchTerm: '',
	filters: {},
	pagination: { ...DEFAULT_PAGINATION }
});

export const initialListViewState: ListViewState = LIST_VIEW_SCREENS.reduce((acc, key) => {
	acc[key] = makeInitialEntry();
	return acc;
}, {} as ListViewState);

const listViewSlice = createSlice({
	name: 'listView',
	initialState: initialListViewState,
	reducers: {
		setSearchTerm(state, action: PayloadAction<{ screen: ListViewScreen; value: string }>) {
			state[action.payload.screen].searchTerm = action.payload.value;
		},
		setFilter(state, action: PayloadAction<{ screen: ListViewScreen; key: string; value: FilterValue }>) {
			state[action.payload.screen].filters[action.payload.key] = action.payload.value;
		},
		setFilters(state, action: PayloadAction<{ screen: ListViewScreen; values: Record<string, FilterValue> }>) {
			state[action.payload.screen].filters = action.payload.values;
		},
		setPagination(state, action: PayloadAction<{ screen: ListViewScreen; value: ListViewPagination }>) {
			state[action.payload.screen].pagination = action.payload.value;
		},
		resetScreen(state, action: PayloadAction<ListViewScreen>) {
			state[action.payload] = makeInitialEntry();
		},
		hydrateListView(_state, action: PayloadAction<ListViewState>) {
			return action.payload;
		}
	}
});

export const { setSearchTerm, setFilter, setFilters, setPagination, resetScreen, hydrateListView } =
	listViewSlice.actions;
export default listViewSlice.reducer;
