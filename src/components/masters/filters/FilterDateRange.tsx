import { Box, Stack, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { DATE_PICKER_FORMAT } from '../../../utils/dateConfig';
import type { DateRangeFilterValue } from './types';

interface FilterDateRangeProps {
	label: string;
	value: DateRangeFilterValue;
	onChange: (next: DateRangeFilterValue) => void;
}

const toDayjs = (iso: string | null): Dayjs | null => {
	if (!iso) return null;
	const d = dayjs(iso);
	return d.isValid() ? d : null;
};

const toIso = (d: Dayjs | null): string | null => (d && d.isValid() ? d.toISOString() : null);

const FilterDateRange = ({ label, value, onChange }: FilterDateRangeProps) => {
	const from = toDayjs(value.from);
	const to = toDayjs(value.to);

	return (
		<Box>
			<Typography
				variant="caption"
				sx={{ display: 'block', color: 'text.secondary', fontWeight: 600, mb: 0.75, letterSpacing: '0.02em' }}
			>
				{label}
			</Typography>
			<Stack direction="row" spacing={1.25} sx={{ '& .MuiFormControl-root': { flex: 1 } }}>
				<DatePicker
					value={from}
					onChange={d => onChange({ from: toIso(d), to: value.to })}
					slotProps={{
						textField: { size: 'small', placeholder: 'From' },
						field: { clearable: true }
					}}
					format={DATE_PICKER_FORMAT}
					maxDate={to ?? undefined}
				/>
				<DatePicker
					value={to}
					onChange={d => onChange({ from: value.from, to: toIso(d) })}
					slotProps={{
						textField: { size: 'small', placeholder: 'To' },
						field: { clearable: true }
					}}
					format={DATE_PICKER_FORMAT}
					minDate={from ?? undefined}
				/>
			</Stack>
		</Box>
	);
};

export default FilterDateRange;
