import { Box, Card, CardContent, Typography } from '@mui/material';
import {
	CheckCircle as CompletedIcon,
	Build as PartsIcon,
	LocationOn as LocationIcon,
	Warning as DefectIcon
} from '@mui/icons-material';
import type { DashboardData } from '../../../store/api/business/dashboard/dashboard.validators';

interface SummaryCardData {
	title: string;
	value: number;
	subtitle: string;
	icon: React.ReactNode;
	color: string;
}

interface DashboardSummaryCardsProps {
	data: DashboardData;
}

export const DashboardSummaryCards = ({ data }: DashboardSummaryCardsProps) => {
	// Calculate summary metrics from dashboard data
	const totalPrcsCompleted = Object.values(data.locationBarGraphCount.detail).reduce((sum, count) => sum + count, 0);
	const totalPartsTracked = Object.keys(data.partsBarGraphCount.detail).length;
	const totalLocationsActive = Object.keys(data.locationBarGraphCount.detail).length;
	
	// Find most common defect
	const defectEntries = Object.entries(data.defectBarGraphCount.detail);
	const mostCommonDefect = defectEntries.reduce((max, current) => 
		current[1] > max[1] ? current : max
	);
	const mostCommonDefectName = data.defectBarGraphCount.header[mostCommonDefect[0]];

	const summaryData: SummaryCardData[] = [
		{
			title: 'Total PRCs Completed',
			value: totalPrcsCompleted,
			subtitle: 'Across all locations',
			icon: <CompletedIcon sx={{ color: '#4caf50', fontSize: '1.5rem', opacity: 0.8 }} />,
			color: '#4caf50'
		},
		{
			title: 'Parts Tracked',
			value: totalPartsTracked,
			subtitle: 'Active part types',
			icon: <PartsIcon sx={{ color: '#2196f3', fontSize: '1.5rem', opacity: 0.8 }} />,
			color: '#2196f3'
		},
		{
			title: 'Active Locations',
			value: totalLocationsActive,
			subtitle: 'Plant locations',
			icon: <LocationIcon sx={{ color: '#ff9800', fontSize: '1.5rem', opacity: 0.8 }} />,
			color: '#ff9800'
		},
		{
			title: 'Most Common Defect',
			value: mostCommonDefect[1],
			subtitle: mostCommonDefectName,
			icon: <DefectIcon sx={{ color: '#f44336', fontSize: '1.5rem', opacity: 0.8 }} />,
			color: '#f44336'
		}
	];

	return (
		<Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
			{summaryData.map((card, index) => (
				<Card
					key={index}
					sx={{
						flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', lg: '1 1 calc(25% - 18px)' },
						minWidth: { xs: '100%', sm: '200px' },
						borderRadius: '12px',
						boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
						backgroundColor: 'white',
						transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
						'&:hover': {
							transform: 'translateY(-2px)',
							boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
						}
					}}
				>
					<CardContent sx={{ p: 3, position: 'relative' }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
							<Box sx={{ flex: 1 }}>
								<Typography
									variant="body2"
									sx={{
										color: '#666',
										mb: 1,
										fontSize: '0.875rem',
										fontWeight: 500
									}}
								>
									{card.title}
								</Typography>
								<Typography
									variant="h4"
									sx={{
										fontWeight: 600,
										color: '#333',
										fontSize: '2rem',
										mb: 0.5
									}}
								>
									{card.value}
								</Typography>
								<Typography
									variant="caption"
									sx={{
										color: '#999',
										fontSize: '0.75rem',
										display: 'block',
										lineHeight: 1.2
									}}
								>
									{card.subtitle}
								</Typography>
							</Box>
							<Box
								sx={{
									opacity: 0.7,
									transition: 'opacity 0.2s ease-in-out',
									'&:hover': {
										opacity: 1
									}
								}}
							>
								{card.icon}
							</Box>
						</Box>
					</CardContent>
				</Card>
			))}
		</Box>
	);
};
