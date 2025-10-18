import { useState, useEffect } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Grid,
	Typography,
	IconButton,
	Autocomplete,
	Chip,
	Divider,
	Card,
	CardContent
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {
	Close as CloseIcon,
	PlayArrow as PlayIcon,
	Factory as FactoryIcon,
	Engineering as EngineeringIcon,
	Schedule as ScheduleIcon,
	CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useFetchCustomersQuery } from '../../../../../store/api/business/part-master/part.api';
import {
	useFetchPartsByCustomerQuery,
	useCreatePrcExecutionMutation
} from '../../../../../store/api/business/prc-execution/prc-execution.api';
import { type PartsComboItem } from '../../../../../store/api/business/prc-execution/prc-execution.validators';

// Form validation schema
const createPrcExecutionSchema = yup.object({
	customer: yup.string().required('Customer is required'),
	partId: yup.number().required('Part selection is required'),
	productionSetId: yup.string().required('Production Set ID is required'),
	mouldId: yup.string().required('Mould ID is required'),
	date: yup.string().required('Date is required'),
	shift: yup.string().required('Shift is required'),
	inCharge: yup.number().required('In Charge is required'),
	remarks: yup.string().optional().default('')
});

type CreatePrcExecutionFormData = yup.InferType<typeof createPrcExecutionSchema>;

interface CreatePrcExecutionModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

const shiftOptions = [
	{ value: 'Morning', label: 'Morning' },
	{ value: 'Afternoon', label: 'Afternoon' },
	{ value: 'Night', label: 'Night' }
];

const CreatePrcExecutionModal = ({ open, onClose, onSuccess }: CreatePrcExecutionModalProps) => {
	const [selectedPart, setSelectedPart] = useState<PartsComboItem | null>(null);
	const [selectedCustomer, setSelectedCustomer] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());

	// Fetch customers and parts data
	const { data: customersData } = useFetchCustomersQuery();
	const { data: partsData, isLoading: isPartsLoading } = useFetchPartsByCustomerQuery(
		{ customerCode: selectedCustomer },
		{ skip: !selectedCustomer }
	);

	// API mutation
	const [createPrcExecution, { isLoading: isCreating }] = useCreatePrcExecutionMutation();

	// Form setup
	const {
		control,
		handleSubmit,
		reset,
		watch,
		setValue,
		formState: { errors }
	} = useForm<CreatePrcExecutionFormData>({
		resolver: yupResolver(createPrcExecutionSchema),
		defaultValues: {
			customer: '',
			partId: 0,
			productionSetId: '',
			mouldId: '',
			date: new Date().toISOString().split('T')[0], // Today's date
			shift: 'Morning',
			inCharge: 1,
			remarks: ''
		}
	});

	const watchedCustomer = watch('customer');

	// Reset form when modal opens/closes
	useEffect(() => {
		if (open) {
			reset();
			setSelectedPart(null);
			setSelectedCustomer('');
			setSelectedDate(dayjs());
		}
	}, [open, reset]);

	// Update customer when form value changes
	useEffect(() => {
		if (watchedCustomer) {
			setSelectedCustomer(watchedCustomer);
		}
	}, [watchedCustomer]);

	const handlePartChange = (part: PartsComboItem | null) => {
		setSelectedPart(part);
		if (part) {
			setValue('partId', part.value);
		}
	};

	const onSubmit: SubmitHandler<CreatePrcExecutionFormData> = async data => {
		if (!selectedPart || !selectedDate) {
			return;
		}

		setIsSubmitting(true);
		try {
			const requestData = {
				data: {
					customer: data.customer,
					partId: data.partId,
					catalyst: selectedPart.data.catalyst,
					partNumber: selectedPart.data.partNumber,
					partDescription: selectedPart.data.description,
					version: selectedPart.data.version,
					productionSetId: data.productionSetId,
					mouldId: data.mouldId,
					date: selectedDate ? selectedDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
					shift: data.shift,
					inCharge: data.inCharge,
					remarks: data.remarks || '',
					drawingNumber: selectedPart.data.drawingNumber,
					status: 'ACTIVE', // Hardcoded as per requirements
					prcTemplate: selectedPart.data.prcTemplate
				}
			};

			await createPrcExecution(requestData).unwrap();
			onSuccess();
			onClose();
		} catch (error) {
			console.error('Failed to create PRC execution:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		if (!isCreating && !isSubmitting) {
			onClose();
		}
	};

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth="md"
				fullWidth
				PaperProps={{
					sx: {
						borderRadius: '8px',
						boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
					}
				}}
			>
				<DialogTitle
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						pb: 2,
						borderBottom: '1px solid #e0e0e0'
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
						<PlayIcon sx={{ color: '#1976d2', fontSize: '1.5rem' }} />
						<Box>
							<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
								Create PRC Execution
							</Typography>
							<Typography variant="body2" sx={{ color: '#666' }}>
								Initiate a new production run control execution
							</Typography>
						</Box>
					</Box>
					<IconButton onClick={handleClose} size="small" disabled={isCreating || isSubmitting} sx={{ color: '#666' }}>
						<CloseIcon />
					</IconButton>
				</DialogTitle>

				<DialogContent sx={{ pt: 3, pb: 2 }}>
					{/* Progress Indicator */}
					{isSubmitting && (
						<Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
							<Typography variant="body2" sx={{ color: '#666' }}>
								Creating PRC Execution...
							</Typography>
						</Box>
					)}

					<Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
						{/* Customer & Part Selection */}
						<Card
							sx={{
								borderRadius: '8px',
								border: '1px solid #e0e0e0',
								boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
								mt: 2
							}}
						>
							<CardContent sx={{ p: 3 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
									<FactoryIcon sx={{ color: '#666', mr: 2, fontSize: '1.25rem' }} />
									<Box>
										<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
											Part & Customer Selection
										</Typography>
										<Typography variant="body2" sx={{ color: '#666' }}>
											Choose the customer and part for this execution
										</Typography>
									</Box>
								</Box>

								<Grid container spacing={3}>
									<Grid size={{ xs: 12, md: 6 }}>
										<Controller
											name="customer"
											control={control}
											render={({ field }) => (
												<FormControl fullWidth error={!!errors.customer}>
													<InputLabel>Customer</InputLabel>
													<Select
														{...field}
														label="Customer"
														disabled={isCreating || isSubmitting}
														sx={{ borderRadius: '8px' }}
													>
														{customersData?.data?.map(customer => (
															<MenuItem key={customer.value} value={customer.value}>
																{customer.label}
															</MenuItem>
														))}
													</Select>
													{errors.customer && (
														<Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
															{errors.customer.message}
														</Typography>
													)}
												</FormControl>
											)}
										/>
									</Grid>

									<Grid size={{ xs: 12, md: 6 }}>
										<Autocomplete
											options={(partsData as { data?: PartsComboItem[] })?.data || []}
											getOptionLabel={option => option.label}
											value={selectedPart}
											onChange={(_, newValue) => handlePartChange(newValue)}
											loading={isPartsLoading}
											disabled={!selectedCustomer || isCreating || isSubmitting}
											renderInput={params => (
												<TextField
													{...params}
													label="Part"
													error={!!errors.partId}
													helperText={errors.partId?.message || 'Select a part for this execution'}
													sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
												/>
											)}
											renderOption={(props, option) => (
												<li {...props}>
													<Box>
														<Typography variant="body2" sx={{ fontWeight: 500 }}>
															{option.label}
														</Typography>
														<Typography variant="caption" color="textSecondary">
															{option.data.description}
														</Typography>
													</Box>
												</li>
											)}
										/>
									</Grid>
								</Grid>
							</CardContent>
						</Card>

						{/* Selected Part Details */}
						{selectedPart && (
							<Card
								sx={{
									borderRadius: '8px',
									border: '1px solid #e0e0e0',
									boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
								}}
							>
								<CardContent sx={{ p: 3 }}>
									<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
										<CheckIcon sx={{ color: '#4caf50', mr: 2, fontSize: '1.25rem' }} />
										<Box>
											<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
												Part Selected Successfully
											</Typography>
											<Typography variant="body2" sx={{ color: '#666' }}>
												{selectedPart.data.partNumber} - {selectedPart.data.description}
											</Typography>
										</Box>
									</Box>
									<Divider sx={{ my: 2 }} />
									<Grid container spacing={2}>
										<Grid size={{ xs: 6, sm: 3 }}>
											<Box sx={{ textAlign: 'center', p: 1 }}>
												<Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
													Part Number
												</Typography>
												<Chip label={selectedPart.data.partNumber} size="small" sx={{ fontWeight: 600 }} />
											</Box>
										</Grid>
										<Grid size={{ xs: 6, sm: 3 }}>
											<Box sx={{ textAlign: 'center', p: 1 }}>
												<Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
													Version
												</Typography>
												<Chip label={`v${selectedPart.data.version}`} size="small" sx={{ fontWeight: 600 }} />
											</Box>
										</Grid>
										<Grid size={{ xs: 6, sm: 3 }}>
											<Box sx={{ textAlign: 'center', p: 1 }}>
												<Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
													Drawing
												</Typography>
												<Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
													{selectedPart.data.drawingNumber}
												</Typography>
											</Box>
										</Grid>
										<Grid size={{ xs: 6, sm: 3 }}>
											<Box sx={{ textAlign: 'center', p: 1 }}>
												<Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
													Model
												</Typography>
												<Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
													{selectedPart.data.model || 'N/A'}
												</Typography>
											</Box>
										</Grid>
									</Grid>
								</CardContent>
							</Card>
						)}

						{/* Production Details */}
						<Card
							sx={{
								borderRadius: '8px',
								border: '1px solid #e0e0e0',
								boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
							}}
						>
							<CardContent sx={{ p: 3 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
									<EngineeringIcon sx={{ color: '#666', mr: 2, fontSize: '1.25rem' }} />
									<Box>
										<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
											Production Setup
										</Typography>
										<Typography variant="body2" sx={{ color: '#666' }}>
											Configure production parameters and equipment
										</Typography>
									</Box>
								</Box>

								<Grid container spacing={3}>
									<Grid size={{ xs: 12, md: 6 }}>
										<Controller
											name="productionSetId"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													label="Production Set ID"
													required
													placeholder="e.g., PROD-001"
													error={!!errors.productionSetId}
													helperText={errors.productionSetId?.message}
													disabled={isCreating || isSubmitting}
													sx={{
														'& .MuiOutlinedInput-root': {
															borderRadius: '12px'
														}
													}}
												/>
											)}
										/>
									</Grid>

									<Grid size={{ xs: 12, md: 6 }}>
										<Controller
											name="mouldId"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													label="Mould ID"
													required
													placeholder="e.g., MOULD-01"
													error={!!errors.mouldId}
													helperText={errors.mouldId?.message}
													disabled={isCreating || isSubmitting}
													sx={{
														'& .MuiOutlinedInput-root': {
															borderRadius: '12px'
														}
													}}
												/>
											)}
										/>
									</Grid>
								</Grid>
							</CardContent>
						</Card>

						{/* Schedule & Details */}
						<Card
							sx={{
								borderRadius: '8px',
								border: '1px solid #e0e0e0',
								boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
							}}
						>
							<CardContent sx={{ p: 3 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
									<ScheduleIcon sx={{ color: '#666', mr: 2, fontSize: '1.25rem' }} />
									<Box>
										<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
											Schedule & Details
										</Typography>
										<Typography variant="body2" sx={{ color: '#666' }}>
											Set timing and additional information
										</Typography>
									</Box>
								</Box>

								<Grid container spacing={3}>
									<Grid size={{ xs: 12, md: 6 }}>
										<DatePicker
											label="Date"
											value={selectedDate}
											onChange={newValue => setSelectedDate(newValue || dayjs())}
											disabled={isCreating || isSubmitting}
											slotProps={{
												textField: {
													fullWidth: true,
													error: !!errors.date,
													helperText: errors.date?.message,
													sx: { '& .MuiOutlinedInput-root': { borderRadius: '8px' } }
												}
											}}
										/>
									</Grid>

									<Grid size={{ xs: 12, md: 6 }}>
										<Controller
											name="shift"
											control={control}
											render={({ field }) => (
												<FormControl fullWidth error={!!errors.shift}>
													<InputLabel>Shift</InputLabel>
													<Select
														{...field}
														label="Shift"
														disabled={isCreating || isSubmitting}
														sx={{ borderRadius: '8px' }}
													>
														{shiftOptions.map(shift => (
															<MenuItem key={shift.value} value={shift.value}>
																{shift.label}
															</MenuItem>
														))}
													</Select>
													{errors.shift && (
														<Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
															{errors.shift.message}
														</Typography>
													)}
												</FormControl>
											)}
										/>
									</Grid>

									<Grid size={{ xs: 12, md: 6 }}>
										<Controller
											name="inCharge"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													label="In Charge"
													type="number"
													required
													placeholder="e.g., 1"
													error={!!errors.inCharge}
													helperText={errors.inCharge?.message}
													disabled={isCreating || isSubmitting}
													sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
												/>
											)}
										/>
									</Grid>

									<Grid size={{ xs: 12 }}>
										<Controller
											name="remarks"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													label="Remarks"
													multiline
													rows={3}
													placeholder="Additional notes about this execution..."
													error={!!errors.remarks}
													helperText={errors.remarks?.message}
													disabled={isCreating || isSubmitting}
													sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
												/>
											)}
										/>
									</Grid>
								</Grid>
							</CardContent>
						</Card>
					</Box>
				</DialogContent>

				<DialogActions sx={{ p: 3, pt: 1, borderTop: '1px solid #e0e0e0' }}>
					<Button
						onClick={handleClose}
						disabled={isCreating || isSubmitting}
						sx={{
							borderRadius: '8px',
							textTransform: 'none',
							fontWeight: 500
						}}
					>
						Cancel
					</Button>

					<Button
						onClick={handleSubmit(onSubmit)}
						variant="contained"
						disabled={isCreating || isSubmitting || !selectedPart}
						startIcon={isSubmitting ? undefined : <PlayIcon />}
						sx={{
							backgroundColor: '#1976d2',
							borderRadius: '8px',
							textTransform: 'none',
							fontWeight: 500,
							px: 3,
							py: 1,
							'&:hover': {
								backgroundColor: '#1565c0'
							}
						}}
					>
						{isSubmitting ? 'Creating...' : 'Create Execution'}
					</Button>
				</DialogActions>
			</Dialog>
		</LocalizationProvider>
	);
};

export default CreatePrcExecutionModal;
