import { useMemo } from 'react';
import type { FilterComboOption } from '../../../components/masters/filters/FilterAutocomplete';
import { useFetchWorkstationsComboQuery } from '../../../store/api/business/prc-execution/prc-execution.api';
import { useFetchPlantComboQuery } from '../../../store/api/business/prc-template/prc-template.api';
import { useFetchMouldingAnalysisQuery } from '../../../store/api/business/dashboard/dashboard.api';
import { SHIFT_OPTION_VALUES } from '../../../constants/shiftOptions';

const isRecord = (v: unknown): v is Record<string, unknown> =>
	v !== null && typeof v === 'object' && !Array.isArray(v);

const toPlantOption = (row: unknown): FilterComboOption | null => {
	if (typeof row === 'string') {
		const value = row.trim();
		return value ? { label: value, value } : null;
	}
	if (!isRecord(row)) return null;

	const value =
		typeof row.value === 'string'
			? row.value.trim()
			: typeof row.value === 'number'
				? String(row.value)
				: '';
	if (!value) return null;

	const label = typeof row.label === 'string' && row.label.trim() ? row.label.trim() : value;
	return { label, value };
};

const uniqueSortedByLabel = (options: FilterComboOption[]): FilterComboOption[] => {
	const byValue = new Map<string, FilterComboOption>();
	for (const option of options) {
		if (!byValue.has(option.value)) byValue.set(option.value, option);
	}
	return [...byValue.values()].sort((a, b) => a.label.localeCompare(b.label));
};

const uniqueSorted = (values: string[]): string[] =>
	[...new Set(values.map(v => v.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));

interface UseDashboardFilterOptionsArgs {
	from: string;
	to: string;
	isReady: boolean;
	selectedUnits: string[];
}

export const useDashboardFilterOptions = ({ from, to, isReady, selectedUnits }: UseDashboardFilterOptionsArgs) => {
	// Linked-master plant combo — called with no partId so the backend returns the full plant list.
	const { data: plantsData, isLoading: isPlantsLoading } = useFetchPlantComboQuery({});
	const { data: mouldingData, isLoading: isMouldingOptionsLoading } = useFetchMouldingAnalysisQuery(
		{ from, to },
		{ skip: !isReady }
	);

	const plantRows = useMemo(
		() => (isRecord(plantsData) && Array.isArray(plantsData.data) ? plantsData.data : []),
		[plantsData]
	);

	const unitOptions = useMemo(
		() => uniqueSortedByLabel(plantRows.map(toPlantOption).filter((option): option is FilterComboOption => option !== null)),
		[plantRows]
	);

	const {
		currentData: workstationComboData,
		isLoading: isWorkstationsLoading,
		isFetching: isWorkstationsFetching
	} = useFetchWorkstationsComboQuery(
		{ plantCodes: selectedUnits },
		{
			skip: selectedUnits.length === 0,
			refetchOnMountOrArgChange: true
		}
	);

	const workstationOptions = useMemo(() => {
		if (selectedUnits.length === 0 || !workstationComboData) return [];
		return uniqueSorted(workstationComboData.map(item => item.label));
	}, [selectedUnits.length, workstationComboData]);

	const projectOptions = useMemo(
		() => uniqueSorted((mouldingData?.projectWise ?? []).map(item => item.project)),
		[mouldingData]
	);

	const shiftOptions = useMemo(() => [...SHIFT_OPTION_VALUES], []);

	return {
		unitOptions,
		workstationOptions,
		projectOptions,
		shiftOptions,
		isLoading: isPlantsLoading || isMouldingOptionsLoading || isWorkstationsLoading || isWorkstationsFetching
	};
};
