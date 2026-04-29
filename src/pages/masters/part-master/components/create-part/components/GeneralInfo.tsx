import { useEffect, useRef } from 'react';
import {
	Box,
	Paper,
	Typography,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Grid,
	Divider,
	Switch,
	IconButton,
	Button,
	FormHelperText,
	Autocomplete,
	CircularProgress
} from '@mui/material';
import { Info as InfoIcon, Image as ImageIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Controller, Control, FieldErrors, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { PartMasterFormData } from '../schemas';
import {
	useFetchCustomersQuery,
	useFetchCustomerVariantComboQuery,
	useFetchSapComboQuery
} from '.././../../../../../store/api/business/part-master/part.api';
import type { SapComboRow } from '.././../../../../../store/api/business/part-master/part.validators';
import PartImageUpload from './PartImageUpload';
import { ImageItem } from '../../../../../../hooks/useImageGallery';

interface GeneralInfoProps {
	control: Control<PartMasterFormData>;
	errors: FieldErrors<PartMasterFormData>;
	gallery: ImageItem[];
	onAddImage: (file: File) => void;
	onRemoveImage: (id: number | string) => void;
}

const GeneralInfo = ({ control, errors, gallery, onAddImage, onRemoveImage }: GeneralInfoProps) => {
	const { setValue } = useFormContext<PartMasterFormData>();
	const customerCode = useWatch({ control, name: 'customer' });
	const prevCustomerRef = useRef<string | undefined>(undefined);

	const { data: customersData, isLoading: isCustomersLoading } = useFetchCustomersQuery();
	const {
		data: sapComboData,
		isLoading: isSapComboLoading,
		isFetching: isSapComboFetching
	} = useFetchSapComboQuery();
	const {
		data: variantComboData,
		isLoading: isVariantComboLoading,
		isFetching: isVariantComboFetching
	} = useFetchCustomerVariantComboQuery(
		{ customerCode: customerCode || '' },
		{ skip: !customerCode }
	);

	useEffect(() => {
		if (prevCustomerRef.current !== undefined && prevCustomerRef.current !== customerCode) {
			setValue('customerVariantId', undefined);
		}
		prevCustomerRef.current = customerCode;
	}, [customerCode, setValue]);

	const { fields: mouldFields, append, remove } = useFieldArray({
		control,
		name: 'moulds'
	});

	return (
		<Box>
			<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
				<InfoIcon sx={{ mr: 1, color: '#1976d2' }} />
				<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
					General Information
				</Typography>
			</Box>

			<Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				<Grid container spacing={3}>
					{/* SAP Reference Number — combo at top */}
					<Grid size={{ xs: 12 }}>
						<Controller
							name="sapReferenceNumber"
							control={control}
							render={({ field }) => {
								const sapRows = sapComboData?.data ?? [];
								const selected = field.value ?? '';
								const hasUnknownSap =
									Boolean(selected) && !sapRows.some(r => String(r.value) === String(selected));
								const options: SapComboRow[] = hasUnknownSap
									? [{ label: selected, value: selected }, ...sapRows]
									: sapRows;
								const comboBusy = isSapComboLoading || isSapComboFetching;
								const value: SapComboRow | null =
									selected === ''
										? null
										: (sapRows.find(r => String(r.value) === String(selected)) ??
											(hasUnknownSap ? { label: selected, value: selected } : null));
								return (
									<Autocomplete<SapComboRow, false, false, false>
										fullWidth
										options={options}
										loading={comboBusy}
										value={value}
										onChange={(_, newValue) => {
											if (!newValue) {
												field.onChange('');
												return;
											}
											field.onChange(String(newValue.value));
											const row =
												sapRows.find(r => String(r.value) === String(newValue.value)) ?? newValue;
											if (row.data) {
												if (row.data.partNumber !== undefined) {
													setValue('partNumber', row.data.partNumber);
												}
												if (row.data.description !== undefined) {
													setValue('description', row.data.description);
												}
											}
										}}
										getOptionLabel={option => option.label}
										isOptionEqualToValue={(a, b) => String(a.value) === String(b.value)}
										ListboxProps={{
											sx: { maxHeight: 280 }
										}}
										renderInput={params => (
											<TextField
												{...params}
												name={field.name}
												onBlur={field.onBlur}
												label="SAP Reference Number"
												placeholder="Search or select SAP reference"
												error={!!errors.sapReferenceNumber}
												helperText={
													errors.sapReferenceNumber?.message ??
													(comboBusy ? 'Loading SAP references…' : undefined)
												}
												sx={{
													'& .MuiOutlinedInput-root': {
														borderRadius: '8px'
													}
												}}
												InputProps={{
													...params.InputProps,
													endAdornment: (
														<>
															{comboBusy ? (
																<CircularProgress color="inherit" size={20} sx={{ mr: 1 }} />
															) : null}
															{params.InputProps.endAdornment}
														</>
													)
												}}
											/>
										)}
									/>
								);
							}}
						/>
					</Grid>

					{/* Part Number */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="partNumber"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Part Number"
									required
									placeholder="e.g., PN-10045"
									helperText={
										errors.partNumber?.message ||
										'Set from SAP reference selection'
									}
									error={!!errors.partNumber}
									slotProps={{
										htmlInput: {
											readOnly: true
										}
									}}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px',
											backgroundColor: '#f5f5f5'
										}
									}}
								/>
							)}
						/>
					</Grid>

					{/* Drawing Number */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="drawingNumber"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Drawing Number"
									required
									placeholder="e.g., DR-4521"
									helperText={errors.drawingNumber?.message || 'Drawing reference number'}
									error={!!errors.drawingNumber}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px'
										}
									}}
								/>
							)}
						/>
					</Grid>

					{/* Drawing Revision */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="drawingRevision"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Drawing Revision"
									type="number"
									placeholder="e.g., 2"
									helperText="Drawing revision number "
									error={!!errors.drawingRevision}
									slotProps={{
										htmlInput: {
											readOnly: true
										}
									}}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px',
											backgroundColor: '#f5f5f5'
										}
									}}
								/>
							)}
						/>
					</Grid>

					{/* Part Revision */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="partRevision"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Part Revision"
									type="number"
									placeholder="e.g., 3"
									helperText="Part revision number "
									error={!!errors.partRevision}
									slotProps={{
										htmlInput: {
											readOnly: true
										}
									}}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px',
											backgroundColor: '#f5f5f5'
										}
									}}
								/>
							)}
						/>
					</Grid>

					<Grid size={{ xs: 12 }}>
						<Divider sx={{ mb: 2 }} />
						<Typography
							variant="subtitle2"
							color="text.secondary"
							sx={{ fontWeight: 600, letterSpacing: '0.02em', mb: 2 }}
						>
							Customer & production
						</Typography>
					</Grid>

					{/* Customer */}
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
										disabled={isCustomersLoading}
										sx={{
											borderRadius: '8px'
										}}
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

					{/* Customer variant */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="customerVariantId"
							control={control}
							render={({ field }) => (
								<FormControl
									fullWidth
									error={!!errors.customerVariantId}
									disabled={
										!customerCode || isVariantComboLoading || isVariantComboFetching
									}
								>
									<InputLabel shrink>Customer variant</InputLabel>
									<Select
										displayEmpty
										label="Customer variant"
										value={
											field.value != null && !Number.isNaN(field.value)
												? String(field.value)
												: ''
										}
										renderValue={selected => {
											if (selected === '') {
												return (
													<Typography component="span" sx={{ color: 'text.secondary' }}>
														Select variant
													</Typography>
												);
											}
											const row = variantComboData?.data?.find(
												r => String(r.value) === String(selected)
											);
											return row?.label ?? String(selected);
										}}
										onChange={e => {
											const v = e.target.value as string;
											const num = Number(v);
											field.onChange(Number.isNaN(num) ? undefined : num);
										}}
										sx={{
											borderRadius: '8px'
										}}
									>
										{variantComboData?.data?.map(row => (
											<MenuItem key={row.value} value={row.value}>
												{row.label}
											</MenuItem>
										))}
									</Select>
									{errors.customerVariantId && (
										<Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
											{errors.customerVariantId.message}
										</Typography>
									)}
									{!errors.customerVariantId && !customerCode && (
										<FormHelperText>Select a customer to load variants</FormHelperText>
									)}
									{!errors.customerVariantId &&
										customerCode &&
										(isVariantComboLoading || isVariantComboFetching) && (
											<FormHelperText>Loading variants…</FormHelperText>
										)}
								</FormControl>
							)}
						/>
					</Grid>

					{/* Active status — settings-style row */}
					<Grid size={{ xs: 12 }}>
						<Box
							sx={{
								display: 'flex',
								flexDirection: { xs: 'column', sm: 'row' },
								alignItems: { xs: 'stretch', sm: 'center' },
								justifyContent: 'space-between',
								gap: 2,
								px: 2.5,
								py: 2,
								borderRadius: 2,
								border: theme => `1px solid ${theme.palette.divider}`,
								bgcolor: theme =>
									theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50'
							}}
						>
							<Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
								<Typography variant="subtitle2" component="p" sx={{ fontWeight: 600, mb: 0.5 }}>
									Active part
								</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
									When off, this part is hidden from production workflows.
								</Typography>
							</Box>
							<Box sx={{ flexShrink: 0, alignSelf: { xs: 'flex-end', sm: 'center' } }}>
								<Controller
									name="isActive"
									control={control}
									render={({ field }) => (
										<Switch
											checked={field.value}
											onChange={field.onChange}
											color="primary"
											inputProps={{ 'aria-label': 'Active part' }}
										/>
									)}
								/>
							</Box>
						</Box>
					</Grid>

					{/* Description */}
					<Grid size={{ xs: 12 }}>
						<Controller
							name="description"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Description"
									required
									placeholder="e.g., Aluminium Bracket Assembly for Cooling System"
									helperText={
										errors.description?.message ||
										'Set from SAP reference selection'
									}
									error={!!errors.description}
									slotProps={{
										htmlInput: {
											readOnly: true
										}
									}}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px',
											backgroundColor: '#f5f5f5'
										}
									}}
								/>
							)}
						/>
					</Grid>

					{/* Layup Type */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="layupType"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Layup Type"
									placeholder="e.g., PPCORE CSM"
									helperText="Material layup type "
									error={!!errors.layupType}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px'
										}
									}}
								/>
							)}
						/>
					</Grid>

					{/* Model */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="model"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Model"
									placeholder="e.g., RHD (Exterior)"
									helperText="Part model or variant "
									error={!!errors.model}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px'
										}
									}}
								/>
							)}
						/>
					</Grid>

					{/* Notes */}
					<Grid size={{ xs: 12 }}>
						<Divider sx={{ my: 2 }} />
						<Controller
							name="notes"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Notes"
									multiline
									rows={4}
									placeholder="Additional notes about this part"
									helperText={
										errors.notes?.message ||
										'Optional notes about usage, special conditions, or other relevant information'
									}
									error={!!errors.notes}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px'
										}
									}}
								/>
							)}
						/>
					</Grid>

					{/* Mould mapping */}
					<Grid size={{ xs: 12 }}>
						<Divider sx={{ my: 2 }} />
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
							<Box>
								<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
									Mould mapping
								</Typography>
								<Typography variant="caption" sx={{ color: '#666' }}>
									Add moulds and reconciliation counts for this part
								</Typography>
							</Box>
							<Button
								variant="outlined"
								size="small"
								startIcon={<AddIcon />}
								onClick={() => append({ mouldCode: '', reconciliationCount: 1, currentCount: 0 })}
							>
								Add mould
							</Button>
						</Box>

						{mouldFields.map((field, index) => (
							<Grid container spacing={2} sx={{ mb: 1 }} key={field.id}>
								<Grid size={{ xs: 12, md: 5 }}>
									<Controller
										name={`moulds.${index}.mouldCode`}
										control={control}
										render={({ field: mouldField }) => (
											<TextField
												{...mouldField}
												fullWidth
												label="Mould code"
												placeholder="e.g., MLD-001"
												error={!!errors.moulds?.[index]?.mouldCode}
												helperText={errors.moulds?.[index]?.mouldCode?.message}
											/>
										)}
									/>
								</Grid>
								<Grid size={{ xs: 12, md: 5 }}>
									<Controller
										name={`moulds.${index}.reconciliationCount`}
										control={control}
										render={({ field: countField }) => (
											<TextField
												{...countField}
												fullWidth
												type="number"
												label="Reconciliation Count"
												inputProps={{ min: 1 }}
												error={!!errors.moulds?.[index]?.reconciliationCount}
												helperText={errors.moulds?.[index]?.reconciliationCount?.message}
											/>
										)}
									/>
								</Grid>
								<Grid size={{ xs: 12, md: 2 }}>
									<Box sx={{ display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center' }}>
										<IconButton color="error" onClick={() => remove(index)} aria-label="remove mould">
											<DeleteIcon />
										</IconButton>
									</Box>
								</Grid>
							</Grid>
						))}
					</Grid>
				</Grid>
			</Paper>

			<Paper sx={{ p: 3, mt: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
					<ImageIcon sx={{ mr: 1, color: '#1976d2' }} />
					<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
						Part Drawings
					</Typography>
				</Box>
				<Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
					Upload part drawing images. These will be available for mapping to inspection parameters when a PRC template
					is linked.
				</Typography>
				<PartImageUpload gallery={gallery} onAddImage={onAddImage} onRemoveImage={onRemoveImage} view={false} />
			</Paper>
		</Box>
	);
};

export default GeneralInfo;
