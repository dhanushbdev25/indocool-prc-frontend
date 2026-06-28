import { Autocomplete, TextField } from '@mui/material';
import { useMemo } from 'react';
import type { FilterComboOption } from '../../../components/masters/filters/FilterAutocomplete';
import { dashboardFilterField } from '../../dashboard/constants/dashboardTokens';

interface DpmoSingleProjectFieldProps {
	value: string;
	onChange: (next: string) => void;
	options: FilterComboOption[];
	disabled?: boolean;
}

export const DpmoSingleProjectField = ({
	value,
	onChange,
	options,
	disabled
}: DpmoSingleProjectFieldProps) => {
	const selected = useMemo(() => options.find(o => o.value === value) ?? null, [options, value]);
	return (
		<Autocomplete
			size="small"
			disabled={disabled}
			options={options}
			value={selected}
			onChange={(_e, next) => onChange(next?.value ?? '')}
			getOptionLabel={option => option.label}
			isOptionEqualToValue={(option, sel) => option.value === sel.value}
			renderInput={params => (
				<TextField {...params} label="Project" placeholder="Select project" size="small" />
			)}
			sx={dashboardFilterField}
			noOptionsText="No projects"
		/>
	);
};
