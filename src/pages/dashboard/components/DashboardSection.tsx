import { Box } from '@mui/material';
import {
	analyticsChartHeight,
	analyticsPanel,
	analyticsPanelBody,
	analyticsSectionSubtitle,
	analyticsSectionTitle
} from '../constants/dashboardTokens';
import { TruncatedTextWithTooltip } from './TruncatedTextWithTooltip';

interface DashboardSectionProps {
	title: string;
	subtitle?: string;
	children: React.ReactNode;
}

export const DashboardSection = ({ title, subtitle, children }: DashboardSectionProps) => (
	<Box component="section" sx={{ mb: 3 }}>
		<Box sx={{ mb: 2, minWidth: 0 }}>
			<TruncatedTextWithTooltip text={title} sx={analyticsSectionTitle} />
			{subtitle ? (
				<TruncatedTextWithTooltip text={subtitle} lineClamp={2} sx={[analyticsSectionSubtitle, { mt: 0.25 }]} />
			) : null}
		</Box>
		{children}
	</Box>
);

interface DashboardChartCardProps {
	title: string;
	children: React.ReactNode;
	height?: number;
}

export const DashboardChartCard = ({ title, children, height = analyticsChartHeight }: DashboardChartCardProps) => (
	<Box sx={[analyticsPanel, { height: '100%' }]}>
		<Box sx={[analyticsPanelBody, { height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }]}>
			<TruncatedTextWithTooltip
				text={title}
				variant="body2"
				sx={{ fontWeight: 600, color: 'text.primary', mb: 2, letterSpacing: '-0.01em', width: '100%' }}
			/>
			<Box sx={{ width: '100%', height, flex: 1, minHeight: 0 }}>{children}</Box>
		</Box>
	</Box>
);
