import { Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface ToolbarAddButtonProps {
	label: string;
	onClick: () => void;
}

/** Compact Add CTA sized to sit inline with the filter toolbar (26px tall). */
const ToolbarAddButton = ({ label, onClick }: ToolbarAddButtonProps) => (
	<Button
		variant="contained"
		size="small"
		startIcon={<AddIcon sx={{ fontSize: '1rem' }} />}
		onClick={onClick}
		sx={{
			textTransform: 'none',
			borderRadius: 0.75,
			fontSize: '0.75rem',
			fontWeight: 600,
			px: 1.25,
			py: 0.5,
			minHeight: 26,
			boxShadow: 'none',
			'&:hover': { boxShadow: 'none' }
		}}
	>
		{label}
	</Button>
);

export default ToolbarAddButton;
