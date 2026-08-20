import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Alert,
	Box,
	Chip,
	Paper,
	Skeleton,
	Stack,
	Typography
} from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';
import HistoryIcon from '@mui/icons-material/History';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import PersonOutline from '@mui/icons-material/PersonOutline';
import Schedule from '@mui/icons-material/Schedule';
import { formatDisplayDateTime } from '../../../utils/formatDisplayDate';
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

const actionConfig = {
	CREATE: { label: 'Created', color: '#15803d', background: '#dcfce7' },
	UPDATE: { label: 'Updated', color: '#1d4ed8', background: '#dbeafe' },
	DELETE: { label: 'Removed', color: '#b91c1c', background: '#fee2e2' },
	VERSIONED: { label: 'New version', color: '#a16207', background: '#fef3c7' }
} as const;

const nestedChangeConfig = {
	ADDED: { label: 'Added', color: '#15803d', background: '#dcfce7' },
	MODIFIED: { label: 'Modified', color: '#1d4ed8', background: '#dbeafe' },
	DELETED: { label: 'Removed', color: '#b91c1c', background: '#fee2e2' },
	REORDERED: { label: 'Reordered', color: '#a16207', background: '#fef3c7' }
} as const;

/**
 * Used whenever the server sends a change type outside the known set. Response validation
 * only warns, so unknown values still reach render and must not break the whole panel.
 */
const unknownChangeConfig = { label: 'Changed', color: '#475569', background: '#e2e8f0' } as const;

type ChangeChipConfig = { label: string; color: string; background: string };

function resolveActionConfig(changeType: string): ChangeChipConfig {
	return actionConfig[changeType as keyof typeof actionConfig] ?? unknownChangeConfig;
}

function resolveNestedConfig(changeType: unknown): ChangeChipConfig {
	return nestedChangeConfig[changeType as keyof typeof nestedChangeConfig] ?? unknownChangeConfig;
}

/**
 * Keeps only well-formed change records. Legacy audit rows store the raw jsondiffpatch delta
 * (an array whose entries are themselves arrays of rows), which has no change metadata at all.
 */
function usableStructuredChanges(changes?: AuditStructuredChange[] | null): AuditStructuredChange[] {
	if (!Array.isArray(changes)) return [];
	return changes.filter(
		(change): change is AuditStructuredChange => change !== null && typeof change === 'object' && !Array.isArray(change)
	);
}

function usableFieldChanges(
	changes?: Array<AuditFieldChange | AuditNestedFieldChange> | null
): Array<AuditFieldChange | AuditNestedFieldChange> {
	if (!Array.isArray(changes)) return [];
	return changes.filter(
		(change): change is AuditFieldChange | AuditNestedFieldChange =>
			change !== null && typeof change === 'object' && !Array.isArray(change) && typeof change.field === 'string'
	);
}

const domainCopy: Record<AuditHistoryDomain, { title: string; subtitle: string }> = {
	part: {
		title: 'Part history',
		subtitle: 'Track revisions made to this part and its manufacturing details.'
	},
	inspection: {
		title: 'Inspection history',
		subtitle: 'Review changes to inspection settings and parameters.'
	},
	sequence: {
		title: 'Sequence history',
		subtitle: 'Follow revisions to process groups, steps, and their order.'
	},
	catalyst: {
		title: 'Catalyst history',
		subtitle: 'See how this catalyst chart and its configuration evolved.'
	},
	prcTemplate: {
		title: 'PRC template history',
		subtitle: 'Review step additions, removals, edits, and reordering.'
	}
};

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
	return formatDisplayDateTime(value, value);
}

function ValueBlock({ label, value, tone }: { label: string; value: unknown; tone: 'before' | 'after' }) {
	const formatted = formatValue(value);
	return (
		<Box
			sx={{
				minWidth: 0,
				p: 1.5,
				borderRadius: 1.5,
				border: '1px solid',
				borderColor: tone === 'before' ? '#e2e8f0' : '#bfdbfe',
				backgroundColor: tone === 'before' ? '#f8fafc' : '#eff6ff'
			}}
		>
			<Typography
				variant="caption"
				sx={{
					display: 'block',
					mb: 0.5,
					color: tone === 'before' ? '#64748b' : '#1d4ed8',
					fontWeight: 700,
					letterSpacing: '0.04em',
					textTransform: 'uppercase'
				}}
			>
				{label}
			</Typography>
			<Typography
				component="pre"
				variant="body2"
				sx={{
					m: 0,
					maxHeight: 180,
					overflow: 'auto',
					whiteSpace: 'pre-wrap',
					overflowWrap: 'anywhere',
					fontFamily: 'inherit',
					color: '#1e293b'
				}}
			>
				{formatted}
			</Typography>
		</Box>
	);
}

function ChangeList({ changes }: { changes: Array<AuditFieldChange | AuditNestedFieldChange> }) {
	if (changes.length === 0) return null;
	return (
		<Stack gap={1.5}>
			{changes.map((change, index) => {
				const fieldChange = 'type' in change ? change.type : 'MODIFIED';
				const config = resolveNestedConfig(fieldChange);
				return (
					<Box
						key={`${change.field}-${index}`}
						sx={{
							p: { xs: 1.5, sm: 2 },
							borderRadius: 2,
							border: '1px solid #e2e8f0',
							backgroundColor: '#fff'
						}}
					>
						<Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ mb: 1.5 }}>
							<Typography variant="subtitle2" sx={{ color: '#172033', fontWeight: 700 }}>
								{formatLabel(change.field)}
							</Typography>
							<Chip
								label={config.label}
								size="small"
								sx={{ color: config.color, backgroundColor: config.background, fontWeight: 700 }}
							/>
						</Stack>
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto minmax(0, 1fr)' },
								alignItems: 'center',
								gap: 1
							}}
						>
							<ValueBlock label="Before" value={change.oldValue} tone="before" />
							<ArrowForwardRounded
								sx={{
									color: '#94a3b8',
									transform: { xs: 'rotate(90deg)', md: 'none' },
									justifySelf: 'center'
								}}
							/>
							<ValueBlock label="After" value={change.newValue} tone="after" />
						</Box>
					</Box>
				);
			})}
		</Stack>
	);
}

function StructuredChange({ change }: { change: AuditStructuredChange }) {
	const title =
		change.stepName ?? change.processName ?? change.parameterName ?? change.parameterDescription ?? 'Changed item';
	const details = usableFieldChanges(change.details);
	const nestedStepChanges = usableStructuredChanges(change.stepChanges);
	const metadata = Object.entries(change).filter(
		([key]) =>
			![
				'changeType',
				'details',
				'stepChanges',
				'stepName',
				'processName',
				'parameterName',
				'parameterDescription'
			].includes(key)
	);
	const config = resolveNestedConfig(change.changeType);

	return (
		<Box
			sx={{
				p: { xs: 1.5, sm: 2 },
				border: '1px solid #e2e8f0',
				borderRadius: 2,
				backgroundColor: '#fff'
			}}
		>
			<Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
				<Typography variant="subtitle2" sx={{ color: '#172033', fontWeight: 700 }}>
					{String(title)}
				</Typography>
				<Chip
					label={config.label}
					size="small"
					sx={{ color: config.color, backgroundColor: config.background, fontWeight: 700 }}
				/>
			</Stack>
			{metadata.length > 0 && (
				<Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1.25 }}>
					{metadata.map(([key, value]) => (
						<Box
							key={key}
							sx={{
								px: 1,
								py: 0.5,
								borderRadius: 1,
								backgroundColor: '#f1f5f9',
								color: '#475569'
							}}
						>
							<Typography variant="caption">
								<strong>{formatLabel(key)}:</strong> {formatValue(value)}
							</Typography>
						</Box>
					))}
				</Stack>
			)}
			{details.length > 0 && (
				<Box sx={{ mt: 1.5 }}>
					<ChangeList changes={details} />
				</Box>
			)}
			{nestedStepChanges.length > 0 && (
				<Stack gap={1} sx={{ mt: 1.5, pl: { sm: 2 }, borderLeft: { sm: '2px solid #dbeafe' } }}>
					{nestedStepChanges.map((stepChange, index) => (
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
			<Typography variant="overline" sx={{ mb: 1, display: 'block', color: '#64748b', fontWeight: 700 }}>
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
	title,
	domain
}: AuditHistoryPanelProps) {
	const isPrcTemplate = domain === 'prcTemplate';
	const normalizedHistory = history?.map(entry => ({
		...entry,
		changes: usableFieldChanges(entry.changes),
		stepChanges: usableStructuredChanges(entry.stepChanges),
		stepGroupChanges: usableStructuredChanges(entry.stepGroupChanges),
		parameterChanges: usableStructuredChanges(entry.parameterChanges)
	}));
	const visibleHistory = isPrcTemplate
		? normalizedHistory?.filter(entry => entry.stepChanges.length > 0)
		: normalizedHistory;
	const copy = domain ? domainCopy[domain] : null;
	const resolvedTitle = title ?? copy?.title ?? 'Change history';
	const subtitle = copy?.subtitle ?? 'See what changed, when it changed, and who made the update.';

	return (
		<Paper
			variant="outlined"
			sx={{
				overflow: 'hidden',
				borderRadius: 3,
				borderColor: '#dbe3ef',
				backgroundColor: '#f8fafc'
			}}
		>
			<Box
				sx={{
					p: { xs: 2, sm: 2.5 },
					borderBottom: '1px solid #dbe3ef',
					background: 'linear-gradient(135deg, #ffffff 0%, #f1f5ff 100%)'
				}}
			>
				<Stack direction="row" alignItems="center" gap={1.5}>
					<Box
						sx={{
							width: 42,
							height: 42,
							display: 'grid',
							placeItems: 'center',
							borderRadius: 2,
							color: '#1d4ed8',
							backgroundColor: '#dbeafe'
						}}
					>
						<HistoryIcon />
					</Box>
					<Box sx={{ minWidth: 0, flex: 1 }}>
						<Typography variant="h6" sx={{ color: '#172033', fontWeight: 700 }}>
							{resolvedTitle}
						</Typography>
						<Typography variant="body2" sx={{ color: '#64748b' }}>
							{subtitle}
						</Typography>
					</Box>
					{!isLoading && !isError && visibleHistory && visibleHistory.length > 0 && (
						<Chip
							label={`${visibleHistory.length} ${visibleHistory.length === 1 ? 'revision' : 'revisions'}`}
							size="small"
							sx={{ color: '#334155', backgroundColor: '#e2e8f0', fontWeight: 700 }}
						/>
					)}
				</Stack>
			</Box>

			<Stack sx={{ p: { xs: 2, sm: 2.5 } }}>
				{isLoading && (
					<Stack gap={1.5}>
						<Skeleton variant="rounded" height={76} />
						<Skeleton variant="rounded" height={76} />
					</Stack>
				)}
				{!isLoading && isError && (
					<Alert severity="error">History could not be loaded. Refresh the page or try again in a moment.</Alert>
				)}
				{!isLoading && !isError && (!visibleHistory || visibleHistory.length === 0) && (
					<Box sx={{ py: 4, px: 2, textAlign: 'center' }}>
						<HistoryIcon sx={{ mb: 1, fontSize: 36, color: '#94a3b8' }} />
						<Typography variant="subtitle1" sx={{ color: '#334155', fontWeight: 700 }}>
							No revisions recorded yet
						</Typography>
						<Typography variant="body2" sx={{ color: '#64748b' }}>
							Future changes to this record will appear here.
						</Typography>
					</Box>
				)}

				{!isLoading &&
					!isError &&
					visibleHistory?.map((entry, index) => {
						const hasStepChanges = entry.stepChanges.length > 0;
						const hasGroupChanges = entry.stepGroupChanges.length > 0;
						const hasParamChanges = entry.parameterChanges.length > 0;
						const hasFieldChanges = !isPrcTemplate && entry.changes.length > 0;
						const hasAnyChanges = isPrcTemplate
							? hasStepChanges
							: hasFieldChanges || hasStepChanges || hasGroupChanges || hasParamChanges;
						const structuredCount =
							entry.stepChanges.length + entry.stepGroupChanges.length + entry.parameterChanges.length;
						const changeCount = isPrcTemplate ? entry.stepChanges.length : entry.changes.length + structuredCount;
						const action = resolveActionConfig(entry.changeType);
						const isLast = index === visibleHistory.length - 1;

						return (
							<Box
								key={entry.id}
								sx={{
									display: 'grid',
									gridTemplateColumns: '32px minmax(0, 1fr)',
									gap: 1.5
								}}
							>
								<Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
									<Box
										sx={{
											mt: 2.5,
											width: 12,
											height: 12,
											zIndex: 1,
											borderRadius: '50%',
											border: '3px solid #fff',
											boxShadow: `0 0 0 2px ${action.color}`,
											backgroundColor: action.color
										}}
									/>
									{!isLast && (
										<Box
											sx={{
												position: 'absolute',
												top: 34,
												bottom: -2,
												width: 2,
												backgroundColor: '#dbe3ef'
											}}
										/>
									)}
								</Box>

								<Accordion
									disableGutters
									sx={{
										mb: isLast ? 0 : 1.5,
										border: '1px solid #dbe3ef',
										borderRadius: '12px !important',
										backgroundColor: '#fff',
										boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
										'&:before': { display: 'none' },
										'&.Mui-expanded': { boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' }
									}}
								>
									<AccordionSummary
										expandIcon={<ExpandMore sx={{ color: '#64748b' }} />}
										sx={{ px: { xs: 1.5, sm: 2 }, minHeight: 72 }}
									>
										<Stack sx={{ width: '100%', pr: 1 }} gap={0.75}>
											<Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
												<Chip
													label={action.label}
													size="small"
													sx={{
														color: action.color,
														backgroundColor: action.background,
														fontWeight: 700
													}}
												/>
												<Typography
													variant="subtitle2"
													sx={{ color: '#172033', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
												>
													Version {entry.version}
												</Typography>
												<Typography variant="caption" sx={{ color: '#64748b' }}>
													{changeCount} {changeCount === 1 ? 'change' : 'changes'}
												</Typography>
											</Stack>
											<Stack direction="row" alignItems="center" gap={2} flexWrap="wrap">
												<Stack direction="row" alignItems="center" gap={0.5}>
													<PersonOutline sx={{ fontSize: 16, color: '#64748b' }} />
													<Typography variant="caption" sx={{ color: '#475569' }}>
														{entry.changedByName}
													</Typography>
												</Stack>
												<Stack direction="row" alignItems="center" gap={0.5}>
													<Schedule sx={{ fontSize: 16, color: '#64748b' }} />
													<Typography variant="caption" sx={{ color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
														{formatDate(entry.changedAt)}
													</Typography>
												</Stack>
											</Stack>
										</Stack>
									</AccordionSummary>
									<AccordionDetails sx={{ px: { xs: 1.5, sm: 2 }, pt: 0, pb: 2 }}>
										<Stack gap={2}>
											{hasFieldChanges && (
												<Box>
													<Typography
														variant="overline"
														sx={{ mb: 1, display: 'block', color: '#64748b', fontWeight: 700 }}
													>
														Changed fields
													</Typography>
													<ChangeList changes={entry.changes} />
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
												<Typography variant="body2" sx={{ color: '#64748b' }}>
													No field-level details were returned for this revision.
												</Typography>
											)}
										</Stack>
									</AccordionDetails>
								</Accordion>
							</Box>
						);
					})}
			</Stack>
		</Paper>
	);
}
