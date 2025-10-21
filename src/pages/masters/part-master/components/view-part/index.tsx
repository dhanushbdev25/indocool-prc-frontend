import { useNavigate, useParams } from 'react-router-dom';
import { Box, Paper, Typography, Button, Alert, Skeleton } from '@mui/material';
import { ArrowBack, Edit } from '@mui/icons-material';
import ViewGeneralInfo from './components/ViewGeneralInfo';
import ViewRawMaterials from './components/ViewRawMaterials';
import ViewBOM from './components/ViewBOM';
import ViewTechnicalData from './components/ViewTechnicalData';
import ViewLinkedMasters from './components/ViewLinkedMasters';
import { useFetchPartByIdQuery } from '../../../../../store/api/business/part-master/part.api';

const ViewPart = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const partId = Number(id);

	// Fetch part data
	const {
		data: partData,
		isLoading: isFetching,
		isError,
		error
	} = useFetchPartByIdQuery({ id: partId }, { skip: !partId });

	const handleBack = () => {
		navigate('/part-master');
	};

	const handleEdit = () => {
		navigate(`/part-master/edit-part/${partId}`);
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
	if (isError || !partData) {
		return (
			<Box sx={{ minHeight: '100vh' }}>
				<Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
					<Alert severity="error" sx={{ mb: 3 }}>
						{error && 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data
							? (error.data as { message: string }).message
							: 'Failed to load part details'}
					</Alert>
					<Button onClick={handleBack} startIcon={<ArrowBack />} sx={{ textTransform: 'none' }}>
						Back to Part Master
					</Button>
				</Paper>
			</Box>
		);
	}

	const { partMaster, rawMaterials, bom, drilling, cutting } = partData.detail;

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
							View Part: {partMaster.partNumber}
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
						Edit Part
					</Button>
				</Box>

				{/* Content Sections */}
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
					<ViewGeneralInfo partMaster={partMaster} files={partData?.detail?.files || undefined} />
					<ViewRawMaterials rawMaterials={rawMaterials} />
					<ViewBOM bom={bom} />
					<ViewTechnicalData drilling={drilling} cutting={cutting} />
					<ViewLinkedMasters partMaster={partMaster} />
				</Box>

				{/* Action Buttons */}
				<Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 3, borderTop: '1px solid #e0e0e0', mt: 4 }}>
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
						Edit Part
					</Button>
				</Box>
			</Paper>
		</Box>
	);
};

export default ViewPart;
