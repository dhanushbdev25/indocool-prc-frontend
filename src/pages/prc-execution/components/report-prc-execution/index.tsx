import React, { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
	Box,
	Button,
	CircularProgress,
	Paper,
	Stack,
	Typography,
	Alert,
	Chip,
	Divider
} from '@mui/material';
import { ArrowBack, PictureAsPdf } from '@mui/icons-material';
import { useFetchPrcExecutionDetailsQuery } from '../../../../store/api/business/prc-execution/prc-execution.api';
import type { ExecutionData, FormData, TimelineStep } from '../../types/execution.types';
import { buildTimelineSteps } from '../../utils/buildTimelineSteps';
import {
	buildInspectionStepPreviewForReport,
	buildSequenceStepPreviewForReport
} from '../../utils/reportStepPreviewData';
import { getExecutionRuntimeMs } from '../../utils/timelineCardTiming';
import { formatExecutionDuration } from '../../utils/formatExecutionDuration';
import ExecutionSetupStep from '../execute-prc/components/steps/ExecutionSetupStep';
import RawMaterialsStep from '../execute-prc/components/steps/RawMaterialsStep';
import BomStep from '../execute-prc/components/steps/BomStep';
import SapConfirmationStep from '../execute-prc/components/steps/SapConfirmationStep';
import StepPreview from '../execute-prc/components/StepPreview';
import StepExecutionMetaSummary from '../StepExecutionMetaSummary';
import './prcExecutionReportPrint.css';

const noopForm = (_fd: FormData) => {
	void _fd;
};
const noopAsyncForm = async (_fd: FormData) => {
	void _fd;
};
const noop = () => {};
const noopProceed = () => {};

function formatWhenKnown(iso?: string | null): string {
	if (!iso) return '—';
	try {
		return new Date(iso).toLocaleString();
	} catch {
		return String(iso);
	}
}

function formatOrderId(orderId?: string | number | null): string {
	return orderId != null && String(orderId).trim() ? String(orderId) : '—';
}

function ReportSummaryField({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<Box sx={{ minWidth: 0 }}>
			<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
				{label}
			</Typography>
			<Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.35 }}>
				{children}
			</Typography>
		</Box>
	);
}

function ReportExecutionHeaderSummary({ execution }: { execution: ExecutionData }) {
	const templateName = execution.prcCurrentTemplate?.prcTemplate?.templateName;
	const templateVersion = execution.prcCurrentTemplate?.prcTemplate?.version;
	const mouldDisplay =
		[execution.mouldCode, execution.mouldId].filter(Boolean).join(' · ') || '—';
	const progressSteps =
		execution.totalSteps != null
			? `${execution.stepsCompleted ?? 0} / ${execution.totalSteps}`
			: `${execution.stepsCompleted ?? 0}`;
	const ctqSummary =
		execution.totalCtq != null && execution.totalCtq > 0
			? `${execution.completedCtq ?? 0} / ${execution.totalCtq} CTQ`
			: '—';

	const summaryGridSx = {
		display: 'grid',
		gridTemplateColumns: {
			xs: 'minmax(0, 1fr)',
			sm: 'repeat(2, minmax(0, 1fr))',
			md: 'repeat(3, minmax(0, 1fr))'
		},
		gap: 2,
		mt: 1,
		'@media print': {
			gridTemplateColumns: 'repeat(3, minmax(0, 1fr))'
		}
	} as const;

	return (
		<Box className="prc-report-header-summary-grid" sx={summaryGridSx}>
			<ReportSummaryField label="Order no.">{formatOrderId(execution.orderId)}</ReportSummaryField>
			<ReportSummaryField label="Part description">{execution.partDescription || '—'}</ReportSummaryField>
			<ReportSummaryField label="Drawing">{execution.drawingNumber || '—'}</ReportSummaryField>
			<ReportSummaryField label="Variant">{execution.customerVariantName || '—'}</ReportSummaryField>
			<ReportSummaryField label="Execution status">{execution.status || '—'}</ReportSummaryField>
			<ReportSummaryField label="Progress (steps)">{progressSteps}</ReportSummaryField>
			<ReportSummaryField label="CTQ">{ctqSummary}</ReportSummaryField>
			<ReportSummaryField label="Elapsed duration">
				{formatExecutionDuration(getExecutionRuntimeMs(execution))}
			</ReportSummaryField>
			<ReportSummaryField label="Current stage">{execution.currentStage ?? '—'}</ReportSummaryField>
			<ReportSummaryField label="Mould">{mouldDisplay}</ReportSummaryField>
			<ReportSummaryField label="PRC template">
				{templateName ? (
					<>
						{templateName}
						{templateVersion != null ? ` · v${templateVersion}` : ''}
					</>
				) : (
					'—'
				)}
			</ReportSummaryField>
			<ReportSummaryField label="Reservation">{execution.reservation || '—'}</ReportSummaryField>
			<ReportSummaryField label="Recorded by (user id)">{execution.inCharge ?? '—'}</ReportSummaryField>
			<ReportSummaryField label="SAP sync">
				{execution.sapSync === undefined ? '—' : execution.sapSync ? 'Yes' : 'No'}
			</ReportSummaryField>
			<Box sx={{ gridColumn: '1 / -1' }}>
				<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
					Remarks
				</Typography>
				<Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>
					{execution.remarks?.trim() ? execution.remarks : '—'}
				</Typography>
			</Box>
			<ReportSummaryField label="Created">{formatWhenKnown(execution.createdAt)}</ReportSummaryField>
			<ReportSummaryField label="Last updated">{formatWhenKnown(execution.updatedAt)}</ReportSummaryField>
		</Box>
	);
}

function stepStatusChipColor(
	status: TimelineStep['status']
): 'success' | 'info' | 'warning' | 'default' {
	if (status === 'completed') return 'success';
	if (status === 'in-progress') return 'info';
	if (status === 'pending') return 'warning';
	return 'default';
}

function ReportSectionShell({
	step,
	stepTimingRoot,
	children
}: {
	step: TimelineStep;
	stepTimingRoot: Record<string, unknown>;
	children: React.ReactNode;
}) {
	return (
		<Paper
			variant="outlined"
			className="prc-report-section"
			elevation={0}
			sx={{
				borderRadius: 2,
				overflow: 'hidden',
				borderLeftWidth: 4,
				borderLeftColor: 'primary.main',
				boxShadow: theme => `0 1px 2px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.35)' : 'rgba(15,23,42,0.06)'}`,
				bgcolor: 'background.paper'
			}}
		>
			<Box
				className="prc-report-step-header"
				sx={{
					px: { xs: 2, sm: 2.5 },
					py: 2,
					borderBottom: '1px solid',
					borderColor: 'divider',
					bgcolor: theme => (theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50')
				}}
			>
				<Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
					<Box sx={{ minWidth: 0 }}>
						<Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.5 }}>
							Step {step.stepNumber}
						</Typography>
						<Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
							{step.title}
						</Typography>
						{step.description && step.description !== step.title && (
							<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }}>
								{step.description}
							</Typography>
						)}
					</Box>
					<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
						{step.ctq && (
							<Chip label="CTQ" size="small" color="warning" variant="outlined" sx={{ fontWeight: 600 }} />
						)}
						{step.partialCtqApprove && (
							<Chip
								label="Partial CTQ"
								size="small"
								color="warning"
								variant="filled"
								sx={{ fontWeight: 600 }}
							/>
						)}
						<Chip label={step.type} size="small" variant="outlined" />
						<Chip label={step.status} size="small" color={stepStatusChipColor(step.status)} />
					</Stack>
				</Stack>
			</Box>
			<StepExecutionMetaSummary step={step} stepStartEndTime={stepTimingRoot} variant="report" />
			<Box sx={{ p: 0 }}>{children}</Box>
		</Paper>
	);
}

function ReportTimelineSection({
	step,
	execution,
	agg,
	stepTimingRoot,
	className
}: {
	step: TimelineStep;
	execution: ExecutionData;
	agg: Record<string, unknown>;
	stepTimingRoot: Record<string, unknown>;
	className?: string;
}) {
	switch (step.type) {
		case 'setup':
			return (
				<Box className={className}>
					<ReportSectionShell step={step} stepTimingRoot={stepTimingRoot}>
						<ExecutionSetupStep
							step={step}
							executionData={execution}
							aggregatedStepsSnapshot={agg}
							onStepComplete={noopForm}
							readOnlyOverride
							plainReadOnlyFields
						/>
					</ReportSectionShell>
				</Box>
			);
		case 'rawMaterials':
			return (
				<Box className={className}>
					<ReportSectionShell step={step} stepTimingRoot={stepTimingRoot}>
						<RawMaterialsStep step={step} onStepComplete={noopForm} readOnlyOverride />
					</ReportSectionShell>
				</Box>
			);
		case 'bom':
			return (
				<Box className={className}>
					<ReportSectionShell step={step} stepTimingRoot={stepTimingRoot}>
						<BomStep
							step={step}
							executionData={execution}
							onStepComplete={noopForm}
							readOnlyOverride
							expandAccordionsForPdf
						/>
					</ReportSectionShell>
				</Box>
			);
		case 'sequence': {
			const preview = buildSequenceStepPreviewForReport(step, agg, stepTimingRoot);
			return (
				<Box className={className}>
					<ReportSectionShell step={step} stepTimingRoot={stepTimingRoot}>
						{preview ? (
							<Box className="prc-report-step-preview-wrap" sx={{ px: { xs: 1.5, sm: 2 }, pt: 2, pb: 2 }}>
								<StepPreview
									previewData={preview}
									embeddedReportMode
									onBackToStep={noop}
									onApproveProduction={noop}
									onApproveCTQ={noop}
									onPartialApproveCTQ={noop}
									onProceedToNext={noopProceed}
								/>
							</Box>
						) : (
							<Box sx={{ p: 2.5 }}>
								<Typography variant="body2" color="text.secondary">
									Sequence measurement data is not available for this step (missing template or group metadata).
								</Typography>
							</Box>
						)}
					</ReportSectionShell>
				</Box>
			);
		}
		case 'inspection': {
			const preview = buildInspectionStepPreviewForReport(step, agg, stepTimingRoot);
			return (
				<Box className={className}>
					<ReportSectionShell step={step} stepTimingRoot={stepTimingRoot}>
						{preview ? (
							<Box className="prc-report-step-preview-wrap" sx={{ px: { xs: 1.5, sm: 2 }, pt: 2, pb: 2 }}>
								<StepPreview
									previewData={preview}
									embeddedReportMode
									onBackToStep={noop}
									onApproveProduction={noop}
									onApproveCTQ={noop}
									onPartialApproveCTQ={noop}
									onProceedToNext={noopProceed}
								/>
							</Box>
						) : (
							<Box sx={{ p: 2.5 }}>
								<Typography variant="body2" color="text.secondary">
									Inspection data is not available for this step.
								</Typography>
							</Box>
						)}
					</ReportSectionShell>
				</Box>
			);
		}
		case 'sapConfirmations':
			return (
				<Box className={className}>
					<ReportSectionShell step={step} stepTimingRoot={stepTimingRoot}>
						<SapConfirmationStep
							executionData={execution}
							onStepComplete={noopAsyncForm}
							readOnlyOverride
						/>
					</ReportSectionShell>
				</Box>
			);
		default:
			return (
				<Box className={className}>
					<ReportSectionShell step={step} stepTimingRoot={stepTimingRoot}>
						<Box sx={{ p: 2.5 }}>
							<Typography variant="body2" color="text.secondary">
								This step type is not supported in the consolidated report.
							</Typography>
						</Box>
					</ReportSectionShell>
				</Box>
			);
	}
}

const PrcExecutionReport = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const executionId = id ? parseInt(id, 10) : 0;

	const { data: executionData, isLoading, error } = useFetchPrcExecutionDetailsQuery(executionId);

	const execution = useMemo(() => {
		if (!executionData) return null;
		return (executionData as { data: ExecutionData }).data;
	}, [executionData]);

	const fullTimelineSteps = useMemo(() => {
		if (!execution) return [];
		return buildTimelineSteps(execution);
	}, [execution]);

	const stepReportMode = useMemo(() => {
		const raw = searchParams.get('step');
		if (raw === null || raw.trim() === '') {
			return { kind: 'full' as const };
		}
		const idx = parseInt(raw, 10);
		if (Number.isNaN(idx) || idx < 0 || idx >= fullTimelineSteps.length) {
			return { kind: 'invalid' as const };
		}
		if (fullTimelineSteps[idx]?.type === 'sapConfirmations') {
			return { kind: 'sapExcluded' as const };
		}
		return { kind: 'single' as const, index: idx };
	}, [searchParams, fullTimelineSteps]);

	const timelineSteps = useMemo(() => {
		if (!execution) return [];
		if (stepReportMode.kind === 'full') {
			return buildTimelineSteps(execution, { omitStepTypes: ['sapConfirmations'] });
		}
		return fullTimelineSteps;
	}, [execution, stepReportMode.kind, fullTimelineSteps]);

	const agg = useMemo(() => {
		if (!execution?.prcAggregatedSteps || typeof execution.prcAggregatedSteps !== 'object') return {};
		return execution.prcAggregatedSteps as Record<string, unknown>;
	}, [execution]);

	const stepTimingRoot = useMemo(() => {
		if (!execution?.stepStartEndTime || typeof execution.stepStartEndTime !== 'object') return {};
		return execution.stepStartEndTime as Record<string, unknown>;
	}, [execution]);

	const handlePrint = () => {
		window.print();
	};

	if (!executionId || Number.isNaN(executionId)) {
		return (
			<Box sx={{ p: 3 }}>
				<Typography>Invalid execution id.</Typography>
			</Box>
		);
	}

	if (isLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error || !execution) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="error">Could not load execution. Return to the list and try again.</Alert>
				<Button sx={{ mt: 2 }} startIcon={<ArrowBack />} onClick={() => navigate('/prc-execution')}>
					Back
				</Button>
			</Box>
		);
	}

	const isSingleStepReport = stepReportMode.kind === 'single';
	const singleTimelineStep =
		stepReportMode.kind === 'single' ? timelineSteps[stepReportMode.index] : null;

	if (stepReportMode.kind === 'invalid' || stepReportMode.kind === 'sapExcluded') {
		return (
			<Box sx={{ p: { xs: 1.5, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
					<Button startIcon={<ArrowBack />} onClick={() => navigate(`/prc-execution/execute/${execution.id}`)}>
						Back to execution
					</Button>
					<Button variant="outlined" onClick={() => navigate(`/prc-execution/report/${execution.id}`)}>
						Open full consolidated report
					</Button>
				</Stack>
				<Alert severity="error">
					{stepReportMode.kind === 'sapExcluded'
						? 'SAP confirmations are not included in PDF reports. Open the full consolidated report instead.'
						: 'This step index is not valid for this execution (check the URL or open the full report).'}
				</Alert>
			</Box>
		);
	}

	return (
		<Box className="prc-execution-report-root" sx={{ p: { xs: 1.5, md: 3 }, maxWidth: 1100, mx: 'auto', pb: 6 }}>
			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} className="prc-report-no-print" sx={{ mb: 3 }}>
				<Button startIcon={<ArrowBack />} onClick={() => navigate(`/prc-execution/execute/${execution.id}`)}>
					Back to execution
				</Button>
				<Button variant="contained" startIcon={<PictureAsPdf />} onClick={handlePrint}>
					Print / Save as PDF
				</Button>
			</Stack>

			<Paper
				elevation={0}
				sx={{
					p: { xs: 2.5, md: 3 },
					mb: 3,
					borderRadius: 2,
					border: '1px solid',
					borderColor: 'divider',
					background: theme =>
						theme.palette.mode === 'dark'
							? theme.palette.grey[900]
							: `linear-gradient(135deg, ${theme.palette.primary.light}14 0%, ${theme.palette.background.paper} 48%)`
				}}
				className="prc-report-section prc-report-hero-paper"
			>
				<Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
					{isSingleStepReport ? 'PRC step report' : 'PRC consolidated report'}
				</Typography>
				<Typography variant="body2" color="text.secondary">
					Execution #{execution.id} · {execution.partNumber} · {execution.customer || '—'}
				</Typography>
				{isSingleStepReport && singleTimelineStep && (
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 600 }}>
						Step {singleTimelineStep.stepNumber}: {singleTimelineStep.title}
					</Typography>
				)}
				<Typography variant="body2" color="text.secondary">
					Date {execution.date ?? '—'} · Shift {execution.shift ?? '—'} · Order {formatOrderId(execution.orderId)} ·
					PRC Set {(() => {
						const meta = (execution.prcAggregatedSteps as { prcmetadata?: { prcSetId?: unknown } } | undefined)
							?.prcmetadata;
						const v = typeof meta?.prcSetId === 'string' ? meta.prcSetId.trim() : '';
						return v || '—';
					})()} · SAP Set {execution.productionSetId ?? '—'}
				</Typography>
				{execution.sapReferenceNumber && (
					<Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
						SAP reference {execution.sapReferenceNumber}
					</Typography>
				)}
				<Divider sx={{ my: 2 }} />
				<ReportExecutionHeaderSummary execution={execution} />
			</Paper>

			<Stack spacing={3}>
				{isSingleStepReport && singleTimelineStep ? (
					<ReportTimelineSection
						key={`single-${singleTimelineStep.type}-${singleTimelineStep.stepNumber}-${stepReportMode.kind === 'single' ? stepReportMode.index : 0}`}
						step={singleTimelineStep}
						execution={execution}
						agg={agg}
						stepTimingRoot={stepTimingRoot}
						className="prc-report-section"
					/>
				) : (
					timelineSteps.map((step, i) => (
						<ReportTimelineSection
							key={`${step.type}-${step.stepNumber}-${i}`}
							step={step}
							execution={execution}
							agg={agg}
							stepTimingRoot={stepTimingRoot}
							className="prc-report-section"
						/>
					))
				)}
			</Stack>
		</Box>
	);
};

export default PrcExecutionReport;
