import { useCallback, useMemo, useState } from 'react';
import type { DashboardEntityFilterParams } from '../../../store/api/business/dashboard/dashboard.validators';

export type DashboardEntityFilters = Required<DashboardEntityFilterParams>;

const EMPTY_FILTERS: DashboardEntityFilters = {
	units: [],
	workstation: [],
	shift: [],
	projects: []
};

export type DashboardEntityFilterKey = keyof DashboardEntityFilters;

const stableSort = (arr: string[]): string[] => [...arr].sort();
const areArraysEqual = (a: string[], b: string[]): boolean => {
	if (a.length !== b.length) return false;
	const sa = stableSort(a);
	const sb = stableSort(b);
	return sa.every((v, i) => v === sb[i]);
};
const areFilterMapsEqual = (a: DashboardEntityFilters, b: DashboardEntityFilters): boolean =>
	areArraysEqual(a.units, b.units) &&
	areArraysEqual(a.workstation, b.workstation) &&
	areArraysEqual(a.shift, b.shift) &&
	areArraysEqual(a.projects, b.projects);

/**
 * Dashboard entity filters with a draft/applied split.
 *
 * - `draftFilters` is what the UI inputs bind to.
 * - `appliedFilters` is what the queries read.
 * - `applyDraft()` commits draft → applied (call from the global Apply button).
 * - `resetDraft()` reverts draft to applied.
 * - `clearAll()` empties both, used by "Clear filters".
 */
export const useDashboardEntityFilters = () => {
	const [appliedFilters, setAppliedFilters] = useState<DashboardEntityFilters>(EMPTY_FILTERS);
	const [draftFilters, setDraftFilters] = useState<DashboardEntityFilters>(EMPTY_FILTERS);

	const setDraftFilter = useCallback((key: DashboardEntityFilterKey, value: string[]) => {
		setDraftFilters(prev => {
			if (key === 'units') {
				return { ...prev, units: value, workstation: [] };
			}
			return { ...prev, [key]: value };
		});
	}, []);

	const applyDraft = useCallback(() => {
		setAppliedFilters(draftFilters);
	}, [draftFilters]);

	const resetDraft = useCallback(() => {
		setDraftFilters(appliedFilters);
	}, [appliedFilters]);

	const clearAll = useCallback(() => {
		setAppliedFilters(EMPTY_FILTERS);
		setDraftFilters(EMPTY_FILTERS);
	}, []);

	const isDirty = useMemo(() => !areFilterMapsEqual(draftFilters, appliedFilters), [draftFilters, appliedFilters]);

	const hasActiveFilters = useMemo(
		() =>
			appliedFilters.units.length > 0 ||
			appliedFilters.workstation.length > 0 ||
			appliedFilters.shift.length > 0 ||
			appliedFilters.projects.length > 0,
		[appliedFilters]
	);

	return {
		appliedFilters,
		draftFilters,
		setDraftFilter,
		applyDraft,
		resetDraft,
		clearAll,
		isDirty,
		hasActiveFilters
	};
};
