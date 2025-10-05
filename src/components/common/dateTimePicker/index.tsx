import React from 'react';
import { DateTimePicker as MUIDateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { DateOrTimeView } from '@mui/x-date-pickers';

interface ReusableDateTimePickerProps {
	label: string;
	value: Date | null;
	name: string;
	onChange: (newValue: Date | null) => void;
	maxDateTime: Date | undefined;
	minDateTime: Date | undefined;
	views: readonly DateOrTimeView[] | undefined;
	format?: string;
}

const DateTimePicker: React.FC<ReusableDateTimePickerProps> = ({
	label,
	value,
	name,
	onChange,
	maxDateTime,
	minDateTime,
	views,
	format
}) => {
	return (
		<MUIDateTimePicker
			name={name}
			label={label}
			value={value}
			onChange={onChange}
			maxDateTime={maxDateTime}
			minDateTime={minDateTime}
			views={views}
			format={format}
		/>
	);
};

export default DateTimePicker;
