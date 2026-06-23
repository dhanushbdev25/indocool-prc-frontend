import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { DATE_PICKER_FORMAT } from '../../../utils/dateConfig';
import type { DateRangeFilterValue, DateRangePresetOption } from './types';

interface FilterDateRangePresetProps {
	label: string;
	value: DateRangeFilterValue;
	presetId: string;
	presets: DateRangePresetOption[];
	customPresetId: string;
	onChange: (next: { value: DateRangeFilterValue; presetId: string }) => void;
}

const toDayjs = (iso: string | null): Dayjs | null => {
	if (!iso) return null;
	const d = dayjs(iso);
	return d.isValid() ? d : null;
};

const toIsoDate = (d: Dayjs | null): string | null => (d && d.isValid() ? d.format('YYYY-MM-DD') : null);

const FilterDateRangePreset = ({
	label,
	value,
	presetId,
	presets,
	customPresetId,
	onChange
}: FilterDateRangePresetProps) => {
	const from = toDayjs(value.from);
	const to = toDayjs(value.to);
	const isCustom = presetId === customPresetId;

	const handlePresetChange = (nextId: string) => {
		const preset = presets.find(p => p.id === nextId);
		if (!preset) return;
		if (preset.id === customPresetId) {
			onChange({ value: { from: value.from, to: value.to }, presetId: preset.id });
			return;
		}
		const resolved = preset.resolve();
		onChange({ value: { from: resolved.from || null, to: resolved.to || null }, presetId: preset.id });
	};

	return (
		<Box>
			<Typography
				variant="caption"
				sx={{ display: 'block', color: 'text.secondary', fontWeight: 600, mb: 0.75, letterSpacing: '0.02em' }}
			>
				{label}
			</Typography>
			<TextField
				select
				size="small"
				fullWidth
				value={presetId}
				onChange={e => handlePresetChange(e.target.value)}
				sx={{
					mb: isCustom ? 1.25 : 0,
					'& .MuiOutlinedInput-root': { borderRadius: 1.5 }
				}}
			>
				{presets.map(p => (
					<MenuItem key={p.id} value={p.id}>
						{p.label}
					</MenuItem>
				))}
			</TextField>
			{isCustom ? (
				<Stack direction="row" spacing={1.25} sx={{ '& .MuiFormControl-root': { flex: 1 } }}>
					<DatePicker
						value={from}
						onChange={d => onChange({ value: { from: toIsoDate(d), to: value.to }, presetId: customPresetId })}
						slotProps={{
							textField: { size: 'small', placeholder: 'From' },
							field: { clearable: true }
						}}
						format={DATE_PICKER_FORMAT}
						maxDate={to ?? undefined}
					/>
					<DatePicker
						value={to}
						onChange={d => onChange({ value: { from: value.from, to: toIsoDate(d) }, presetId: customPresetId })}
						slotProps={{
							textField: { size: 'small', placeholder: 'To' },
							field: { clearable: true }
						}}
						format={DATE_PICKER_FORMAT}
						minDate={from ?? undefined}
					/>
				</Stack>
			) : null}
		</Box>
	);
};

export default FilterDateRangePreset;
