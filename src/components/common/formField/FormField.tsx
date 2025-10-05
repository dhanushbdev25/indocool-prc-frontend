import {
	TextField,
	Grid,
	MenuItem,
	RadioGroup,
	FormControlLabel,
	Radio,
	FormLabel,
	Button,
	Autocomplete
} from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import DatePicker from '../datePicker/DatePicker';
import { size } from 'zod';

const FormField = ({
	type,
	name,
	label,
	required,
	disabled,
	options = [],
	placeholder,
	grid = 6,
	showIf,
	onChange
}: any) => {
	const { control, watch } = useFormContext();

	if (showIf && !showIf(watch)) {
		return null;
	}

	return (
		<Grid item xs={grid}>
			<Controller
				name={name}
				control={control}
				rules={{ required: required ? `${label} is required` : false }}
				render={({ field, fieldState }) => {
					const error = fieldState.error;

					const handleChange = (value: any) => {
						field.onChange(value);
						if (onChange) {
							onChange(value);
						}
					};

					switch (type) {
						case 'text':
							return (
								<TextField
									{...field}
									label={label}
									fullWidth
									required={required}
									placeholder={placeholder}
									error={!!error}
									helperText={error?.message}
									onChange={e => handleChange(e.target.value)}
									disabled={disabled}
								/>
							);
						case 'textarea':
							return (
								<TextField
									{...field}
									label={label}
									fullWidth
									multiline
									rows={4}
									error={!!error}
									helperText={error?.message}
									onChange={e => handleChange(e.target.value)}
								/>
							);
						case 'dropdown':
							return (
								<TextField
									{...field}
									label={label}
									select
									fullWidth
									required={required}
									error={!!error}
									helperText={error?.message}
									onChange={e => handleChange(e.target.value)}
									disabled={disabled}
								>
									{options.map((opt: any) => (
										<MenuItem key={opt.value} value={opt.value}>
											{opt.label}
										</MenuItem>
									))}
								</TextField>
							);
						case 'radio':
							return (
								<>
									<FormLabel error={!!error}>{label}</FormLabel>
									<RadioGroup row {...field} aria-label={label} onChange={e => handleChange(e.target.value)}>
										{options.map((opt: any) => (
											<FormControlLabel key={opt.value} value={opt.value} control={<Radio />} label={opt.label} />
										))}
									</RadioGroup>
									{error && (
										<p style={{ color: '#d32f2f', fontSize: '0.75rem', marginLeft: '14px' }}>{error.message}</p>
									)}
								</>
							);

						case 'autocomplete':
							return (
								<Autocomplete
									options={options}
									value={options.find((opt: any) => opt.value === field.value) || null}
									getOptionLabel={opt => (typeof opt === 'string' ? opt : opt.label || '')}
									onChange={(_, newValue) => handleChange(newValue ? newValue.value : '')}
									isOptionEqualToValue={(option, value) => (option.value || option) === (value.value || value)}
									renderInput={params => (
										<TextField
											{...params}
											label={label}
											required={required}
											error={!!error}
											helperText={error?.message}
											fullWidth
										/>
									)}
								/>
							);

						case 'multiselect':
							return (
								<Autocomplete
									multiple
									options={options}
									value={options.filter((opt: any) => (field.value || []).includes(opt.value))}
									getOptionLabel={opt => (typeof opt === 'string' ? opt : opt.label || '')}
									onChange={(_, newValues) => handleChange(newValues.map((v: any) => v.value))}
									isOptionEqualToValue={(option, value) => (option.value || option) === (value.value || value)}
									disabled={disabled}
									renderInput={params => (
										<TextField
											{...params}
											label={label}
											required={required}
											error={!!error}
											helperText={error?.message}
											fullWidth
										/>
									)}
								/>
							);
						case 'date':
							return (
								<DatePicker
									label={label}
									size="medium"
									fullWidth={true}
									value={field.value || null}
									onChange={newValue => handleChange(newValue)}
									slotProps={{
										textField: {
											required,
											error: !!error,
											helperText: error?.message,
											fullWidth: true
										}
									}}
									disabled
								/>
							);

						default:
							return <></>;
					}
				}}
			/>
		</Grid>
	);
};

export default FormField;
