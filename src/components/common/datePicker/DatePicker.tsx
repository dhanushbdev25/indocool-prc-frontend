import React from 'react';
import { DatePicker as MUIDatePicker } from '@mui/x-date-pickers';

export type DatePickerPropsType = {
	onChange?: (date: any) => void;
	onBlur?: React.FocusEventHandler<HTMLInputElement>;
	name?: string;
	label?: string;
	defaultValue?: any;
	disabled?: boolean;
	value?: any;
	fullWidth?: boolean;
	views?: any;
	slotProps?: any;
	size?: 'small' | 'medium';
	format?: string;
	minDate?: any;
	maxDate?: any;
};

const DatePicker: React.FC<DatePickerPropsType> = ({
	fullWidth = false,
	size = 'small',
	format = 'DD/MM/YYYY',
	minDate,
	maxDate,
	onBlur,
	slotProps,
	...datePickerProps
}) => {
	const datePickerStyle: React.CSSProperties = fullWidth ? { width: '100%' } : {};

	return (
		<MUIDatePicker
			{...datePickerProps}
			minDate={minDate}
			maxDate={maxDate}
			sx={{ ...datePickerStyle }}
			format={format}
			slotProps={{
				...slotProps,
				textField: {
					...slotProps?.textField,
					size,
					style: { width: fullWidth ? '100%' : 160 },
					onBlur
				}
			}}
		/>
	);
};

export default DatePicker;
