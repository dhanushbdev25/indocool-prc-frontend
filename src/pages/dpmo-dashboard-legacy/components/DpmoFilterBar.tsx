import { useState } from 'react';
import { Box, Button, ButtonBase, Collapse, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
	ExpandLess as ExpandLessIcon,
	ExpandMore as ExpandMoreIcon,
	FilterAltOutlined as FilterIcon
} from '@mui/icons-material';
import FilterAutocomplete, {
	type FilterComboOption
} from '../../../components/masters/filters/FilterAutocomplete';
import { dashboardFilterField } from '../../dashboard/constants/dashboardTokens';
import { DashboardDateRangeField } from '../../dashboard/components/DashboardDateRangeField';
import type {
	DashboardEntityFilters,
	DashboardEntityFilterKey
} from '../../dashboard/hooks/useDashboardEntityFilters';
import type { DateRangePreset } from '../../dashboard/hooks/useDashboardDateRange';
import { DpmoSingleProjectField } from './DpmoSingleProjectField';

const CONTROL_HEIGHT = 40;

interface DateRangeDraft {
	preset: DateRangePreset | null;
	presetLabel: string;
	displayLabel: string;
	customFrom: string | null;
	customTo: string | null;
	onPresetChange: (preset: DateRangePreset) => void;
	onCustomRangeChange: (from: string | null, to: string | null) => void;
}

interface BaseProps {
	dateRange: DateRangeDraft;
	onApply: () => void;
	onReset: () => void;
	isDirty: boolean;
	hasActiveFilters: boolean;
	disabled?: boolean;
	projectOptions: FilterComboOption[];
}

interface OverallVariantProps extends BaseProps {
	variant: 'overall';
	draftFilters: DashboardEntityFilters;
	onDraftFilterChange: (key: DashboardEntityFilterKey, value: string[]) => void;
	unitOptions: FilterComboOption[];
	workstationOptions: string[];
}

interface ProjectWiseVariantProps extends BaseProps {
	variant: 'projectWise';
	draftProject: string;
	onDraftProjectChange: (next: string) => void;
}

type DpmoFilterBarProps = OverallVariantProps | ProjectWiseVariantProps;

const FilterShell = ({
	activeCount,
	children
}: {
	activeCount: number;
	children: React.ReactNode;
}) => {
	const theme = useTheme();
	const hairlineHover = alpha(theme.palette.text.primary, 0.04);
	const mutedText = alpha(theme.palette.text.primary, 0.6);
	const [isExpanded, setIsExpanded] = useState(true);

	const panelSx = {
		borderRadius: '12px',
		border: `1px solid ${theme.palette.divider}`,
		backgroundColor: theme.palette.background.paper,
		boxShadow:
			theme.palette.mode === 'dark'
				? 'none'
				: `0 1px 0 ${alpha(theme.palette.common.black, 0.04)}, 0 1px 3px ${alpha(theme.palette.common.black, 0.05)}`
	};

	return (
		<Box sx={panelSx}>
			<ButtonBase
				onClick={() => setIsExpanded(open => !open)}
				aria-expanded={isExpanded}
				aria-controls="dpmo-filter-bar-body"
				sx={{
					width: '100%',
					px: { xs: 2, sm: 2.5 },
					py: 1.25,
					borderBottom: isExpanded ? 1 : 0,
					borderBottomColor: 'divider',
					justifyContent: 'space-between',
					transition: 'background-color 0.15s ease',
					'&:hover': { backgroundColor: hairlineHover }
				}}
			>
				<Stack direction="row" alignItems="center" spacing={1} sx={{ color: mutedText }}>
					<FilterIcon sx={{ fontSize: '1.125rem' }} />
					<Typography
						sx={{
							fontSize: '0.875rem',
							fontWeight: 600,
							color: 'text.primary',
							letterSpacing: '-0.005em'
						}}
					>
						Filters
					</Typography>
					{activeCount > 0 ? (
						<Box
							component="span"
							sx={{
								ml: 0.5,
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								minWidth: 20,
								height: 20,
								px: 0.75,
								borderRadius: '999px',
								fontSize: '0.6875rem',
								fontWeight: 700,
								color: 'primary.main',
								backgroundColor: alpha(theme.palette.primary.main, 0.1)
							}}
						>
							{activeCount}
						</Box>
					) : null}
				</Stack>
				{isExpanded ? (
					<ExpandLessIcon sx={{ fontSize: '1.25rem', color: mutedText }} aria-hidden />
				) : (
					<ExpandMoreIcon sx={{ fontSize: '1.25rem', color: mutedText }} aria-hidden />
				)}
			</ButtonBase>

			<Collapse in={isExpanded} id="dpmo-filter-bar-body" unmountOnExit={false}>
				{children}
			</Collapse>
		</Box>
	);
};

const ActionRow = ({
	isDirty,
	hasActiveFilters,
	onApply,
	onReset,
	disabled
}: {
	isDirty: boolean;
	hasActiveFilters: boolean;
	onApply: () => void;
	onReset: () => void;
	disabled?: boolean;
}) => {
	const theme = useTheme();
	const hairlineHover = alpha(theme.palette.text.primary, 0.04);
	return (
		<Stack
			direction="row"
			alignItems="center"
			justifyContent="flex-end"
			spacing={1}
			sx={{ mt: { xs: 1.5, sm: 1.75 }, flexWrap: 'wrap', rowGap: 1 }}
		>
			<Button
				size="small"
				variant="outlined"
				color="inherit"
				onClick={onReset}
				disabled={(!isDirty && !hasActiveFilters) || disabled}
				sx={{
					textTransform: 'none',
					fontWeight: 600,
					fontSize: '0.8125rem',
					borderColor: 'divider',
					color: 'text.primary',
					height: CONTROL_HEIGHT,
					px: 2,
					borderRadius: '10px',
					'&:hover': { borderColor: 'text.secondary', backgroundColor: hairlineHover }
				}}
			>
				Reset
			</Button>
			<Button
				type="submit"
				size="small"
				variant="contained"
				color="primary"
				onClick={onApply}
				disabled={!isDirty || disabled}
				aria-label="Apply filters"
				sx={{
					textTransform: 'none',
					fontWeight: 700,
					fontSize: '0.8125rem',
					height: CONTROL_HEIGHT,
					px: 2.5,
					borderRadius: '10px',
					boxShadow: 'none',
					'&:hover': { boxShadow: 'none' }
				}}
			>
				Apply
			</Button>
		</Stack>
	);
};

export const DpmoFilterBar = (props: DpmoFilterBarProps) => {
	const { dateRange, onApply, onReset, isDirty, hasActiveFilters, disabled } = props;

	const dateActive =
		dateRange.preset !== 'last30' || dateRange.customFrom || dateRange.customTo ? 1 : 0;

	const activeCount =
		props.variant === 'overall'
			? dateActive +
				(props.draftFilters.units.length > 0 ? 1 : 0) +
				(props.draftFilters.workstation.length > 0 ? 1 : 0) +
				(props.draftFilters.projects.length > 0 ? 1 : 0)
			: dateActive + (props.draftProject ? 1 : 0);

	return (
		<FilterShell activeCount={activeCount}>
			<form
				role="search"
				aria-label="DPMO filters"
				onSubmit={e => {
					e.preventDefault();
					if (isDirty) onApply();
				}}
				style={{ display: 'block' }}
			>
				<Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.75, sm: 2 } }}>
					{props.variant === 'overall' ? (
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: {
									xs: '1fr',
									sm: 'repeat(2, minmax(0, 1fr))',
									md: 'repeat(2, minmax(0, 1fr))',
									lg: 'repeat(4, minmax(0, 1fr))'
								},
								gap: { xs: 1.25, sm: 1.5 }
							}}
						>
							<DashboardDateRangeField
								preset={dateRange.preset}
								presetLabel={dateRange.presetLabel}
								displayLabel={dateRange.displayLabel}
								customFrom={dateRange.customFrom}
								customTo={dateRange.customTo}
								onPresetChange={dateRange.onPresetChange}
								onCustomRangeChange={dateRange.onCustomRangeChange}
								disabled={disabled}
							/>
							<FilterAutocomplete
								label="Units"
								placeholder="All units"
								options={props.unitOptions}
								value={props.draftFilters.units}
								onChange={value => props.onDraftFilterChange('units', value)}
								disabled={disabled}
								compactDisplay
								sx={dashboardFilterField}
							/>
							<FilterAutocomplete
								label="Workstation"
								placeholder="All workstations"
								options={props.workstationOptions}
								value={props.draftFilters.workstation}
								onChange={value => props.onDraftFilterChange('workstation', value)}
								disabled={disabled || props.draftFilters.units.length === 0}
								compactDisplay
								sx={dashboardFilterField}
							/>
							<FilterAutocomplete
								label="Projects"
								placeholder="All projects"
								options={props.projectOptions}
								value={props.draftFilters.projects}
								onChange={value => props.onDraftFilterChange('projects', value)}
								disabled={disabled}
								compactDisplay
								sx={dashboardFilterField}
							/>
						</Box>
					) : (
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: {
									xs: '1fr',
									sm: 'repeat(2, minmax(0, 1fr))'
								},
								gap: { xs: 1.25, sm: 1.5 }
							}}
						>
							<DashboardDateRangeField
								preset={dateRange.preset}
								presetLabel={dateRange.presetLabel}
								displayLabel={dateRange.displayLabel}
								customFrom={dateRange.customFrom}
								customTo={dateRange.customTo}
								onPresetChange={dateRange.onPresetChange}
								onCustomRangeChange={dateRange.onCustomRangeChange}
								disabled={disabled}
							/>
							<DpmoSingleProjectField
								value={props.draftProject}
								onChange={props.onDraftProjectChange}
								options={props.projectOptions}
								disabled={disabled}
							/>
						</Box>
					)}

					<ActionRow
						isDirty={isDirty}
						hasActiveFilters={hasActiveFilters}
						onApply={onApply}
						onReset={onReset}
						disabled={disabled}
					/>
				</Box>
			</form>
		</FilterShell>
	);
};
