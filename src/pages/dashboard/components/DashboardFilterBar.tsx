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
import { dashboardFilterField } from '../constants/dashboardTokens';
import type { DashboardEntityFilters, DashboardEntityFilterKey } from '../hooks/useDashboardEntityFilters';
import type { DateRangePreset } from '../hooks/useDashboardDateRange';
import { DashboardDateRangeField } from './DashboardDateRangeField';

interface DashboardFilterBarProps {
	draftFilters: DashboardEntityFilters;
	onDraftFilterChange: (key: DashboardEntityFilterKey, value: string[]) => void;
	draftPreset: DateRangePreset;
	draftPresetLabel: string;
	draftDisplayLabel: string;
	draftCustomFrom: string | null;
	draftCustomTo: string | null;
	onDraftPresetChange: (preset: DateRangePreset) => void;
	onDraftCustomRangeChange: (from: string | null, to: string | null) => void;
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
	disabled?: boolean;
}

const CONTROL_HEIGHT = 40;

export const DashboardFilterBar = ({
	draftFilters,
	onDraftFilterChange,
	draftPreset,
	draftPresetLabel,
	draftDisplayLabel,
	draftCustomFrom,
	draftCustomTo,
	onDraftPresetChange,
	onDraftCustomRangeChange,
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
	variantDisabled = false,
	variantPlaceholder,
	disabled = false
}: DashboardFilterBarProps) => {
	const theme = useTheme();
	const hairlineHover = alpha(theme.palette.text.primary, 0.04);
	const mutedText = alpha(theme.palette.text.primary, 0.6);

	const [isExpanded, setIsExpanded] = useState(true);

	const activeCount =
		(draftFilters.units.length > 0 ? 1 : 0) +
		(draftFilters.workstation.length > 0 ? 1 : 0) +
		(draftFilters.shift.length > 0 ? 1 : 0) +
		(draftFilters.projects.length > 0 ? 1 : 0) +
		(draftFilters.sapReferenceNumber.length > 0 ? 1 : 0) +
		(draftFilters.customerVariantId.length > 0 ? 1 : 0) +
		(draftPreset !== 'last30' || draftCustomFrom || draftCustomTo ? 1 : 0);

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
			{/* Accordion header — click strip toggles the body */}
			<ButtonBase
				onClick={() => setIsExpanded(open => !open)}
				aria-expanded={isExpanded}
				aria-controls="dashboard-filter-bar-body"
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
					<Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary', letterSpacing: '-0.005em' }}>
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

			<Collapse in={isExpanded} id="dashboard-filter-bar-body" unmountOnExit={false}>
			<form
				role="search"
				aria-label="Dashboard filters"
				onSubmit={e => {
					e.preventDefault();
					if (isDirty) onApply();
				}}
				style={{ display: 'block' }}
			>
				<Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.75, sm: 2 } }}>
					{/* All filters inline on one row (CSS grid for 5 equal columns at lg) */}
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: {
								xs: '1fr',
								sm: 'repeat(2, minmax(0, 1fr))',
								md: 'repeat(3, minmax(0, 1fr))',
								lg: 'repeat(4, minmax(0, 1fr))'
							},
							gap: { xs: 1.25, sm: 1.5 }
						}}
					>
						<DashboardDateRangeField
							preset={draftPreset}
							presetLabel={draftPresetLabel}
							displayLabel={draftDisplayLabel}
							customFrom={draftCustomFrom}
							customTo={draftCustomTo}
							onPresetChange={onDraftPresetChange}
							onCustomRangeChange={onDraftCustomRangeChange}
							disabled={disabled}
						/>

						<FilterAutocomplete
							label="Plant"
							placeholder="All plants"
							options={unitOptions}
							value={draftFilters.units}
							onChange={value => onDraftFilterChange('units', value)}
							disabled={disabled}
							compactDisplay
							sx={dashboardFilterField}
						/>
						<FilterAutocomplete
							label="Workstation"
							placeholder="All workstations"
							options={workstationOptions}
							value={draftFilters.workstation}
							onChange={value => onDraftFilterChange('workstation', value)}
							disabled={disabled || draftFilters.units.length === 0}
							compactDisplay
							sx={dashboardFilterField}
						/>
						<FilterAutocomplete
							label="Shift"
							placeholder="All shifts"
							options={shiftOptions}
							value={draftFilters.shift}
							onChange={value => onDraftFilterChange('shift', value)}
							disabled={disabled}
							compactDisplay
							sx={dashboardFilterField}
						/>
						<FilterAutocomplete
							label="Customer"
							placeholder="All customers"
							options={projectOptions}
							value={draftFilters.projects}
							onChange={value => onDraftFilterChange('projects', value)}
							disabled={disabled}
							compactDisplay
							sx={dashboardFilterField}
						/>
						<FilterAutocomplete
							label="Variant"
							placeholder={variantPlaceholder}
							options={variantOptions}
							value={draftFilters.customerVariantId}
							onChange={value => onDraftFilterChange('customerVariantId', value)}
							disabled={disabled || variantDisabled}
							compactDisplay
							sx={dashboardFilterField}
						/>
						<FilterAutocomplete
							label="SAP Product"
							placeholder="All SAP products"
							options={sapProductOptions}
							value={draftFilters.sapReferenceNumber}
							onChange={value => onDraftFilterChange('sapReferenceNumber', value)}
							disabled={disabled}
							compactDisplay
							sx={dashboardFilterField}
						/>
					</Box>

					{/* Action row: Reset/Apply right-aligned on the next line */}
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
								'&:hover': {
									borderColor: 'text.secondary',
									backgroundColor: hairlineHover
								}
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
							aria-label="Apply dashboard filters"
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
				</Box>
			</form>
			</Collapse>
		</Box>
	);
};
