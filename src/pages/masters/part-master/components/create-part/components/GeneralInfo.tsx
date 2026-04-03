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
	FormControlLabel,
	Switch,
	IconButton,
	Button
} from '@mui/material';
import { Info as InfoIcon, Image as ImageIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Controller, Control, FieldErrors, useFieldArray } from 'react-hook-form';
import { PartMasterFormData } from '../schemas';
import { useFetchCustomersQuery } from '.././../../../../../store/api/business/part-master/part.api';
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
	const { data: customersData, isLoading: isCustomersLoading } = useFetchCustomersQuery();
	const { fields: mouldeFields, append, remove } = useFieldArray({
		control,
		name: 'mouldes'
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
									helperText={errors.partNumber?.message || 'Unique identifier for the part'}
									error={!!errors.partNumber}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px'
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

					{/* Active Status */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								height: '100%'
							}}
						>
							<Controller
								name="isActive"
								control={control}
								render={({ field }) => (
									<FormControlLabel
										control={<Switch checked={field.value} onChange={field.onChange} color="primary" />}
										label={
											<Box>
												<Typography variant="body1" sx={{ fontWeight: 500 }}>
													Active Part
												</Typography>
												<Typography variant="caption" sx={{ color: '#666' }}>
													Enable this part for use in production
												</Typography>
											</Box>
										}
									/>
								)}
							/>
						</Box>
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
									helperText={errors.description?.message || 'Detailed description of the part'}
									error={!!errors.description}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px'
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

					{/* SAP Reference Number */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="sapReferenceNumber"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="SAP Reference Number"
									placeholder="e.g., SAP-12345"
									helperText="SAP system reference number "
									error={!!errors.sapReferenceNumber}
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

					{/* Moulde Mapping */}
					<Grid size={{ xs: 12 }}>
						<Divider sx={{ my: 2 }} />
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
							<Box>
								<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
									Moulde Mapping
								</Typography>
								<Typography variant="caption" sx={{ color: '#666' }}>
									Add mouldes and reconciliation counts for this part
								</Typography>
							</Box>
							<Button
								variant="outlined"
								size="small"
								startIcon={<AddIcon />}
								onClick={() => append({ mouldeCode: '', reconciliationCount: 1, currentCount: 0 })}
							>
								Add Moulde
							</Button>
						</Box>

						{mouldeFields.map((field, index) => (
							<Grid container spacing={2} sx={{ mb: 1 }} key={field.id}>
								<Grid size={{ xs: 12, md: 5 }}>
									<Controller
										name={`mouldes.${index}.mouldeCode`}
										control={control}
										render={({ field: mouldeField }) => (
											<TextField
												{...mouldeField}
												fullWidth
												label="Moulde Code"
												placeholder="e.g., MLD-001"
												error={!!errors.mouldes?.[index]?.mouldeCode}
												helperText={errors.mouldes?.[index]?.mouldeCode?.message}
											/>
										)}
									/>
								</Grid>
								<Grid size={{ xs: 12, md: 5 }}>
									<Controller
										name={`mouldes.${index}.reconciliationCount`}
										control={control}
										render={({ field: countField }) => (
											<TextField
												{...countField}
												fullWidth
												type="number"
												label="Reconciliation Count"
												inputProps={{ min: 1 }}
												error={!!errors.mouldes?.[index]?.reconciliationCount}
												helperText={errors.mouldes?.[index]?.reconciliationCount?.message}
											/>
										)}
									/>
								</Grid>
								<Grid size={{ xs: 12, md: 2 }}>
									<Box sx={{ display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center' }}>
										<IconButton color="error" onClick={() => remove(index)} aria-label="remove moulde">
											<DeleteIcon />
										</IconButton>
									</Box>
								</Grid>
							</Grid>
						))}
					</Grid>
				</Grid>
			</Paper>

			{/* Part Drawings Section */}
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
