import { Badge, Box, Button, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { FilterList as FilterListIcon } from '@mui/icons-material';

interface FilterTriggerButtonProps {
	onClick: () => void;
	activeCount: number;
	label?: string;
	summary?: string | null;
}

const FilterTriggerButton = ({ onClick, activeCount, label = 'Filters', summary }: FilterTriggerButtonProps) => {
	const theme = useTheme();

	return (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				flexWrap: 'wrap',
				gap: 1.5,
				py: 1.25
			}}
		>
			{summary ? (
				<Typography
					component="div"
					role="status"
					aria-live="polite"
					variant="body2"
					color="text.secondary"
					sx={{ fontWeight: 500, letterSpacing: '0.01em' }}
				>
					{summary}
				</Typography>
			) : (
				<Box />
			)}
			<Badge badgeContent={activeCount} color="primary" overlap="rectangular">
				<Button
					size="small"
					variant="outlined"
					color="inherit"
					startIcon={<FilterListIcon fontSize="small" />}
					onClick={onClick}
					aria-label={`Open ${label.toLowerCase()}`}
					sx={{
						textTransform: 'none',
						fontWeight: 600,
						borderColor: 'divider',
						color: 'text.primary',
						px: 1.5,
						borderRadius: 1.5,
						'&:hover': {
							borderColor: 'text.secondary',
							backgroundColor: alpha(theme.palette.text.primary, 0.04)
						}
					}}
				>
					{label}
				</Button>
			</Badge>
		</Box>
	);
};

export default FilterTriggerButton;
