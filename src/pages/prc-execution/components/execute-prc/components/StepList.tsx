import { Box, Typography, Chip, Card, CardContent, Avatar, IconButton, useTheme, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CheckCircle, RadioButtonUnchecked, PlayArrow, ArrowForward, WarningAmberRounded } from '@mui/icons-material';
import { useEffect, useRef } from 'react';
import { type TimelineStep } from '../../../types/execution.types';
import { formatExecutionDuration, getTimelineStepPlannedVsActual } from '../../../utils/timelineCardTiming';

interface StepListProps {
	steps: TimelineStep[];
	currentStepIndex: number;
	onStepClick: (stepIndex: number) => void;
	/** When true, all steps are navigable (e.g. unsaved template preview). */
	previewMode?: boolean;
	/** From GET /prcExecution/:id — keyed timing snapshot for planned vs actual on cards. */
	stepStartEndTime?: Record<string, unknown>;
}

const StepList = ({ steps, currentStepIndex, onStepClick, previewMode = false, stepStartEndTime }: StepListProps) => {
	const theme = useTheme();
	const currentStepRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to current step
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

	const timingFontSx = {
		fontFamily: '"SF Mono", "Roboto Mono", ui-monospace, monospace',
		fontVariantNumeric: 'tabular-nums' as const,
		letterSpacing: '0.01em',
		fontSize: '0.6875rem'
	};

	return (
		<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			<Typography variant="h6" sx={{ p: 2, pb: 0, fontWeight: 600, color: '#333' }}>
				Execution Steps
			</Typography>

			<Box sx={{ flex: 1, overflowY: 'auto', p: 2, pt: 1 }}>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					{steps.map((step, index) => {
						const { plannedSec, actualSec } = getTimelineStepPlannedVsActual(step, stepStartEndTime);
						const showPlannedVsActual = plannedSec !== null || actualSec !== null;
						const timingOverPlanned =
							plannedSec !== null && actualSec !== null && actualSec > plannedSec;
						const dimTiming = !isStepClickable(step, index);

						const timingBorderColor = timingOverPlanned
							? alpha(theme.palette.warning.main, 0.55)
							: theme.palette.divider;
						const timingBgColor = timingOverPlanned
							? alpha(theme.palette.warning.main, 0.12)
							: alpha(theme.palette.action.hover, 0.06);

						return (
							<Card
								key={index}
								ref={index === currentStepIndex ? currentStepRef : null}
								sx={{
									cursor: isStepClickable(step, index) ? 'pointer' : 'default',
									opacity: isStepClickable(step, index) ? 1 : 0.6,
									border: index === currentStepIndex ? '2px solid #2196f3' : '1px solid #e0e0e0',
									borderRadius: 2,
									overflow: 'hidden',
									transition: 'box-shadow 0.2s ease, transform 0.2s ease',
									'&:hover': isStepClickable(step, index)
										? {
												boxShadow: 2,
												transform: 'translateY(-1px)'
											}
										: {}
								}}
								onClick={() => isStepClickable(step, index) && onStepClick(index)}
							>
								<CardContent
									sx={{
										p: 2,
										display: 'flex',
										flexDirection: 'column',
										gap: 0,
										'&:last-child': { pb: 2 }
									}}
								>
									<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
										<Avatar
											sx={{
												width: 40,
												height: 40,
												backgroundColor: 'white',
												border: `2px solid ${getStepColor(step, index)}`,
												flexShrink: 0
											}}
										>
											{getStepIcon(step, index)}
										</Avatar>

										<Box sx={{ flex: 1, minWidth: 0 }}>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
												<Typography
													variant="body2"
													sx={{
														fontWeight: 600,
														color: isStepClickable(step, index) ? '#333' : '#999'
													}}
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
															fontSize: '0.625rem',
															height: 16
														}}
													/>
												)}
											</Box>

											<Typography
												variant="body1"
												sx={{
													fontWeight: 500,
													color: isStepClickable(step, index) ? '#333' : '#999',
													mb: 0.5
												}}
											>
												{step.title}
											</Typography>

											<Typography
												variant="body2"
												sx={{
													color: '#666',
													mb: 1,
													lineHeight: 1.4,
													display: '-webkit-box',
													WebkitLineClamp: 2,
													WebkitBoxOrient: 'vertical',
													overflow: 'hidden'
												}}
											>
												{step.description}
											</Typography>

											<Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
												<Chip
													label={getStepTypeLabel(step)}
													size="small"
													sx={{
														backgroundColor: '#f5f5f5',
														color: '#666',
														fontSize: '0.625rem',
														height: 20
													}}
												/>
												{step.status === 'completed' && (
													<Chip
														label="Completed"
														size="small"
														sx={{
															backgroundColor: '#e8f5e8',
															color: '#4caf50',
															fontSize: '0.625rem',
															height: 20
														}}
													/>
												)}
												{step.status === 'in-progress' && (
													<Chip
														label="In Progress"
														size="small"
														sx={{
															backgroundColor: '#e3f2fd',
															color: '#2196f3',
															fontSize: '0.625rem',
															height: 20
														}}
													/>
												)}
												{step.partialCtqApprove && step.status !== 'completed' && (
													<Chip
														label="Partial CTQ"
														size="small"
														sx={{
															backgroundColor: '#fff8e1',
															color: '#f9a825',
															fontSize: '0.625rem',
															height: 20,
															fontWeight: 600
														}}
													/>
												)}
											</Box>
										</Box>

										{isStepClickable(step, index) && (
											<IconButton
												size="small"
												aria-label="Open step"
												sx={{
													flexShrink: 0,
													mt: -0.5,
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
									</Box>

									{showPlannedVsActual && (
										<Box
											sx={{
												mt: 1,
												pt: 1,
												borderTop: '1px solid',
												borderColor: 'divider',
												display: 'flex',
												justifyContent: 'flex-end'
											}}
										>
											<Stack
												alignItems="flex-end"
												sx={{
													px: 0.65,
													py: 0.35,
													borderRadius: 1,
													border: '1px solid',
													borderColor: timingBorderColor,
													backgroundColor: timingBgColor
												}}
											>
												<Stack spacing={0.125} sx={{ alignItems: 'flex-end', minWidth: 0 }}>
													{actualSec !== null && (
														<Box
															sx={{
																display: 'flex',
																alignItems: 'baseline',
																justifyContent: 'flex-end',
																gap: 0.5,
																width: '100%'
															}}
														>
															<Typography
																variant="caption"
																color="text.secondary"
																sx={{ flexShrink: 0, fontSize: '0.6rem', lineHeight: 1.1 }}
															>
																Actual
															</Typography>
															<Box
																sx={{
																	display: 'flex',
																	alignItems: 'center',
																	gap: 0.25,
																	flexShrink: 0
																}}
															>
																<Typography
																	component="span"
																	variant="caption"
																	sx={{
																		...timingFontSx,
																		fontWeight: 700,
																		lineHeight: 1.1,
																		color: timingOverPlanned
																			? 'warning.main'
																			: dimTiming
																				? 'text.secondary'
																				: 'text.primary'
																	}}
																>
																	{formatExecutionDuration(actualSec)}
																</Typography>
																{timingOverPlanned && (
																	<WarningAmberRounded
																		titleAccess="Actual time exceeds planned"
																		sx={{
																			fontSize: 13,
																			color: 'warning.main',
																			display: 'block'
																		}}
																	/>
																)}
															</Box>
														</Box>
													)}
													{plannedSec !== null && (
														<Box
															sx={{
																display: 'flex',
																alignItems: 'baseline',
																justifyContent: 'flex-end',
																gap: 0.5,
																width: '100%'
															}}
														>
															<Typography
																variant="caption"
																color="text.secondary"
																sx={{ flexShrink: 0, fontSize: '0.6rem', lineHeight: 1.1 }}
															>
																Planned
															</Typography>
															<Typography
																component="span"
																variant="caption"
																sx={{
																	...timingFontSx,
																	fontWeight: 600,
																	lineHeight: 1.1,
																	color: dimTiming ? 'text.secondary' : 'text.primary'
																}}
															>
																{formatExecutionDuration(plannedSec)}
															</Typography>
														</Box>
													)}
												</Stack>
											</Stack>
										</Box>
									)}
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
