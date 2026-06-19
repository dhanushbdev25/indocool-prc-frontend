import { Box, ButtonBase, Grid } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import FilterAutocomplete from '../../../components/masters/filters/FilterAutocomplete';
import { dashboardFilterField } from '../constants/dashboardTokens';
import type { DashboardEntityFilters, DashboardEntityFilterKey } from '../hooks/useDashboardEntityFilters';

interface DashboardFilterBarProps {
	filters: DashboardEntityFilters;
	onFilterChange: (key: DashboardEntityFilterKey, value: string[]) => void;
	onClearAll: () => void;
	hasActiveFilters: boolean;
	unitOptions: string[];
	workstationOptions: string[];
	shiftOptions: string[];
	projectOptions: string[];
	disabled?: boolean;
}

export const DashboardFilterBar = ({
	filters,
	onFilterChange,
	onClearAll,
	hasActiveFilters,
	unitOptions,
	workstationOptions,
	shiftOptions,
	projectOptions,
	disabled = false
}: DashboardFilterBarProps) => {
	const theme = useTheme();
	const mutedText = alpha(theme.palette.text.primary, 0.55);
	const hairlineHover = alpha(theme.palette.text.primary, 0.04);
	const filterFieldSx = [dashboardFilterField];

	return (
		<Box sx={{ width: '100%' }}>
			<Grid container spacing={1.25} alignItems="center">
				<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
					<FilterAutocomplete
						label="Units"
						placeholder="All units"
						options={unitOptions}
						value={filters.units}
						onChange={value => onFilterChange('units', value)}
						disabled={disabled}
						compactDisplay
						sx={filterFieldSx}
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
					<FilterAutocomplete
						label="Workstation"
						placeholder="All workstations"
						options={workstationOptions}
						value={filters.workstation}
						onChange={value => onFilterChange('workstation', value)}
						disabled={disabled || filters.units.length === 0}
						compactDisplay
						sx={filterFieldSx}
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
					<FilterAutocomplete
						label="Shift"
						placeholder="All shifts"
						options={shiftOptions}
						value={filters.shift}
						onChange={value => onFilterChange('shift', value)}
						disabled={disabled}
						compactDisplay
						sx={filterFieldSx}
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6, lg: 3 }}>
					<FilterAutocomplete
						label="Projects"
						placeholder="All projects"
						options={projectOptions}
						value={filters.projects}
						onChange={value => onFilterChange('projects', value)}
						disabled={disabled}
						compactDisplay
						sx={filterFieldSx}
					/>
				</Grid>
			</Grid>

			{hasActiveFilters ? (
				<Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
					<ButtonBase
						onClick={onClearAll}
						aria-label="Clear dashboard filters"
						sx={{
							height: 24,
							px: 0.75,
							borderRadius: 0.75,
							color: mutedText,
							fontSize: '0.75rem',
							fontWeight: 500,
							'&:hover': { color: 'text.primary', backgroundColor: hairlineHover }
						}}
					>
						Clear filters
					</ButtonBase>
				</Box>
			) : null}
		</Box>
	);
};
