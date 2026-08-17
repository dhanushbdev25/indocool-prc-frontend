import {
	Autocomplete,
	Box,
	Chip,
	TextField,
	Tooltip,
	Typography,
	createFilterOptions,
	type SxProps,
	type Theme
} from '@mui/material';
import { useMemo } from 'react';

export interface FilterComboOption {
	label: string;
	value: string;
}

interface FilterAutocompleteProps {
	label: string;
	placeholder?: string;
	options: string[] | FilterComboOption[];
	value: string[];
	onChange: (next: string[]) => void;
	disabled?: boolean;
	/** Dashboard-style single-line summary instead of stacked chips. */
	compactDisplay?: boolean;
	sx?: SxProps<Theme>;
}

const COMPACT_SUMMARY_MAX_CHARS = 44;

/**
 * MUI's Autocomplete listbox is not virtualised — it renders every matching option into the DOM.
 * Some combos are very large (the order-id list is ~29k values), which locks up the browser when
 * the dropdown opens. Capping the rendered matches keeps it responsive; the user types to narrow.
 */
const RENDERED_OPTIONS_LIMIT = 100;

const limitRenderedOptions = createFilterOptions<FilterComboOption>({
	limit: RENDERED_OPTIONS_LIMIT,
	stringify: option => option.label
});

const formatCompactSummary = (labels: string[]): { display: string; full: string; truncated: boolean } => {
	if (labels.length === 0) return { display: '', full: '', truncated: false };

	const full = labels.join(', ');
	if (full.length <= COMPACT_SUMMARY_MAX_CHARS) {
		return { display: full, full, truncated: false };
	}

	return {
		display: `${full.slice(0, COMPACT_SUMMARY_MAX_CHARS)}...`,
		full,
		truncated: true
	};
};

const normalizeOptions = (options: string[] | FilterComboOption[]): FilterComboOption[] => {
	if (options.length === 0) return [];
	if (typeof options[0] === 'string') {
		return (options as string[]).map(option => ({ label: option, value: option }));
	}
	return options as FilterComboOption[];
};

const FilterAutocomplete = ({
	label,
	placeholder,
	options,
	value,
	onChange,
	disabled,
	compactDisplay = false,
	sx
}: FilterAutocompleteProps) => {
	const normalizedOptions = useMemo(
		() => [...normalizeOptions(options)].sort((a, b) => a.label.localeCompare(b.label)),
		[options]
	);

	const selectedOptions = useMemo(
		() => normalizedOptions.filter(option => value.includes(option.value)),
		[normalizedOptions, value]
	);

	const selectedLabels = useMemo(() => selectedOptions.map(option => option.label), [selectedOptions]);

	return (
		<Autocomplete
			multiple
			disableCloseOnSelect
			filterOptions={limitRenderedOptions}
			size="small"
			options={normalizedOptions}
			value={selectedOptions}
			onChange={(_event, next) => onChange(next.map(option => option.value))}
			getOptionLabel={option => option.label}
			isOptionEqualToValue={(option, selected) => option.value === selected.value}
			disabled={disabled}
			renderTags={(values, getTagProps) => {
				if (!compactDisplay) {
					return values.map((option, index) => {
						const tagProps = getTagProps({ index });
						return (
							<Chip
								{...tagProps}
								key={option.value}
								label={option.label}
								size="small"
								sx={{ borderRadius: 1, fontWeight: 500 }}
							/>
						);
					});
				}

				if (selectedLabels.length === 0) return null;

				const { display, full } = formatCompactSummary(selectedLabels);

				const summaryNode = (
					<Typography
						noWrap
						sx={{
							fontSize: '0.8125rem',
							fontWeight: 500,
							color: 'text.primary',
							lineHeight: 1.2,
							maxWidth: '100%',
							minWidth: 0,
							overflow: 'hidden',
							textOverflow: 'ellipsis'
						}}
					>
						{display}
					</Typography>
				);

				// Always wrap in Tooltip so the full list is revealed on hover, even when
				// the visible text is clipped by a narrow container (not just the 44-char cap).
				const tooltipTitle = selectedLabels.length > 1 ? selectedLabels.join('\n') : full;
				return (
					<Tooltip
						key="compact-summary"
						title={tooltipTitle}
						placement="top"
						arrow
						enterDelay={200}
						slotProps={{
							tooltip: {
								sx: { maxWidth: 360, fontSize: '0.75rem', lineHeight: 1.45, whiteSpace: 'pre-line' }
							}
						}}
					>
						<Box
							component="span"
							sx={{ flex: 1, display: 'inline-flex', maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}
						>
							{summaryNode}
						</Box>
					</Tooltip>
				);
			}}
			renderInput={params => (
				<TextField
					{...params}
					label={label}
					placeholder={value.length === 0 ? (placeholder ?? `Select ${label.toLowerCase()}`) : ''}
					size="small"
				/>
			)}
			sx={[
				{
					'& .MuiOutlinedInput-root': {
						borderRadius: 1.5,
						...(compactDisplay
							? {
									py: 0,
									alignItems: 'center'
								}
							: { py: 0.5 })
					}
				},
				...(Array.isArray(sx) ? sx : sx ? [sx] : [])
			]}
			ChipProps={{ size: 'small' }}
			noOptionsText="No matches"
		/>
	);
};

export default FilterAutocomplete;
