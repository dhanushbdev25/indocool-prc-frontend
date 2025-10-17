import { Card, CardContent, Typography, Chip, Box, IconButton } from '@mui/material';
import { Science as CatalystIcon, Assignment as TemplateIcon, Close as CloseIcon } from '@mui/icons-material';
import { SelectableCatalyst, SelectablePrcTemplate, isCatalystItem, isPrcTemplateItem } from '../types';

interface LinkedMasterCardProps {
	item: SelectableCatalyst | SelectablePrcTemplate;
	onClick: (item: SelectableCatalyst | SelectablePrcTemplate) => void;
	isSelected: boolean;
	onRemove?: () => void;
}

const LinkedMasterCard = ({ item, onClick, isSelected, onRemove }: LinkedMasterCardProps) => {
	const isCatalyst = isCatalystItem(item);
	const isTemplate = isPrcTemplateItem(item);

	const getItemId = () => {
		if (isCatalyst) return item.chartId;
		if (isTemplate) return item.templateId;
		return '';
	};

	const getItemName = () => {
		if (isCatalyst) return `${item.chartId} - ${item.chartSupplier}`;
		if (isTemplate) return item.templateName;
		return '';
	};

	const getItemType = () => {
		if (isCatalyst) return 'catalyst';
		if (isTemplate) return 'template';
		return '';
	};

	const getTypeColor = () => {
		return isCatalyst ? '#1976d2' : '#4caf50';
	};

	const getTypeIcon = () => {
		return isCatalyst ? <CatalystIcon /> : <TemplateIcon />;
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'ACTIVE':
				return 'success';
			case 'NEW':
				return 'info';
			case 'INACTIVE':
				return 'error';
			default:
				return 'default';
		}
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
					{isSelected && onRemove && (
						<IconButton
							size="small"
							onClick={e => {
								e.stopPropagation();
								onRemove();
							}}
							sx={{
								color: '#d32f2f',
								'&:hover': {
									backgroundColor: 'rgba(211, 47, 47, 0.04)'
								}
							}}
						>
							<CloseIcon fontSize="small" />
						</IconButton>
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
						fontWeight: 500,
						mb: 1
					}}
				>
					ID: {getItemId()}
				</Typography>

				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<Chip
						label={item.status}
						color={
							getStatusColor(item.status) as
								| 'default'
								| 'primary'
								| 'secondary'
								| 'error'
								| 'info'
								| 'success'
								| 'warning'
						}
						size="small"
						variant="outlined"
						sx={{ fontSize: '0.7rem' }}
					/>
					<Typography
						variant="caption"
						sx={{
							color: '#999',
							fontSize: '0.75rem'
						}}
					>
						v{item.version}
					</Typography>
				</Box>
			</CardContent>
		</Card>
	);
};

export default LinkedMasterCard;
