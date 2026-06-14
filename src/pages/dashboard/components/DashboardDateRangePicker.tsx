import { useState } from 'react';
import {
	Box,
	Button,
	Divider,
	List,
	ListItemButton,
	ListItemText,
	Popover,
	Stack,
	Typography
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { CalendarMonth, Check, KeyboardArrowDown } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { dateRangeTriggerButton } from '../constants/dashboardTokens';
import { PRESET_OPTIONS, type DateRangePreset } from '../hooks/useDashboardDateRange';

interface DashboardDateRangePickerProps {
	preset: DateRangePreset;
	presetLabel: string;
	displayLabel: string;
	onPresetChange: (preset: DateRangePreset) => void;
	onCustomRangeChange: (from: string | null, to: string | null) => void;
	customFrom: string | null;
	customTo: string | null;
}

const toDayjs = (iso: string | null): Dayjs | null => {
	if (!iso) return null;
	const d = dayjs(iso);
	return d.isValid() ? d : null;
};

const toIsoDate = (d: Dayjs | null): string | null => (d && d.isValid() ? d.format('YYYY-MM-DD') : null);

export const DashboardDateRangePicker = ({
	preset,
	presetLabel,
	displayLabel,
	onPresetChange,
	onCustomRangeChange,
	customFrom,
	customTo
}: DashboardDateRangePickerProps) => {
	const theme = useTheme();
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const open = Boolean(anchorEl);

	const draftFrom = toDayjs(customFrom);
	const draftTo = toDayjs(customTo);
	const canApplyCustom = preset === 'custom' && draftFrom != null && draftTo != null;

	const handleClose = () => setAnchorEl(null);

	const handlePresetSelect = (id: DateRangePreset) => {
		onPresetChange(id);
		if (id !== 'custom') handleClose();
	};

	return (
		<>
			<Button
				variant="outlined"
				onClick={e => setAnchorEl(e.currentTarget)}
				startIcon={<CalendarMonth sx={{ fontSize: 18, color: 'text.secondary' }} />}
				endIcon={<KeyboardArrowDown sx={{ fontSize: 20, color: 'text.secondary' }} />}
				sx={dateRangeTriggerButton}
			>
				<Stack direction="row" spacing={1} alignItems="baseline" sx={{ textAlign: 'left' }}>
					<Typography component="span" sx={{ fontWeight: 600, fontSize: '0.8125rem', color: 'text.primary' }}>
						{preset === 'custom' ? 'Custom' : presetLabel}
					</Typography>
					<Typography
						component="span"
						sx={{
							fontWeight: 500,
							fontSize: '0.75rem',
							color: 'text.secondary',
							display: { xs: 'none', sm: 'inline' }
						}}
					>
						{displayLabel}
					</Typography>
				</Stack>
			</Button>

			<Popover
				open={open}
				anchorEl={anchorEl}
				onClose={handleClose}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				slotProps={{
					paper: {
						elevation: 0,
						sx: {
							mt: 1,
							borderRadius: '12px',
							border: `1px solid ${theme.palette.divider}`,
							boxShadow: theme.shadows[8],
							overflow: 'visible',
							width: { xs: 'min(100vw - 32px, 420px)', sm: preset === 'custom' ? 560 : 480 },
							maxWidth: 'calc(100vw - 32px)'
						}
					}
				}}
			>
				<Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, minHeight: { sm: 280 } }}>
					<List
						dense
						sx={{
							width: { xs: '100%', sm: 200 },
							flexShrink: 0,
							py: 1,
							borderRight: { sm: 1 },
							borderBottom: { xs: 1, sm: 0 },
							borderColor: 'divider',
							bgcolor: alpha(theme.palette.action.hover, 0.03)
						}}
					>
						{PRESET_OPTIONS.map(option => {
							const selected = preset === option.id;
							return (
								<ListItemButton
									key={option.id}
									selected={selected}
									onClick={() => handlePresetSelect(option.id)}
									sx={{
										mx: 1,
										borderRadius: '8px',
										py: 1,
										'&.Mui-selected': {
											backgroundColor: alpha(theme.palette.primary.main, 0.08),
											'&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.12) }
										}
									}}
								>
									<ListItemText
										primary={option.label}
										secondary={option.description}
										primaryTypographyProps={{
											fontSize: '0.8125rem',
											fontWeight: selected ? 600 : 500,
											color: 'text.primary'
										}}
										secondaryTypographyProps={{
											fontSize: '0.6875rem',
											color: 'text.secondary',
											sx: { display: { xs: 'none', sm: 'block' } }
										}}
									/>
									{selected ? <Check sx={{ fontSize: 16, color: 'primary.main', ml: 1 }} /> : null}
								</ListItemButton>
							);
						})}
					</List>

					<Box sx={{ flex: 1, minWidth: 0, p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
						<Box>
							<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
								Selected period
							</Typography>
							<Typography variant="body2" sx={{ fontWeight: 600, mt: 0.75, color: 'text.primary' }}>
								{displayLabel}
							</Typography>
						</Box>

						{preset === 'custom' ? (
							<>
								<Divider />
								<Stack spacing={1.5}>
									<Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
										Choose a custom date range
									</Typography>
									<DatePicker
										label="Start date"
										value={draftFrom}
										onChange={d => onCustomRangeChange(toIsoDate(d), customTo)}
										slotProps={{ textField: { size: 'small', fullWidth: true } }}
										format="DD MMM YYYY"
										maxDate={draftTo ?? undefined}
									/>
									<DatePicker
										label="End date"
										value={draftTo}
										onChange={d => onCustomRangeChange(customFrom, toIsoDate(d))}
										slotProps={{ textField: { size: 'small', fullWidth: true } }}
										format="DD MMM YYYY"
										minDate={draftFrom ?? undefined}
									/>
									<Button
										variant="contained"
										size="small"
										disabled={!canApplyCustom}
										onClick={handleClose}
										sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2.5 }}
									>
										Apply range
									</Button>
								</Stack>
							</>
						) : (
							<Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
								Metrics and charts update automatically for the selected preset. Choose custom range to pick specific dates.
							</Typography>
						)}
					</Box>
				</Box>
			</Popover>
		</>
	);
};
