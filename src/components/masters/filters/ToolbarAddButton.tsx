import { Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface ToolbarAddButtonProps {
	label: string;
	onClick: () => void;
}

/** Add CTA sized to sit inline with the filter bar action cluster. */
const ToolbarAddButton = ({ label, onClick }: ToolbarAddButtonProps) => (
	<Button
		variant="contained"
		size="small"
		startIcon={<AddIcon sx={{ fontSize: '1.125rem' }} />}
		onClick={onClick}
		sx={{
			textTransform: 'none',
			borderRadius: '10px',
			fontSize: '0.8125rem',
			fontWeight: 700,
			px: 2,
			height: 40,
			boxShadow: 'none',
			'&:hover': { boxShadow: 'none' }
		}}
	>
		{label}
	</Button>
);

export default ToolbarAddButton;
