import { Box, Stack, Typography } from '@mui/material';
import { DashboardDateRangePicker } from './DashboardDateRangePicker';
import { DashboardFilterBar } from './DashboardFilterBar';
import type { DateRangePreset } from '../hooks/useDashboardDateRange';
import type { DashboardEntityFilters, DashboardEntityFilterKey } from '../hooks/useDashboardEntityFilters';

interface DashboardPageHeaderProps {
	preset: DateRangePreset;
	presetLabel: string;
	displayLabel: string;
	onPresetChange: (preset: DateRangePreset) => void;
	onCustomRangeChange: (from: string | null, to: string | null) => void;
	customFrom: string | null;
	customTo: string | null;
	filters: DashboardEntityFilters;
	onFilterChange: (key: DashboardEntityFilterKey, value: string[]) => void;
	onClearFilters: () => void;
	hasActiveFilters: boolean;
	unitOptions: string[];
	workstationOptions: string[];
	shiftOptions: string[];
	projectOptions: string[];
	filtersDisabled?: boolean;
}

export const DashboardPageHeader = ({
	preset,
	presetLabel,
	displayLabel,
	onPresetChange,
	onCustomRangeChange,
	customFrom,
	customTo,
	filters,
	onFilterChange,
	onClearFilters,
	hasActiveFilters,
	unitOptions,
	workstationOptions,
	shiftOptions,
	projectOptions,
	filtersDisabled = false
}: DashboardPageHeaderProps) => (
	<Box
		sx={{
			pb: 2.5,
			mb: 0.5,
			borderBottom: 1,
			borderColor: 'divider'
		}}
	>
		<Box
			sx={{
				display: 'flex',
				flexDirection: { xs: 'column', md: 'row' },
				alignItems: { xs: 'stretch', md: 'flex-start' },
				justifyContent: 'space-between',
				gap: 2
			}}
		>
			<Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
				<Typography
					component="h1"
					variant="h5"
					sx={{ fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.25, color: 'text.primary' }}
				>
					Production Dashboard
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 560, lineHeight: 1.55 }}>
					Output, manpower, moulding performance, and daily trends for your selected period.
				</Typography>
			</Box>

			<Box sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', md: 'flex-start' } }}>
				<DashboardDateRangePicker
					preset={preset}
					presetLabel={presetLabel}
					displayLabel={displayLabel}
					onPresetChange={onPresetChange}
					onCustomRangeChange={onCustomRangeChange}
					customFrom={customFrom}
					customTo={customTo}
				/>
			</Box>
		</Box>

		<Stack sx={{ mt: 2 }}>
			<DashboardFilterBar
				filters={filters}
				onFilterChange={onFilterChange}
				onClearAll={onClearFilters}
				hasActiveFilters={hasActiveFilters}
				unitOptions={unitOptions}
				workstationOptions={workstationOptions}
				shiftOptions={shiftOptions}
				projectOptions={projectOptions}
				disabled={filtersDisabled}
			/>
		</Stack>
	</Box>
);
