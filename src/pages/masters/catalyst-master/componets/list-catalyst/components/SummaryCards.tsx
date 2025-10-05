import { Box, Card, CardContent, Typography } from '@mui/material';
import { 
    Science as BeakerIcon, 
    CheckCircle as ActiveIcon, 
    Add as NewIcon
} from '@mui/icons-material';

interface SummaryCardData {
    title: string;
    value: number;
    subtitle: string;
    icon: React.ReactNode;
}

interface SummaryCardsProps {
    headerData: {
        ACTIVE: number;
        NEW: number;
        INACTIVE: number;
    };
}

const SummaryCards = ({ headerData }: SummaryCardsProps) => {
    const totalCharts = headerData.ACTIVE + headerData.NEW + headerData.INACTIVE;
    
    const summaryData: SummaryCardData[] = [
        {
            title: 'Total Charts',
            value: totalCharts,
            subtitle: `${headerData.ACTIVE} active charts`,
            icon: <BeakerIcon sx={{ color: '#666', fontSize: '1.5rem', opacity: 0.7 }} />
        },
        {
            title: 'Active Charts',
            value: headerData.ACTIVE,
            subtitle: 'Currently in production',
            icon: <ActiveIcon sx={{ color: '#4caf50', fontSize: '1.5rem', opacity: 0.8 }} />
        },
        {
            title: 'New Charts',
            value: headerData.NEW,
            subtitle: 'Pending activation',
            icon: <NewIcon sx={{ color: '#2196f3', fontSize: '1.5rem', opacity: 0.8 }} />
        }
    ];

    return (
        <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
            {summaryData.map((card, index) => (
                <Card key={index} sx={{ 
                    flex: 1, 
                    borderRadius: '12px', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    backgroundColor: 'white'
                }}>
                    <CardContent sx={{ p: 3, position: 'relative' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                                <Typography variant="body2" sx={{ 
                                    color: '#666', 
                                    mb: 1,
                                    fontSize: '0.875rem',
                                    fontWeight: 500
                                }}>
                                    {card.title}
                                </Typography>
                                <Typography variant="h4" sx={{ 
                                    fontWeight: 600, 
                                    color: '#333',
                                    fontSize: '2rem',
                                    mb: 0.5
                                }}>
                                    {card.value}
                                </Typography>
                                <Typography variant="caption" sx={{ 
                                    color: '#999',
                                    fontSize: '0.75rem'
                                }}>
                                    {card.subtitle}
                                </Typography>
                            </Box>
                            {card.icon}
                        </Box>
                    </CardContent>
                </Card>
            ))}
        </Box>
    );
};

export default SummaryCards;
