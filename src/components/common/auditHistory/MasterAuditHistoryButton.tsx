import { useState } from 'react';
import HistoryIcon from '@mui/icons-material/History';
import { Button } from '@mui/material';
import { MasterAuditHistoryDialog, type MasterAuditTarget } from './MasterAuditHistoryDialog';

interface MasterAuditHistoryButtonProps {
	target: MasterAuditTarget | null;
}

export function MasterAuditHistoryButton({ target }: MasterAuditHistoryButtonProps) {
	const [isOpen, setIsOpen] = useState(false);

	if (!target) return null;

	return (
		<>
			<Button
				variant="outlined"
				startIcon={<HistoryIcon />}
				onClick={() => setIsOpen(true)}
				sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
			>
				Audit Logs
			</Button>
			{isOpen && <MasterAuditHistoryDialog target={target} onClose={() => setIsOpen(false)} />}
		</>
	);
}
