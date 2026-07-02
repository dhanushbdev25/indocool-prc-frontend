import { useState } from 'react';
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	Collapse,
	IconButton,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
	Alert
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, Refresh } from '@mui/icons-material';
import { FullScreenFormSavingOverlay } from '../../../../../../components/common/FullScreenFormSavingOverlay';
import {
	useFetchSapConfirmationLogsQuery,
	useRetriggerSapConfirmationsMutation
} from '../../../../../../store/api/business/sap-job-runs/sap-job-runs.api';
import { type ExecutionData, type FormData } from '../../../../types/execution.types';
import { useCurrentRole } from '../../../../../../hooks/useCurrentRole';

interface SapConfirmationStepProps {
	executionData: ExecutionData;
	onStepComplete: (formData: FormData) => Promise<void>;
	readOnlyOverride?: boolean;
}

function LogRow({
	log,
	expanded,
	onToggle,
	archivePresentation
}: {
	log: {
		id: number;
		operationId: string;
		operationText: string;
		requestUrl: string;
		requestBody: Record<string, unknown>;
		httpStatus: number;
		success: boolean;
		errorMessage: string | null;
		errorDescription?: string | Record<string, unknown> | null;
		triggeredAt: string;
	};
	expanded: boolean;
	onToggle: () => void;
	/** Report / browse-only: compact table — operation name, operation ID, status only. */
	archivePresentation?: boolean;
}) {
	const displayOperation = archivePresentation
		? log.operationText?.trim() || '—'
		: `${log.operationId} — ${log.operationText}`;
	const payloadForDisplay = log.requestBody;

	const errorDescriptionText = (() => {
		const raw = log.errorDescription;
		if (raw == null) return null;
		if (typeof raw === 'string') {
			const trimmed = raw.trim();
			if (!trimmed) return null;
			try {
				return JSON.stringify(JSON.parse(trimmed), null, 2);
			} catch {
				return trimmed;
			}
		}
		return JSON.stringify(raw, null, 2);
	})();

	const payloadSection = (
		<Box sx={{ py: 2, px: 1 }}>
			{errorDescriptionText && (
				<>
					<Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
						Error description
					</Typography>
					<Box
						component="pre"
						sx={{
							m: 0,
							mb: 2,
							p: 1.5,
							bgcolor: theme =>
								theme.palette.mode === 'dark' ? theme.palette.error.dark : theme.palette.error.light,
							color: theme =>
								theme.palette.mode === 'dark' ? theme.palette.error.contrastText : theme.palette.error.dark,
							borderRadius: 1,
							fontSize: 12,
							overflow: 'auto',
							maxHeight: 240,
							whiteSpace: 'pre-wrap',
							wordBreak: 'break-word'
						}}
					>
						{errorDescriptionText}
					</Box>
				</>
			)}
			<Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
				Request URL
			</Typography>
			<Typography variant="body2" sx={{ mb: 2, wordBreak: 'break-all' }}>
				{log.requestUrl}
			</Typography>
			<Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
				Request body
			</Typography>
			<Box
				component="pre"
				sx={{
					m: 0,
					p: 1.5,
					bgcolor: theme => (theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100'),
					borderRadius: 1,
					fontSize: 12,
					overflow: 'auto',
					maxHeight: 240
				}}
			>
				{JSON.stringify(payloadForDisplay, null, 2)}
			</Box>
		</Box>
	);

	if (archivePresentation) {
		return (
			<TableRow>
				<TableCell>
					<Typography variant="body2">{displayOperation}</Typography>
				</TableCell>
				<TableCell>
					<Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
						{log.operationId || '—'}
					</Typography>
				</TableCell>
				<TableCell>
					<Chip
						size="small"
						label={log.success ? 'Success' : 'Failed'}
						color={log.success ? 'success' : 'error'}
						variant={log.success ? 'filled' : 'outlined'}
					/>
				</TableCell>
			</TableRow>
		);
	}

	return (
		<>
			<TableRow sx={{ '& > td': { borderBottom: expanded ? 0 : undefined } }}>
				<TableCell width={48}>
					<IconButton size="small" onClick={onToggle} aria-label="expand row">
						{expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
					</IconButton>
				</TableCell>
				<TableCell>
					<Typography variant="body2">{displayOperation}</Typography>
				</TableCell>
				<TableCell>{log.httpStatus}</TableCell>
				<TableCell>
					<Chip
						size="small"
						label={log.success ? 'Success' : 'Failed'}
						color={log.success ? 'success' : 'error'}
						variant={log.success ? 'filled' : 'outlined'}
					/>
				</TableCell>
				<TableCell sx={{ maxWidth: 280 }}>
					<Typography variant="body2" color="text.secondary" noWrap title={log.errorMessage || ''}>
						{log.errorMessage || '—'}
					</Typography>
				</TableCell>
				<TableCell>
					<Typography variant="body2" color="text.secondary">
						{new Date(log.triggeredAt).toLocaleString()}
					</Typography>
				</TableCell>
			</TableRow>
			<TableRow>
				<TableCell colSpan={6} sx={{ py: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
					<Collapse in={expanded} timeout="auto" unmountOnExit>
						{payloadSection}
					</Collapse>
				</TableCell>
			</TableRow>
		</>
	);
}

const SapConfirmationStep = ({ executionData, onStepComplete, readOnlyOverride }: SapConfirmationStepProps) => {
	const prcExecutionId = executionData.id;
	const [expandedId, setExpandedId] = useState<number | null>(null);
	const [completeLoading, setCompleteLoading] = useState(false);
	const { hasPermission } = useCurrentRole();
	const canRetrySap = hasPermission('SAP_INTEGRATION_JOBS_EDIT');

	const { data: logs = [], isLoading, isError, error, refetch } = useFetchSapConfirmationLogsQuery(
		{ prcExecutionId },
		{ skip: !prcExecutionId }
	);

	const [retrigger, { isLoading: isRetriggering }] = useRetriggerSapConfirmationsMutation();

	const canComplete = logs.length > 0 && logs.every(l => l.success);

	const handleRetrigger = async () => {
		if (!prcExecutionId) return;
		await retrigger({ prcExecutionId }).unwrap();
		refetch();
	};

	const handleComplete = async () => {
		if (!canComplete) return;
		setCompleteLoading(true);
		try {
			await onStepComplete({ stepCompleted: true });
		} finally {
			setCompleteLoading(false);
		}
	};

	const archivePresentation = Boolean(readOnlyOverride);

	return (
		<Box sx={{ p: 2, maxWidth: 1200, mx: 'auto' }}>
			<FullScreenFormSavingOverlay
				open={isRetriggering || completeLoading}
				message={completeLoading ? 'Completing…' : 'Retrying…'}
			/>
			<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
				SAP confirmation API calls
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
				{archivePresentation
					? 'SAP confirmations posted for this execution (operation name, ID, and status).'
					: 'Review each call to SAP production order confirmation. Retry failed posts, then complete this execution only when every row shows success.'}
			</Typography>

			{!archivePresentation && (
				<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, alignItems: 'center' }}>
					{canRetrySap && (
						<Button
							variant="outlined"
							color="primary"
							startIcon={<Refresh />}
							disabled={!prcExecutionId || isRetriggering}
							onClick={() => void handleRetrigger()}
						>
							Retry failed confirmations
						</Button>
					)}
					<Button
						variant="contained"
						color="primary"
						disabled={!canComplete || completeLoading}
						onClick={() => void handleComplete()}
					>
						Complete PRC
					</Button>
				</Box>
			)}

			{!archivePresentation && !canComplete && logs.length > 0 && (
				<Alert severity="warning" sx={{ mb: 2 }}>
					All SAP confirmations must succeed before you can complete this execution. Use retry for failed rows, then
					refresh if needed.
				</Alert>
			)}

			{logs.length === 0 && !isLoading && !isError && (
				<Alert severity="info" sx={{ mb: 2 }}>
					No confirmations yet.
				</Alert>
			)}

			{isError && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error && typeof error === 'object' && 'data' in error
						? String((error as { data?: unknown }).data)
						: 'Failed to load confirmation logs.'}
				</Alert>
			)}

			{isLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
					<CircularProgress />
				</Box>
			) : (
				<TableContainer>
					<Table size="small">
						<TableHead>
							{archivePresentation ? (
								<TableRow>
									<TableCell>Operation name</TableCell>
									<TableCell>Operation ID</TableCell>
									<TableCell>Status</TableCell>
								</TableRow>
							) : (
								<TableRow>
									<TableCell />
									<TableCell>Operation</TableCell>
									<TableCell>HTTP</TableCell>
									<TableCell>Status</TableCell>
									<TableCell>Error</TableCell>
									<TableCell>Triggered</TableCell>
								</TableRow>
							)}
						</TableHead>
						<TableBody>
							{logs.map(log => (
								<LogRow
									key={log.id}
									log={log}
									expanded={expandedId === log.id}
									onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
									archivePresentation={archivePresentation}
								/>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Box>
	);
};

export default SapConfirmationStep;
