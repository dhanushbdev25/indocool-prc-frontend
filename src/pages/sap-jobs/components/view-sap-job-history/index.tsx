import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, IconButton, Tooltip, Typography } from '@mui/material';
import { ArrowBack, Refresh as RefreshIcon } from '@mui/icons-material';
import CatalystTableSkeleton from '../../../../components/common/skeleton/CatalystTableSkeleton';
import { useFetchSapJobRunsQuery } from '../../../../store/api/business/sap-job-runs/sap-job-runs.api';
import SapJobRunsTable from './components/SapJobRunsTable';

const ViewSapJobHistory = () => {
	const navigate = useNavigate();
	const { jobKey: jobKeyParam } = useParams<{ jobKey: string }>();

	const jobKey = useMemo(() => {
		if (!jobKeyParam) return '';
		try {
			return decodeURIComponent(jobKeyParam);
		} catch {
			return jobKeyParam;
		}
	}, [jobKeyParam]);

	const {
		data: runs = [],
		isLoading,
		isFetching,
		isError,
		error,
		refetch
	} = useFetchSapJobRunsQuery({ jobKey }, { skip: !jobKey });

	const handleBack = () => {
		navigate('/sap-jobs');
	};

	const listErrorMessage =
		isError && error && typeof error === 'object' && 'data' in error
			? String((error as { data?: { message?: string } }).data?.message || 'Unable to load run history.')
			: isError
				? 'Unable to load run history. Please try again.'
				: null;

	if (!jobKeyParam) {
		return (
			<Box sx={{ p: 3, minHeight: '100vh' }}>
				<Alert severity="warning" sx={{ mb: 2 }}>
					Invalid route: job key is missing.
				</Alert>
				<Button onClick={handleBack} startIcon={<ArrowBack />} sx={{ textTransform: 'none' }}>
					Back to SAP integration jobs
				</Button>
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3, minHeight: '100vh' }}>
			<Box sx={{ mb: 4 }}>
				<Button
					onClick={handleBack}
					startIcon={<ArrowBack />}
					sx={{ textTransform: 'none', mb: 2, color: '#333' }}
				>
					Back to SAP integration jobs
				</Button>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
					<Box>
						<Typography variant="h3" sx={{ fontWeight: 600, color: '#333', mb: 1, fontSize: '2rem' }}>
							Job run history
						</Typography>
						<Typography variant="body1" sx={{ color: '#666', fontSize: '1rem' }}>
							Job key: <strong>{jobKey}</strong>
						</Typography>
						<Typography variant="body2" sx={{ color: '#666', mt: 1, maxWidth: 720 }}>
							Execution log for this SAP integration job. Use refresh to retrieve the latest runs from the
							server.
						</Typography>
					</Box>
					<Tooltip title="Refresh">
						<span>
							<IconButton
								onClick={() => void refetch()}
								disabled={isFetching && !isLoading}
								sx={{
									color: '#1976d2',
									border: '1px solid #e0e0e0',
									borderRadius: '8px',
									'&:hover': { backgroundColor: '#f5f5f5' }
								}}
							>
								<RefreshIcon />
							</IconButton>
						</span>
					</Tooltip>
				</Box>
			</Box>

			{listErrorMessage && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{listErrorMessage}
				</Alert>
			)}

			<Box
				sx={{
					backgroundColor: 'white',
					borderRadius: '12px',
					boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
					overflow: 'hidden'
				}}
			>
				{isLoading ? (
					<Box sx={{ p: 2 }}>
						<CatalystTableSkeleton />
					</Box>
				) : (
					<SapJobRunsTable data={runs} />
				)}
			</Box>
		</Box>
	);
};

export default ViewSapJobHistory;
