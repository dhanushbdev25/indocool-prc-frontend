import { Box, Stack, Typography } from '@mui/material';
import { DashboardFilterBar } from '../../dashboard/components/DashboardFilterBar';
import type { DateRangePreset } from '../../dashboard/hooks/useDashboardDateRange';
import type { FilterComboOption } from '../../../components/masters/filters/FilterAutocomplete';
import type { DashboardEntityFilters, DashboardEntityFilterKey } from '../../dashboard/hooks/useDashboardEntityFilters';

interface DpmoPageHeaderProps {
	draftPreset: DateRangePreset | null;
	draftPresetLabel: string;
	draftDisplayLabel: string;
	onDraftPresetChange: (preset: DateRangePreset) => void;
	onDraftCustomRangeChange: (from: string | null, to: string | null) => void;
	draftCustomFrom: string | null;
	draftCustomTo: string | null;
	draftFilters: DashboardEntityFilters;
	onDraftFilterChange: (key: DashboardEntityFilterKey, value: string[]) => void;
	onApply: () => void;
	onReset: () => void;
	isDirty: boolean;
	hasActiveFilters: boolean;
	unitOptions: FilterComboOption[];
	workstationOptions: string[];
	shiftOptions: string[];
	projectOptions: FilterComboOption[];
	sapProductOptions: FilterComboOption[];
	variantOptions: FilterComboOption[];
	variantDisabled?: boolean;
	variantPlaceholder?: string;
	filtersDisabled?: boolean;
}

/**
 * Mirrors DashboardPageHeader — same filter bar, DPMO-specific title. Kept separate
 * so the two pages can carry different copy without parameterising the analytics header.
 */
export const DpmoPageHeader = ({
	draftPreset,
	draftPresetLabel,
	draftDisplayLabel,
	onDraftPresetChange,
	onDraftCustomRangeChange,
	draftCustomFrom,
	draftCustomTo,
	draftFilters,
	onDraftFilterChange,
	onApply,
	onReset,
	isDirty,
	hasActiveFilters,
	unitOptions,
	workstationOptions,
	shiftOptions,
	projectOptions,
	sapProductOptions,
	variantOptions,
	variantDisabled,
	variantPlaceholder,
	filtersDisabled = false
}: DpmoPageHeaderProps) => (
	<Box sx={{ pb: 2.5, mb: 0.5 }}>
		<Box sx={{ minWidth: 0, mb: 2 }}>
			<Typography
				component="h1"
				variant="h5"
				sx={{ fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.25, color: 'text.primary' }}
			>
				DPMO Dashboard
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 560, lineHeight: 1.55 }}>
				Defect and first pass yield analysis across shifts, projects, workstations, and operators for completed PRCs in
				the selected period.
			</Typography>
		</Box>

		<Stack>
			<DashboardFilterBar
				draftFilters={draftFilters}
				onDraftFilterChange={onDraftFilterChange}
				draftPreset={draftPreset}
				draftPresetLabel={draftPresetLabel}
				draftDisplayLabel={draftDisplayLabel}
				draftCustomFrom={draftCustomFrom}
				draftCustomTo={draftCustomTo}
				onDraftPresetChange={onDraftPresetChange}
				onDraftCustomRangeChange={onDraftCustomRangeChange}
				onApply={onApply}
				onReset={onReset}
				isDirty={isDirty}
				hasActiveFilters={hasActiveFilters}
				unitOptions={unitOptions}
				workstationOptions={workstationOptions}
				shiftOptions={shiftOptions}
				projectOptions={projectOptions}
				sapProductOptions={sapProductOptions}
				variantOptions={variantOptions}
				variantDisabled={variantDisabled}
				variantPlaceholder={variantPlaceholder}
				disabled={filtersDisabled}
			/>
		</Stack>
	</Box>
);
