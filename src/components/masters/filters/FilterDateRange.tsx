import { useRef, useState } from 'react';
import { Box, ButtonBase, Popover, Stack, Tooltip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { CalendarMonth, KeyboardArrowDown } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { DATE_PICKER_FORMAT } from '../../../utils/dateConfig';
import { toIsoDateOnly } from './filterHelpers';
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


const formatChip = (iso: string | null): string => {
	const d = toDayjs(iso);
	return d ? d.format('DD MMM YYYY') : '';
};

const buildDisplayLabel = (value: DateRangeFilterValue): string => {
	const from = formatChip(value.from);
	const to = formatChip(value.to);
	if (from && to) return `${from} – ${to}`;
	if (from) return `from ${from}`;
	if (to) return `until ${to}`;
	return '';
};

/**
 * Compact date-range control sized to sit inline with the other filter dropdowns
 * (40px tall, 10px radius). Click → Popover with From / To DatePicker inputs.
 */
const FilterDateRange = ({ label, value, onChange }: FilterDateRangeProps) => {
	const theme = useTheme();
	const anchorRef = useRef<HTMLButtonElement>(null);
	const [open, setOpen] = useState(false);

	const from = toDayjs(value.from);
	const to = toDayjs(value.to);
	const hasValue = Boolean(from || to);
	const display = buildDisplayLabel(value);
	const triggerLabel = hasValue ? display : 'Pick range';

	const handleClose = () => setOpen(false);

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
							title={hasValue ? display : ''}
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
									color: hasValue ? 'text.primary' : 'text.secondary',
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
							width: 320,
							maxWidth: 'calc(100vw - 32px)'
						}
					}
				}}
			>
				<Box sx={{ px: 1.5, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
					<Typography
						variant="caption"
						sx={{
							color: 'text.secondary',
							fontWeight: 600,
							letterSpacing: '0.06em',
							textTransform: 'uppercase'
						}}
					>
						{label}
					</Typography>
					<DatePicker
						label="From"
						value={from}
						onChange={d => onChange({ from: toIsoDateOnly(d), to: value.to })}
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
						onChange={d => onChange({ from: value.from, to: toIsoDateOnly(d) })}
						slotProps={{
							textField: { size: 'small', fullWidth: true },
							field: { clearable: true }
						}}
						format={DATE_PICKER_FORMAT}
						minDate={from ?? undefined}
					/>
				</Box>
			</Popover>
		</>
	);
};

export default FilterDateRange;
