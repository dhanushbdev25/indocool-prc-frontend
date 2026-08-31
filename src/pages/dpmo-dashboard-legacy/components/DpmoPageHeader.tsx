import { Box, Tab, Tabs, Typography } from '@mui/material';

export type DpmoTab = 'overall' | 'projectWise';

interface DpmoPageHeaderProps {
	tab: DpmoTab;
	onTabChange: (next: DpmoTab) => void;
}

export const DpmoPageHeader = ({ tab, onTabChange }: DpmoPageHeaderProps) => (
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
				Quality defects and first-pass yield across projects, with per-project drill-down.
			</Typography>
		</Box>
		<Tabs
			value={tab}
			onChange={(_e, next: DpmoTab) => onTabChange(next)}
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
			<Tab value="overall" label="Overall" />
			<Tab value="projectWise" label="Project Wise" />
		</Tabs>
	</Box>
);
