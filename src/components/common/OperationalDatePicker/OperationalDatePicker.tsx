import { DatePicker, type DatePickerProps } from '@mui/x-date-pickers/DatePicker';
import { getTodayMinDate } from '../../../utils/datePickerConstraints';
import { DATE_PICKER_FORMAT } from '../../../utils/dateConfig';

type OperationalDatePickerProps = Omit<DatePickerProps, 'minDate' | 'format' | 'timezone'>;

export default function OperationalDatePicker(props: OperationalDatePickerProps) {
	return (
		<DatePicker
			{...props}
			minDate={getTodayMinDate()}
			format={DATE_PICKER_FORMAT}
			timezone="default"
		/>
	);
}
