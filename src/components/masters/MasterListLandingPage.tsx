import { Box, Stack } from '@mui/material';

import { masterListLandingSectionGap } from './masterListTokens';

export interface MasterListLandingPageProps {
	/** Usually title + primary CTA */
	header: React.ReactNode;
	/** Optional KPI strip */
	metrics?: React.ReactNode;
	toolbar: React.ReactNode;
	/** Alerts, banners, warnings */
	alerts?: React.ReactNode;
	table: React.ReactNode;
}

/**
 * Canonical list “landing” shell: vertical rhythm matches admin table browse patterns
 * (header → optional KPIs → sticky-friendly toolbar → table).
 */
const MasterListLandingPage = ({ header, metrics, toolbar, alerts, table }: MasterListLandingPageProps) => (
	<Stack component="article" spacing={masterListLandingSectionGap} sx={{ minWidth: 0, pb: { xs: 2, sm: 3 } }}>
		<Box component="header" sx={{ flexShrink: 0 }}>
			{header}
		</Box>
		{metrics ? (
			<Box component="section" aria-label="Summary metrics" sx={{ flexShrink: 0 }}>
				{metrics}
			</Box>
		) : null}
		<Box component="section" aria-label="Search and filters" sx={{ flexShrink: 0 }}>
			{toolbar}
		</Box>
		{alerts ? <Box sx={{ width: '100%' }}>{alerts}</Box> : null}
		<Box component="section" aria-label="Data table" sx={{ flexShrink: 0, minHeight: 0, flex: '1 1 auto' }}>
			{table}
		</Box>
	</Stack>
);

export default MasterListLandingPage;
