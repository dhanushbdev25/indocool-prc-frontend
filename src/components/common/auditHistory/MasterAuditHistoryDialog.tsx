import Close from '@mui/icons-material/Close';
import { Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import { useFetchCatalystByIdQuery } from '../../../store/api/business/catalyst-master/catalyst.api';
import { useFetchInspectionByIdQuery } from '../../../store/api/business/inspection-master/inspection.api';
import { useFetchPartByIdQuery } from '../../../store/api/business/part-master/part.api';
import { useFetchPrcTemplateByIdQuery } from '../../../store/api/business/prc-template/prc-template.api';
import { useFetchProcessSequenceByIdQuery } from '../../../store/api/business/sequence-master/sequence.api';
import { AuditHistoryPanel } from './AuditHistoryPanel';

export type MasterAuditDomain = 'part' | 'inspection' | 'sequence' | 'catalyst' | 'prcTemplate';

export interface MasterAuditTarget {
	domain: MasterAuditDomain;
	id: number;
	label: string;
}

interface MasterAuditHistoryDialogProps {
	target: MasterAuditTarget | null;
	onClose: () => void;
}

export function MasterAuditHistoryDialog({ target, onClose }: MasterAuditHistoryDialogProps) {
	const id = target?.id ?? 0;
	const open = target !== null;
	const partQuery = useFetchPartByIdQuery({ id }, { skip: !open || target?.domain !== 'part' });
	const inspectionQuery = useFetchInspectionByIdQuery({ id }, { skip: !open || target?.domain !== 'inspection' });
	const sequenceQuery = useFetchProcessSequenceByIdQuery({ id }, { skip: !open || target?.domain !== 'sequence' });
	const catalystQuery = useFetchCatalystByIdQuery({ id }, { skip: !open || target?.domain !== 'catalyst' });
	const prcTemplateQuery = useFetchPrcTemplateByIdQuery({ id }, { skip: !open || target?.domain !== 'prcTemplate' });

	const query =
		target?.domain === 'part'
			? partQuery
			: target?.domain === 'inspection'
				? inspectionQuery
				: target?.domain === 'sequence'
					? sequenceQuery
					: target?.domain === 'catalyst'
						? catalystQuery
						: prcTemplateQuery;

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
			<DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
				<Typography component="span" variant="h6" sx={{ fontWeight: 600 }}>
					Audit Logs{target?.label ? ` — ${target.label}` : ''}
				</Typography>
				<IconButton onClick={onClose} aria-label="Close audit logs">
					<Close />
				</IconButton>
			</DialogTitle>
			<DialogContent dividers>
				<AuditHistoryPanel
					history={query.data?.history}
					isLoading={query.isFetching}
					isError={query.isError}
					title="Change History"
					domain={target?.domain}
				/>
			</DialogContent>
		</Dialog>
	);
}
