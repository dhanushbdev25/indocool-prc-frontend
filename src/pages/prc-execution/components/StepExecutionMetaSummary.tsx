import { Box, Typography, Tooltip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { WarningAmberRounded } from '@mui/icons-material';
import type { ReactNode } from 'react';
import type { TimelineStep } from '../types/execution.types';
import {
	type ApproverInfo,
	type TimelineCardTiming,
	type TimelineStepApprovalMeta,
	formatApproverDisplay,
	formatExecutionDuration,
	formatStepTimestamp,
	formatStepTimestampParts,
	getTimelineStepApprovalMeta,
	getStepTiming,
	isStepLate
} from '../utils/timelineCardTiming';

const timingFontSx = {
	fontFamily: '"SF Mono", "Roboto Mono", ui-monospace, monospace',
	fontVariantNumeric: 'tabular-nums' as const,
	letterSpacing: '0.02em',
	fontSize: '0.75rem'
} as const;

function buildApproverRows(approvalMeta: TimelineStepApprovalMeta): Array<{ key: string; label: string; approver: ApproverInfo }> {
	const rows: Array<{ key: string; label: string; approver: ApproverInfo }> = [];
	if (approvalMeta.productionApprovedBy) {
		rows.push({ key: 'production', label: 'Production approved by', approver: approvalMeta.productionApprovedBy });
	}
	if (approvalMeta.qualityApprovedBy) {
		rows.push({ key: 'quality', label: 'Quality approved by', approver: approvalMeta.qualityApprovedBy });
	}
	if (approvalMeta.dataEnteredBy && !approvalMeta.productionApprovedBy) {
		rows.push({ key: 'recorded', label: 'Recorded by', approver: approvalMeta.dataEnteredBy });
	}
	return rows;
}

function ReportMetaField({ label, children }: { label: string; children: ReactNode }) {
	return (
		<Box sx={{ minWidth: 0 }}>
			<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25, lineHeight: 1.1 }}>
				{label}
			</Typography>
			<Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3, fontSize: '0.8125rem' }}>
				{children}
			</Typography>
		</Box>
	);
}

function formatCompactTimeRange(startIso: string | null, endIso: string | null): { primary: string; secondary: string } | null {
	const start = startIso ? formatStepTimestampParts(startIso) : null;
	const end = endIso ? formatStepTimestampParts(endIso) : null;

	if (!start && !end) return null;

	if (start && end) {
		const sameDay = start.date === end.date;
		return {
			primary: sameDay ? `${start.time} – ${end.time}` : `${start.time} – ${end.time}`,
			secondary: sameDay ? start.date : `${start.date} → ${end.date}`
		};
	}

	const single = start ?? end;
	if (!single) return null;
	return { primary: single.time, secondary: single.date };
}

function SidebarStatCell({
	label,
	children,
	tooltip,
	isLast = false
}: {
	label: string;
	children: ReactNode;
	tooltip?: string;
	isLast?: boolean;
}) {
	const content = (
		<Box
			sx={{
				px: 1.25,
				py: 0.25,
				minWidth: 0,
				borderRight: isLast ? 'none' : '1px solid',
				borderColor: theme => alpha(theme.palette.divider, 0.7)
			}}
		>
			<Typography
				sx={{
					fontSize: '0.625rem',
					fontWeight: 600,
					letterSpacing: '0.07em',
					textTransform: 'uppercase',
					color: 'text.secondary',
					mb: 0.375,
					lineHeight: 1
				}}
			>
				{label}
			</Typography>
			{children}
		</Box>
	);

	if (tooltip) {
		return (
			<Tooltip title={tooltip} placement="top" arrow>
				{content}
			</Tooltip>
		);
	}

	return content;
}

function SidebarMetaPanel({
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
	const theme = useTheme();
	const { plannedSec, actualSec } = timing;
	const showTiming = plannedSec !== null || actualSec !== null;
	const timeRange = formatCompactTimeRange(approvalMeta.startTime, approvalMeta.endTime);
	const approverRows = buildApproverRows(approvalMeta);
	const primaryApprover = approverRows ?? [];
	const approverTooltip = approverRows.map(r => `${r.label}: ${formatApproverDisplay(r.approver)}`).join('\n');

	if (!timeRange && !showTiming && !primaryApprover) return null;

	const statCells: Array<{ key: string; label: string; node: ReactNode; tooltip?: string }> = [];

	if (timeRange) {
		statCells.push({
			key: 'window',
			label: 'Window',
			node: (
				<>
					<Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1.3, color: 'text.primary' }}>
						{timeRange.primary}
					</Typography>
					<Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', lineHeight: 1.3, mt: 0.125 }}>
						{timeRange.secondary}
					</Typography>
				</>
			)
		});
	}

	if (showTiming) {
		statCells.push({
			key: 'duration',
			label: 'Duration',
			node: (
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
					{actualSec !== null && (
						<Typography
							component="span"
							sx={{
								...timingFontSx,
								fontWeight: 600,
								color: timingOverPlanned ? 'warning.main' : dimTiming ? 'text.secondary' : 'text.primary'
							}}
						>
							{formatExecutionDuration(actualSec)}
						</Typography>
					)}
					{actualSec !== null && plannedSec !== null && (
						<Typography component="span" sx={{ fontSize: '0.6875rem', color: 'text.disabled' }}>
							/
						</Typography>
					)}
					{plannedSec !== null && (
						<Typography
							component="span"
							sx={{
								...timingFontSx,
								fontWeight: 500,
								color: 'text.secondary'
							}}
						>
							{formatExecutionDuration(plannedSec)}
						</Typography>
					)}
					{timingOverPlanned && (
						<WarningAmberRounded titleAccess="Actual time exceeds planned" sx={{ fontSize: 13, color: 'warning.main' }} />
					)}
				</Box>
			),
			tooltip: plannedSec !== null ? `Planned: ${formatExecutionDuration(plannedSec)}` : undefined
		});
	}

	primaryApprover.map(e =>{
		statCells.push({
			key: 'approver',
			label: e.key === 'recorded' ? 'Recorded' : e.key === 'production' ? 'Production' : 'Quality',
			node: (
				<Typography
					sx={{
						fontSize: '0.8125rem',
						fontWeight: 500,
						lineHeight: 1.3,
						color: 'text.primary',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap'
					}}
				>
					{formatApproverDisplay(e.approver)}
				</Typography>
			),
			tooltip: approverRows.length > 1 ? approverTooltip : e.label
		});
	})

	return (
		<Box
			sx={{
				mt: 1.5,
				pt: 1.25,
				borderTop: '1px solid',
				borderColor: alpha(theme.palette.divider, 0.65),
				display: 'grid',
				gridTemplateColumns: `repeat(${statCells.length}, minmax(0, 1fr))`,
				gap: 0,
				mx: -0.25
			}}
		>
			{statCells.map((cell, idx) => (
				<SidebarStatCell key={cell.key} label={cell.label} tooltip={cell.tooltip} isLast={idx === statCells.length - 1}>
					{cell.node}
				</SidebarStatCell>
			))}
		</Box>
	);
}

function ReportMetaPanel({
	timing,
	approvalMeta
}: {
	timing: TimelineCardTiming;
	approvalMeta: TimelineStepApprovalMeta;
}) {
	const { plannedSec } = timing;
	const approverRows = buildApproverRows(approvalMeta);
	const hasStart = Boolean(approvalMeta.startTime);

	if (!hasStart && plannedSec === null && approverRows.length === 0) return null;

	const gridSx = {
		display: 'grid',
		gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' },
		gap: 1.5,
		'@media print': {
			gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
			gap: '4px 10px'
		}
	} as const;

	return (
		<Box
			className="prc-report-step-meta"
			sx={{
				px: { xs: 2, sm: 2.5 },
				py: 1.25,
				borderBottom: '1px solid',
				borderColor: 'divider',
				bgcolor: theme => (theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50')
			}}
		>
			<Box className="prc-report-step-meta-grid" sx={gridSx}>
				{hasStart && (
					<ReportMetaField label="Start time">
						{formatStepTimestamp(approvalMeta.startTime)}
					</ReportMetaField>
				)}
				{plannedSec !== null && (
					<ReportMetaField label="Planned duration">
						<Box component="span" sx={timingFontSx}>
							{formatExecutionDuration(plannedSec)}
						</Box>
					</ReportMetaField>
				)}
				{approverRows.map(row => (
					<ReportMetaField key={row.key} label={row.label}>
						{formatApproverDisplay(row.approver)}
					</ReportMetaField>
				))}
			</Box>
		</Box>
	);
}

export interface StepExecutionMetaSummaryProps {
	step: TimelineStep;
	stepStartEndTime?: Record<string, unknown>;
	variant?: 'sidebar' | 'report';
	dimTiming?: boolean;
}

export function StepExecutionMetaSummary({
	step,
	stepStartEndTime,
	variant = 'sidebar',
	dimTiming = false
}: StepExecutionMetaSummaryProps) {
	const timing = getStepTiming(step, stepStartEndTime);
	const approvalMeta = getTimelineStepApprovalMeta(step, stepStartEndTime);
	const timingOverPlanned = isStepLate(timing);

	if (variant === 'report') {
		return <ReportMetaPanel timing={timing} approvalMeta={approvalMeta} />;
	}

	return (
		<SidebarMetaPanel
			timing={timing}
			approvalMeta={approvalMeta}
			timingOverPlanned={timingOverPlanned}
			dimTiming={dimTiming}
		/>
	);
}

export default StepExecutionMetaSummary;
