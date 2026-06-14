import { Box, Typography } from '@mui/material';
import { DashboardDateRangePicker } from './DashboardDateRangePicker';
import type { DateRangePreset } from '../hooks/useDashboardDateRange';

interface DashboardPageHeaderProps {
	preset: DateRangePreset;
	presetLabel: string;
	displayLabel: string;
	onPresetChange: (preset: DateRangePreset) => void;
	onCustomRangeChange: (from: string | null, to: string | null) => void;
	customFrom: string | null;
	customTo: string | null;
}

export const DashboardPageHeader = ({
	preset,
	presetLabel,
	displayLabel,
	onPresetChange,
	onCustomRangeChange,
	customFrom,
	customTo
}: DashboardPageHeaderProps) => (
	<Box
		sx={{
			display: 'flex',
			flexDirection: { xs: 'column', md: 'row' },
			alignItems: { xs: 'stretch', md: 'flex-start' },
			justifyContent: 'space-between',
			gap: 2,
			pb: 2.5,
			mb: 0.5,
			borderBottom: 1,
			borderColor: 'divider'
		}}
	>
		<Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
			<Typography
				component="h1"
				variant="h5"
				sx={{ fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.25, color: 'text.primary' }}
			>
				Production Dashboard
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 560, lineHeight: 1.55 }}>
				Output, manpower, moulding performance, and daily trends for your selected period.
			</Typography>
		</Box>

		<Box sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', md: 'flex-start' } }}>
			<DashboardDateRangePicker
				preset={preset}
				presetLabel={presetLabel}
				displayLabel={displayLabel}
				onPresetChange={onPresetChange}
				onCustomRangeChange={onCustomRangeChange}
				customFrom={customFrom}
				customTo={customTo}
			/>
		</Box>
	</Box>
);
