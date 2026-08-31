import { useState } from 'react';
import { Box } from '@mui/material';
import { DpmoPageHeader, type DpmoTab } from './components/DpmoPageHeader';
import { DpmoOverallTab } from './components/tabs/DpmoOverallTab';
import { DpmoProjectWiseTab } from './components/tabs/DpmoProjectWiseTab';

/**
 * The pre-rebuild DPMO dashboard, kept verbatim behind a hidden route
 * (`/dpmo-dashboard-legacy`) while the new three-endpoint page beds in.
 * Still reads the superseded `dashboard/metrics/dpmo` endpoint.
 */
const DpmoLegacyDashboard = () => {
	const [tab, setTab] = useState<DpmoTab>('overall');

	return (
		<Box component="article" sx={{ minWidth: 0, pb: { xs: 2, sm: 3 } }}>
			<DpmoPageHeader tab={tab} onTabChange={setTab} />

			{/* Both tabs mounted to preserve independent filter state across switches */}
			<Box sx={{ display: tab === 'overall' ? 'block' : 'none' }}>
				<DpmoOverallTab />
			</Box>
			<Box sx={{ display: tab === 'projectWise' ? 'block' : 'none' }}>
				<DpmoProjectWiseTab />
			</Box>
		</Box>
	);
};

export default DpmoLegacyDashboard;
