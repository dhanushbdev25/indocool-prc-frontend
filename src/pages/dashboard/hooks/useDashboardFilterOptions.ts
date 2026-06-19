import { useMemo } from 'react';
import {
	useFetchPlantsQuery,
	useFetchWorkstationsComboQuery
} from '../../../store/api/business/prc-execution/prc-execution.api';
import { useFetchMouldingAnalysisQuery } from '../../../store/api/business/dashboard/dashboard.api';
import { SHIFT_OPTION_VALUES } from '../../../constants/shiftOptions';

const isRecord = (v: unknown): v is Record<string, unknown> =>
	v !== null && typeof v === 'object' && !Array.isArray(v);

const coercePlantCode = (row: unknown): string => {
	if (typeof row === 'string') return row.trim();
	if (!isRecord(row)) return '';
	if (typeof row.value === 'string') return row.value.trim();
	if (typeof row.value === 'number') return String(row.value);
	if (typeof row.label === 'string') return row.label.trim();
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

	// Units filter stores plant codes (sent as plantCode query params to the workstations API).
	const unitOptions = useMemo(() => uniqueSorted(plantRows.map(coercePlantCode)), [plantRows]);

	const plantCodeByUnit = useMemo(() => {
		const map = new Map<string, string>();
		plantRows.forEach(row => {
			const code = coercePlantCode(row);
			if (!code) return;
			map.set(code, code);
			if (isRecord(row) && typeof row.label === 'string' && row.label.trim()) {
				map.set(row.label.trim(), code);
			}
		});
		return map;
	}, [plantRows]);

	// Preserve selection order; dedupe so each plantCode appears once in the request.
	const selectedPlantCodes = useMemo(() => {
		if (selectedUnits.length === 0) return [];
		const seen = new Set<string>();
		const codes: string[] = [];
		for (const unit of selectedUnits) {
			const code = plantCodeByUnit.get(unit.trim()) ?? unit.trim();
			if (!code || seen.has(code)) continue;
			seen.add(code);
			codes.push(code);
		}
		return codes;
	}, [selectedUnits, plantCodeByUnit]);

	const {
		currentData: workstationComboData,
		isLoading: isWorkstationsLoading,
		isFetching: isWorkstationsFetching
	} = useFetchWorkstationsComboQuery(
		{ plantCodes: selectedPlantCodes },
		{
			skip: selectedPlantCodes.length === 0,
			refetchOnMountOrArgChange: true
		}
	);

	const workstationOptions = useMemo(() => {
		if (selectedPlantCodes.length === 0 || !workstationComboData) return [];
		return uniqueSorted(workstationComboData.map(item => item.label));
	}, [selectedPlantCodes.length, workstationComboData]);

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
