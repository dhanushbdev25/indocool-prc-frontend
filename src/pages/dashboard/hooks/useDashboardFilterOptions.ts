import { useMemo } from 'react';
import { useFetchPlantsQuery } from '../../../store/api/business/prc-execution/prc-execution.api';
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

const uniqueSorted = (values: string[]): string[] =>
	[...new Set(values.map(v => v.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));

interface UseDashboardFilterOptionsArgs {
	from: string;
	to: string;
	isReady: boolean;
}

export const useDashboardFilterOptions = ({ from, to, isReady }: UseDashboardFilterOptionsArgs) => {
	const { data: plantsData, isLoading: isPlantsLoading } = useFetchPlantsQuery();
	const { data: mouldingData, isLoading: isMouldingOptionsLoading } = useFetchMouldingAnalysisQuery(
		{ from, to },
		{ skip: !isReady }
	);

	const unitOptions = useMemo(() => {
		const rows = Array.isArray(plantsData)
			? plantsData
			: isRecord(plantsData) && Array.isArray(plantsData.data)
				? plantsData.data
				: [];
		return uniqueSorted(rows.map(coercePlantOption));
	}, [plantsData]);

	const workstationOptions = useMemo(
		() => uniqueSorted((mouldingData?.workstationWise ?? []).map(item => item.workCenter)),
		[mouldingData]
	);

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
