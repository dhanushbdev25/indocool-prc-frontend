import React from 'react';
import { FormControl, FormHelperText, Typography, Select, MenuItem } from '@mui/material';

type DropDownProps = {
	label: string;
	name?: string;
	value?: any;
	onChange?: any;
	list: { value: any; label: string }[];
	styles?: React.CSSProperties;
	defaultValue?: string;
	fullWidth?: boolean;
	onBlur?: any;
	error?: any;
	helperText?: any;
	onSkuSelect?: any;
	isFormControlled?: boolean;
	removeBorder?: boolean;
	id?: string;
	field?: any;
	disabled?: boolean;
};

const DropDown: React.FC<DropDownProps> = ({
	list,
	fullWidth = true,
	styles,
	helperText,
	removeBorder = false,
	label,
	id,
	error,
	field,
	disabled,
	onChange, // Handles non-controller onChange
	isFormControlled = true,
	...muiProps
}) => {
	const handleChange = (event: any) => {
		const selectedValue = event.target.value;
		const selectedItem = list.find(item => item.value === selectedValue);

		const formattedEvent = {
			target: {
				name: event.target.name,
				value: selectedValue,
				label: selectedItem ? selectedItem.label : ''
			}
		};

		if (field?.onChange) {
			field.onChange(selectedValue); // React Hook Form's onChange
		}
		if (onChange) {
			onChange(formattedEvent); // Non-controller onChange
		}
	};

	return (
		<FormControl fullWidth error={error}>
			{label && (
				<Typography
					component="label"
					htmlFor={id}
					sx={{
						fontWeight: 600,
						color: '#626F86',
						display: 'block'
					}}
				>
					{label}
				</Typography>
			)}
			<Select
				{...field} // Spread field props for Controller support
				id={id}
				fullWidth
				label={undefined}
				disabled={disabled}
				onChange={handleChange} // Unified onChange handler
				value={field?.value ?? ''} // Ensures it's controlled
				size="small"
				MenuProps={{
					PaperProps: {
						style: {
							maxHeight: 200,
							overflowY: 'auto'
						}
					}
				}}
				sx={{
					...styles,
					backgroundColor: 'white',
					'& .MuiOutlinedInput-notchedOutline': {
						border: removeBorder ? 'none' : undefined
					}
				}}
				{...muiProps}
			>
				{list?.map(item => (
					<MenuItem key={item.value} value={item.value}>
						{item.label}
					</MenuItem>
				))}
			</Select>
			{error && <FormHelperText>{helperText}</FormHelperText>}
		</FormControl>
	);
};

export default DropDown;
