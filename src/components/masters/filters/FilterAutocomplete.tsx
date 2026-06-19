import {
	Autocomplete,
	Box,
	Chip,
	TextField,
	Tooltip,
	Typography,
	type AutocompleteProps,
	type SxProps,
	type Theme
} from '@mui/material';
import { useMemo } from 'react';

interface FilterAutocompleteProps {
	label: string;
	placeholder?: string;
	options: string[];
	value: string[];
	onChange: (next: string[]) => void;
	disabled?: boolean;
	/** Dashboard-style single-line summary instead of stacked chips. */
	compactDisplay?: boolean;
	sx?: SxProps<Theme>;
}

type MuiProps = AutocompleteProps<string, true, false, false>;

const COMPACT_SUMMARY_MAX_CHARS = 44;

const formatCompactSummary = (values: string[]): { display: string; full: string; truncated: boolean } => {
	if (values.length === 0) return { display: '', full: '', truncated: false };

	const full = values.join(', ');
	if (full.length <= COMPACT_SUMMARY_MAX_CHARS) {
		return { display: full, full, truncated: false };
	}

	return {
		display: `${full.slice(0, COMPACT_SUMMARY_MAX_CHARS)}...`,
		full,
		truncated: true
	};
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
	const sortedOptions = useMemo(() => [...options].sort((a, b) => a.localeCompare(b)), [options]);

	const handleChange: MuiProps['onChange'] = (_event, next) => {
		onChange(next);
	};

	return (
		<Autocomplete
			multiple
			disableCloseOnSelect
			size="small"
			options={sortedOptions}
			value={value}
			onChange={handleChange}
			disabled={disabled}
			renderTags={(values, getTagProps) => {
				if (!compactDisplay) {
					return values.map((option, index) => {
						const tagProps = getTagProps({ index });
						return (
							<Chip
								{...tagProps}
								key={option}
								label={option}
								size="small"
								sx={{ borderRadius: 1, fontWeight: 500 }}
							/>
						);
					});
				}

				if (values.length === 0) return null;

				const { display, full, truncated } = formatCompactSummary(values);

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

				if (!truncated) return <Box key="compact-summary">{summaryNode}</Box>;

				return (
					<Tooltip
						key="compact-summary"
						title={full}
						placement="bottom"
						arrow
						enterDelay={200}
						slotProps={{
							tooltip: {
								sx: { maxWidth: 360, fontSize: '0.75rem', lineHeight: 1.45 }
							}
						}}
					>
						<Box component="span" sx={{ display: 'inline-flex', maxWidth: '100%', minWidth: 0 }}>
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
