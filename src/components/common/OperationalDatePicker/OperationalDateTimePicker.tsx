import { DateTimePicker, type DateTimePickerProps } from '@mui/x-date-pickers/DateTimePicker';
import { getTodayMinDate } from '../../../utils/datePickerConstraints';
import { DATETIME_PICKER_FORMAT } from '../../../utils/dateConfig';

type OperationalDateTimePickerProps = Omit<DateTimePickerProps, 'minDate' | 'format' | 'timezone'>;

export default function OperationalDateTimePicker(props: OperationalDateTimePickerProps) {
	return (
		<DateTimePicker
			{...props}
			minDate={getTodayMinDate()}
			format={DATETIME_PICKER_FORMAT}
			timezone="default"
		/>
	);
}
