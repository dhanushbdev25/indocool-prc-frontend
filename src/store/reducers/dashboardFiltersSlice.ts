import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type pagination = {
	page: number;
	limit: number;
};

type FiltersState = {
	duration: string;
	requestType: string;
	requirement: string;
	company: string;
	sbu: string;
	domain: string;
	priority: string;
	requestTable: pagination;
};

const initialState: FiltersState = {
	duration: '',
	requestType: '',
	requirement: '',
	company: '',
	sbu: '',
	domain: '',
	priority: '',
	requestTable: {
		page: 1,
		limit: 6
	}
};

export type StringFilterAction = Exclude<keyof FiltersState, 'requestTable'>;

const dashboardFiltersSlice = createSlice({
	name: 'dashboardFilters',
	initialState,
	reducers: {
		setStringFilter: (state, action: PayloadAction<{ key: StringFilterAction; value: string }>) => {
			state[action.payload.key] = action.payload.value;
		},
		setRequestTablePagination: (state, action: PayloadAction<pagination>) => {
			state.requestTable = action.payload;
		},
		resetFilters: () => initialState
	}
});

export const { setStringFilter, setRequestTablePagination, resetFilters } = dashboardFiltersSlice.actions;
export default dashboardFiltersSlice.reducer;
