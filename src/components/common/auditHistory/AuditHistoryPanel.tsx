import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Alert,
	Box,
	Chip,
	Divider,
	Paper,
	Skeleton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography
} from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';
import HistoryIcon from '@mui/icons-material/History';
import {
	AuditFieldChange,
	AuditHistoryEntry,
	AuditNestedFieldChange,
	AuditStructuredChange
} from '../../../store/api/business/audit-history/audit-history.validators';

export type AuditHistoryDomain = 'part' | 'inspection' | 'sequence' | 'catalyst' | 'prcTemplate';

export interface AuditHistoryPanelProps {
	history?: AuditHistoryEntry[];
	isLoading?: boolean;
	isError?: boolean;
	title?: string;
	/** When `prcTemplate`, only `stepChanges` are shown as the actual change content. */
	domain?: AuditHistoryDomain;
}

const actionColor = {
	CREATE: 'success',
	UPDATE: 'info',
	DELETE: 'error',
	VERSIONED: 'warning'
} as const;

function formatLabel(value: string) {
	return value
		.replace(/\[(\d+)\]/g, ' $1')
		.replace(/\./g, ' / ')
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/_/g, ' ')
		.replace(/\b\w/g, letter => letter.toUpperCase());
}

function formatValue(value: unknown): string {
	if (value === null || value === undefined || value === '') return '—';
	if (typeof value === 'boolean') return value ? 'Yes' : 'No';
	if (typeof value === 'object') {
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return String(value);
		}
	}
	return String(value);
}

function formatDate(value: string) {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function ChangeTable({ changes }: { changes: Array<AuditFieldChange | AuditNestedFieldChange> }) {
	if (changes.length === 0) return null;
	return (
		<TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
			<Table size="small">
				<TableHead>
					<TableRow sx={{ backgroundColor: 'action.hover' }}>
						<TableCell sx={{ fontWeight: 600 }}>Field</TableCell>
						<TableCell sx={{ fontWeight: 600 }}>Previous value</TableCell>
						<TableCell sx={{ fontWeight: 600 }}>New value</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{changes.map((change, index) => (
						<TableRow key={`${change.field}-${index}`}>
							<TableCell sx={{ verticalAlign: 'top', minWidth: 180 }}>{formatLabel(change.field)}</TableCell>
							<TableCell sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
								{formatValue(change.oldValue)}
							</TableCell>
							<TableCell sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
								{formatValue(change.newValue)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
}

function StructuredChange({ change }: { change: AuditStructuredChange }) {
	const title =
		change.stepName ?? change.processName ?? change.parameterName ?? change.parameterDescription ?? 'Changed item';
	const metadata = Object.entries(change).filter(([key]) => !['changeType', 'details', 'stepChanges'].includes(key));

	return (
		<Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
			<Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
				<Chip label={change.changeType} size="small" variant="outlined" />
				<Typography variant="subtitle2">{String(title)}</Typography>
			</Stack>
			{metadata.length > 0 && (
				<Stack direction="row" gap={2} flexWrap="wrap" sx={{ mt: 1 }}>
					{metadata.map(([key, value]) => (
						<Typography key={key} variant="caption" color="text.secondary">
							{formatLabel(key)}: {formatValue(value)}
						</Typography>
					))}
				</Stack>
			)}
			{change.details && change.details.length > 0 && (
				<Box sx={{ mt: 1.5 }}>
					<ChangeTable changes={change.details} />
				</Box>
			)}
			{change.stepChanges && change.stepChanges.length > 0 && (
				<Stack gap={1} sx={{ mt: 1.5, pl: 1.5 }}>
					{change.stepChanges.map((stepChange, index) => (
						<StructuredChange key={index} change={stepChange} />
					))}
				</Stack>
			)}
		</Box>
	);
}

function StructuredSection({ title, changes }: { title: string; changes?: AuditStructuredChange[] }) {
	if (!changes?.length) return null;
	return (
		<Box>
			<Typography variant="subtitle2" sx={{ mb: 1 }}>
				{title}
			</Typography>
			<Stack gap={1}>
				{changes.map((change, index) => (
					<StructuredChange key={index} change={change} />
				))}
			</Stack>
		</Box>
	);
}

export function AuditHistoryPanel({
	history,
	isLoading = false,
	isError = false,
	title = 'Audit Logs',
	domain
}: AuditHistoryPanelProps) {
	const isPrcTemplate = domain === 'prcTemplate';

	return (
		<Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
			<Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
				<HistoryIcon color="primary" />
				<Typography variant="h6" sx={{ fontWeight: 600 }}>
					{title}
				</Typography>
			</Stack>

			{isLoading && (
				<Stack gap={1}>
					<Skeleton variant="rounded" height={56} />
					<Skeleton variant="rounded" height={56} />
				</Stack>
			)}
			{!isLoading && isError && <Alert severity="error">Failed to load audit logs.</Alert>}
			{!isLoading && !isError && (!history || history.length === 0) && (
				<Alert severity="info">No audit logs are available for this record.</Alert>
			)}
			{!isLoading &&
				!isError &&
				history?.map(entry => {
					const hasStepChanges = Boolean(entry.stepChanges?.length);
					const hasGroupChanges = Boolean(entry.stepGroupChanges?.length);
					const hasParamChanges = Boolean(entry.parameterChanges?.length);
					const hasFieldChanges = !isPrcTemplate && entry.changes.length > 0;
					const hasAnyChanges = isPrcTemplate
						? hasStepChanges
						: hasFieldChanges || hasStepChanges || hasGroupChanges || hasParamChanges;

					return (
						<Accordion key={entry.id} disableGutters sx={{ '&:before': { display: 'none' } }}>
							<AccordionSummary expandIcon={<ExpandMore />}>
								<Stack
									direction={{ xs: 'column', sm: 'row' }}
									alignItems={{ xs: 'flex-start', sm: 'center' }}
									gap={1}
									sx={{ width: '100%', pr: 1 }}
								>
									<Chip label={entry.changeType} size="small" color={actionColor[entry.changeType]} />
									<Typography variant="body2" sx={{ fontWeight: 600 }}>
										Version {entry.version}
									</Typography>
									<Typography variant="body2">{entry.changedByName}</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ ml: { sm: 'auto' } }}>
										{formatDate(entry.changedAt)}
									</Typography>
								</Stack>
							</AccordionSummary>
							<AccordionDetails>
								<Stack gap={2}>
									{hasFieldChanges && (
										<Box>
											<Typography variant="subtitle2" sx={{ mb: 1 }}>
												Field changes
											</Typography>
											<ChangeTable changes={entry.changes} />
										</Box>
									)}
									{isPrcTemplate ? (
										<StructuredSection title="Step changes" changes={entry.stepChanges} />
									) : (
										<>
											<StructuredSection title="Template step changes" changes={entry.stepChanges} />
											<StructuredSection title="Process group changes" changes={entry.stepGroupChanges} />
											<StructuredSection title="Inspection parameter changes" changes={entry.parameterChanges} />
										</>
									)}
									{!hasAnyChanges && (
										<Typography variant="body2" color="text.secondary">
											No field-level changes were returned.
										</Typography>
									)}
									<Divider />
									<Typography variant="caption" color="text.secondary">
										Changed by user ID {entry.changedBy}
									</Typography>
								</Stack>
							</AccordionDetails>
						</Accordion>
					);
				})}
		</Paper>
	);
}
