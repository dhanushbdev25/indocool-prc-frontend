import { Box, Typography, LinearProgress, Chip, Button } from '@mui/material';
import { ArrowBack, Pause, Escalator } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { type ExecutionData } from '../../../types/execution.types';

interface ExecutionHeaderProps {
	executionData: ExecutionData;
}

const ExecutionHeader = ({ executionData }: ExecutionHeaderProps) => {
	const navigate = useNavigate();

	const progressPercentage = executionData.progress;

	const getProgressColor = (progress: number) => {
		if (progress >= 100) return '#4caf50';
		if (progress >= 50) return '#ff9800';
		return '#2196f3';
	};

	const formatDuration = (durationMs: number) => {
		const hours = Math.floor(durationMs / 3600000);
		const minutes = Math.floor((durationMs % 3600000) / 60000);
		return `${hours}h ${minutes}m`;
	};

	return (
		<Box
			sx={{
				backgroundColor: 'white',
				borderBottom: '1px solid #e0e0e0',
				p: 2,
				boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
				flexShrink: 0
			}}
		>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
				{/* Back Button */}
				<Button startIcon={<ArrowBack />} onClick={() => navigate('/prc-execution')} sx={{ color: '#666' }}>
					Back to List
				</Button>

				{/* PRC Info */}
				<Box sx={{ flex: 1, minWidth: '200px' }}>
					<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
						PRC #{executionData.id} - {executionData.partNumber}
					</Typography>
					<Typography variant="body2" sx={{ color: '#666' }}>
						{executionData.customer} • {executionData.productionSetId} • {executionData.mouldId}
					</Typography>
				</Box>

				{/* Progress */}
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: '200px' }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<LinearProgress
							variant="determinate"
							value={progressPercentage}
							sx={{
								flex: 1,
								height: 8,
								borderRadius: 4,
								backgroundColor: '#e0e0e0',
								'& .MuiLinearProgress-bar': {
									backgroundColor: getProgressColor(progressPercentage),
									borderRadius: 4
								}
							}}
						/>
						<Typography
							variant="body2"
							sx={{
								fontWeight: 500,
								color: getProgressColor(progressPercentage),
								minWidth: '40px'
							}}
						>
							{progressPercentage}%
						</Typography>
					</Box>
					<Typography variant="caption" sx={{ color: '#666' }}>
						{executionData.stepsCompleted} of {executionData.totalSteps} steps completed
					</Typography>
				</Box>

				{/* Status & Actions */}
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					{/* CTQ Status */}
					<Chip
						label={`${executionData.completedCtq}/${executionData.totalCtq} CTQs`}
						size="small"
						sx={{
							backgroundColor: executionData.completedCtq === executionData.totalCtq ? '#e8f5e8' : '#fff3e0',
							color: executionData.completedCtq === executionData.totalCtq ? '#2e7d32' : '#f57c00'
						}}
					/>

					{/* Duration */}
					<Chip
						label={formatDuration(executionData.duration)}
						size="small"
						sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
					/>
				</Box>

				{/* Action Buttons */}
				<Box sx={{ display: 'flex', gap: 1 }}>
					<Button startIcon={<Pause />} variant="outlined" size="small" sx={{ color: '#666', borderColor: '#ddd' }}>
						Pause PRC
					</Button>
					<Button
						startIcon={<Escalator />}
						variant="outlined"
						size="small"
						sx={{ color: '#f57c00', borderColor: '#ffb74d' }}
					>
						Escalate
					</Button>
				</Box>
			</Box>
		</Box>
	);
};

export default ExecutionHeader;
