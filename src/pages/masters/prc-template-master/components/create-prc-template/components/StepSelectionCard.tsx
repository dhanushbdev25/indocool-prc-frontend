import { Card, CardContent, Typography, Chip, Box } from '@mui/material';
import { Timeline as SequenceIcon, Checklist as InspectionIcon } from '@mui/icons-material';
import { StepSelectionCardProps, isSequenceItem, isInspectionItem } from '../types';

const StepSelectionCard = ({ item, onClick, isSelected }: StepSelectionCardProps) => {
	const isSequence = isSequenceItem(item);
	const isInspection = isInspectionItem(item);

	const getItemId = () => {
		if (isSequence) return item.sequenceId;
		if (isInspection) return item.inspectionId;
		return '';
	};

	const getItemName = () => {
		if (isSequence) return item.sequenceName;
		if (isInspection) return item.inspectionName;
		return '';
	};

	const getItemType = () => {
		if (isSequence) return 'sequence';
		if (isInspection) return 'inspection';
		return '';
	};

	const getTypeColor = () => {
		return isSequence ? '#1976d2' : '#4caf50';
	};

	const getTypeIcon = () => {
		return isSequence ? <SequenceIcon /> : <InspectionIcon />;
	};

	return (
		<Card
			sx={{
				cursor: 'pointer',
				border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
				borderRadius: '12px',
				boxShadow: isSelected ? '0 4px 12px rgba(25, 118, 210, 0.15)' : '0 2px 4px rgba(0,0,0,0.1)',
				backgroundColor: isSelected ? '#f3f8ff' : 'white',
				transition: 'all 0.2s ease-in-out',
				'&:hover': {
					borderColor: '#1976d2',
					boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
					transform: 'translateY(-2px)'
				}
			}}
			onClick={() => onClick(item)}
		>
			<CardContent sx={{ p: 2 }}>
				<Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<Box
							sx={{
								color: getTypeColor(),
								display: 'flex',
								alignItems: 'center'
							}}
						>
							{getTypeIcon()}
						</Box>
						<Chip
							label={getItemType().toUpperCase()}
							size="small"
							sx={{
								backgroundColor: getTypeColor(),
								color: 'white',
								fontSize: '0.7rem',
								fontWeight: 600,
								height: 20
							}}
						/>
					</Box>
					{isSelected && (
						<Box
							sx={{
								width: 20,
								height: 20,
								borderRadius: '50%',
								backgroundColor: '#1976d2',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: 'white',
								fontSize: '0.8rem',
								fontWeight: 'bold'
							}}
						>
							✓
						</Box>
					)}
				</Box>

				<Typography
					variant="h6"
					sx={{
						fontSize: '1rem',
						fontWeight: 600,
						color: '#333',
						mb: 0.5,
						lineHeight: 1.3
					}}
				>
					{getItemName()}
				</Typography>

				<Typography
					variant="body2"
					sx={{
						color: '#666',
						fontSize: '0.85rem',
						fontWeight: 500
					}}
				>
					ID: {getItemId()}
				</Typography>

				<Typography
					variant="caption"
					sx={{
						color: '#999',
						fontSize: '0.75rem',
						display: 'block',
						mt: 1
					}}
				>
					Version {item.version} • {item.status}
				</Typography>
			</CardContent>
		</Card>
	);
};

export default StepSelectionCard;
