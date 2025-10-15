import { Box, Paper, Typography, Button, Skeleton } from '@mui/material';
import { ArrowBack as BackIcon, Edit as EditIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useFetchPrcTemplateByIdQuery } from '../../../../../store/api/business/prc-template/prc-template.api';
import ViewPrcTemplateBasicInfo from './components/ViewPrcTemplateBasicInfo';
import ViewPrcTemplateSteps from './components/ViewPrcTemplateSteps';

const ViewPrcTemplate = () => {
	const navigate = useNavigate();
	const { id } = useParams();

	const {
		data: templateData,
		isLoading: isFetching,
		error
	} = useFetchPrcTemplateByIdQuery({ id: Number(id) }, { skip: !id });

	const handleBack = () => {
		navigate('/prc-template-master');
	};

	const handleEdit = () => {
		navigate(`/prc-template-master/edit-prc-template/${id}`);
	};

	// Show skeleton loading state
	if (isFetching) {
		return (
			<Box sx={{ minHeight: '100vh', p: 3 }}>
				<Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
					{/* Header skeleton */}
					<Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
						<Skeleton variant="rectangular" width={80} height={36} sx={{ mr: 2, borderRadius: 1 }} />
						<Skeleton variant="text" width={300} height={40} />
					</Box>

					{/* Content skeleton */}
					<Box sx={{ mb: 4 }}>
						<Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 1, mb: 3 }} />
						<Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 1 }} />
					</Box>
				</Paper>
			</Box>
		);
	}

	// Show error state
	if (error) {
		return (
			<Box sx={{ minHeight: '100vh', p: 3 }}>
				<Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' }}>
					<Typography variant="h6" color="error" sx={{ mb: 2 }}>
						Error Loading Template
					</Typography>
					<Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
						Failed to load the PRC template. Please try again.
					</Typography>
					<Button variant="contained" onClick={handleBack}>
						Back to Templates
					</Button>
				</Paper>
			</Box>
		);
	}

	// Show not found state
	if (!templateData) {
		return (
			<Box sx={{ minHeight: '100vh', p: 3 }}>
				<Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' }}>
					<Typography variant="h6" sx={{ mb: 2 }}>
						Template Not Found
					</Typography>
					<Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
						The requested PRC template could not be found.
					</Typography>
					<Button variant="contained" onClick={handleBack}>
						Back to Templates
					</Button>
				</Paper>
			</Box>
		);
	}

	const { prcTemplate, prcTemplateSteps } = templateData.detail;

	return (
		<Box sx={{ minHeight: '100vh', p: 3 }}>
			<Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
				{/* Header */}
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<Button startIcon={<BackIcon />} onClick={handleBack} sx={{ mr: 2, textTransform: 'none' }}>
							Back
						</Button>
						<Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }}>
							View PRC Template
						</Typography>
					</Box>
					<Button
						variant="contained"
						startIcon={<EditIcon />}
						onClick={handleEdit}
						sx={{
							textTransform: 'none',
							backgroundColor: '#1976d2',
							'&:hover': { backgroundColor: '#1565c0' }
						}}
					>
						Edit Template
					</Button>
				</Box>

				{/* Content */}
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
					<ViewPrcTemplateBasicInfo template={prcTemplate} />
					<ViewPrcTemplateSteps steps={prcTemplateSteps} />
				</Box>
			</Paper>
		</Box>
	);
};

export default ViewPrcTemplate;
