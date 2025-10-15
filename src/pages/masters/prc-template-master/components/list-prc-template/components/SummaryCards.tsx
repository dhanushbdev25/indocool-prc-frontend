import { Box, Card, CardContent, Typography } from '@mui/material';
import {
	Assignment as TemplateIcon,
	CheckCircle as ActiveIcon,
	Cancel as InactiveIcon,
	NewReleases as NewIcon
} from '@mui/icons-material';
import { PrcTemplateHeader } from '../../../../../../store/api/business/prc-template/prc-template.validators';

interface SummaryCardData {
	title: string;
	value: number;
	subtitle: string;
	icon: React.ReactNode;
}

interface SummaryCardsProps {
	headerData: PrcTemplateHeader;
}

const SummaryCards = ({ headerData }: SummaryCardsProps) => {
	const totalTemplates = headerData.ACTIVE + headerData.NEW + headerData.INACTIVE;

	const summaryData: SummaryCardData[] = [
		{
			title: 'Total Templates',
			value: totalTemplates,
			subtitle: `${headerData.ACTIVE} active templates`,
			icon: <TemplateIcon sx={{ color: '#666', fontSize: '1.5rem', opacity: 0.7 }} />
		},
		{
			title: 'Active Templates',
			value: headerData.ACTIVE,
			subtitle: 'Currently in use',
			icon: <ActiveIcon sx={{ color: '#4caf50', fontSize: '1.5rem', opacity: 0.8 }} />
		},
		{
			title: 'New Templates',
			value: headerData.NEW,
			subtitle: 'Recently created',
			icon: <NewIcon sx={{ color: '#2196f3', fontSize: '1.5rem', opacity: 0.8 }} />
		},
		{
			title: 'Inactive Templates',
			value: headerData.INACTIVE,
			subtitle: 'Not in use',
			icon: <InactiveIcon sx={{ color: '#f44336', fontSize: '1.5rem', opacity: 0.8 }} />
		}
	];

	return (
		<Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
			{summaryData.map((card, index) => (
				<Card
					key={index}
					sx={{
						flex: 1,
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
							<Box>
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
										fontSize: '0.75rem'
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

export default SummaryCards;
