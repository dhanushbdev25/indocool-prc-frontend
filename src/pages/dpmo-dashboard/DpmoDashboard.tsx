import { useCallback, useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import DpmoLegacyDashboard from '../dpmo-dashboard-legacy/DpmoLegacyDashboard';
import { DpmoOverviewTab } from './components/tabs/DpmoOverviewTab';

type DpmoTopTab = 'overview' | 'legacy';

const DpmoDashboard = () => {
	const [tab, setTab] = useState<DpmoTopTab>('overview');
	// Tabs mount on first visit and stay mounted, so switching back keeps each
	// dashboard's filter state — without firing the other's queries on page load.
	const [visited, setVisited] = useState<Set<DpmoTopTab>>(() => new Set<DpmoTopTab>(['overview']));

	const handleTabChange = useCallback((next: DpmoTopTab) => {
		setTab(next);
		setVisited(prev => (prev.has(next) ? prev : new Set(prev).add(next)));
	}, []);

	return (
		<Box component="article" sx={{ minWidth: 0, pb: { xs: 2, sm: 3 } }}>
			<Box sx={{ mb: 2.5 }}>
				<Box sx={{ minWidth: 0, mb: 2 }}>
					<Typography
						component="h1"
						variant="h5"
						sx={{ fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.25, color: 'text.primary' }}
					>
						DPMO Dashboard
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 560, lineHeight: 1.55 }}>
						Defect and first pass yield analysis across shifts, projects, workstations, and operators for completed PRCs
						in the selected period.
					</Typography>
				</Box>
				<Tabs
					value={tab}
					onChange={(_e, next: DpmoTopTab) => handleTabChange(next)}
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
					<Tab value="overview" label="Overview" />
					<Tab value="legacy" label="Legacy" />
				</Tabs>
			</Box>

			{visited.has('overview') ? (
				<Box sx={{ display: tab === 'overview' ? 'block' : 'none' }}>
					<DpmoOverviewTab />
				</Box>
			) : null}
			{visited.has('legacy') ? (
				<Box sx={{ display: tab === 'legacy' ? 'block' : 'none' }}>
					<DpmoLegacyDashboard />
				</Box>
			) : null}
		</Box>
	);
};

export default DpmoDashboard;
