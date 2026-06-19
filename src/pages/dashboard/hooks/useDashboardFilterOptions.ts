import { useMemo } from 'react';
import {
	useFetchPlantsQuery,
	useFetchWorkstationsComboQuery
} from '../../../store/api/business/prc-execution/prc-execution.api';
import { useFetchMouldingAnalysisQuery } from '../../../store/api/business/dashboard/dashboard.api';
import { SHIFT_OPTION_VALUES } from '../../../constants/shiftOptions';

const isRecord = (v: unknown): v is Record<string, unknown> =>
	v !== null && typeof v === 'object' && !Array.isArray(v);

const coercePlantOption = (row: unknown): string => {
	if (typeof row === 'string') return row.trim();
	if (!isRecord(row)) return '';
	const label = typeof row.label === 'string' ? row.label.trim() : '';
	const value = typeof row.value === 'string' ? row.value.trim() : '';
	return label || value;
};

const coercePlantCode = (row: unknown): string => {
	if (typeof row === 'string') return row.trim();
	if (!isRecord(row)) return '';
	if (typeof row.value === 'string') return row.value.trim();
	if (typeof row.value === 'number') return String(row.value);
	return '';
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
	const { data: plantsData, isLoading: isPlantsLoading } = useFetchPlantsQuery();
	const { data: mouldingData, isLoading: isMouldingOptionsLoading } = useFetchMouldingAnalysisQuery(
		{ from, to },
		{ skip: !isReady }
	);

	const plantRows = useMemo(
		() =>
			Array.isArray(plantsData)
				? plantsData
				: isRecord(plantsData) && Array.isArray(plantsData.data)
					? plantsData.data
					: [],
		[plantsData]
	);

	const unitOptions = useMemo(() => uniqueSorted(plantRows.map(coercePlantOption)), [plantRows]);

	// Map the displayed unit option string back to its plant code for the workstations API.
	const plantCodeByUnit = useMemo(() => {
		const map = new Map<string, string>();
		plantRows.forEach(row => {
			const option = coercePlantOption(row);
			const code = coercePlantCode(row);
			if (option && code) map.set(option, code);
		});
		return map;
	}, [plantRows]);

	const selectedPlantCode = useMemo(() => {
		if (selectedUnits.length !== 1) return '';
		return plantCodeByUnit.get(selectedUnits[0]) ?? '';
	}, [selectedUnits, plantCodeByUnit]);

	const { data: workstationComboData = [] } = useFetchWorkstationsComboQuery(
		{ plantCode: selectedPlantCode },
		{ skip: !selectedPlantCode }
	);

	const workstationOptions = useMemo(() => {
		if (selectedPlantCode) {
			return uniqueSorted(workstationComboData.map(item => item.label));
		}
		// Fallback to moulding-derived workstations when no single unit is selected.
		return uniqueSorted((mouldingData?.workstationWise ?? []).map(item => item.workCenter));
	}, [selectedPlantCode, workstationComboData, mouldingData]);

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
		isLoading: isPlantsLoading || isMouldingOptionsLoading
	};
};
