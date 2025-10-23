import { Box, Typography, Chip, Card, CardContent, Avatar, IconButton } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, PlayArrow, ArrowForward } from '@mui/icons-material';
import { useEffect, useRef } from 'react';
import { type TimelineStep } from '../../../types/execution.types';

interface StepListProps {
	steps: TimelineStep[];
	currentStepIndex: number;
	onStepClick: (stepIndex: number) => void;
}

const StepList = ({ steps, currentStepIndex, onStepClick }: StepListProps) => {
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
		return step.status === 'completed' || step.status === 'in-progress' || index === currentStepIndex;
	};

	const getStepTypeLabel = (step: TimelineStep) => {
		switch (step.type) {
			case 'rawMaterials':
				return 'Raw Materials';
			case 'bom':
				return 'BOM';
			case 'sequence':
				return 'Sequence';
			case 'inspection':
				return 'Inspection';
			default:
				return step.type;
		}
	};

	return (
		<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			<Typography variant="h6" sx={{ p: 2, pb: 0, fontWeight: 600, color: '#333' }}>
				Execution Steps
			</Typography>

			<Box sx={{ flex: 1, overflowY: 'auto', p: 2, pt: 1 }}>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					{steps.map((step, index) => (
						<Card
							key={index}
							ref={index === currentStepIndex ? currentStepRef : null}
							sx={{
								cursor: isStepClickable(step, index) ? 'pointer' : 'default',
								opacity: isStepClickable(step, index) ? 1 : 0.6,
								border: index === currentStepIndex ? '2px solid #2196f3' : '1px solid #e0e0e0',
								'&:hover': isStepClickable(step, index) ? {
									boxShadow: 2,
									transform: 'translateY(-1px)',
									transition: 'all 0.2s ease-in-out'
								} : {}
							}}
							onClick={() => isStepClickable(step, index) && onStepClick(index)}
						>
						<CardContent sx={{ p: 2 }}>
							<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
								{/* Step Icon */}
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

								{/* Step Content */}
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

									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
									</Box>
								</Box>

								{/* Clickable Arrow */}
								{isStepClickable(step, index) && (
									<IconButton
										sx={{
											color: '#666',
											'&:hover': {
												color: '#2196f3',
												backgroundColor: 'rgba(33, 150, 243, 0.04)'
											}
										}}
									>
										<ArrowForward />
									</IconButton>
								)}
							</Box>
						</CardContent>
					</Card>
				))}
				</Box>
			</Box>
		</Box>
	);
};

export default StepList;
