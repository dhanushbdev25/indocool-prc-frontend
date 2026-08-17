import { Box, Button, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { DashboardDateRangeField } from '../../dashboard/components/DashboardDateRangeField';
import type { DateRangePreset } from '../../dashboard/hooks/useDashboardDateRange';
import FilterAutocomplete, { type FilterComboOption } from '../../../components/masters/filters/FilterAutocomplete';
import FilterDateRange from '../../../components/masters/filters/FilterDateRange';
import type { DateRangeFilterValue } from '../../../components/masters/filters/types';
import { dashboardFilterField } from '../../dashboard/constants/dashboardTokens';

const CONTROL_HEIGHT = 40;

export type ReportFilterKey =
	| 'plantCode'
	| 'customer'
	| 'customerVariantId'
	| 'sapReferenceNumber'
	| 'status'
	| 'orderId'
	| 'reservation'
	| 'prcSetId'
	| 'productionSetId';

export type ReportFilters = Record<ReportFilterKey, string[]>;

const FILTER_FIELDS: { key: ReportFilterKey; label: string }[] = [
	{ key: 'plantCode', label: 'Plant Code' },
	{ key: 'customer', label: 'Customer' },
	{ key: 'customerVariantId', label: 'Variant' },
	{ key: 'sapReferenceNumber', label: 'SAP Number' },
	{ key: 'status', label: 'Status' },
	{ key: 'orderId', label: 'Order No' },
	{ key: 'reservation', label: 'Reservation' },
	{ key: 'prcSetId', label: 'Prc Set Id' },
	{ key: 'productionSetId', label: 'Serial Number' }
];

interface ReportsFilterBarProps {
	preset: DateRangePreset | null;
	presetLabel: string;
	displayLabel: string;
	customFrom: string | null;
	customTo: string | null;
	onPresetChange: (preset: DateRangePreset) => void;
	onCustomRangeChange: (from: string | null, to: string | null) => void;
	/** SAP date range — optional filter, empty by default. */
	sapDateRange: DateRangeFilterValue;
	onSapDateRangeChange: (next: DateRangeFilterValue) => void;
	filters: ReportFilters;
	onFilterChange: (key: ReportFilterKey, values: string[]) => void;
	filterOptions: Record<ReportFilterKey, string[] | FilterComboOption[]>;
	optionsLoading?: Partial<Record<ReportFilterKey, boolean>>;
	optionsDisabled?: Partial<Record<ReportFilterKey, boolean>>;
	optionsPlaceholder?: Partial<Record<ReportFilterKey, string | undefined>>;
	onClearFilters: () => void;
	onGenerate: () => void;
	canGenerate: boolean;
	/** Shown when no usable date range is selected yet. */
	validationMessage?: string;
	isFetching: boolean;
	disabled?: boolean;
}

export const ReportsFilterBar = ({
	preset,
	presetLabel,
	displayLabel,
	customFrom,
	customTo,
	onPresetChange,
	onCustomRangeChange,
	sapDateRange,
	onSapDateRangeChange,
	filters,
	onFilterChange,
	filterOptions,
	optionsLoading,
	optionsDisabled,
	optionsPlaceholder,
	onClearFilters,
	onGenerate,
	canGenerate,
	validationMessage,
	isFetching,
	disabled
}: ReportsFilterBarProps) => {
	const theme = useTheme();
	const panelSx = {
		borderRadius: '12px',
		border: `1px solid ${theme.palette.divider}`,
		backgroundColor: theme.palette.background.paper,
		boxShadow:
			theme.palette.mode === 'dark'
				? 'none'
				: `0 1px 0 ${alpha(theme.palette.common.black, 0.04)}, 0 1px 3px ${alpha(theme.palette.common.black, 0.05)}`,
		mb: 3
	};

	const hasActiveFilters =
		FILTER_FIELDS.some(({ key }) => filters[key].length > 0) ||
		Boolean(sapDateRange.from || sapDateRange.to) ||
		preset !== null;

	return (
		<Box sx={panelSx}>
			<form
				role="search"
				aria-label="Reports filter"
				onSubmit={e => {
					e.preventDefault();
					if (canGenerate) onGenerate();
				}}
				style={{ display: 'block' }}
			>
				<Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.75, sm: 2 } }}>
					<Stack
						direction={{ xs: 'column', sm: 'row' }}
						spacing={{ xs: 1.25, sm: 1.5 }}
						alignItems={{ xs: 'stretch', sm: 'center' }}
					>
						<Box sx={{ flex: 1, minWidth: 0, maxWidth: { sm: 320 } }}>
							<DashboardDateRangeField
								preset={preset}
								presetLabel={presetLabel}
								displayLabel={displayLabel}
								customFrom={customFrom}
								customTo={customTo}
								onPresetChange={onPresetChange}
								onCustomRangeChange={onCustomRangeChange}
								disabled={disabled}
								fieldLabel="PRC Date"
							/>
						</Box>
						<Box sx={{ flex: 1, minWidth: 0, maxWidth: { sm: 320 } }}>
							<FilterDateRange label="SAP Date" value={sapDateRange} onChange={onSapDateRangeChange} />
						</Box>
						<Box sx={{ flex: 1 }} />
						{hasActiveFilters ? (
							<Button
								size="small"
								variant="text"
								color="inherit"
								onClick={onClearFilters}
								disabled={disabled}
								sx={{
									textTransform: 'none',
									fontWeight: 600,
									color: theme.palette.text.secondary,
									alignSelf: { xs: 'stretch', sm: 'center' }
								}}
							>
								Clear filters
							</Button>
						) : null}
						<Button
							type="submit"
							size="small"
							variant="contained"
							color="primary"
							onClick={onGenerate}
							disabled={!canGenerate}
							aria-label="Generate report"
							sx={{
								textTransform: 'none',
								fontWeight: 700,
								fontSize: '0.8125rem',
								height: CONTROL_HEIGHT,
								px: 2.5,
								borderRadius: '10px',
								boxShadow: 'none',
								alignSelf: { xs: 'stretch', sm: 'center' },
								'&:hover': { boxShadow: 'none' }
							}}
						>
							{isFetching ? 'Generating…' : 'Generate report'}
						</Button>
					</Stack>
					<Box
						sx={{
							mt: 1.5,
							display: 'grid',
							gap: { xs: 1.25, sm: 1.5 },
							gridTemplateColumns: {
								xs: '1fr',
								sm: 'repeat(2, minmax(0, 1fr))',
								md: 'repeat(4, minmax(0, 1fr))'
							}
						}}
					>
						{FILTER_FIELDS.map(({ key, label }) => (
							<FilterAutocomplete
								key={key}
								label={label}
								placeholder={optionsPlaceholder?.[key] ?? (optionsLoading?.[key] ? 'Loading…' : undefined)}
								options={filterOptions[key]}
								value={filters[key]}
								onChange={next => onFilterChange(key, next)}
								disabled={disabled || optionsDisabled?.[key]}
								compactDisplay
								sx={dashboardFilterField}
							/>
						))}
					</Box>
					{validationMessage ? (
						<Typography variant="caption" sx={{ display: 'block', mt: 1.25, color: 'text.secondary' }}>
							{validationMessage}
						</Typography>
					) : null}
				</Box>
			</form>
		</Box>
	);
};
