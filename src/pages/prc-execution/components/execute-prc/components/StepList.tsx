import { Box, Typography, IconButton, Stack, Tooltip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ArrowForward, PictureAsPdf } from '@mui/icons-material';
import { useEffect, useRef } from 'react';
import { type TimelineStep } from '../../../types/execution.types';
import { isAlwaysAccessibleStep } from '../../../utils/stepGating';
import StepExecutionMetaSummary from '../../StepExecutionMetaSummary';

interface StepListProps {
	steps: TimelineStep[];
	currentStepIndex: number;
	frontierIndex?: number;
	onStepClick: (stepIndex: number) => void;
	previewMode?: boolean;
	stepStartEndTime?: Record<string, unknown>;
	executionId?: number;
}

type StepVisualStatus = 'completed' | 'active' | 'pending';

interface StepVisualConfig {
	status: StepVisualStatus;
	label: string | null;
	color: string;
}

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

const getStepVisualConfig = (
	step: TimelineStep,
	index: number,
	currentStepIndex: number,
	theme: ReturnType<typeof useTheme>
): StepVisualConfig => {
	if (step.status === 'completed') {
		return { status: 'completed', label: 'Completed', color: theme.palette.success.main };
	}
	if (step.status === 'in-progress' || index === currentStepIndex) {
		return { status: 'active', label: 'In progress', color: theme.palette.primary.main };
	}
	return { status: 'pending', label: null, color: theme.palette.grey[400] };
};

function StatusPill({ label, color }: { label: string; color: string }) {
	return (
		<Box
			sx={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 0.625,
				px: 1,
				py: 0.25,
				borderRadius: 10,
				bgcolor: alpha(color, 0.08),
				border: '1px solid',
				borderColor: alpha(color, 0.16)
			}}
		>
			<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
			<Typography sx={{ fontSize: '0.6875rem', fontWeight: 500, color, lineHeight: 1.2 }}>{label}</Typography>
		</Box>
	);
}

const StepList = ({
	steps,
	currentStepIndex,
	frontierIndex = currentStepIndex,
	onStepClick,
	previewMode = false,
	stepStartEndTime,
	executionId
}: StepListProps) => {
	const theme = useTheme();
	const currentStepRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		currentStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}, [currentStepIndex]);

	const isStepClickable = (step: TimelineStep, index: number) => {
		if (previewMode) return true;
		if (isAlwaysAccessibleStep(step)) return true;
		return step.status === 'completed' || index === frontierIndex;
	};

	return (
		<Box
			sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: alpha(theme.palette.grey[500], 0.04) }}
		>
			<Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2.5 }}>
				<Stack spacing={1.25}>
					{steps.map((step, index) => {
						const clickable = isStepClickable(step, index);
						const isActive = index === currentStepIndex;
						const dimTiming = !clickable;
						const visual = getStepVisualConfig(step, index, currentStepIndex, theme);
						const stepNo = String(step.stepNumber).padStart(2, '0');

						return (
							<Box
								key={index}
								ref={isActive ? currentStepRef : null}
								onClick={() => clickable && onStepClick(index)}
								sx={{
									position: 'relative',
									display: 'flex',
									gap: 1.5,
									p: 1.75,
									borderRadius: 2.5,
									cursor: clickable ? 'pointer' : 'default',
									opacity: clickable ? 1 : 0.45,
									bgcolor: 'background.paper',
									border: '1px solid',
									borderColor: isActive ? alpha(theme.palette.primary.main, 0.28) : alpha(theme.palette.divider, 0.9),
									boxShadow: isActive
										? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.06)}, 0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`
										: `0 1px 2px ${alpha(theme.palette.common.black, 0.04)}`,
									transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
									'&:hover': clickable
										? {
												borderColor: isActive
													? alpha(theme.palette.primary.main, 0.35)
													: alpha(theme.palette.grey[500], 0.25),
												boxShadow: isActive
													? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.08)}, 0 12px 28px ${alpha(theme.palette.primary.main, 0.12)}`
													: `0 4px 16px ${alpha(theme.palette.common.black, 0.06)}`,
												'& .step-card-actions': { opacity: 1 }
											}
										: {}
								}}
							>
								<Typography
									sx={{
										fontSize: '1.375rem',
										fontWeight: 300,
										lineHeight: 1,
										letterSpacing: '-0.03em',
										color: isActive ? 'primary.main' : alpha(theme.palette.text.primary, 0.18),
										fontVariantNumeric: 'tabular-nums',
										pt: 0.125,
										flexShrink: 0,
										width: 28,
										textAlign: 'center'
									}}
								>
									{stepNo}
								</Typography>

								<Box sx={{ flex: 1, minWidth: 0 }}>
									<Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
										<Box sx={{ flex: 1, minWidth: 0 }}>
											<Typography
												sx={{
													fontSize: '0.9375rem',
													fontWeight: 600,
													lineHeight: 1.35,
													letterSpacing: '-0.01em',
													color: clickable ? 'text.primary' : 'text.disabled',
													display: '-webkit-box',
													WebkitLineClamp: 2,
													WebkitBoxOrient: 'vertical',
													overflow: 'hidden',
													mb: 0.75
												}}
												title={step.title}
											>
												{step.title}
											</Typography>

											<Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75 }}>
												<Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 500 }}>
													{getStepTypeLabel(step)}
												</Typography>
												{step.ctq && (
													<Typography
														sx={{
															fontSize: '0.6875rem',
															fontWeight: 600,
															color: 'warning.dark',
															px: 0.75,
															py: 0.125,
															borderRadius: 1,
															bgcolor: alpha(theme.palette.warning.main, 0.1)
														}}
													>
														CTQ
													</Typography>
												)}
												{step.partialCtqApprove && (
													<Typography
														sx={{
															fontSize: '0.6875rem',
															fontWeight: 600,
															color: 'warning.main',
															px: 0.75,
															py: 0.125,
															borderRadius: 1,
															bgcolor: alpha(theme.palette.warning.main, 0.06)
														}}
													>
														Partial CTQ
													</Typography>
												)}
												{visual.label && <StatusPill label={visual.label} color={visual.color} />}
											</Box>
										</Box>

										<Stack
											className="step-card-actions"
											direction="row"
											spacing={0}
											alignItems="center"
											sx={{
												flexShrink: 0,
												opacity: isActive ? 1 : 0,
												transition: 'opacity 0.15s ease'
											}}
										>
											{executionId != null &&
												!previewMode &&
												step.status === 'completed' &&
												step.type !== 'sapConfirmations' && (
													<Tooltip title="Step report">
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
																'&:hover': { color: 'text.primary', bgcolor: alpha(theme.palette.grey[500], 0.08) }
															}}
														>
															<PictureAsPdf sx={{ fontSize: 17 }} />
														</IconButton>
													</Tooltip>
												)}
											{clickable && (
												<IconButton
													size="small"
													aria-label="Open step"
													sx={{
														color: isActive ? 'primary.main' : 'text.secondary',
														'&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
													}}
												>
													<ArrowForward sx={{ fontSize: 15 }} />
												</IconButton>
											)}
										</Stack>
									</Box>

									<StepExecutionMetaSummary
										step={step}
										stepStartEndTime={stepStartEndTime}
										variant="sidebar"
										dimTiming={dimTiming}
									/>
								</Box>
							</Box>
						);
					})}
				</Stack>
			</Box>
		</Box>
	);
};

export default StepList;
