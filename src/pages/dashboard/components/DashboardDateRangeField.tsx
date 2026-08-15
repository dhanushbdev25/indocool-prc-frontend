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
import { PRESET_OPTIONS, type DateRangePreset } from '../hooks/useDashboardDateRange';

interface DashboardDateRangeFieldProps {
	preset: DateRangePreset;
	presetLabel: string;
	displayLabel: string;
	customFrom: string | null;
	customTo: string | null;
	onPresetChange: (preset: DateRangePreset) => void;
	onCustomRangeChange: (from: string | null, to: string | null) => void;
	disabled?: boolean;
	/** Floating field label (defaults to "Date Range"). */
	fieldLabel?: string;
}

const toDayjs = (iso: string | null): Dayjs | null => {
	if (!iso) return null;
	const d = dayjs(iso);
	return d.isValid() ? d : null;
};

const toIsoDate = (d: Dayjs | null): string | null => (d && d.isValid() ? d.format('YYYY-MM-DD') : null);

/**
 * Compact "Date Range" control sized to sit inline with FilterAutocomplete fields (40px tall, 10px radius).
 * Click → Popover with preset list. If "Custom range" is selected, From/To date pickers appear in-place.
 */
export const DashboardDateRangeField = ({
	preset,
	presetLabel,
	displayLabel,
	customFrom,
	customTo,
	onPresetChange,
	onCustomRangeChange,
	disabled = false,
	fieldLabel = 'Date Range'
}: DashboardDateRangeFieldProps) => {
	const theme = useTheme();
	const anchorRef = useRef<HTMLButtonElement>(null);
	const [open, setOpen] = useState(false);

	const draftFrom = toDayjs(customFrom);
	const draftTo = toDayjs(customTo);
	const isCustom = preset === 'custom';

	const handleClose = () => setOpen(false);

	const handlePresetSelect = (id: DateRangePreset) => {
		onPresetChange(id);
		if (id !== 'custom') handleClose();
	};

	const valueLabel = isCustom ? (customFrom && customTo ? displayLabel : 'Pick dates…') : presetLabel;

	return (
		<>
			<Box sx={{ position: 'relative', width: '100%' }}>
				{/* Floating label, mimicking MUI outlined input */}
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
					{fieldLabel}
				</Typography>

				<ButtonBase
					ref={anchorRef}
					onClick={() => setOpen(o => !o)}
					disabled={disabled}
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
						'&:hover': {
							borderColor: alpha(theme.palette.grey[500], 0.35)
						},
						'&.Mui-disabled': { opacity: 0.55 }
					}}
				>
					<Stack
						direction="row"
						alignItems="center"
						spacing={1}
						sx={{ width: '100%', minWidth: 0 }}
					>
						<CalendarMonth sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
						<Tooltip
							title={valueLabel}
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
									color: customFrom || !isCustom ? 'text.primary' : 'text.secondary',
									overflow: 'hidden',
									textOverflow: 'ellipsis'
								}}
							>
								{valueLabel}
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
					{PRESET_OPTIONS.map(option => {
						const selected = preset === option.id;
						return (
							<ListItemButton
								key={option.id}
								selected={selected}
								onClick={() => handlePresetSelect(option.id)}
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
									primary={option.label}
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
							label="Start date"
							value={draftFrom}
							onChange={d => onCustomRangeChange(toIsoDate(d), customTo)}
							slotProps={{ textField: { size: 'small', fullWidth: true } }}
							format={DATE_PICKER_FORMAT}
							maxDate={draftTo ?? undefined}
						/>
						<DatePicker
							label="End date"
							value={draftTo}
							onChange={d => onCustomRangeChange(customFrom, toIsoDate(d))}
							slotProps={{ textField: { size: 'small', fullWidth: true } }}
							format={DATE_PICKER_FORMAT}
							minDate={draftFrom ?? undefined}
						/>
					</Box>
				) : null}
			</Popover>
		</>
	);
};
