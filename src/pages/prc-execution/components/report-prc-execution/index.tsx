import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Box, Button, CircularProgress, Stack, Typography, Alert } from '@mui/material';
import { ArrowBack, PictureAsPdf } from '@mui/icons-material';
import { useFetchPrcExecutionDetailsQuery } from '../../../../store/api/business/prc-execution/prc-execution.api';
import type { ExecutionData } from '../../types/execution.types';
import { buildTimelineSteps } from '../../utils/buildTimelineSteps';
import { ReportDocument } from './document/ReportDocument';

const PrcExecutionReport = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const executionId = id ? parseInt(id, 10) : 0;

	const { data: executionData, isLoading, error } = useFetchPrcExecutionDetailsQuery(executionId);

	const execution = useMemo(() => {
		if (!executionData) return null;
		return (executionData as { data: ExecutionData }).data;
	}, [executionData]);

	const fullTimelineSteps = useMemo(() => {
		if (!execution) return [];
		return buildTimelineSteps(execution);
	}, [execution]);

	const stepReportMode = useMemo(() => {
		const raw = searchParams.get('step');
		if (raw === null || raw.trim() === '') {
			return { kind: 'full' as const };
		}
		const idx = parseInt(raw, 10);
		if (Number.isNaN(idx) || idx < 0 || idx >= fullTimelineSteps.length) {
			return { kind: 'invalid' as const };
		}
		if (fullTimelineSteps[idx]?.type === 'sapConfirmations') {
			return { kind: 'sapExcluded' as const };
		}
		return { kind: 'single' as const, index: idx };
	}, [searchParams, fullTimelineSteps]);

	const timelineSteps = useMemo(() => {
		if (!execution) return [];
		if (stepReportMode.kind === 'full') {
			return buildTimelineSteps(execution, { omitStepTypes: ['sapConfirmations'] });
		}
		return fullTimelineSteps;
	}, [execution, stepReportMode.kind, fullTimelineSteps]);

	const [pendingPhotos, setPendingPhotos] = useState(0);

	const handlePrint = () => {
		window.print();
	};

	if (!executionId || Number.isNaN(executionId)) {
		return (
			<Box sx={{ p: 3 }}>
				<Typography>Invalid execution id.</Typography>
			</Box>
		);
	}

	if (isLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error || !execution) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="error">Could not load execution. Return to the list and try again.</Alert>
				<Button sx={{ mt: 2 }} startIcon={<ArrowBack />} onClick={() => navigate('/prc-execution')}>
					Back
				</Button>
			</Box>
		);
	}

	const isSingleStepReport = stepReportMode.kind === 'single';
	const singleTimelineStep = stepReportMode.kind === 'single' ? timelineSteps[stepReportMode.index] : null;

	if (stepReportMode.kind === 'invalid' || stepReportMode.kind === 'sapExcluded') {
		return (
			<Box sx={{ p: { xs: 1.5, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
					<Button startIcon={<ArrowBack />} onClick={() => navigate(`/prc-execution/execute/${execution.id}`)}>
						Back to execution
					</Button>
					<Button variant="outlined" onClick={() => navigate(`/prc-execution/report/${execution.id}`)}>
						Open full consolidated report
					</Button>
				</Stack>
				<Alert severity="error">
					{stepReportMode.kind === 'sapExcluded'
						? 'SAP confirmations are not included in PDF reports. Open the full consolidated report instead.'
						: 'This step index is not valid for this execution (check the URL or open the full report).'}
				</Alert>
			</Box>
		);
	}

	return (
		<Box>
			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2, maxWidth: 794, mx: 'auto' }}>
				<Button startIcon={<ArrowBack />} onClick={() => navigate(`/prc-execution/execute/${execution.id}`)}>
					Back to execution
				</Button>
				<Button
					variant="contained"
					startIcon={pendingPhotos > 0 ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdf />}
					onClick={handlePrint}
					disabled={pendingPhotos > 0}
				>
					{pendingPhotos > 0 ? 'Preparing photos…' : 'Print / Save as PDF'}
				</Button>
			</Stack>
			<ReportDocument
				execution={execution}
				steps={isSingleStepReport && singleTimelineStep ? [singleTimelineStep] : timelineSteps}
				singleStep={isSingleStepReport ? singleTimelineStep : null}
				onPendingPhotosChange={setPendingPhotos}
			/>
		</Box>
	);
};

export default PrcExecutionReport;
