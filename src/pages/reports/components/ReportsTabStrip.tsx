import { Box, Tab, Tabs } from '@mui/material';
import type { AvailableReport } from '../../../store/api/business/reports/reports.validators';

interface ReportsTabStripProps {
	reports: AvailableReport[];
	selectedCode: string;
	onSelect: (code: string) => void;
	disabled?: boolean;
}

export const ReportsTabStrip = ({
	reports,
	selectedCode,
	onSelect,
	disabled
}: ReportsTabStripProps) => (
	<Box sx={{ mb: 2 }}>
		<Tabs
			value={reports.some(r => r.code === selectedCode) ? selectedCode : false}
			onChange={(_e, next: string) => onSelect(next)}
			variant="scrollable"
			scrollButtons="auto"
			allowScrollButtonsMobile
			textColor="primary"
			indicatorColor="primary"
			sx={{
				minHeight: 38,
				borderBottom: 1,
				borderColor: 'divider',
				'& .MuiTab-root': {
					textTransform: 'none',
					fontWeight: 600,
					fontSize: '0.875rem',
					minHeight: 38,
					px: 2,
					letterSpacing: '-0.005em'
				}
			}}
		>
			{reports.map(report => (
				<Tab key={report.code} value={report.code} label={report.label} disabled={disabled} />
			))}
		</Tabs>
	</Box>
);
