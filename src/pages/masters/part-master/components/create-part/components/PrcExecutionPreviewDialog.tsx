import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Dialog, DialogContent, Box, Button, Alert, Chip } from '@mui/material';
import { FullScreenFormSavingOverlay } from '../../../../../../components/common/FullScreenFormSavingOverlay';
import { useResolvePrcTemplateMutation } from '../../../../../../store/api/business/prc-template/prc-template.api';
import type { OperationsComboResponse } from '../../../../../../store/api/business/prc-template/prc-template.validators';
import { normalizePrcTemplateSteps, buildPrcTemplatePayload } from '../../../utils/prcTemplatePayload';
import { buildPreviewResolveRequestKey } from '../../../utils/previewResolveKey';
import { buildExecutionPreviewStub } from '../../../utils/buildExecutionPreviewStub';
import { buildTimelineSteps } from '../../../../../prc-execution/utils/buildTimelineSteps';
import type { TimelineStep } from '../../../../../prc-execution/types/execution.types';
import type { PartMasterFormData } from '../schemas';
import type { FormData } from '../../../../../prc-execution/types/execution.types';
import StepList from '../../../../../prc-execution/components/execute-prc/components/StepList';
import ExecutionQuickStats from '../../../../../prc-execution/components/execute-prc/components/ExecutionQuickStats';
import ExecutionHeader from '../../../../../prc-execution/components/execute-prc/components/ExecutionHeader';
import StepDetailView from '../../../../../prc-execution/components/execute-prc/components/StepDetailView';

export interface PrcExecutionPreviewDialogProps {
	open: boolean;
	onClose: () => void;
	formSnapshot: PartMasterFormData;
	operationsData: OperationsComboResponse | undefined;
}

type PreviewView = 'list' | 'detail';

const PrcExecutionPreviewDialog = ({
	open,
	onClose,
	formSnapshot,
	operationsData
}: PrcExecutionPreviewDialogProps) => {
	const [resolvePrcTemplate, { isLoading }] = useResolvePrcTemplateMutation();
	const [error, setError] = useState<string | null>(null);
	const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([]);
	const [executionStub, setExecutionStub] = useState<ReturnType<typeof buildExecutionPreviewStub> | null>(null);
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [currentView, setCurrentView] = useState<PreviewView>('list');

	const requestKey = useMemo(
		() => buildPreviewResolveRequestKey(formSnapshot, operationsData),
		[formSnapshot, operationsData]
	);

	const fetchGenerationRef = useRef(0);
	const lastAppliedKeyRef = useRef<string | null>(null);

	const runResolve = useCallback(
		async (force: boolean) => {
			setError(null);
			const { steps: normalizedSteps, error: normErr } = normalizePrcTemplateSteps(formSnapshot, operationsData);
			if (normErr) {
				setError(normErr);
				setTimelineSteps([]);
				setExecutionStub(null);
				lastAppliedKeyRef.current = null;
				return;
			}

			if (!force && lastAppliedKeyRef.current === requestKey) {
				return;
			}

			const gen = ++fetchGenerationRef.current;
			const payload = buildPrcTemplatePayload(formSnapshot, normalizedSteps);
			try {
				const res = await resolvePrcTemplate(payload).unwrap();
				if (gen !== fetchGenerationRef.current) return;

				const stub = buildExecutionPreviewStub(formSnapshot, res.data);
				const steps = buildTimelineSteps(stub);
				lastAppliedKeyRef.current = requestKey;
				setExecutionStub(stub);
				setTimelineSteps(steps);
				setCurrentStepIndex(0);
				setCurrentView('list');
			} catch (e) {
				if (gen !== fetchGenerationRef.current) return;
				console.error('resolvePrcTemplate failed', e);
				setError('Failed to resolve PRC template. Check the network and try again.');
				setTimelineSteps([]);
				setExecutionStub(null);
				lastAppliedKeyRef.current = null;
			}
		},
		[formSnapshot, operationsData, requestKey, resolvePrcTemplate]
	);

	useEffect(() => {
		if (!open) {
			lastAppliedKeyRef.current = null;
			fetchGenerationRef.current = 0;
			setCurrentView('list');
			return;
		}
		void runResolve(false);
	}, [open, requestKey, runResolve]);

	const currentStep = timelineSteps[currentStepIndex];

	const handleStepClick = (index: number) => {
		setCurrentStepIndex(index);
		setCurrentView('detail');
	};

	const noopComplete = async (_formData: FormData): Promise<void> => {
		void _formData;
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			fullWidth
			maxWidth={false}
			PaperProps={{
				sx: {
					width: '100vw',
					height: '100vh',
					maxWidth: '100vw',
					maxHeight: '100vh',
					margin: 0,
					borderRadius: 0,
					display: 'flex',
					flexDirection: 'column',
					overflow: 'hidden'
				}
			}}
		>
			<FullScreenFormSavingOverlay
				open={open && (isLoading || (!executionStub && !error))}
				message="Loading preview…"
			/>

			{executionStub && (
				<>
					<ExecutionHeader
						executionData={executionStub}
						onBackOverride={currentView === 'detail' ? () => setCurrentView('list') : onClose}
						hideExecutionActions
					/>
					<Box
						sx={{
							px: 2,
							py: 1,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'flex-end',
							gap: 1,
							flexWrap: 'wrap',
							borderBottom: 1,
							borderColor: 'divider',
							flexShrink: 0,
							bgcolor: 'background.paper'
						}}
					>
						<Chip label="Unsaved preview" size="small" color="warning" variant="outlined" />
						<Button size="small" variant="outlined" onClick={() => void runResolve(true)} disabled={isLoading}>
							Refresh
						</Button>
						<Button size="small" onClick={onClose}>
							Close
						</Button>
					</Box>
				</>
			)}

			<DialogContent sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
				{error && (
					<Box sx={{ p: 2 }}>
						<Alert severity="error">{error}</Alert>
					</Box>
				)}
				{!error && executionStub && timelineSteps.length === 0 && (
					<Box sx={{ p: 2 }}>
						<Alert severity="warning">No timeline steps to display.</Alert>
					</Box>
				)}
				{executionStub && timelineSteps.length > 0 && (
					<Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
						{currentView === 'list' && (
							<Box sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
								<Box sx={{ flex: 1, borderRight: '1px solid #e0e0e0', minWidth: 0 }}>
									<StepList
										steps={timelineSteps}
										currentStepIndex={currentStepIndex}
										previewMode
										onStepClick={handleStepClick}
									/>
								</Box>
								<Box sx={{ width: '300px', flexShrink: 0, overflowY: 'auto' }}>
									<ExecutionQuickStats executionData={executionStub} currentStep={currentStep} />
								</Box>
							</Box>
						)}

						{currentView === 'detail' && currentStep && (
							<Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
								<StepDetailView
									key={`preview-${currentStepIndex}-${currentStep.type}-${currentStep.stepNumber}-${currentStep.prcTemplateStepId ?? ''}`}
									step={currentStep}
									executionData={executionStub}
									aggregatedStepsSnapshot={executionStub.prcAggregatedSteps as Record<string, unknown>}
									readOnly
									onBackToList={() => setCurrentView('list')}
									onPreviousStep={() => {
										if (currentStepIndex > 0) {
											setCurrentStepIndex(prev => prev - 1);
										}
									}}
									onNextStep={() => {
										if (currentStepIndex < timelineSteps.length - 1) {
											setCurrentStepIndex(prev => prev + 1);
										}
									}}
									onStepComplete={noopComplete}
									canGoPrevious={currentStepIndex > 0}
									canGoNext={currentStepIndex < timelineSteps.length - 1}
								/>
							</Box>
						)}
					</Box>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default PrcExecutionPreviewDialog;
