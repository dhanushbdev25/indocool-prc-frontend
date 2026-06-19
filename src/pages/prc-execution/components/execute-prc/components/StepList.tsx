import {
	Box,
	Typography,
	Chip,
	Card,
	CardContent,
	Avatar,
	IconButton,
	useTheme,
	Stack,
	Tooltip
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
	CheckCircle,
	RadioButtonUnchecked,
	PlayArrow,
	ArrowForward,
	WarningAmberRounded,
	PictureAsPdf,
	TimerOutlined,
	PersonOutline
} from '@mui/icons-material';
import { useEffect, useRef, type ReactNode } from 'react';
import { type TimelineStep } from '../../../types/execution.types';
import {
	type ApproverInfo,
	type TimelineCardTiming,
	type TimelineStepApprovalMeta,
	formatApproverDisplay,
	formatExecutionDuration,
	formatStepTimestampParts,
	getTimelineStepApprovalMeta,
	getTimelineStepPlannedVsActual
} from '../../../utils/timelineCardTiming';

interface StepListProps {
	steps: TimelineStep[];
	currentStepIndex: number;
	onStepClick: (stepIndex: number) => void;
	/** When true, all steps are navigable (e.g. unsaved template preview). */
	previewMode?: boolean;
	/** From GET /prcExecution/:id — keyed timing snapshot for planned vs actual on cards. */
	stepStartEndTime?: Record<string, unknown>;
	/** When set (live execution only), completed steps show a PDF affordance scoped to this execution. */
	executionId?: number;
}

const timingFontSx = {
	fontFamily: '"SF Mono", "Roboto Mono", ui-monospace, monospace',
	fontVariantNumeric: 'tabular-nums' as const,
	letterSpacing: '0.01em',
	fontSize: '0.625rem'
} as const;

const metaLabelSx = { fontSize: '0.6rem', lineHeight: 1.2, color: 'text.secondary', flexShrink: 0 } as const;
const metaValueSx = { fontSize: '0.625rem', lineHeight: 1.2, fontWeight: 600, color: 'text.primary' } as const;

function formatCompactTimestamp(iso: string): string {
	const parts = formatStepTimestampParts(iso);
	if (!parts) return '';
	return `${parts.date} ${parts.time}`;
}

function MetaInlineItem({ label, children }: { label: string; children: ReactNode }) {
	return (
		<Box sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.35, minWidth: 0 }}>
			<Typography component="span" variant="caption" sx={metaLabelSx}>
				{label}
			</Typography>
			<Typography component="span" variant="caption" sx={metaValueSx}>
				{children}
			</Typography>
		</Box>
	);
}

function StepCardMetaPanel({
	timing,
	approvalMeta,
	timingOverPlanned,
	dimTiming
}: {
	timing: TimelineCardTiming;
	approvalMeta: TimelineStepApprovalMeta;
	timingOverPlanned: boolean;
	dimTiming: boolean;
}) {
	const { plannedSec, actualSec } = timing;
	const showTiming = plannedSec !== null || actualSec !== null;
	const startLabel = approvalMeta.startTime ? formatCompactTimestamp(approvalMeta.startTime) : '';
	const endLabel = approvalMeta.endTime ? formatCompactTimestamp(approvalMeta.endTime) : '';
	const showTimes = Boolean(startLabel) || Boolean(endLabel);

	const approverRows: Array<{ shortLabel: string; approver: ApproverInfo }> = [];
	if (approvalMeta.productionApprovedBy) {
		approverRows.push({ shortLabel: 'Prod', approver: approvalMeta.productionApprovedBy });
	}
	if (approvalMeta.qualityApprovedBy) {
		approverRows.push({ shortLabel: 'Quality', approver: approvalMeta.qualityApprovedBy });
	}
	if (approvalMeta.dataEnteredBy && !approvalMeta.productionApprovedBy) {
		approverRows.push({ shortLabel: 'Recorded', approver: approvalMeta.dataEnteredBy });
	}

	if (!showTimes && !showTiming && approverRows.length === 0) return null;

	return (
		<Box
			sx={{
				mt: 0.75,
				pt: 0.75,
				borderTop: '1px solid',
				borderColor: 'divider',
				display: 'flex',
				flexDirection: 'column',
				gap: 0.4
			}}
		>
			{(showTimes || showTiming) && (
				<Box
					sx={{
						display: 'flex',
						flexWrap: 'wrap',
						alignItems: 'center',
						gap: 0.75,
						rowGap: 0.35
					}}
				>
					{startLabel && <MetaInlineItem label="Start">{startLabel}</MetaInlineItem>}
					{endLabel && <MetaInlineItem label="End">{endLabel}</MetaInlineItem>}
					{showTiming && (
						<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.35, ml: showTimes ? 0 : undefined }}>
							<TimerOutlined sx={{ fontSize: 11, color: 'text.disabled' }} />
							{actualSec !== null && (
								<Typography
									component="span"
									variant="caption"
									sx={{
										...timingFontSx,
										fontWeight: 700,
										color: timingOverPlanned ? 'warning.main' : dimTiming ? 'text.secondary' : 'text.primary'
									}}
								>
									Act {formatExecutionDuration(actualSec)}
								</Typography>
							)}
							{actualSec !== null && plannedSec !== null && (
								<Typography component="span" variant="caption" sx={{ ...metaLabelSx, mx: -0.15 }}>
									/
								</Typography>
							)}
							{plannedSec !== null && (
								<Typography
									component="span"
									variant="caption"
									sx={{
										...timingFontSx,
										fontWeight: 600,
										color: dimTiming ? 'text.secondary' : 'text.primary'
									}}
								>
									Plan {formatExecutionDuration(plannedSec)}
								</Typography>
							)}
							{timingOverPlanned && (
								<WarningAmberRounded titleAccess="Actual time exceeds planned" sx={{ fontSize: 12, color: 'warning.main' }} />
							)}
						</Box>
					)}
				</Box>
			)}

			{approverRows.length > 0 && (
				<Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75, rowGap: 0.25 }}>
					{approverRows.map(row => (
						<Box key={row.shortLabel} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3, minWidth: 0 }}>
							<PersonOutline sx={{ fontSize: 11, color: 'primary.main', flexShrink: 0 }} />
							<Typography component="span" variant="caption" sx={metaLabelSx}>
								{row.shortLabel}:
							</Typography>
							<Typography
								component="span"
								variant="caption"
								sx={{
									...metaValueSx,
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
									maxWidth: 140
								}}
								title={formatApproverDisplay(row.approver)}
							>
								{formatApproverDisplay(row.approver)}
							</Typography>
						</Box>
					))}
				</Box>
			)}
		</Box>
	);
}

const StepList = ({
	steps,
	currentStepIndex,
	onStepClick,
	previewMode = false,
	stepStartEndTime,
	executionId
}: StepListProps) => {
	const theme = useTheme();
	const currentStepRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (currentStepRef.current) {
			currentStepRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'center'
			});
		}
	}, [currentStepIndex]);

	const getStepIcon = (step: TimelineStep, index: number) => {
		if (step.status === 'completed') {
			return <CheckCircle sx={{ color: '#4caf50' }} />;
		}
		if (step.status === 'in-progress' || index === currentStepIndex) {
			return <PlayArrow sx={{ color: '#2196f3' }} />;
		}
		return <RadioButtonUnchecked sx={{ color: '#ccc' }} />;
	};

	const getStepColor = (step: TimelineStep, index: number) => {
		if (step.status === 'completed') return '#4caf50';
		if (step.status === 'in-progress' || index === currentStepIndex) return '#2196f3';
		return '#ccc';
	};

	const isStepClickable = (step: TimelineStep, index: number) => {
		if (previewMode) return true;
		return step.status === 'completed' || step.status === 'in-progress' || index === currentStepIndex;
	};

	const getStepTypeLabel = (step: TimelineStep) => {
		switch (step.type) {
			case 'setup':
				return 'Setup';
			case 'rawMaterials':
				return 'Bill of Material';
			case 'bom':
				return 'BOM';
			case 'sequence':
				return 'Sequence';
			case 'inspection':
				return 'Inspection';
			case 'sapConfirmations':
				return 'SAP';
			default:
				return step.type;
		}
	};

	return (
		<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			<Typography variant="h6" sx={{ px: 1.5, pt: 1.5, pb: 0.5, fontWeight: 600, color: '#333', fontSize: '1rem' }}>
				Execution Steps
			</Typography>

			<Box sx={{ flex: 1, overflowY: 'auto', p: 1.5, pt: 0.75 }}>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
					{steps.map((step, index) => {
						const timing = getTimelineStepPlannedVsActual(step, stepStartEndTime);
						const approvalMeta = getTimelineStepApprovalMeta(step, stepStartEndTime);
						const timingOverPlanned =
							timing.plannedSec !== null &&
							timing.actualSec !== null &&
							timing.actualSec > timing.plannedSec;
						const dimTiming = !isStepClickable(step, index);
						const clickable = isStepClickable(step, index);
						const isActive = index === currentStepIndex;

						return (
							<Card
								key={index}
								ref={isActive ? currentStepRef : null}
								sx={{
									cursor: clickable ? 'pointer' : 'default',
									opacity: clickable ? 1 : 0.6,
									border: isActive ? '2px solid #2196f3' : '1px solid #e0e0e0',
									borderRadius: 2,
									overflow: 'hidden',
									transition: 'box-shadow 0.2s ease, transform 0.2s ease',
									'&:hover': clickable
										? {
												boxShadow: 2,
												transform: 'translateY(-1px)'
											}
										: {}
								}}
								onClick={() => clickable && onStepClick(index)}
							>
								<CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
									<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
										<Avatar
											sx={{
												width: 30,
												height: 30,
												backgroundColor: 'white',
												border: `2px solid ${getStepColor(step, index)}`,
												flexShrink: 0,
												'& svg': { fontSize: 18 }
											}}
										>
											{getStepIcon(step, index)}
										</Avatar>

										<Box sx={{ flex: 1, minWidth: 0 }}>
											<Box
												sx={{
													display: 'flex',
													alignItems: 'center',
													flexWrap: 'wrap',
													gap: 0.5,
													mb: 0.25
												}}
											>
												<Typography
													variant="caption"
													sx={{ fontWeight: 700, color: clickable ? 'text.primary' : 'text.disabled' }}
												>
													Step {step.stepNumber}
												</Typography>
												{step.ctq && (
													<Chip
														label="CTQ"
														size="small"
														sx={{
															backgroundColor: '#fff3e0',
															color: '#f57c00',
															fontSize: '0.5625rem',
															height: 16,
															fontWeight: 600,
															'& .MuiChip-label': { px: 0.6 }
														}}
													/>
												)}
												{step.partialCtqApprove && (
													<Chip
														label="Partial CTQ"
														size="small"
														sx={{
															backgroundColor: '#fff8e1',
															color: '#f9a825',
															fontSize: '0.5625rem',
															height: 16,
															fontWeight: 700,
															'& .MuiChip-label': { px: 0.6 }
														}}
													/>
												)}
												<Chip
													label={getStepTypeLabel(step)}
													size="small"
													variant="outlined"
													sx={{
														fontSize: '0.5625rem',
														height: 16,
														color: 'text.secondary',
														'& .MuiChip-label': { px: 0.6 }
													}}
												/>
												{step.status === 'completed' && (
													<Chip
														label="Done"
														size="small"
														sx={{
															backgroundColor: '#e8f5e8',
															color: '#4caf50',
															fontSize: '0.5625rem',
															height: 16,
															fontWeight: 600,
															'& .MuiChip-label': { px: 0.6 }
														}}
													/>
												)}
												{step.status === 'in-progress' && (
													<Chip
														label="Active"
														size="small"
														sx={{
															backgroundColor: '#e3f2fd',
															color: '#2196f3',
															fontSize: '0.5625rem',
															height: 16,
															fontWeight: 600,
															'& .MuiChip-label': { px: 0.6 }
														}}
													/>
												)}
											</Box>

											<Typography
												variant="body2"
												sx={{
													fontWeight: 600,
													fontSize: '0.8125rem',
													color: clickable ? 'text.primary' : 'text.disabled',
													lineHeight: 1.25,
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap'
												}}
												title={step.title}
											>
												{step.title}
											</Typography>
										</Box>

										<Stack direction="row" spacing={0} alignItems="flex-start" sx={{ flexShrink: 0, mt: -0.25 }}>
											{executionId != null &&
												!previewMode &&
												step.status === 'completed' &&
												step.type !== 'sapConfirmations' && (
													<Tooltip title="Step report — print or save as PDF">
														<IconButton
															size="small"
															aria-label={`Step report PDF for step ${step.stepNumber}`}
															onClick={e => {
																e.stopPropagation();
																const reportStepIndex = step.reportStepIndex ?? index;
																window.open(
																	`/prc-execution/report/${executionId}?step=${reportStepIndex}`,
																	'_blank',
																	'noopener,noreferrer'
																);
															}}
															sx={{
																color: 'text.secondary',
																'&:hover': {
																	color: 'primary.main',
																	backgroundColor: alpha(theme.palette.primary.main, 0.06)
																}
															}}
														>
															<PictureAsPdf fontSize="small" />
														</IconButton>
													</Tooltip>
												)}
											{clickable && (
												<IconButton
													size="small"
													aria-label="Open step"
													sx={{
														color: 'text.secondary',
														'&:hover': {
															color: 'primary.main',
															backgroundColor: alpha(theme.palette.primary.main, 0.06)
														}
													}}
												>
													<ArrowForward fontSize="small" />
												</IconButton>
											)}
										</Stack>
									</Box>

									<StepCardMetaPanel
										timing={timing}
										approvalMeta={approvalMeta}
										timingOverPlanned={timingOverPlanned}
										dimTiming={dimTiming}
									/>
								</CardContent>
							</Card>
						);
					})}
				</Box>
			</Box>
		</Box>
	);
};

export default StepList;
