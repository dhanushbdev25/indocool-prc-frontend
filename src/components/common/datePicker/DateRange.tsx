import { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import { LocalizationProvider, DatePicker as MUIDatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const DateRangePickerComponent = ({ handleChange }: any) => {
	const [startDate, setStartDate] = useState<any>(null);
	const [endDate, setEndDate] = useState<any>(null);

	useEffect(() => {
		handleChange(startDate, endDate);
	}, [startDate, endDate]);

	const handleDateChange = (date: any, picker: 'start' | 'end') => {
		if (picker === 'start') {
			setStartDate(date);
		} else if (picker === 'end') {
			setEndDate(date);
		}
	};

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'en-gb'}>
			<Grid container direction="row" alignItems="center" justifyContent={'center'} spacing={1}>
				<Grid item>
					<MUIDatePicker
						value={startDate}
						format="DD/MM/YYYY"
						views={['year', 'month', 'day']}
						slotProps={{
							textField: {
								placeholder: 'From Date',
								size: 'small',
								style: { width: 160 }
							}
						}}
						onChange={newValue => handleDateChange(newValue, 'start')}
					/>
				</Grid>

				<Grid item> -- </Grid>
				<Grid item>
					<MUIDatePicker
						value={endDate}
						format="DD/MM/YYYY"
						views={['year', 'month', 'day']}
						slotProps={{
							textField: {
								placeholder: 'To Date',
								size: 'small',
								style: { width: 160 }
							}
						}}
						onChange={newValue => handleDateChange(newValue, 'end')}
					/>
				</Grid>
			</Grid>
		</LocalizationProvider>
	);
};

export default DateRangePickerComponent;
