import { useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { AccountTree, Sync } from '@mui/icons-material';
import { useCurrentRole } from '../../../../hooks/useCurrentRole';
import {
	useSyncSapBomMutation,
	useSyncSapOperationsMutation
} from '../../../../store/api/business/sap-job-runs/sap-job-runs.api';

export type PartSapSyncType = 'bom' | 'operations';

interface PartSapSyncActionsProps {
	partId: number;
	onSynced?: (type: PartSapSyncType) => void | Promise<unknown>;
}

const PartSapSyncActions = ({ partId, onSynced }: PartSapSyncActionsProps) => {
	const { hasPermission } = useCurrentRole();
	const [syncSapBom, { isLoading: isSyncingBom }] = useSyncSapBomMutation();
	const [syncSapOperations, { isLoading: isSyncingOperations }] = useSyncSapOperationsMutation();
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	if (!hasPermission('PART_MASTER_EDIT')) return null;

	const handleSync = async (type: PartSapSyncType) => {
		setSuccessMessage(null);

		try {
			if (type === 'bom') {
				await syncSapBom({ partId }).unwrap();
				setSuccessMessage('BOM synced');
			} else {
				await syncSapOperations({ partId }).unwrap();
				setSuccessMessage('Operations synced');
			}

			await onSynced?.(type);
		} catch {
			// Rejected RTK Query actions are displayed by the global API error handler.
		}
	};

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
			<Box sx={{ display: 'flex', gap: 2 }}>
				<Button
					variant="outlined"
					startIcon={isSyncingBom ? <CircularProgress size={16} color="inherit" /> : <Sync />}
					onClick={() => void handleSync('bom')}
					disabled={isSyncingBom}
					sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
				>
					Sync SAP BOM
				</Button>
				<Button
					variant="outlined"
					startIcon={isSyncingOperations ? <CircularProgress size={16} color="inherit" /> : <AccountTree />}
					onClick={() => void handleSync('operations')}
					disabled={isSyncingOperations}
					sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
				>
					Sync SAP Operations
				</Button>
			</Box>
			{successMessage && (
				<Typography variant="caption" color="success.main" role="status">
					{successMessage}
				</Typography>
			)}
		</Box>
	);
};

export default PartSapSyncActions;
