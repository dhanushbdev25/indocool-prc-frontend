import { useState, useEffect } from 'react';
import {
	Box,
	Typography,
	TextField,
	Button,
	Card,
	CardContent,
	Grid,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Divider,
	Avatar,
	Autocomplete,
	Alert,
	CircularProgress
} from '@mui/material';
import { Engineering as EngineeringIcon, Schedule as ScheduleIcon, Person as PersonIcon } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import { useCurrentRole } from '../../../../../../hooks/useCurrentRole';
import { useFetchMouldComboQuery } from '../../../../../../store/api/business/mould/mould.api';
import { type MouldComboItem } from '../../../../../../store/api/business/mould/mould.validators';
import { type TimelineStep, type ExecutionData, type FormData } from '../../../../types/execution.types';

const shiftOptions = [
	{ value: 'Morning', label: 'Morning' },
	{ value: 'Afternoon', label: 'Afternoon' },
	{ value: 'Night', label: 'Night' }
];

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
	onStepComplete: (formData: FormData) => void;
}

const ExecutionSetupStep = ({ step, executionData, onStepComplete }: ExecutionSetupStepProps) => {
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
	const [shift, setShift] = useState('Morning');
	const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
	const [errors, setErrors] = useState<Record<string, string>>({});

	const isReadOnly = step.status === 'completed';
	const mouldComboBusy = isMouldComboLoading || isMouldComboFetching;

	useEffect(() => {
		const saved = executionData.prcAggregatedSteps?.prcmetadata as Record<string, unknown> | undefined;
		const hasSaved = saved && Object.keys(saved).length > 0;
		const mouldIdStr =
			(hasSaved && typeof saved.mouldId === 'string' ? saved.mouldId : '') || executionData.mouldId || '';

		if (hasSaved) {
			setTimeout(() => {
				if (typeof saved.productionSetId === 'string') setProductionSetId(saved.productionSetId);
				if (typeof saved.shift === 'string') setShift(saved.shift);
				if (typeof saved.date === 'string' && saved.date) {
					setSelectedDate(dayjs(saved.date));
				}
				if (mouldIdStr) setFallbackMouldId(mouldIdStr);
			}, 0);
		} else {
			setTimeout(() => {
				setProductionSetId(executionData.productionSetId || '');
				setShift(executionData.shift || 'Morning');
				if (executionData.date) {
					setSelectedDate(dayjs(executionData.date));
				}
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
		if (!shift) next.shift = 'Shift is required';
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const handleSubmit = () => {
		if (!validate()) return;
		const dateStr = selectedDate.format('YYYY-MM-DD');
		const mouldIdValue = getMouldCode(selectedMould);
		onStepComplete({
			productionSetId: productionSetId.trim(),
			mouldId: mouldIdValue,
			shift,
			date: dateStr,
			recordedByUserId: userInfo.id
		});
	};

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
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
									disabled={isReadOnly}
									required
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
										disabled
										sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
										helperText="Saved mould is not in the current list for this part"
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
										disabled={isReadOnly}
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

				<Card sx={{ mb: 2, borderRadius: 2, border: '1px solid #e0e0e0' }}>
					<CardContent sx={{ p: 3 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
							<ScheduleIcon sx={{ color: '#666', mr: 2, fontSize: '1.25rem' }} />
							<Box>
								<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
									Schedule
								</Typography>
								<Typography variant="body2" sx={{ color: '#666' }}>
									Date and shift
								</Typography>
							</Box>
						</Box>
						<Grid container spacing={3}>
							<Grid size={{ xs: 12, md: 6 }}>
								<DatePicker
									label="Date"
									value={selectedDate}
									onChange={v => setSelectedDate(v || dayjs())}
									disabled={isReadOnly}
									slotProps={{
										textField: {
											fullWidth: true,
											sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } }
										}
									}}
								/>
							</Grid>
							<Grid size={{ xs: 12, md: 6 }}>
								<FormControl fullWidth error={!!errors.shift}>
									<InputLabel>Shift</InputLabel>
									<Select
										value={shift}
										label="Shift"
										onChange={e => setShift(e.target.value)}
										disabled={isReadOnly}
										sx={{ borderRadius: 2 }}
									>
										{shiftOptions.map(opt => (
											<MenuItem key={opt.value} value={opt.value}>
												{opt.label}
											</MenuItem>
										))}
									</Select>
									{errors.shift && (
										<Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
											{errors.shift}
										</Typography>
									)}
								</FormControl>
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
		</LocalizationProvider>
	);
};

export default ExecutionSetupStep;
