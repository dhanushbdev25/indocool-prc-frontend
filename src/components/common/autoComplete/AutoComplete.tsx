import { Autocomplete, AutocompleteProps, TextField } from '@mui/material';

interface ReusableAutocompleteProps extends AutocompleteProps<any, any, any, any> {
	id?: string;
	options: any;
	label?: string;
	handleAutoCompleteChange?: any;
	width?: number;
	required?: boolean;
	variant?: string;
	name?: string;
	error?: any;
	helperText?: any;
}

function AutoComplete({
	id = '0',
	options,
	label,
	handleAutoCompleteChange,
	width,
	value,
	...extraProps
}: Readonly<ReusableAutocompleteProps>) {
	return (
		<Autocomplete
			value={value}
			onChange={(event: any, newValue: string | null) => {
				event.preventDefault();
				handleAutoCompleteChange(newValue);
			}}
			disableCloseOnSelect={true}
			options={options}
			sx={{ width: width ?? '100%' }}
			{...extraProps}
			renderInput={params => <TextField {...params} label={label} fullWidth />}
		/>
	);
}

export default AutoComplete;
