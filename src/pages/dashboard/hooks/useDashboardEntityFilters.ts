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

export const useDashboardEntityFilters = () => {
	const [filters, setFilters] = useState<DashboardEntityFilters>(EMPTY_FILTERS);

	const setFilter = useCallback((key: DashboardEntityFilterKey, value: string[]) => {
		setFilters(prev => ({ ...prev, [key]: value }));
	}, []);

	const clearAll = useCallback(() => {
		setFilters(EMPTY_FILTERS);
	}, []);

	const hasActiveFilters = useMemo(
		() => filters.units.length > 0 || filters.workstation.length > 0 || filters.shift.length > 0 || filters.projects.length > 0,
		[filters]
	);

	return {
		filters,
		setFilter,
		clearAll,
		hasActiveFilters
	};
};
