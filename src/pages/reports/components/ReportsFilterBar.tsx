import { Box, Button, Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { DashboardDateRangeField } from '../../dashboard/components/DashboardDateRangeField';
import type { DateRangePreset } from '../../dashboard/hooks/useDashboardDateRange';

const CONTROL_HEIGHT = 40;

interface ReportsFilterBarProps {
	preset: DateRangePreset;
	presetLabel: string;
	displayLabel: string;
	customFrom: string | null;
	customTo: string | null;
	onPresetChange: (preset: DateRangePreset) => void;
	onCustomRangeChange: (from: string | null, to: string | null) => void;
	onGenerate: () => void;
	canGenerate: boolean;
	isFetching: boolean;
	disabled?: boolean;
}

export const ReportsFilterBar = ({
	preset,
	presetLabel,
	displayLabel,
	customFrom,
	customTo,
	onPresetChange,
	onCustomRangeChange,
	onGenerate,
	canGenerate,
	isFetching,
	disabled
}: ReportsFilterBarProps) => {
	const theme = useTheme();
	const panelSx = {
		borderRadius: '12px',
		border: `1px solid ${theme.palette.divider}`,
		backgroundColor: theme.palette.background.paper,
		boxShadow:
			theme.palette.mode === 'dark'
				? 'none'
				: `0 1px 0 ${alpha(theme.palette.common.black, 0.04)}, 0 1px 3px ${alpha(theme.palette.common.black, 0.05)}`,
		mb: 3
	};

	return (
		<Box sx={panelSx}>
			<form
				role="search"
				aria-label="Reports filter"
				onSubmit={e => {
					e.preventDefault();
					if (canGenerate) onGenerate();
				}}
				style={{ display: 'block' }}
			>
				<Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.75, sm: 2 } }}>
					<Stack
						direction={{ xs: 'column', sm: 'row' }}
						spacing={{ xs: 1.25, sm: 1.5 }}
						alignItems={{ xs: 'stretch', sm: 'center' }}
					>
						<Box sx={{ flex: 1, minWidth: 0, maxWidth: { sm: 320 } }}>
							<DashboardDateRangeField
								preset={preset}
								presetLabel={presetLabel}
								displayLabel={displayLabel}
								customFrom={customFrom}
								customTo={customTo}
								onPresetChange={onPresetChange}
								onCustomRangeChange={onCustomRangeChange}
								disabled={disabled}
							/>
						</Box>
						<Box sx={{ flex: 1 }} />
						<Button
							type="submit"
							size="small"
							variant="contained"
							color="primary"
							onClick={onGenerate}
							disabled={!canGenerate}
							aria-label="Generate report"
							sx={{
								textTransform: 'none',
								fontWeight: 700,
								fontSize: '0.8125rem',
								height: CONTROL_HEIGHT,
								px: 2.5,
								borderRadius: '10px',
								boxShadow: 'none',
								alignSelf: { xs: 'stretch', sm: 'center' },
								'&:hover': { boxShadow: 'none' }
							}}
						>
							{isFetching ? 'Generating…' : 'Generate report'}
						</Button>
					</Stack>
				</Box>
			</form>
		</Box>
	);
};
