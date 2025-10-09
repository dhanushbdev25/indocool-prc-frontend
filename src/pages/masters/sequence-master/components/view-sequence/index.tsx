import { useNavigate, useParams } from 'react-router-dom';
import { Box, Paper, Typography, Button, Alert, Skeleton } from '@mui/material';
import { ArrowBack, Edit } from '@mui/icons-material';
import ViewSequenceBasicInfo from './components/ViewSequenceBasicInfo';
import ViewSequenceStepGroups from './components/ViewSequenceStepGroups';
import { useFetchProcessSequenceByIdQuery } from '../../../../../store/api/business/sequence-master/sequence.api';

const ViewSequence = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const sequenceId = Number(id);

	// Fetch sequence data
	const {
		data: sequenceData,
		isLoading: isFetching,
		isError,
		error
	} = useFetchProcessSequenceByIdQuery({ id: sequenceId }, { skip: !sequenceId });

	const handleBack = () => {
		navigate('/sequence-master');
	};

	const handleEdit = () => {
		navigate(`/sequence-master/edit-sequence/${sequenceId}`);
	};

	// Show loading state
	if (isFetching) {
		return (
			<Box sx={{ minHeight: '100vh' }}>
				<Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
					{/* Header skeleton */}
					<Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
						<Skeleton variant="rectangular" width={80} height={36} sx={{ mr: 2, borderRadius: 1 }} />
						<Skeleton variant="text" width={300} height={40} />
					</Box>

					{/* Content skeleton */}
					<Box sx={{ mb: 4 }}>
						<Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 1 }} />
					</Box>

					{/* Action buttons skeleton */}
					<Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 3, borderTop: '1px solid #e0e0e0' }}>
						<Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
						<Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
					</Box>
				</Paper>
			</Box>
		);
	}

	// Show error state
	if (isError || !sequenceData) {
		return (
			<Box sx={{ minHeight: '100vh' }}>
				<Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
					<Alert severity="error" sx={{ mb: 3 }}>
						{error && 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data
							? (error.data as { message: string }).message
							: 'Failed to load sequence details'}
					</Alert>
					<Button onClick={handleBack} startIcon={<ArrowBack />} sx={{ textTransform: 'none' }}>
						Back to Sequence Master
					</Button>
				</Paper>
			</Box>
		);
	}

	const sequence = sequenceData.detail;

	return (
		<Box sx={{ minHeight: '100vh' }}>
			<Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
				{/* Header */}
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<Button
							onClick={handleBack}
							startIcon={<ArrowBack />}
							sx={{
								textTransform: 'none',
								mr: 2,
								color: '#666',
								'&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
							}}
						>
							Back
						</Button>
						<Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }}>
							View Process Sequence
						</Typography>
					</Box>
					<Button
						variant="contained"
						startIcon={<Edit />}
						onClick={handleEdit}
						sx={{
							textTransform: 'none',
							backgroundColor: '#1976d2',
							'&:hover': { backgroundColor: '#1565c0' }
						}}
					>
						Edit Sequence
					</Button>
				</Box>

				{/* Basic Information Section */}
				<Box sx={{ mb: 4 }}>
					<ViewSequenceBasicInfo sequence={sequence} />
				</Box>

				{/* Step Groups Section */}
				<Box sx={{ mb: 4 }}>
					<ViewSequenceStepGroups stepGroups={sequence.stepGroups} />
				</Box>

				{/* Action Buttons */}
				<Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 3, borderTop: '1px solid #e0e0e0' }}>
					<Button onClick={handleBack} sx={{ textTransform: 'none' }}>
						Back to List
					</Button>
					<Button
						variant="contained"
						startIcon={<Edit />}
						onClick={handleEdit}
						sx={{
							textTransform: 'none',
							backgroundColor: '#1976d2',
							'&:hover': { backgroundColor: '#1565c0' }
						}}
					>
						Edit Sequence
					</Button>
				</Box>
			</Paper>
		</Box>
	);
};

export default ViewSequence;
