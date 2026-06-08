import { Autocomplete, Chip, TextField, type AutocompleteProps } from '@mui/material';
import { useMemo } from 'react';

interface FilterAutocompleteProps {
	label: string;
	placeholder?: string;
	options: string[];
	value: string[];
	onChange: (next: string[]) => void;
	disabled?: boolean;
}

type MuiProps = AutocompleteProps<string, true, false, false>;

const FilterAutocomplete = ({ label, placeholder, options, value, onChange, disabled }: FilterAutocompleteProps) => {
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
			renderTags={(values, getTagProps) =>
				values.map((option, index) => {
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
				})
			}
			renderInput={params => (
				<TextField
					{...params}
					label={label}
					placeholder={value.length === 0 ? (placeholder ?? `Select ${label.toLowerCase()}`) : ''}
					size="small"
				/>
			)}
			sx={{
				'& .MuiOutlinedInput-root': {
					borderRadius: 1.5,
					py: 0.5
				}
			}}
			ChipProps={{ size: 'small' }}
			noOptionsText="No matches"
		/>
	);
};

export default FilterAutocomplete;
