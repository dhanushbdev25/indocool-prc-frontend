import { useRef, useState } from 'react';
import {
	Box,
	ButtonBase,
	List,
	ListItemButton,
	ListItemText,
	Popover,
	Stack,
	Tooltip,
	Typography
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { CalendarMonth, Check, KeyboardArrowDown } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { DATE_PICKER_FORMAT } from '../../../utils/dateConfig';
import { toIsoDateOnly } from './filterHelpers';
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

const formatChip = (iso: string | null): string => {
	const d = toDayjs(iso);
	return d ? d.format('DD MMM YYYY') : '';
};

const FilterDateRangePreset = ({
	label,
	value,
	presetId,
	presets,
	customPresetId,
	onChange
}: FilterDateRangePresetProps) => {
	const theme = useTheme();
	const anchorRef = useRef<HTMLButtonElement>(null);
	const [open, setOpen] = useState(false);

	const from = toDayjs(value.from);
	const to = toDayjs(value.to);
	const isCustom = presetId === customPresetId;
	const selectedPreset = presets.find(p => p.id === presetId);

	const handleClose = () => setOpen(false);

	const handlePresetSelect = (id: string) => {
		const preset = presets.find(p => p.id === id);
		if (!preset) return;
		if (preset.id === customPresetId) {
			onChange({ value: { from: value.from, to: value.to }, presetId: preset.id });
			return;
		}
		const resolved = preset.resolve();
		onChange({ value: { from: resolved.from || null, to: resolved.to || null }, presetId: preset.id });
		handleClose();
	};

	const customSummary = (() => {
		const f = formatChip(value.from);
		const t = formatChip(value.to);
		if (f && t) return `${f} – ${t}`;
		if (f) return `from ${f}`;
		if (t) return `until ${t}`;
		return 'Pick range';
	})();

	const triggerLabel = isCustom ? customSummary : (selectedPreset?.label ?? 'Pick range');
	const triggerIsPlaceholder = isCustom && triggerLabel === 'Pick range';

	return (
		<>
			<Box sx={{ position: 'relative', width: '100%' }}>
				<Typography
					component="label"
					sx={{
						position: 'absolute',
						top: -7,
						left: 10,
						zIndex: 1,
						px: 0.5,
						fontSize: '0.6875rem',
						fontWeight: 600,
						letterSpacing: '0.02em',
						color: open ? 'primary.main' : 'text.secondary',
						backgroundColor: theme.palette.background.paper,
						pointerEvents: 'none'
					}}
				>
					{label}
				</Typography>

				<ButtonBase
					ref={anchorRef}
					onClick={() => setOpen(o => !o)}
					aria-haspopup="dialog"
					aria-expanded={open}
					sx={{
						width: '100%',
						height: 40,
						borderRadius: '10px',
						border: 1,
						borderColor: open
							? alpha(theme.palette.primary.main, 0.35)
							: alpha(theme.palette.divider, 0.9),
						backgroundColor: theme.palette.background.paper,
						boxShadow: open
							? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.08)}, 0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`
							: `0 1px 2px ${alpha(theme.palette.common.black, 0.04)}`,
						px: 1.25,
						transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
						'&:hover': { borderColor: alpha(theme.palette.grey[500], 0.35) }
					}}
				>
					<Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%', minWidth: 0 }}>
						<CalendarMonth sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
						<Tooltip
							title={triggerIsPlaceholder ? '' : triggerLabel}
							placement="top"
							arrow
							enterDelay={300}
							slotProps={{
								tooltip: { sx: { maxWidth: 360, fontSize: '0.75rem', lineHeight: 1.45 } }
							}}
						>
							<Typography
								noWrap
								component="span"
								sx={{
									flex: 1,
									minWidth: 0,
									textAlign: 'left',
									fontSize: '0.8125rem',
									fontWeight: 500,
									color: triggerIsPlaceholder ? 'text.secondary' : 'text.primary',
									overflow: 'hidden',
									textOverflow: 'ellipsis'
								}}
							>
								{triggerLabel}
							</Typography>
						</Tooltip>
						<KeyboardArrowDown
							sx={{
								fontSize: 18,
								color: 'text.secondary',
								flexShrink: 0,
								transition: 'transform 0.15s ease',
								transform: open ? 'rotate(180deg)' : 'rotate(0)'
							}}
						/>
					</Stack>
				</ButtonBase>
			</Box>

			<Popover
				open={open}
				anchorEl={anchorRef.current}
				onClose={handleClose}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				transformOrigin={{ vertical: 'top', horizontal: 'left' }}
				slotProps={{
					paper: {
						elevation: 0,
						sx: {
							mt: 0.75,
							borderRadius: '12px',
							border: `1px solid ${theme.palette.divider}`,
							boxShadow: theme.shadows[8],
							overflow: 'visible',
							width: isCustom ? 320 : 240,
							maxWidth: 'calc(100vw - 32px)'
						}
					}
				}}
			>
				<List dense sx={{ py: 0.75 }}>
					{presets.map(p => {
						const selected = presetId === p.id;
						return (
							<ListItemButton
								key={p.id}
								selected={selected}
								onClick={() => handlePresetSelect(p.id)}
								sx={{
									mx: 0.75,
									my: 0.25,
									borderRadius: '8px',
									py: 0.75,
									'&.Mui-selected': {
										backgroundColor: alpha(theme.palette.primary.main, 0.08),
										'&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.12) }
									}
								}}
							>
								<ListItemText
									primary={p.label}
									primaryTypographyProps={{
										fontSize: '0.8125rem',
										fontWeight: selected ? 600 : 500,
										color: 'text.primary'
									}}
								/>
								{selected ? <Check sx={{ fontSize: 16, color: 'primary.main' }} /> : null}
							</ListItemButton>
						);
					})}
				</List>

				{isCustom ? (
					<Box
						sx={{
							px: 1.5,
							py: 1.5,
							borderTop: 1,
							borderTopColor: 'divider',
							display: 'flex',
							flexDirection: 'column',
							gap: 1.25
						}}
					>
						<Typography
							variant="caption"
							sx={{
								color: 'text.secondary',
								fontWeight: 600,
								letterSpacing: '0.06em',
								textTransform: 'uppercase'
							}}
						>
							Pick range
						</Typography>
						<DatePicker
							label="From"
							value={from}
							onChange={d => onChange({ value: { from: toIsoDateOnly(d), to: value.to }, presetId: customPresetId })}
							slotProps={{
								textField: { size: 'small', fullWidth: true },
								field: { clearable: true }
							}}
							format={DATE_PICKER_FORMAT}
							maxDate={to ?? undefined}
						/>
						<DatePicker
							label="To"
							value={to}
							onChange={d => onChange({ value: { from: value.from, to: toIsoDateOnly(d) }, presetId: customPresetId })}
							slotProps={{
								textField: { size: 'small', fullWidth: true },
								field: { clearable: true }
							}}
							format={DATE_PICKER_FORMAT}
							minDate={from ?? undefined}
						/>
					</Box>
				) : null}
			</Popover>
		</>
	);
};

export default FilterDateRangePreset;
