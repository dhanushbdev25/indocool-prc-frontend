import { useState, useEffect, useMemo } from 'react';
import {
	Box,
	Typography,
	TextField,
	Button,
	Card,
	CardContent,
	Grid,
	Divider,
	Avatar,
	Autocomplete,
	Alert,
	CircularProgress
} from '@mui/material';
import { Engineering as EngineeringIcon, Person as PersonIcon } from '@mui/icons-material';
import { useCurrentRole } from '../../../../../../hooks/useCurrentRole';
import { useFetchMouldComboQuery } from '../../../../../../store/api/business/mould/mould.api';
import { type MouldComboItem } from '../../../../../../store/api/business/mould/mould.validators';
import {
	type TimelineStep,
	type ExecutionData,
	type FormData,
	type OperationWiseExecutionRow
} from '../../../../types/execution.types';
import {
	applyCountDeviated,
	extractSequenceStepGroupsFromExecution,
	mergeOperationWiseForRead
} from '../../../../utils/operationWiseMerge';

const getMouldCode = (item: MouldComboItem | null): string => {
	if (!item) return '';
	const fromData = item.data.mouldId ?? item.data.mouldCode;
	if (typeof fromData === 'string' && fromData.trim()) {
		return fromData.trim();
	}
	return item.label?.trim() ?? '';
};

interface ExecutionSetupStepProps {
	step: TimelineStep;
	executionData: ExecutionData;
	/** Live merged aggregated steps from parent (includes optimistic operationWiseData). */
	aggregatedStepsSnapshot?: Record<string, unknown>;
	onStepComplete: (formData: FormData) => void;
	readOnlyOverride?: boolean;
	/** With `readOnlyOverride`, use normal-looking fields (read-only, not MUI disabled grey) — e.g. consolidated report. */
	plainReadOnlyFields?: boolean;
}

const ExecutionSetupStep = ({
	step,
	executionData,
	aggregatedStepsSnapshot,
	onStepComplete,
	readOnlyOverride,
	plainReadOnlyFields
}: ExecutionSetupStepProps) => {
	const { userInfo } = useCurrentRole();
	const partId = executionData.partId;
	const {
		data: mouldOptions = [],
		isLoading: isMouldComboLoading,
		isFetching: isMouldComboFetching
	} = useFetchMouldComboQuery({ partId }, { skip: !partId });

	const [productionSetId, setProductionSetId] = useState('');
	const [selectedMould, setSelectedMould] = useState<MouldComboItem | null>(null);
	const [fallbackMouldId, setFallbackMouldId] = useState('');
	const [errors, setErrors] = useState<Record<string, string>>({});

	const isReadOnly = Boolean(readOnlyOverride) || step.status === 'completed';
	const plainLocked = Boolean(readOnlyOverride && plainReadOnlyFields);
	const greyDisabledReadOnly = isReadOnly && !plainLocked;
	const mouldComboBusy = isMouldComboLoading || isMouldComboFetching;

	const mergedOperationWise = useMemo(() => {
		const merged = mergeOperationWiseForRead(
			executionData.operationWiseData,
			aggregatedStepsSnapshot ?? (executionData.prcAggregatedSteps as Record<string, unknown> | undefined)
		);
		if (merged.length > 0) return merged;
		const groups = extractSequenceStepGroupsFromExecution(executionData);
		return groups.map(
			(g): OperationWiseExecutionRow => ({
				id: `tpl-${g.id}`,
				operationID: Number(g.id) || 0,
				operationName: g.processName,
				responsiblePersons: []
			})
		);
	}, [executionData.operationWiseData, executionData.prcAggregatedSteps, executionData.prcCurrentTemplate, aggregatedStepsSnapshot]);

	useEffect(() => {
		const saved = executionData.prcAggregatedSteps?.prcmetadata as Record<string, unknown> | undefined;
		const hasSaved = saved && Object.keys(saved).length > 0;
		const mouldIdStr =
			(hasSaved && typeof saved.mouldId === 'string' ? saved.mouldId : '') || executionData.mouldId || '';

		if (hasSaved) {
			setTimeout(() => {
				if (typeof saved.productionSetId === 'string') setProductionSetId(saved.productionSetId);
				if (mouldIdStr) setFallbackMouldId(mouldIdStr);
			}, 0);
		} else {
			setTimeout(() => {
				setProductionSetId(executionData.productionSetId || '');
				if (mouldIdStr) setFallbackMouldId(mouldIdStr);
			}, 0);
		}
	}, [step.status, executionData]);

	useEffect(() => {
		if (!fallbackMouldId) {
			setSelectedMould(null);
			return;
		}
		if (mouldOptions.length === 0) return;
		const match = mouldOptions.find(o => getMouldCode(o) === String(fallbackMouldId));
		setSelectedMould(match ?? null);
	}, [mouldOptions, fallbackMouldId]);

	const validate = () => {
		const next: Record<string, string> = {};
		if (!productionSetId.trim()) next.productionSetId = 'Production Set ID is required';
		if (!partId) next.mouldId = 'Part is missing; cannot load moulds for this execution';
		const mouldCode = getMouldCode(selectedMould);
		if (partId && !mouldCode) next.mouldId = 'Mould is required';
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const handleSubmit = () => {
		if (!validate()) return;
		const mouldIdValue = getMouldCode(selectedMould);
		onStepComplete({
			productionSetId: productionSetId.trim(),
			mouldId: mouldIdValue,
			recordedByUserId: userInfo.id,
			operationWiseData: applyCountDeviated(mergedOperationWise.map(r => ({ ...r })))
		});
	};

	return (
		<Box sx={{ p: 2, overflowY: 'auto', maxHeight: '100%' }}>
				<Card sx={{ mb: 2, borderRadius: 2, border: '1px solid #e0e0e0' }}>
					<CardContent sx={{ p: 3 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
							<Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
								<PersonIcon />
							</Avatar>
							<Box>
								<Typography variant="subtitle2" color="text.secondary">
									Logged in as
								</Typography>
								<Typography variant="body1" fontWeight={600}>
									{userInfo.name}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{userInfo.email}
								</Typography>
							</Box>
						</Box>
					</CardContent>
				</Card>

				<Card sx={{ mb: 2, borderRadius: 2, border: '1px solid #e0e0e0' }}>
					<CardContent sx={{ p: 3 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
							<EngineeringIcon sx={{ color: '#666', mr: 2, fontSize: '1.25rem' }} />
							<Box>
								<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
									Production setup
								</Typography>
								<Typography variant="body2" sx={{ color: '#666' }}>
									Production set and mould used for this run
								</Typography>
							</Box>
						</Box>
						<Grid container spacing={3}>
							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									fullWidth
									label="Production Set ID"
									value={productionSetId}
									onChange={e => setProductionSetId(e.target.value)}
									error={!!errors.productionSetId}
									helperText={errors.productionSetId}
									disabled={greyDisabledReadOnly}
									required
									InputProps={plainLocked ? { readOnly: true } : undefined}
									sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
								/>
							</Grid>
							<Grid size={{ xs: 12, md: 6 }}>
								{!partId ? (
									<Alert severity="warning" sx={{ borderRadius: 2 }}>
										Part is missing for this execution, so the mould list cannot be loaded.
									</Alert>
								) : isReadOnly && !selectedMould && fallbackMouldId ? (
									<TextField
										fullWidth
										label="Mould ID"
										value={fallbackMouldId}
										disabled={greyDisabledReadOnly}
										InputProps={plainLocked ? { readOnly: true } : undefined}
										sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
										helperText="Saved mould is not in the current list for this part"
									/>
								) : plainLocked ? (
									<TextField
										fullWidth
										label="Mould"
										value={selectedMould?.label?.trim() || fallbackMouldId || '—'}
										InputProps={{ readOnly: true }}
										sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
										helperText={
											mouldComboBusy ? 'Loading mould list…' : 'Mould recorded for this execution'
										}
									/>
								) : (
									<Autocomplete<MouldComboItem, false, false, false>
										options={mouldOptions}
										loading={mouldComboBusy}
										value={selectedMould}
										onChange={(_, value) => {
											setSelectedMould(value);
											setFallbackMouldId(getMouldCode(value));
											if (errors.mouldId) setErrors(prev => ({ ...prev, mouldId: '' }));
										}}
										getOptionLabel={option => option.label}
										isOptionEqualToValue={(a, b) => a.value === b.value}
										disabled={greyDisabledReadOnly}
										renderInput={params => (
											<TextField
												{...params}
												label="Mould"
												required
												error={!!errors.mouldId}
												helperText={
													errors.mouldId ||
													(mouldOptions.length === 0 && !mouldComboBusy
														? 'No moulds linked to this part'
														: 'Select a mould for this part')
												}
												sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
												InputProps={{
													...params.InputProps,
													endAdornment: (
														<>
															{mouldComboBusy ? (
																<CircularProgress color="inherit" size={20} sx={{ mr: 1 }} />
															) : null}
															{params.InputProps.endAdornment}
														</>
													)
												}}
											/>
										)}
									/>
								)}
							</Grid>
						</Grid>
					</CardContent>
				</Card>

				<Divider sx={{ my: 2 }} />

				{!isReadOnly && (
					<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
						<Button variant="contained" size="large" onClick={handleSubmit} sx={{ textTransform: 'none', px: 4 }}>
							Confirm and continue
						</Button>
					</Box>
				)}
		</Box>
	);
};

export default ExecutionSetupStep;
