import { Box, Typography, Chip, Avatar } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { type TimelineStep } from '../../../types/execution.types';

interface ExecutionTimelineProps {
	steps: TimelineStep[];
	currentStepIndex: number;
	onStepClick: (stepIndex: number) => void;
}

const ExecutionTimeline = ({ steps, currentStepIndex: _currentStepIndex, onStepClick }: ExecutionTimelineProps) => {
	const getStepIcon = (step: TimelineStep, _index: number) => {
		if (step.status === 'completed') {
			return <CheckCircle sx={{ color: '#4caf50' }} />;
		}
		if (step.status === 'in-progress') {
			return <RadioButtonUnchecked sx={{ color: '#2196f3' }} />;
		}
		return <RadioButtonUnchecked sx={{ color: '#ccc' }} />;
	};

	const getStepColor = (step: TimelineStep) => {
		if (step.status === 'completed') return '#4caf50';
		if (step.status === 'in-progress') return '#2196f3';
		return '#ccc';
	};

	const isStepClickable = (step: TimelineStep) => {
		return step.status === 'completed' || step.status === 'in-progress';
	};

	return (
		<Box
			sx={{
				backgroundColor: 'white',
				p: 2
			}}
		>
			<Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#333' }}>
				Execution Steps
			</Typography>

			<Box sx={{ position: 'relative' }}>
				{/* Timeline Line */}
				<Box
					sx={{
						position: 'absolute',
						left: 20,
						top: 0,
						bottom: 0,
						width: 2,
						backgroundColor: '#e0e0e0'
					}}
				/>

				{steps.map((step, index) => (
					<Box
						key={index}
						sx={{
							position: 'relative',
							mb: 3,
							cursor: isStepClickable(step) ? 'pointer' : 'default',
							opacity: isStepClickable(step) ? 1 : 0.6
						}}
						onClick={() => isStepClickable(step) && onStepClick(index)}
					>
						{/* Step Icon */}
						<Avatar
							sx={{
								position: 'absolute',
								left: 0,
								top: 0,
								width: 40,
								height: 40,
								backgroundColor: 'white',
								border: `2px solid ${getStepColor(step)}`,
								zIndex: 1
							}}
						>
							{getStepIcon(step, index)}
						</Avatar>

						{/* Step Content */}
						<Box sx={{ ml: 6 }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
								<Typography
									variant="body2"
									sx={{
										fontWeight: 600,
										color: isStepClickable(step) ? '#333' : '#999'
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
								variant="body2"
								sx={{
									fontWeight: 500,
									color: isStepClickable(step) ? '#333' : '#999',
									mb: 0.5
								}}
							>
								{step.title}
							</Typography>

							<Typography
								variant="caption"
								sx={{
									color: '#666',
									display: 'block',
									lineHeight: 1.4
								}}
							>
								{step.description}
							</Typography>

							{/* Step Type Badge */}
							<Chip
								label={step.type}
								size="small"
								sx={{
									mt: 1,
									backgroundColor: '#f5f5f5',
									color: '#666',
									fontSize: '0.625rem',
									height: 20
								}}
							/>
						</Box>
					</Box>
				))}
			</Box>
		</Box>
	);
};

export default ExecutionTimeline;
