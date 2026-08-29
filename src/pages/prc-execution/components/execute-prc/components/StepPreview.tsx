import React, { useState, useEffect } from 'react';
import {
	Box,
	Typography,
	Button,
	Card,
	CardContent,
	Avatar,
	Chip,
	IconButton,
	Alert,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Grid,
	TextField,
	ButtonGroup,
	Menu,
	MenuItem,
	Collapse,
	Autocomplete,
	CircularProgress,
	Tooltip
} from '@mui/material';
import {
	ArrowBack,
	CheckCircle,
	Visibility,
	Check,
	ArrowForward,
	AccessTime,
	ArrowDropDown,
	ExpandMore,
	ExpandLess,
	Warning,
	Error as ErrorIcon,
	RemoveCircleOutline
} from '@mui/icons-material';
import { type StepPreviewData, type ProceedFromPreviewPayload } from '../../../types/execution.types';
import { formatExecutionDuration } from '../../../utils/timelineCardTiming';
import { useFetchOperationDelayReasonComboQuery } from '../../../../../store/api/business/prc-execution/prc-execution.api';
import { type OperationDelayReasonComboOption } from '../../../../../store/api/business/prc-execution/prc-execution.validators';
import ImageDisplay from './ImageDisplay';
import { debugDataTransformation } from '../../../utils/dataTransformers';
import { useCurrentRole } from '../../../../../hooks/useCurrentRole';
import { toFileRenderUrl } from '../../../../../utils/fileUrl';
import {
	OK_NOT_OK_POSITIVE_VALUE,
	OK_NOT_OK_TYPE_KEY,
	formatOkNotOkTypeForDisplay,
	formatOkNotOkValueForDisplay,
	isNegativeOkNotOk,
	isNotApplicableOkNotOk,
	isValidOkNotOkValue
} from '../../../../../utils/okNotOkLabels';
import { GATE_FIELD_LABEL } from '../../../../../utils/gateLabels';
import {
	CRITICALITY_CHIP_TINT,
	formatInspectionCriticality,
	formatSequenceCriticality,
	resolveCriticality
} from '../../../../../utils/criticality';
import { sortByNumericOrder } from '../../../../../utils/orderedRecords';
import { formatTableCellDisplay } from '../../../../../utils/formatTableCellDisplay';

import {
	findMatchingPreviewFile,
	buildPreviewImageUrl,
	type PreviewAnnotation
} from '../../../utils/inspectionPreviewImageHelpers';
import { normalizeInspectionStepAggregatedData } from '../../../utils/inspectionAggregatedNormalization';

const COMMENT_PREVIEW_MAX_CHARS = 50;

const truncateCommentForPreview = (text: string, maxChars = COMMENT_PREVIEW_MAX_CHARS) => {
	const t = text.trim();
	if (t.length <= maxChars) {
		return { display: t, full: t, isTruncated: false };
	}
	return { display: `${t.slice(0, maxChars)}…`, full: t, isTruncated: true };
};

type PreviewRowAnnotationEntry = {
	rowIndex?: number;
	annotations?: PreviewAnnotation[];
};

const normalizePreviewTargetType = (t: string | undefined): string =>
	typeof t === 'string' ? t.trim().toLowerCase() : '';

/** Range or exact-value numeric targets (not ok/not ok, not table). */
const isNumericTargetValueType = (t: string | undefined): boolean => {
	const n = normalizePreviewTargetType(t);
	return n === 'range' || n === 'exact value';
};

const isExactPreviewTarget = (t: string | undefined): boolean => normalizePreviewTargetType(t) === 'exact value';

const formatSignedDeviationPreview = (measured: number, target: number): string => {
	const delta = measured - target;
	if (!Number.isFinite(delta)) return '';
	if (delta === 0) return '0';
	const abs = Math.abs(delta);
	const dec = abs.toFixed(6).replace(/\.?0+$/, '');
	return `${delta > 0 ? '+' : '-'}${dec}`;
};

const formatSequenceNumericValueForPreview = (value: unknown, uom: string | undefined): string => {
	if (value === undefined || value === null) return '';
	const suffix = uom && uom !== 'None' ? ` ${uom}` : '';
	if (Array.isArray(value)) {
		const parts = value.map(v => {
			if (typeof v === 'object' && v !== null && 'value' in v) {
				return String((v as Record<string, unknown>).value ?? '');
			}
			return String(v);
		});
		return `${parts.join(', ')}${suffix}`.trim();
	}
	if (typeof value === 'object') {
		const valueObj = value as Record<string, unknown>;
		if ('value' in valueObj) {
			return formatSequenceNumericValueForPreview(valueObj.value, uom);
		}
		if ('data' in valueObj) {
			return formatSequenceNumericValueForPreview(valueObj.data, uom);
		}
		return '';
	}
	return `${String(value)}${suffix}`.trim();
};

const NotOkCommentPreview = ({ comment }: { comment: string }) => {
	const { display, full, isTruncated } = truncateCommentForPreview(comment);
	const body = (
		<Typography
			variant="caption"
			sx={{
				color: '#d32f2f',
				display: 'block',
				mt: 0.5,
				...(isTruncated ? { cursor: 'help' as const } : {})
			}}
		>
			Comment: {display}
		</Typography>
	);
	if (!isTruncated) {
		return body;
	}
	return (
		<Tooltip title={full} enterDelay={300} leaveDelay={0}>
			<span style={{ display: 'block' }}>{body}</span>
		</Tooltip>
	);
};

function descriptionTextSx(embeddedReportMode: boolean, options?: { fontWeight?: number }) {
	if (embeddedReportMode) {
		return {
			fontWeight: options?.fontWeight ?? 500,
			whiteSpace: 'normal' as const,
			wordBreak: 'break-word' as const,
			overflow: 'visible',
			textOverflow: 'unset'
		};
	}
	return {
		fontWeight: options?.fontWeight ?? 500,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap' as const
	};
}

function descriptionTableCellSx(embeddedReportMode: boolean, maxWidth?: number) {
	return embeddedReportMode
		? { py: 1, fontSize: '0.8rem' }
		: { py: 1, fontSize: '0.8rem', maxWidth: maxWidth ?? 200 };
}

interface StepPreviewProps {
	previewData: StepPreviewData;
	onBackToStep: () => void;
	onApproveProduction: (payload?: ProceedFromPreviewPayload) => void;
	onApproveCTQ: (payload?: ProceedFromPreviewPayload) => void;
	onPartialApproveCTQ: (payload?: ProceedFromPreviewPayload) => void;
	onProceedToNext: (payload?: ProceedFromPreviewPayload) => void;
	onBackToStepGroup?: () => void;
	/** Read-only embed (e.g. consolidated PDF/report): no approvals, no delay inputs, full-height tables. */
	embeddedReportMode?: boolean;
	/** Browse-only execution viewer: show data and navigation without edit/approve actions. */
	readOnlyMode?: boolean;
}

const StepPreview = ({
	previewData,
	onBackToStep,
	onApproveProduction,
	onApproveCTQ,
	onPartialApproveCTQ,
	onProceedToNext,
	onBackToStepGroup,
	embeddedReportMode = false,
	readOnlyMode = false
}: StepPreviewProps) => {
	const browseOnly = embeddedReportMode || readOnlyMode;
	const { hasPermission } = useCurrentRole();
	const canApproveProduction =
		hasPermission('PRC_APPROVE_PRODUCTION') &&
		(previewData.type !== 'inspection' || previewData.inspectionMetadata?.approveByProduction === true);
	const canApproveCTQ =
		hasPermission('PRC_APPROVE_QUALITY') &&
		(previewData.type !== 'inspection' || previewData.inspectionMetadata?.approveByQuality === true);

	const [productionApproved, setProductionApproved] = useState(previewData.productionApproved || false);
	const [ctqApproved, setCtqApproved] = useState(previewData.ctqApproved || false);
	const [expandedMultiValueParams, setExpandedMultiValueParams] = useState<Set<string>>(new Set());
	const [partialCtqApproved, setPartialCtqApproved] = useState(previewData.partialCtqApprove || false);

	const toggleMultiValueParam = (parameterId: string) => {
		setExpandedMultiValueParams(prev => {
			const newSet = new Set(prev);
			if (newSet.has(parameterId)) {
				newSet.delete(parameterId);
			} else {
				newSet.add(parameterId);
			}
			return newSet;
		});
	};
	const [timingExceededRemarks, setTimingExceededRemarks] = useState('');
	const [selectedDelayReason, setSelectedDelayReason] = useState<OperationDelayReasonComboOption | null>(null);
	const [ctqMenuAnchor, setCtqMenuAnchor] = useState<null | HTMLElement>(null);
	const [ctqApprovalMode, setCtqApprovalMode] = useState<'full' | 'partial'>('full');

	// Helper functions for validation status display
	const getValidationIcon = (status: 'Accepted' | 'Lesser' | 'Greater') => {
		switch (status) {
			case 'Accepted':
				return <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />;
			case 'Lesser':
				return <Warning sx={{ color: 'warning.main', fontSize: 20 }} />;
			case 'Greater':
				return <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />;
		}
	};

	const getValidationChip = (
		status: 'Accepted' | 'Lesser' | 'Greater',
		ctx?: { isExact: boolean; measured: number; target: number }
	) => {
		const color = status === 'Accepted' ? 'success' : status === 'Lesser' ? 'warning' : 'error';
		if (ctx?.isExact) {
			const label =
				status === 'Accepted'
					? 'Matches target'
					: `Deviation: ${formatSignedDeviationPreview(ctx.measured, ctx.target)}`;
			return <Chip icon={getValidationIcon(status)} label={label} color={color} size="small" variant="outlined" />;
		}
		const label = `Range: ${status}`;
		return <Chip icon={getValidationIcon(status)} label={label} color={color} size="small" variant="outlined" />;
	};

	// Snapshot of the timing-exceeded comment + selected delay reason to forward with each action.
	// Returned as undefined when timing has not been exceeded so the parent payload stays minimal.
	const buildTimingPayload = (): ProceedFromPreviewPayload | undefined => {
		if (!previewData.timingExceeded) return undefined;
		return {
			timingExceededRemarks:
				timingExceededRemarks.trim() || (previewData.timingExceededRemarks ?? '').trim(),
			timingExceededReasonCode: selectedDelayReason?.value ?? previewData.timingExceededReasonCode,
			timingExceededReasonLabel: selectedDelayReason?.label ?? previewData.timingExceededReasonLabel
		};
	};

	const handleApproveProduction = () => {
		setProductionApproved(true);
		onApproveProduction(buildTimingPayload());
	};

	const handleApproveCTQ = () => {
		if (ctqApprovalMode === 'full') {
			setCtqApproved(true);
			onApproveCTQ(buildTimingPayload());
		} else {
			setPartialCtqApproved(true);
			onPartialApproveCTQ(buildTimingPayload());
		}
	};

	const handleCtqMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setCtqMenuAnchor(event.currentTarget);
	};

	const handleCtqMenuClose = () => {
		setCtqMenuAnchor(null);
	};

	const handleSelectFullApproval = () => {
		setCtqApprovalMode('full');
		setCtqMenuAnchor(null);
	};

	const handleSelectPartialApproval = () => {
		setCtqApprovalMode('partial');
		setCtqMenuAnchor(null);
	};

	const persistedReasonOk = ((): boolean => {
		const rc = previewData.timingExceededReasonCode;
		if (rc === undefined || rc === null) return false;
		if (typeof rc === 'number') return Number.isFinite(rc);
		return String(rc).trim().length > 0;
	})();

	// Persisted-first: saved delay documentation stays visible even when the live lateness
	// recompute disagrees (legacy data, edited master timing, incomplete intervals).
	const hasPersistedDelayInfo =
		previewData.persistedTimingExceeded === true ||
		(previewData.timingExceededRemarks ?? '').trim() !== '' ||
		persistedReasonOk ||
		(previewData.timingExceededReasonLabel ?? '').trim() !== '';
	const showTimingExceededSection =
		previewData.timingExceeded === true || ((browseOnly || previewData.stepCompleted) && hasPersistedDelayInfo);
	// The required-input prompt for incomplete steps stays driven purely by live lateness.
	const hydrateDelayReason =
		previewData.timingExceeded === true || (previewData.stepCompleted && hasPersistedDelayInfo);

	const {
		data: operationDelayReasonOptions = [],
		isLoading: isDelayReasonLoading,
		isFetching: isDelayReasonFetching
	} = useFetchOperationDelayReasonComboQuery(undefined, {
		skip:
			browseOnly ||
			(previewData.type !== 'sequence' && previewData.type !== 'inspection') ||
			!previewData.timingExceeded
	});

	const delayReasonComboBusy = isDelayReasonLoading || isDelayReasonFetching;

	// Hydrate delay reason from saved execution data only. Do not clear when code is missing — the
	// combo list loading would otherwise wipe the user's selection before submit.
	/* eslint-disable react-hooks/set-state-in-effect -- sync selected combo row when options load / step changes */
	useEffect(() => {
		if (browseOnly) {
			return;
		}
		if ((previewData.type !== 'sequence' && previewData.type !== 'inspection') || !hydrateDelayReason) {
			setSelectedDelayReason(null);
			return;
		}
		const code = previewData.timingExceededReasonCode;
		if (code === undefined || code === null || code === '') {
			return;
		}
		const match = operationDelayReasonOptions.find(
			o => o.value === code || String(o.value) === String(code)
		);
		if (match) {
			setSelectedDelayReason(match);
		} else if (previewData.timingExceededReasonLabel) {
			setSelectedDelayReason({
				label: previewData.timingExceededReasonLabel,
				value: String(code)
			});
		} else {
			setSelectedDelayReason({ label: String(code), value: String(code) });
		}
	}, [
		browseOnly,
		previewData.type,
		hydrateDelayReason,
		previewData.timingExceededReasonCode,
		previewData.timingExceededReasonLabel,
		previewData.stepNumber,
		operationDelayReasonOptions
	]);
	/* eslint-enable react-hooks/set-state-in-effect */

	const remarksSatisfied =
		timingExceededRemarks.trim().length > 0 || Boolean((previewData.timingExceededRemarks ?? '').trim().length > 0);
	const reasonSatisfied = selectedDelayReason !== null || persistedReasonOk;
	const delayDocumentationSatisfied =
		browseOnly ||
		embeddedReportMode ||
		!previewData.timingExceeded ||
		previewData.stepCompleted ||
		(remarksSatisfied && reasonSatisfied);

	const canProceed =
		productionApproved &&
		(!previewData.ctq || ctqApproved || partialCtqApproved) &&
		!previewData.stepCompleted &&
		delayDocumentationSatisfied;


	const parseOkNotOkValue = (rawValue: unknown): { value: string; notOkComment: string } => {
		if (typeof rawValue === 'string') {
			return { value: rawValue, notOkComment: '' };
		}
		if (typeof rawValue === 'object' && rawValue !== null) {
			const rec = rawValue as Record<string, unknown>;
			const value = rec.value;
			const comments = rec.comments;
			const legacy = rec.notOkComment;
			const commentStr =
				typeof comments === 'string' ? comments : typeof legacy === 'string' ? legacy : '';
			return {
				value: typeof value === 'string' ? value : '',
				notOkComment: commentStr
			};
		}
		return { value: '', notOkComment: '' };
	};

	/**
	 * Status icon for the sequence / inspection column: green check for OK, warning for OK with
	 * deviation, a struck-through circle for Not Applicable, and a neutral circle when the value
	 * is indeterminate. Not Applicable gets its own mark so it does not read as a pass.
	 */
	const renderOkNotOkResultStatusIcon = (parsed: { value: string; notOkComment: string }) => {
		if (isNegativeOkNotOk(parsed.value)) {
			return (
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: 24,
						height: 24,
						borderRadius: '50%',
						backgroundColor: '#fff4e5'
					}}
				>
					<Warning sx={{ color: 'warning.main', fontSize: 16 }} />
				</Box>
			);
		}
		if (parsed.value === OK_NOT_OK_POSITIVE_VALUE) {
			return (
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: 24,
						height: 24,
						borderRadius: '50%',
						backgroundColor: '#e8f5e8'
					}}
				>
					<CheckCircle sx={{ color: '#4caf50', fontSize: 16 }} />
				</Box>
			);
		}
		// Not Applicable gets its own mark — a grey tick would read as a pass.
		if (isNotApplicableOkNotOk(parsed.value)) {
			return (
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: 24,
						height: 24,
						borderRadius: '50%',
						backgroundColor: '#f5f5f5'
					}}
				>
					<RemoveCircleOutline sx={{ color: '#616161', fontSize: 16 }} />
				</Box>
			);
		}
		return (
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					width: 24,
					height: 24,
					borderRadius: '50%',
					backgroundColor: '#f5f5f5'
				}}
			>
				<CheckCircle sx={{ color: '#9e9e9e', fontSize: 16 }} />
			</Box>
		);
	};

	// Shown outside the delay section: an edit can happen on any submitted step. Preview only (hidden in print).
	const renderEditedAfterSubmitNote = () => {
		if (!previewData.editedAfterSubmit) return null;
		const editedAt = previewData.editedAfterSubmit.at ? new Date(previewData.editedAfterSubmit.at) : null;
		const editedAtDisplay = editedAt && !Number.isNaN(editedAt.getTime()) ? ` on ${editedAt.toLocaleString()}` : '';
		return (
			<Box className="prc-report-no-print" sx={{ mb: 1.5 }}>
				<Chip
					size="small"
					color="info"
					variant="outlined"
					label={`Edited after submission${editedAtDisplay}`}
					sx={{ fontWeight: 500 }}
				/>
			</Box>
		);
	};

	const renderTimingExceededSection = () => {
		if (!showTimingExceededSection) return null;
		return (
			<Box sx={{ mb: 2 }}>
				<Alert
					severity="warning"
					sx={{
						mb: 1,
						border: '1px solid #ff9800',
						backgroundColor: '#fff8e1',
						'& .MuiAlert-icon': {
							color: '#f57c00'
						}
					}}
					icon={<AccessTime sx={{ fontSize: 20 }} />}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
						<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#e65100' }}>
							Timing Exceeded
						</Typography>
						{previewData.timingExceeded && (
							<Chip
								label={`+${Math.round((previewData.actualDuration || 0) - (previewData.plannedDuration || 0))}s`}
								size="small"
								sx={{
									backgroundColor: '#ff5722',
									color: 'white',
									fontSize: '0.7rem',
									fontWeight: 600,
									height: 20
								}}
							/>
						)}
					</Box>
					{previewData.timingExceeded && (
						<Typography variant="body2" sx={{ color: '#bf360c', fontSize: '0.875rem' }}>
							<strong>{formatExecutionDuration(previewData.actualDuration || 0)}</strong> actual vs{' '}
							<strong>{formatExecutionDuration(previewData.plannedDuration || 0)}</strong> planned
						</Typography>
					)}
				</Alert>
				{browseOnly ? (
					<Box sx={{ mt: 2, pl: 0.5 }}>
						{(previewData.timingExceededReasonLabel != null ||
							previewData.timingExceededReasonCode !== undefined) && (
							<Typography variant="body2" sx={{ color: 'text.primary' }}>
								<strong>Delay reason:</strong>{' '}
								{previewData.timingExceededReasonLabel ??
									(previewData.timingExceededReasonCode !== undefined
										? String(previewData.timingExceededReasonCode)
										: '—')}
							</Typography>
						)}
						<Typography variant="body2" sx={{ mt: 0.75, color: 'text.secondary' }}>
							<strong>Remarks:</strong> {(previewData.timingExceededRemarks ?? '').trim() || '—'}
						</Typography>
					</Box>
				) : (
					<>
						<Autocomplete<OperationDelayReasonComboOption, false, false, false>
							fullWidth
							sx={{ mt: 2 }}
							options={operationDelayReasonOptions}
							loading={delayReasonComboBusy}
							value={selectedDelayReason}
							onChange={(_, v) => setSelectedDelayReason(v)}
							getOptionLabel={o => o.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							disabled={previewData.stepCompleted}
							renderInput={params => (
								<TextField
									{...params}
									label="Operation delay reason"
									placeholder="Select a reason code"
									required={!previewData.stepCompleted}
									error={!previewData.stepCompleted && !selectedDelayReason}
									helperText={
										!previewData.stepCompleted && !selectedDelayReason ? 'Required to proceed' : undefined
									}
									InputProps={{
										...params.InputProps,
										endAdornment: (
											<>
												{delayReasonComboBusy ? <CircularProgress color="inherit" size={20} /> : null}
												{params.InputProps.endAdornment}
											</>
										)
									}}
								/>
							)}
						/>
						<TextField
							fullWidth
							multiline
							rows={2}
							label="Reason for delay"
							placeholder="Brief explanation for the timing delay"
							value={
								previewData.stepCompleted
									? previewData.timingExceededRemarks || 'No reason provided'
									: timingExceededRemarks
							}
							onChange={e => setTimingExceededRemarks(e.target.value)}
							required={!previewData.stepCompleted}
							disabled={previewData.stepCompleted}
							sx={{
								mt: 2,
								'& .MuiOutlinedInput-root': {
									borderColor:
										!previewData.stepCompleted && !timingExceededRemarks.trim() ? '#f44336' : '#e0e0e0',
									'&:hover .MuiOutlinedInput-notchedOutline': {
										borderColor:
											!previewData.stepCompleted && !timingExceededRemarks.trim() ? '#f44336' : '#1976d2'
									},
									'&.Mui-disabled': {
										backgroundColor: '#f5f5f5',
										color: '#666'
									}
								}
							}}
							error={!previewData.stepCompleted && !timingExceededRemarks.trim()}
							helperText={'Required to proceed'}
						/>
					</>
				)}
			</Box>
		);
	};

	const renderDataSummary = () => {
		let { data } = previewData;

		// Normalize object-shaped annotations to arrays (shared with consolidated report)
		if (previewData.type === 'inspection' && typeof data === 'object' && data !== null) {
			const raw = data as Record<string, unknown>;
			const normalized = normalizeInspectionStepAggregatedData(raw);
			if (normalized !== raw) {
				debugDataTransformation(raw, normalized, 'StepPreview');
			}
			data = normalized;
		}

		if (previewData.type === 'sequence') {
			// Handle sequence data - show as compact report table
			return (
				<Box>
					{renderEditedAfterSubmitNote()}
					{renderTimingExceededSection()}
					<Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: '#333', fontSize: '1.1rem' }}>
						Measurement Report ({Array.isArray(data) ? data.length : 0} measurements)
					</Typography>
					<TableContainer
						component={Paper}
						variant="outlined"
						sx={embeddedReportMode ? undefined : { maxHeight: 400 }}
					>
						<Table size="small" stickyHeader={!embeddedReportMode}>
							<TableHead>
								<TableRow sx={{ backgroundColor: '#f5f5f5' }}>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Step</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Parameter</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Value</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Target Value Type</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Method</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Target</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Status</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{Array.isArray(data) && data.length > 0 ? (
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									data.map((measurement: any, index: number) => (
										<TableRow
											key={measurement.stepId || index}
											sx={{
												'&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
												'&:hover': { backgroundColor: '#f0f0f0' }
											}}
										>
											<TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
													<Typography variant="body2" sx={{ fontWeight: 500 }}>
														{measurement.stepNumber || index + 1}
													</Typography>
													{resolveCriticality(measurement) !== 'NONE' && (
														<Chip
															label={formatSequenceCriticality(measurement)}
															size="small"
															sx={{
																backgroundColor: CRITICALITY_CHIP_TINT[resolveCriticality(measurement)].background,
																color: CRITICALITY_CHIP_TINT[resolveCriticality(measurement)].color,
																fontSize: '0.6rem',
																height: 16,
																'& .MuiChip-label': { px: 0.5 }
															}}
														/>
													)}
												</Box>
											</TableCell>
											<TableCell sx={descriptionTableCellSx(embeddedReportMode)}>
												<Typography
													variant="body2"
													sx={descriptionTextSx(embeddedReportMode)}
													title={measurement.parameterDescription}
												>
													{measurement.parameterDescription}
												</Typography>
											</TableCell>
										<TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
											{measurement.targetValueType === 'table' && Array.isArray(measurement.value) ? (
												<Box>
													<Chip
														label={`Table (${measurement.value.length} rows)`}
														size="small"
														sx={{ backgroundColor: '#f3e8ff', color: '#7b1fa2', fontSize: '0.7rem', height: 20 }}
													/>
													{measurement.tableConfig && (
														<Box
															component="table"
															sx={{
																mt: 1,
																width: '100%',
																borderCollapse: 'collapse',
																fontSize: '0.75rem',
																'& th, & td': { border: '1px solid #e0e0e0', p: 0.5, textAlign: 'left' },
																'& th': { backgroundColor: '#f5f5f5', fontWeight: 600 }
															}}
														>
															<thead>
																<tr>
																	{measurement.tableConfig.columns?.map((col: { name: string; type?: string }) => (
																		<th key={col.name}>{col.name}</th>
																	))}
																</tr>
															</thead>
															<tbody>
																{measurement.value.map((row: Record<string, string>, rIdx: number) => (
																	<tr key={rIdx}>
																		{measurement.tableConfig.columns?.map((col: { name: string; type?: string }) => {
																			const cellConfig = measurement.tableConfig.rows?.[rIdx]?.cells?.[col.name];
																			const displayValue = formatTableCellDisplay(col.type, row[col.name]);
																			return (
																				<td
																					key={col.name}
																					style={cellConfig?.readOnly ? { backgroundColor: '#f9f9f9', fontStyle: 'italic' } : undefined}
																				>
																					{displayValue}
																				</td>
																			);
																		})}
																	</tr>
																))}
															</tbody>
														</Box>
													)}
												</Box>
											) : (
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
													{isNumericTargetValueType(measurement.targetValueType) ? (
														<Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
															{formatSequenceNumericValueForPreview(measurement.value, measurement.uom)}
														</Typography>
													) : measurement.targetValueType === 'ok/not ok' ? (
														<Chip
															label={(() => {
																const parsedValue = parseOkNotOkValue(measurement.value);
																if (parsedValue.value === 'ok' || isNegativeOkNotOk(parsedValue.value)) {
																	return formatOkNotOkValueForDisplay(parsedValue.value);
																}
																return (
																	parsedValue.value ||
																	formatSequenceNumericValueForPreview(measurement.value, measurement.uom) ||
																	'-'
																);
															})()}
															size="small"
															sx={{
																backgroundColor: '#e3f2fd',
																color: '#1976d2',
																fontSize: '0.7rem',
																height: 20
															}}
														/>
													) : (
														<Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
															{formatSequenceNumericValueForPreview(measurement.value, measurement.uom)}
														</Typography>
													)}
												</Box>
											)}
											{(() => {
												const parsedValue = parseOkNotOkValue(measurement.value);
												const shouldShowComment =
													isNegativeOkNotOk(parsedValue.value) && parsedValue.notOkComment.trim().length > 0;
												if (!shouldShowComment) return null;
												return <NotOkCommentPreview comment={parsedValue.notOkComment} />;
											})()}
											{typeof measurement.instrumentId === 'string' && measurement.instrumentId.trim() && (
												<Typography variant="caption" sx={{ color: '#6a1b9a', display: 'block', mt: 0.5 }}>
													Instrument id: {measurement.instrumentId}
												</Typography>
											)}
										</TableCell>
											<TableCell sx={{ py: 1, fontSize: '0.8rem', color: '#666' }}>{formatOkNotOkTypeForDisplay(measurement.targetValueType)}</TableCell>
											<TableCell sx={{ py: 1, fontSize: '0.8rem', color: '#666' }}>
												{measurement.evaluationMethod}
											</TableCell>
											<TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
												{(() => {
													const uom =
														measurement.uom && measurement.uom !== 'None' ? ` ${measurement.uom}` : '';
													const minV = measurement.minimumAcceptanceValue;
													const maxV = measurement.maximumAcceptanceValue;
													const isExact = isExactPreviewTarget(measurement.targetValueType);
													if (
														(minV === undefined || minV === null || minV === '') &&
														(maxV === undefined || maxV === null || maxV === '')
													) {
														return (
															<Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
																N/A
															</Typography>
														);
													}
													if (isExact) {
														const t = minV ?? maxV;
														return (
															<Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
																{t}
																{uom}
															</Typography>
														);
													}
													if (
														maxV != null &&
														minV != null &&
														String(minV).length > 0 &&
														String(maxV).length > 0
													) {
														return (
															<Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
																{minV} - {maxV}
																{uom}
															</Typography>
														);
													}
													return (
														<Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
															N/A
														</Typography>
													);
												})()}
											</TableCell>
											<TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
												{(() => {
													const minV = measurement.minimumAcceptanceValue;
													const maxV = measurement.maximumAcceptanceValue;
													const hasTarget =
														(minV !== undefined && minV !== null && minV !== '') ||
														(maxV !== undefined && maxV !== null && maxV !== '');
													if (!hasTarget || !measurement.validationStatus) {
														const parsed = parseOkNotOkValue(measurement.value);
														const isOkNotOkRow =
															measurement.targetValueType === OK_NOT_OK_TYPE_KEY ||
															(measurement.targetValueType === OK_NOT_OK_TYPE_KEY &&
																isValidOkNotOkValue(parsed.value));
														if (isOkNotOkRow) {
															return renderOkNotOkResultStatusIcon(parsed);
														}
														return (
															<Box
																sx={{
																	display: 'flex',
																	alignItems: 'center',
																	justifyContent: 'center',
																	width: 24,
																	height: 24,
																	borderRadius: '50%',
																	backgroundColor: '#e8f5e8'
																}}
															>
																<CheckCircle sx={{ color: '#4caf50', fontSize: 16 }} />
															</Box>
														);
													}
													const targetNum = parseFloat(
														String(minV ?? maxV ?? '')
													);
													const measuredNum = parseFloat(
														String(
															typeof measurement.value === 'object' && measurement.value !== null
																? (measurement.value as Record<string, unknown>).value ?? ''
																: measurement.value ?? ''
														)
													);
													const chipCtx =
														isExactPreviewTarget(measurement.targetValueType) &&
														!Number.isNaN(targetNum) &&
														!Number.isNaN(measuredNum)
															? {
																	isExact: true as const,
																	measured: measuredNum,
																	target: targetNum
																}
															: undefined;
													return (
														<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
															{getValidationChip(
																measurement.validationStatus as 'Accepted' | 'Lesser' | 'Greater',
																chipCtx
															)}
														</Box>
													);
												})()}
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: '#666' }}>
											No measurement data available
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</TableContainer>

					{/* Notes section for important notes */}
					{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
					{Array.isArray(data) && data.some((m: any) => m.notes && m.notes.length > 0) && (
						<Box sx={{ mt: 2 }}>
							<Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#333' }}>
								Important Notes:
							</Typography>
							{data
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								.filter((m: any) => m.notes && m.notes.length > 0)
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								.map((measurement: any, index: number) => (
									<Box key={index} sx={{ mb: 1, p: 1, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
										<Typography variant="caption" sx={{ fontWeight: 500, color: '#666' }}>
											Step {measurement.stepNumber}:
										</Typography>
										<Typography variant="caption" sx={{ color: '#333', ml: 0.5 }}>
											{measurement.notes}
										</Typography>
									</Box>
								))}
						</Box>
					)}

					{/* Responsible Person Information */}
					{(() => {
						// Check for responsible person data in both array format and object format (backward compatibility)
						interface ResponsiblePerson {
							role: string;
							employeeName: string;
							employeeCode: string;
						}

						interface StepGroup {
							stepId: string;
							parameterDescription: string;
							responsiblePersons: ResponsiblePerson[];
						}

						let responsiblePersons: StepGroup[] = [];
						let displayResponsiblePersons: boolean = false;

						// For sequence type: Check if any measurement in the data array has responsiblePersons
						if (Array.isArray(data)) {
							// Group responsible persons by step
							const stepGroups: Record<string, StepGroup> = {};

							data.forEach((measurement: unknown, index: number) => {
								const measurementData = measurement as Record<string, unknown>;
								if (measurementData.responsiblePersons && Array.isArray(measurementData.responsiblePersons)) {
									console.log(
										`✅ Found responsiblePersons in measurement ${index}:`,
										measurementData.responsiblePersons
									);

									const stepId = (measurementData.stepId as string) || `Step ${index + 1}`;
									const parameterDescription =
										(measurementData.parameterDescription as string) || `Parameter ${index + 1}`;

									// Initialize step group if not exists
									if (!stepGroups[stepId]) {
										stepGroups[stepId] = {
											stepId: stepId,
											parameterDescription: parameterDescription,
											responsiblePersons: []
										};
									}

									// Add responsible persons to this step group
									measurementData.responsiblePersons.forEach((person: unknown) => {
										const personData = person as Record<string, unknown>;
										stepGroups[stepId].responsiblePersons.push({
											role: (personData.role as string) || '',
											employeeName: (personData.employeeName as string) || '',
											employeeCode: (personData.employeeCode as string) || ''
										});
									});
								}
							});

							// Convert to array for rendering
							responsiblePersons = Object.values(stepGroups);
							displayResponsiblePersons =
								responsiblePersons.filter(e => e?.responsiblePersons?.length)?.length > 0 ? true : false;
						}

						return (
							displayResponsiblePersons && (
								<Box sx={{ mt: 2 }}>
									<Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#333' }}>
										Responsible Person Details:
									</Typography>

									{responsiblePersons.map((stepGroup: StepGroup, groupIndex: number) =>
										stepGroup.responsiblePersons.length ? (
											<Box key={groupIndex} sx={{ mb: 2 }}>
												{/* Step Header */}
												<Box
													sx={{
														backgroundColor: '#f5f5f5',
														p: 1.5,
														borderRadius: '4px 4px 0 0',
														border: '1px solid #e0e0e0',
														borderBottom: 'none'
													}}
												>
													<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333', fontSize: '0.9rem' }}>
														{stepGroup.parameterDescription}
													</Typography>
												</Box>

												{/* Responsible Persons Table */}
												<TableContainer
													component={Paper}
													variant="outlined"
													sx={{ borderRadius: '0 0 4px 4px', borderTop: 'none' }}
												>
													<Table size="small">
														<TableHead>
															<TableRow sx={{ backgroundColor: '#fafafa' }}>
																<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Role</TableCell>
																<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Employee Name</TableCell>
																<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Employee Code</TableCell>
															</TableRow>
														</TableHead>
														<TableBody>
															{stepGroup.responsiblePersons.map((person: ResponsiblePerson, personIndex: number) => (
																<TableRow key={personIndex} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
																	<TableCell sx={{ fontSize: '0.875rem', py: 1 }}>
																		{person.role?.toUpperCase()}
																	</TableCell>
																	<TableCell sx={{ fontSize: '0.875rem', py: 1 }}>{person.employeeName}</TableCell>
																	<TableCell sx={{ fontSize: '0.875rem', py: 1 }}>{person.employeeCode}</TableCell>
																</TableRow>
															))}
														</TableBody>
													</Table>
												</TableContainer>
											</Box>
										) : (
											<></>
										)
									)}
								</Box>
							)
						);
					})()}
				</Box>
			);
		}

		if (previewData.type === 'inspection') {
			// Handle inspection data - show as detailed inspection report table
			const inspectionParams = sortByNumericOrder(previewData.inspectionParameters || []);
			const inspectionMeta = previewData.inspectionMetadata;
			const rawInspectionEntries = Object.entries(data).filter(([key]) => /^\d+$/.test(key));
			const inspectionEntryById = new Map(rawInspectionEntries);
			const knownParameterIds = new Set(inspectionParams.map(parameter => parameter.id.toString()));
			const orderedInspectionEntries: Array<[string, unknown]> = [
				...inspectionParams.flatMap(parameter => {
					const parameterId = parameter.id.toString();
					return inspectionEntryById.has(parameterId)
						? ([[parameterId, inspectionEntryById.get(parameterId)]] as Array<[string, unknown]>)
						: [];
				}),
				...rawInspectionEntries.filter(([parameterId]) => !knownParameterIds.has(parameterId))
			];
			const hasAnyAnnotationData = orderedInspectionEntries.some(([, parameterData]) => {
				if (typeof parameterData !== 'object' || parameterData === null) return false;
				const parameterRecord = parameterData as Record<string, unknown>;
				const direct = Array.isArray(parameterRecord.annotations) && parameterRecord.annotations.length > 0;
				const row = Array.isArray(parameterRecord.rowAnnotations)
					? parameterRecord.rowAnnotations.some(
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							ra => Array.isArray((ra as any).annotations) && (ra as any).annotations.length > 0
					  )
					: false;
				return direct || row;
			});

			type PreviewRegion = Record<string, unknown>;
			const renderAnnotationRegions = (annotation: PreviewAnnotation) => {
				if (!annotation?.regions || annotation.regions.length === 0) return null;
				return (
					<Box sx={{ mt: 1 }}>
						<Typography variant="caption" sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}>
							Annotation Details:
						</Typography>
						{annotation.regions.map((region, regionIndex: number) => {
							const regionObj = region as PreviewRegion;
							const regionType = String(regionObj.type || '');
							return (
							<Box
								key={regionIndex}
								sx={{
									mt: 0.5,
									p: 1,
									backgroundColor: '#fff',
									borderRadius: 0.5,
									border: '1px solid #e0e0e0'
								}}
							>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
									<Chip
										label={`${regionIndex + 1}`}
										size="small"
										sx={{
											backgroundColor: '#f44336',
											color: 'white',
											fontSize: '0.6rem',
											fontWeight: 'bold',
											height: 16,
											minWidth: 20,
											'& .MuiChip-label': { px: 0.5 }
										}}
									/>
									<Chip
											label={regionType}
										size="small"
										sx={{
												backgroundColor: regionType === 'point' ? '#e8f5e8' : '#fff3e0',
												color: regionType === 'point' ? '#4caf50' : '#f57c00',
											fontSize: '0.6rem',
											height: 16
										}}
									/>
								</Box>
									{regionObj.comment && (
									<Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#333', fontStyle: 'italic' }}>
											"{String(regionObj.comment)}"
									</Typography>
								)}
									{regionObj.category && (
									<Box sx={{ mt: 0.5 }}>
										<Chip
												label={String(regionObj.category)}
											size="small"
											sx={{
												backgroundColor: '#e3f2fd',
												color: '#1976d2',
												fontSize: '0.6rem',
												height: 18
											}}
										/>
									</Box>
								)}
							</Box>
						);
						})}
					</Box>
				);
			};

			// Debug logging for inspection preview
			console.log('🖼️ INSPECTION_PREVIEW_DEBUG:', {
				previewData,
				data: previewData.data,
				dataKeys: Object.keys(previewData.data),
				filteredKeys: Object.keys(previewData.data).filter(
					key => key !== 'data' && key !== 'startTime' && key !== 'endTime'
				),
				inspectionParams,
				inspectionMeta,
				parameterCount: Object.keys(previewData.data).filter(
					key => key !== 'data' && key !== 'startTime' && key !== 'endTime'
				).length
			});

			return (
				<Box>
					{renderEditedAfterSubmitNote()}
					{renderTimingExceededSection()}
					{/* Inspection Metadata Header */}
					{inspectionMeta && (
						<Box sx={{ mb: 2, p: 1.5, backgroundColor: '#e3f2fd', borderRadius: 1, border: '1px solid #bbdefb' }}>
							<Grid container spacing={1.5}>
								<Grid size={{ xs: 6, sm: 4 }}>
									<Typography variant="caption" sx={{ fontWeight: 600, color: '#1565c0', fontSize: '0.75rem' }}>
										Type
									</Typography>
									<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1565c0' }}>
										{inspectionMeta.type}
									</Typography>
								</Grid>
								<Grid size={{ xs: 6, sm: 4 }}>
									<Typography variant="caption" sx={{ fontWeight: 600, color: '#1565c0', fontSize: '0.75rem' }}>
										Status
									</Typography>
									<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1565c0' }}>
										{inspectionMeta.status}
									</Typography>
								</Grid>
								<Grid size={{ xs: 6, sm: 4 }}>
									<Typography variant="caption" sx={{ fontWeight: 600, color: '#1565c0', fontSize: '0.75rem' }}>
										Version
									</Typography>
									<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1565c0' }}>
										v{inspectionMeta.version}
									</Typography>
								</Grid>
							</Grid>
						</Box>
					)}

					<Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: '#333', fontSize: '1.1rem' }}>
						Inspection Report (
						{
							Object.keys(data).filter(
								key =>
									key !== 'data' &&
									key !== 'startTime' &&
									key !== 'endTime' &&
									key !== 'stepCompleted' &&
									key !== 'productionApproved' &&
									key !== 'ctqApproved'
							).length
						}{' '}
						parameters)
					</Typography>
					<TableContainer
						component={Paper}
						variant="outlined"
						sx={embeddedReportMode ? undefined : { maxHeight: 400 }}
					>
						<Table size="small" stickyHeader={!embeddedReportMode}>
							<TableHead>
								<TableRow sx={{ backgroundColor: '#f5f5f5' }}>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>#</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Parameter</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Type</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Value</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>{GATE_FIELD_LABEL}</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Specification</TableCell>
									<TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Status</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{orderedInspectionEntries.map(([parameterId, parameterData], index) => {
										// Find the corresponding inspection parameter metadata
										const paramMeta = inspectionParams.find(p => p.id.toString() === parameterId);

										// Handle different data structures
									let displayValue = '';
									let hasAnnotations = false;
									let isMultiColumn = false;
									let isTableType = false;
									let isFixedTableType = false;
									let tableRowCount = 0;
									const criticality = resolveCriticality(paramMeta);
									let parameterName = paramMeta?.parameterName || `Parameter ${parameterId}`;
									let parameterType = paramMeta?.type || 'text';
									let specification = paramMeta?.specification || 'N/A';
									let notOkComment = '';
									let okNotOkMultiColumnHasNegative = false;
									let singleOkNotOkParsed: { value: string; notOkComment: string } | null = null;

									if (parameterType === 'table' && paramMeta?.columns && paramMeta.columns.length > 0) {
										isTableType = true;
									}

									if (parameterType === 'fixed-table' && (paramMeta as Record<string, unknown>)?.tableConfig) {
										isFixedTableType = true;
									}

									if (typeof parameterData === 'object' && parameterData !== null) {
										const paramObj = parameterData as Record<string, unknown>;

										if (paramObj.annotations && Array.isArray(paramObj.annotations)) {
											hasAnnotations = true;
										}

										if (paramObj.value) {
											if (isFixedTableType && Array.isArray(paramObj.value)) {
												tableRowCount = (paramObj.value as unknown[]).length;
												displayValue = `${tableRowCount} row${tableRowCount !== 1 ? 's' : ''}`;
											} else if (isTableType && Array.isArray(paramObj.value)) {
												isMultiColumn = true;
												tableRowCount = (paramObj.value as unknown[]).length;
												displayValue = `${tableRowCount} row${tableRowCount !== 1 ? 's' : ''}`;
											} else if (
													typeof paramObj.value === 'object' &&
													paramObj.value !== null &&
													!Array.isArray(paramObj.value)
												) {
													// Multi-column data: { "value": { "Date": "213", "Name": "1" } }
													isMultiColumn = true;
													const valueObj = paramObj.value as Record<string, unknown>;
													displayValue = Object.entries(valueObj)
														.map(([col, val]) => {
															// Format values based on parameter type
															if (parameterType === 'ok/not ok') {
																const parsedValue = parseOkNotOkValue(val);
																if (isNegativeOkNotOk(parsedValue.value)) {
																	okNotOkMultiColumnHasNegative = true;
																}
																const formatted = formatOkNotOkValueForDisplay(parsedValue.value);
																const commentSuffix =
																	isNegativeOkNotOk(parsedValue.value) && parsedValue.notOkComment.trim()
																		? ` (Comment: ${
																				truncateCommentForPreview(parsedValue.notOkComment).display
																		  })`
																		: '';
																return `${col}: ${formatted}${commentSuffix}`;
															} else if (parameterType === 'datetime') {
																return `${col}: ${val}`;
															}
															return `${col}: ${val}`;
														})
														.join(', ');
												} else {
													// Single value
													if (parameterType === 'ok/not ok') {
														const parsedValue = parseOkNotOkValue(paramObj.value);
														const value = parsedValue.value;
														notOkComment =
															parsedValue.notOkComment ||
															(typeof paramObj.comments === 'string' ? String(paramObj.comments) : '') ||
															(typeof paramObj.notOkComment === 'string' ? String(paramObj.notOkComment) : '');
														singleOkNotOkParsed = { value, notOkComment };
														displayValue = formatOkNotOkValueForDisplay(value);
													} else {
														const value = String(paramObj.value);
														displayValue = value;
													}
												}
											}
										} else {
											// Simple string/number value
											const value = String(parameterData);
											if (parameterType === 'ok/not ok') {
												const p = parseOkNotOkValue(parameterData);
												singleOkNotOkParsed = p;
												notOkComment = p.notOkComment;
												displayValue = formatOkNotOkValueForDisplay(p.value);
											} else {
												displayValue = value;
											}
										}

										return (
											<React.Fragment key={parameterId}>
												{/* Main Row */}
												<TableRow
												sx={{
													'&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
													'&:hover': { backgroundColor: '#f0f0f0' },
													cursor:
														embeddedReportMode || !(isMultiColumn || isTableType || isFixedTableType)
															? 'default'
															: 'pointer'
												}}
												onClick={
													embeddedReportMode || !(isMultiColumn || isTableType || isFixedTableType)
														? undefined
														: () => toggleMultiValueParam(parameterId)
												}
											>
												<TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
														{!embeddedReportMode &&
															(isMultiColumn || isTableType || isFixedTableType) && (
																<IconButton size="small" sx={{ p: 0.25 }}>
																	{expandedMultiValueParams.has(parameterId) ? <ExpandLess /> : <ExpandMore />}
																</IconButton>
															)}
															<Typography variant="body2" sx={{ fontWeight: 500 }}>
																{index + 1}
															</Typography>
														</Box>
													</TableCell>
													<TableCell sx={descriptionTableCellSx(embeddedReportMode)}>
														<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
															<Typography
																variant="body2"
																sx={descriptionTextSx(embeddedReportMode)}
																title={parameterName}
															>
																{parameterName}
															</Typography>
															{hasAnnotations && (
																<Chip
																	label="Images"
																	size="small"
																	sx={{
																		backgroundColor: '#e3f2fd',
																		color: '#1976d2',
																		fontSize: '0.6rem',
																		height: 16,
																		'& .MuiChip-label': { px: 0.5 }
																	}}
																/>
															)}
															{isTableType && (
																<Chip
																	label="Table"
																	size="small"
																	sx={{
																		backgroundColor: '#e1f5fe',
																		color: '#0277bd',
																		fontSize: '0.6rem',
																		height: 16,
																		'& .MuiChip-label': { px: 0.5 }
																	}}
																/>
															)}
															{isFixedTableType && (
																<Chip
																	label="Fixed Table"
																	size="small"
																	sx={{
																		backgroundColor: '#f3e8ff',
																		color: '#7b1fa2',
																		fontSize: '0.6rem',
																		height: 16,
																		'& .MuiChip-label': { px: 0.5 }
																	}}
																/>
															)}
															{isMultiColumn && !isTableType && (
																<Chip
																	label="Multi"
																	size="small"
																	sx={{
																		backgroundColor: '#f3e5f5',
																		color: '#7b1fa2',
																		fontSize: '0.6rem',
																		height: 16,
																		'& .MuiChip-label': { px: 0.5 }
																	}}
																/>
															)}
															{paramMeta?.files && paramMeta.files.length > 0 && (
																<Chip
																	label={`${paramMeta.files.length} files`}
																	size="small"
																	sx={{
																		backgroundColor: '#e8f5e8',
																		color: '#4caf50',
																		fontSize: '0.6rem',
																		height: 16,
																		'& .MuiChip-label': { px: 0.5 }
																	}}
																/>
															)}
														</Box>
													</TableCell>
													<TableCell sx={{ py: 1, fontSize: '0.8rem', color: '#666' }}>{formatOkNotOkTypeForDisplay(parameterType)}</TableCell>
												<TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
													{isFixedTableType ? (
														<Typography variant="body2" sx={{ fontWeight: 600, color: '#7b1fa2' }}>
															{tableRowCount} row{tableRowCount !== 1 ? 's' : ''}
														</Typography>
													) : isTableType ? (
														<Typography variant="body2" sx={{ fontWeight: 600, color: '#0277bd' }}>
															{tableRowCount} row{tableRowCount !== 1 ? 's' : ''}
														</Typography>
													) : isMultiColumn ? (
															<Typography variant="body2" sx={{ fontWeight: 600, color: '#7b1fa2' }}>
																{
																	Object.keys(
																		(parameterData as Record<string, unknown>).value as Record<string, unknown>
																	).length
																}{' '}
																fields
															</Typography>
														) : (
															<>
																<Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
																	{displayValue}
																</Typography>
																{parameterType === 'ok/not ok' &&
																	singleOkNotOkParsed &&
																	isNegativeOkNotOk(singleOkNotOkParsed.value) &&
																	notOkComment.trim() && (
																	<NotOkCommentPreview comment={notOkComment} />
																)}
															</>
														)}
													</TableCell>
													<TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
														<Chip
															label={formatInspectionCriticality(paramMeta)}
															size="small"
															sx={{
																backgroundColor: CRITICALITY_CHIP_TINT[criticality].background,
																color: CRITICALITY_CHIP_TINT[criticality].color,
																fontSize: '0.7rem',
																height: 20
															}}
														/>
													</TableCell>
													<TableCell sx={descriptionTableCellSx(embeddedReportMode, 150)}>
														<Typography
															variant="body2"
															sx={descriptionTextSx(embeddedReportMode, { fontWeight: 400 })}
															title={specification}
														>
															{specification}
														</Typography>
													</TableCell>
													<TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
														{parameterType === 'ok/not ok' && !isTableType && !isFixedTableType ? (
															(() => {
																if (isMultiColumn) {
																	return renderOkNotOkResultStatusIcon({
																		value: okNotOkMultiColumnHasNegative ? 'not ok' : 'ok',
																		notOkComment: ''
																	});
																}
																if (singleOkNotOkParsed && isNegativeOkNotOk(singleOkNotOkParsed.value)) {
																	return renderOkNotOkResultStatusIcon({
																		value: 'not ok',
																		notOkComment: ''
																	});
																}
																if (singleOkNotOkParsed?.value === 'ok') {
																	return renderOkNotOkResultStatusIcon({
																		value: 'ok',
																		notOkComment: ''
																	});
																}
																return (
																	<Box
																		sx={{
																			display: 'flex',
																			alignItems: 'center',
																			justifyContent: 'center',
																			width: 24,
																			height: 24,
																			borderRadius: '50%',
																			backgroundColor: '#e8f5e8'
																		}}
																	>
																		<CheckCircle sx={{ color: '#4caf50', fontSize: 16 }} />
																	</Box>
																);
															})()
														) : (
															<Box
																sx={{
																	display: 'flex',
																	alignItems: 'center',
																	justifyContent: 'center',
																	width: 24,
																	height: 24,
																	borderRadius: '50%',
																	backgroundColor: '#e8f5e8'
																}}
															>
																<CheckCircle sx={{ color: '#4caf50', fontSize: 16 }} />
															</Box>
														)}
													</TableCell>
												</TableRow>

											{/* Collapsible Detail Row for Fixed-Table Parameters */}
											{isFixedTableType && (
												<TableRow>
													<TableCell colSpan={7} sx={{ py: 0, border: 'none' }}>
														<Collapse
															in={embeddedReportMode || expandedMultiValueParams.has(parameterId)}
															timeout="auto"
															unmountOnExit={!embeddedReportMode}
														>
															<Box sx={{ p: 2, backgroundColor: '#f0f4ff', borderRadius: '8px', m: 1 }}>
																<Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#1a237e' }}>
																	{parameterName} - Fixed Table Data
																</Typography>
																{(() => {
																	const tc = (paramMeta as Record<string, unknown>)?.tableConfig as {
																		columns?: Array<{ name: string; type: string }>;
																		rows?: Array<{ cells: Record<string, { value: string; readOnly: boolean }> }>;
																	} | null;
																	const rows = Array.isArray((parameterData as Record<string, unknown>).value)
																		? ((parameterData as Record<string, unknown>).value as Record<string, string>[])
																		: [];
																	const rowMappings = Array.isArray(paramMeta?.rowMappings) ? paramMeta.rowMappings : [];
																	const rowAnnotations = Array.isArray((parameterData as Record<string, unknown>).rowAnnotations)
																		? ((parameterData as Record<string, unknown>).rowAnnotations as Array<{
																				rowIndex: number;
																				annotations: Array<{
																					imageFileName: string;
																					imageUrl?: string;
																					regions?: unknown[];
																				}>;
																			}>)
																		: [];
																	if (!tc?.columns) return <Typography variant="body2" color="text.secondary">No table configuration</Typography>;
																	return (
																		<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflow: 'hidden' }}>
																			<Table size="small">
																				<TableHead>
																					<TableRow sx={{ backgroundColor: '#e8eaf6' }}>
																						{tc.columns.map(col => (
																							<TableCell key={col.name} sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75, px: 1, borderRight: '1px solid #e0e0e0' }}>
																								{col.name}
																								<Typography variant="caption" sx={{ display: 'block', color: '#666', fontWeight: 400, fontSize: '0.65rem' }}>
																									{col.type}
																								</Typography>
																							</TableCell>
																						))}
																						<TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75, px: 1 }}>
																							Row Images
																						</TableCell>
																					</TableRow>
																				</TableHead>
																				<TableBody>
																					{rows.map((row, rIdx) => (
																						<TableRow key={rIdx} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}>
																							{tc.columns!.map(col => {
																								const cellConfig = tc.rows?.[rIdx]?.cells?.[col.name];
																								const cellValue = row[col.name] || '';
																								const displayValue = formatTableCellDisplay(col.type, cellValue);
																								return (
																									<TableCell
																										key={col.name}
																										sx={{
																											fontSize: '0.75rem',
																											py: 0.5,
																											px: 1,
																											borderRight: '1px solid #e0e0e0',
																											maxWidth: 150,
																											...(cellConfig?.readOnly ? { backgroundColor: '#f5f5f5', fontStyle: 'italic' } : {})
																										}}
																									>
																										<Typography variant="body2" sx={descriptionTextSx(embeddedReportMode, { fontWeight: 400 })} title={displayValue}>
																											{displayValue}
																										</Typography>
																									</TableCell>
																								);
																							})}
																							<TableCell sx={{ minWidth: 260 }}>
																								{(() => {
																									const mappedFiles = rowMappings.find(m => m.rowIndex === rIdx)?.fileName || [];
																									const rowAnn = rowAnnotations.find(a => a.rowIndex === rIdx)?.annotations || [];
																									if (rowAnn.length === 0) {
																										return (
																											<Typography variant="caption" sx={{ color: '#999' }}>
																												No row annotations
																											</Typography>
																										);
																									}

																									return (
																										<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
																											{rowAnn.map((annotation, annIdx) => {
																												const mappedFile =
																													findMatchingPreviewFile(mappedFiles, annotation) ||
																													findMatchingPreviewFile(paramMeta?.files || [], annotation);
																												const imageUrl = buildPreviewImageUrl(annotation, mappedFile);
																												return (
																													<Box key={`${parameterId}-${rIdx}-${annIdx}-${annotation.imageFileName}`}>
																														<ImageDisplay
																															imageUrl={imageUrl}
																															imageFileName={annotation.imageFileName}
																															originalFileName={
																																mappedFile?.originalFileName || annotation.imageFileName
																															}
																															annotations={annotation.regions || []}
																															readOnly={true}
																															showAnnotations={true}
																														/>
																														{renderAnnotationRegions(annotation)}
																													</Box>
																												);
																											})}
																										</Box>
																									);
																								})()}
																							</TableCell>
																						</TableRow>
																					))}
																				</TableBody>
																			</Table>
																		</TableContainer>
																	);
																})()}
															</Box>
														</Collapse>
													</TableCell>
												</TableRow>
											)}

											{/* Collapsible Detail Row for Multi-Column and Table Parameters */}
											{isMultiColumn && (
													<TableRow>
														<TableCell colSpan={7} sx={{ py: 0, border: 'none' }}>
															<Collapse
															in={embeddedReportMode || expandedMultiValueParams.has(parameterId)}
															timeout="auto"
															unmountOnExit={!embeddedReportMode}
														>
																<Box
																	sx={{
																		p: 2,
																		backgroundColor: isTableType ? '#f0f4ff' : '#f8f9fa',
																		border: isTableType ? 'none' : '1px solid #e0e0e0',
																		borderRadius: '8px',
																		m: 1
																	}}
																>
																	<Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: isTableType ? '#1a237e' : '#333' }}>
																		{parameterName} - {isTableType ? 'Table Data' : 'Detailed Values'}
																	</Typography>
																	<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflow: 'hidden' }}>
																		<Table size="small">
																			<TableHead>
																				<TableRow sx={{ backgroundColor: '#e8eaf6' }}>
																					{paramMeta?.columns?.map(column => (
																						<TableCell
																							key={column.name}
																							sx={{
																								fontWeight: 600,
																								fontSize: '0.75rem',
																								py: 0.75,
																								px: 1,
																								borderRight: '1px solid #e0e0e0'
																							}}
																						>
																							{column.name}
																							{isTableType && (
																								<Typography variant="caption" sx={{ display: 'block', color: '#666', fontWeight: 400, fontSize: '0.65rem' }}>
																									{formatOkNotOkTypeForDisplay(column.type)}
																								</Typography>
																							)}
																						</TableCell>
																					))}
																				</TableRow>
																			</TableHead>
																			<TableBody>
																				{isTableType &&
																				Array.isArray((parameterData as Record<string, unknown>).value) ? (
																					// Table type: render multiple rows
																					(
																						(parameterData as Record<string, unknown>).value as Record<
																							string,
																							unknown
																						>[]
																					).map((row, rowIndex) => (
																						<TableRow key={rowIndex} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}>
																							{paramMeta?.columns?.map(column => {
																								const value = row[column.name];
																								const parsedValue =
																									column.type === 'ok/not ok'
																										? parseOkNotOkValue(value)
																										: { value: String(value || ''), notOkComment: '' };
																								const formattedValue =
																									column.type === 'ok/not ok'
																										? formatOkNotOkValueForDisplay(parsedValue.value)
																										: formatTableCellDisplay(column.type, value);

																								return (
																									<TableCell
																										key={column.name}
																										sx={{
																											fontSize: '0.75rem',
																											py: 0.5,
																											px: 1,
																											borderRight: '1px solid #e0e0e0',
																											maxWidth: 150
																										}}
																									>
																										<Typography
																											variant="body2"
																											sx={descriptionTextSx(embeddedReportMode, { fontWeight: 400 })}
																											title={formattedValue}
																										>
																											{formattedValue}
																										</Typography>
																										{column.type === 'ok/not ok' &&
																											isNegativeOkNotOk(parsedValue.value) &&
																											parsedValue.notOkComment.trim() && (
																												<NotOkCommentPreview comment={parsedValue.notOkComment} />
																											)}
																									</TableCell>
																								);
																							})}
																						</TableRow>
																					))
																				) : (
																					// Multi-column single row
																					<TableRow>
																						{paramMeta?.columns?.map(column => {
																							const value = (
																								(parameterData as Record<string, unknown>).value as Record<
																									string,
																									unknown
																								>
																							)[column.name];
																							const parsedValue =
																								column.type === 'ok/not ok'
																									? parseOkNotOkValue(value)
																									: { value: String(value), notOkComment: '' };
																							const formattedValue =
																								column.type === 'ok/not ok'
																									? formatOkNotOkValueForDisplay(parsedValue.value)
																									: formatTableCellDisplay(column.type, value);

																							return (
																								<TableCell
																									key={column.name}
																									sx={{
																										fontSize: '0.75rem',
																										py: 0.5,
																										px: 1,
																										borderRight: '1px solid #e0e0e0',
																										maxWidth: 150
																									}}
																								>
																									<Typography
																										variant="body2"
																										sx={descriptionTextSx(embeddedReportMode, { fontWeight: 400 })}
																										title={formattedValue}
																									>
																										{formattedValue}
																									</Typography>
																									{column.type === 'ok/not ok' &&
																										isNegativeOkNotOk(parsedValue.value) &&
																										parsedValue.notOkComment.trim() && (
																											<NotOkCommentPreview comment={parsedValue.notOkComment} />
																										)}
																								</TableCell>
																							);
																						})}
																					</TableRow>
																				)}
																			</TableBody>
																		</Table>
																	</TableContainer>
																</Box>
															</Collapse>
														</TableCell>
													</TableRow>
												)}
											</React.Fragment>
										);
								})}
							</TableBody>
						</Table>
					</TableContainer>

					{/* Image Annotations Section */}
					{hasAnyAnnotationData && (
						<Box sx={{ mt: 2 }}>
							<Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: '#333', fontSize: '1.1rem' }}>
								Image Annotations
							</Typography>
							{orderedInspectionEntries.map(([parameterId, parameterData]) => {
									// Find the corresponding inspection parameter metadata
									const paramMeta = inspectionParams.find(p => p.id.toString() === parameterId);

									if (typeof parameterData === 'object' && parameterData !== null) {
										const parameterDataObj = parameterData as Record<string, unknown>;
										const annotations = Array.isArray(parameterDataObj.annotations)
											? (parameterDataObj.annotations as PreviewAnnotation[])
											: [];
										const rowAnnotations = Array.isArray(parameterDataObj.rowAnnotations)
											? (parameterDataObj.rowAnnotations as PreviewRowAnnotationEntry[])
											: [];
										const hasRowAnnotations = rowAnnotations.some(
											ra => Array.isArray(ra.annotations) && ra.annotations.length > 0
										);
										console.log('🖼️ StepPreview: Processing annotations for parameter:', {
											parameterId,
											parameterData,
											annotations,
											isArray: Array.isArray(annotations),
											length: annotations?.length
										});

										if ((Array.isArray(annotations) && annotations.length > 0) || hasRowAnnotations) {
											return (
												<Box key={parameterId} sx={{ mb: 2 }}>
													<Paper variant="outlined" sx={{ p: 2 }}>
														<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#1976d2' }}>
															{paramMeta?.parameterName || `Parameter ${parameterId}`}
														</Typography>
														{annotations.map((annotation: PreviewAnnotation, annotationIndex: number) => {
															const matchedFile = findMatchingPreviewFile(paramMeta?.files || [], annotation);
															const originalFileName = matchedFile?.originalFileName || annotation.imageFileName;
															const imageUrl = buildPreviewImageUrl(annotation, matchedFile);

															console.log('🖼️ StepPreview: Image URL construction:', {
																parameterId,
																annotationIndex,
																annotation,
																paramMeta,
																imageUrl,
																annotationImageUrl: annotation.imageUrl,
																constructedUrl: toFileRenderUrl(
																	paramMeta?.files?.find(file => file.fileName === annotation.imageFileName)?.filePath
																)
															});

															return (
																<Box
																	key={annotationIndex}
																	sx={{
																		mb: 2,
																		p: 1.5,
																		backgroundColor: '#f8f9fa',
																		borderRadius: 1,
																		border: '1px solid #e9ecef'
																	}}
																>
																	{/* Image Display with Annotations */}
																	<Box sx={{ mb: 2 }}>
																		<ImageDisplay
																			key={`${parameterId}-${annotationIndex}-${annotation.imageFileName}`}
																			imageUrl={imageUrl}
																			imageFileName={annotation.imageFileName}
																			originalFileName={originalFileName}
																			annotations={annotation.regions || []}
																			readOnly={true}
																			showAnnotations={true}
																		/>
																	</Box>

																	{renderAnnotationRegions(annotation)}
																</Box>
															);
														})}
														{hasRowAnnotations && (
															<Box sx={{ mt: 1.5 }}>
																<Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#6a1b9a' }}>
																	Row-Mapped Defects
																</Typography>
																{rowAnnotations.map((rowEntry: PreviewRowAnnotationEntry) => {
																	const rowAnns = Array.isArray(rowEntry?.annotations) ? rowEntry.annotations : [];
																	const rowIndex = Number(rowEntry?.rowIndex);
																	const rowMappedFiles = Array.isArray(paramMeta?.rowMappings)
																		? paramMeta.rowMappings.find(rm => rm.rowIndex === rowIndex)?.fileName || []
																		: [];
																	if (rowAnns.length === 0) return null;
																	return (
																		<Box key={`${parameterId}-row-${rowIndex}`} sx={{ mb: 1.5, p: 1, backgroundColor: '#f7f0ff', borderRadius: 1 }}>
																			<Typography variant="caption" sx={{ fontWeight: 600, color: '#6a1b9a' }}>
																				Row {rowIndex + 1}
																			</Typography>
																			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0.75 }}>
																				{rowAnns.map((annotation: PreviewAnnotation, rowAnnIndex: number) => {
																					const matchedFile =
																						findMatchingPreviewFile(rowMappedFiles, annotation) ||
																						findMatchingPreviewFile(paramMeta?.files || [], annotation);
																					return (
																						<Box key={`${parameterId}-row-${rowIndex}-ann-${rowAnnIndex}`}>
																							<ImageDisplay
																								imageUrl={buildPreviewImageUrl(annotation, matchedFile)}
																								imageFileName={annotation.imageFileName}
																								originalFileName={matchedFile?.originalFileName || annotation.imageFileName}
																								annotations={annotation.regions || []}
																								readOnly={true}
																								showAnnotations={true}
																							/>
																							{renderAnnotationRegions(annotation)}
																						</Box>
																					);
																				})}
																			</Box>
																		</Box>
																	);
																})}
															</Box>
														)}
													</Paper>
												</Box>
											);
										}
									}
									return null;
								})}
						</Box>
					)}

					{/* Summary Statistics */}
					<Box sx={{ mt: 2, p: 1.5, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
						<Grid container spacing={1.5}>
							<Grid size={{ xs: 6, sm: 3 }}>
								<Typography variant="caption" sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}>
									Total Parameters
								</Typography>
								<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
									{orderedInspectionEntries.length}
								</Typography>
							</Grid>
							<Grid size={{ xs: 6, sm: 3 }}>
								<Typography variant="caption" sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}>
									Gate Parameters
								</Typography>
								<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
									{inspectionParams.filter(p => p.ctq).length}
								</Typography>
							</Grid>
							<Grid size={{ xs: 6, sm: 3 }}>
								<Typography variant="caption" sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}>
									With Images
								</Typography>
								<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
									{
										Object.values(data).filter(
											// eslint-disable-next-line @typescript-eslint/no-explicit-any
											(param: any) =>
												typeof param === 'object' && param?.annotations && Array.isArray(param.annotations)
										).length
									}
								</Typography>
							</Grid>
							<Grid size={{ xs: 6, sm: 3 }}>
								<Typography variant="caption" sx={{ fontWeight: 500, color: '#666', fontSize: '0.75rem' }}>
									Total Annotations
								</Typography>
								<Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
									{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
									{Object.values(data).reduce((total: number, param: any) => {
										if (typeof param === 'object' && param?.annotations && Array.isArray(param.annotations)) {
											return (
												total +
												// eslint-disable-next-line @typescript-eslint/no-explicit-any
												param.annotations.reduce((annotationTotal: number, annotation: any) => {
													return annotationTotal + (annotation.regions?.length || 0);
												}, 0)
											);
										}
										return total;
									}, 0)}
								</Typography>
							</Grid>
						</Grid>
					</Box>
				</Box>
			);
		}

		// Fallback for other types
		return (
			<Box>
				<Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
					Step Completed
				</Typography>
				<Card variant="outlined" sx={{ backgroundColor: '#f8f9fa' }}>
					<CardContent sx={{ textAlign: 'center', py: 3 }}>
						<CheckCircle sx={{ fontSize: 48, color: '#4caf50', mb: 2 }} />
						<Typography variant="body1" sx={{ color: '#666' }}>
							This step has been completed successfully
						</Typography>
					</CardContent>
				</Card>
			</Box>
		);
	};

	if (embeddedReportMode) {
		return (
			<Box sx={{ py: 0 }}>
				<Card variant="outlined" sx={{ border: 'none', boxShadow: 'none', bgcolor: 'transparent' }}>
					<CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>{renderDataSummary()}</CardContent>
				</Card>
			</Box>
		);
	}

	return (
		<Box sx={{ p: 2 }}>
			{/* Header with Approval Buttons */}
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<IconButton onClick={onBackToStep} sx={{ mr: 1, p: 0.5 }}>
						<ArrowBack />
					</IconButton>
					<Avatar sx={{ bgcolor: 'success.main', mr: 1, width: 32, height: 32 }}>
						<Visibility sx={{ fontSize: 18 }} />
					</Avatar>
					<Box>
						<Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
							Step {previewData.stepNumber} -{' '}
							{previewData.type === 'inspection' ? 'Inspection Report' : 'Measurement Report'}
						</Typography>
						<Typography variant="caption" sx={{ color: 'text.secondary' }}>
							{previewData.title}
						</Typography>
						{previewData.type === 'sequence' &&
							previewData.description &&
							previewData.description !== previewData.title && (
								<Typography variant="body2" sx={{ color: 'text.secondary', display: 'block', mt: 0.25, lineHeight: 1.35 }}>
									{previewData.description}
								</Typography>
							)}
					</Box>
				</Box>

				{/* Approval Buttons in Header */}
				{!readOnlyMode && (
				<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
					<Button
						variant={productionApproved ? 'outlined' : 'contained'}
						color={productionApproved ? 'success' : 'primary'}
						onClick={handleApproveProduction}
						disabled={
							!delayDocumentationSatisfied ||
							productionApproved ||
							(!canApproveProduction && !(previewData.type === 'inspection' && canApproveCTQ))
						}
						startIcon={<Check />}
						size="small"
					>
						{productionApproved
							? previewData.type === 'inspection'
								? 'Inspection Approved'
								: 'Production Approved'
							: previewData.type === 'inspection'
								? 'Approve Inspection'
								: 'Approve Production'}
					</Button>
					{previewData.ctq && (
						<>
							<ButtonGroup variant={ctqApproved || partialCtqApproved ? 'outlined' : 'contained'} size="small">
								<Button
									color={ctqApproved || partialCtqApproved ? 'success' : 'warning'}
									onClick={handleApproveCTQ}
									disabled={
										!delayDocumentationSatisfied ||
										ctqApproved ||
										partialCtqApproved ||
										!canApproveCTQ
									}
									startIcon={<Check />}
								>
									{ctqApproved
										? 'CTQ Approved'
										: partialCtqApproved
											? 'Partially Approved'
											: ctqApprovalMode === 'partial'
												? 'Partially CTQ Approve'
												: 'CTQ Approve'}
								</Button>
								<Button
									color={ctqApproved || partialCtqApproved ? 'success' : 'warning'}
									onClick={handleCtqMenuOpen}
									disabled={
										!delayDocumentationSatisfied ||
										ctqApproved ||
										partialCtqApproved ||
										!canApproveCTQ
									}
									sx={{ minWidth: 'auto', px: 1 }}
								>
									<ArrowDropDown />
								</Button>
							</ButtonGroup>
							<Menu
								anchorEl={ctqMenuAnchor}
								open={Boolean(ctqMenuAnchor)}
								onClose={handleCtqMenuClose}
								anchorOrigin={{
									vertical: 'bottom',
									horizontal: 'left'
								}}
								transformOrigin={{
									vertical: 'top',
									horizontal: 'left'
								}}
							>
								<MenuItem onClick={handleSelectFullApproval} selected={ctqApprovalMode === 'full'}>
									CTQ Approve
								</MenuItem>
								<MenuItem onClick={handleSelectPartialApproval} selected={ctqApprovalMode === 'partial'}>
									Partially CTQ Approve
								</MenuItem>
							</Menu>
						</>
					)}
					<Button
						variant="contained"
						color="success"
						onClick={() => onProceedToNext(buildTimingPayload())}
						disabled={!canProceed}
						startIcon={previewData.stepCompleted ? <CheckCircle /> : <ArrowForward />}
						size="small"
					>
						{previewData.stepCompleted ? 'Completed' : 'Complete Step'} 
					</Button>

					{/* Step Type Indicators */}
					<Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
						{previewData.ctq && (
							<Chip
								label="CTQ"
								sx={{
									backgroundColor: '#fff3e0',
									color: '#f57c00',
									fontSize: '0.7rem'
								}}
							/>
						)}
						<Chip
							label={previewData.type}
							sx={{
								backgroundColor: '#f5f5f5',
								color: '#666',
								fontSize: '0.7rem'
							}}
						/>
					</Box>
				</Box>
				)}
				{readOnlyMode && (
					<Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
						<Chip
							label={
								productionApproved
									? previewData.type === 'inspection'
										? 'Inspection approved'
										: 'Production approved'
									: 'Production pending'
							}
							size="small"
							color={productionApproved ? 'success' : 'default'}
							variant="outlined"
						/>
						{previewData.ctq && (
							<Chip
								label={
									ctqApproved
										? 'CTQ approved'
										: partialCtqApproved
											? 'Partially CTQ approved'
											: 'CTQ pending'
								}
								size="small"
								color={ctqApproved || partialCtqApproved ? 'success' : 'warning'}
								variant="outlined"
							/>
						)}
						{previewData.stepCompleted && (
							<Chip label="Step completed" size="small" color="success" variant="outlined" />
						)}
					</Box>
				)}
			</Box>

			{/* Report Data */}
			<Card variant="outlined" sx={{ mb: 2 }}>
				<CardContent sx={{ p: 2 }}>{renderDataSummary()}</CardContent>
			</Card>

			{/* CTQ Warning */}
			{!readOnlyMode && previewData.ctq && !ctqApproved && !partialCtqApproved && (
				<Alert severity="warning" sx={{ mb: 2 }}>
					This is a Critical to Quality (CTQ) step. Both Production and CTQ approvals are required to proceed.
				</Alert>
			)}

			{/* Back Button */}
			<Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
				<Button variant="outlined" onClick={onBackToStepGroup || onBackToStep} startIcon={<ArrowBack />} size="small">
					{onBackToStepGroup ? 'Back to Steps' : 'Back to Step'}
				</Button>
			</Box>
		</Box>
	);
};

export default StepPreview;
