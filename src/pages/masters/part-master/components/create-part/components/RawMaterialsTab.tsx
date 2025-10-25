import { useState } from 'react';
import {
	Box,
	Paper,
	Typography,
	Button,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	IconButton,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Alert,
	FormControlLabel,
	Switch
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';
import { useFieldArray, Control, FieldErrors } from 'react-hook-form';
import { PartMasterFormData, defaultRawMaterial } from '../schemas';
import { uomOptions } from '../../../../sequence-master/components/create-sequence/types';

// Material code options
const materialCodeOptions = [
	{ value: 'Gelcoat', label: 'Gelcoat' },
	{ value: 'Resin', label: 'Resin' },
	{ value: 'Others', label: 'Others' }
];

interface RawMaterialsTabProps {
	control: Control<PartMasterFormData>;
	errors: FieldErrors<PartMasterFormData>;
}

const RawMaterialsTab = ({ control, errors }: RawMaterialsTabProps) => {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [formData, setFormData] = useState(defaultRawMaterial);
	const [selectedMaterialCodeType, setSelectedMaterialCodeType] = useState<string>('');
	const [customMaterialCode, setCustomMaterialCode] = useState<string>('');

	const { fields, append, remove, update } = useFieldArray({
		control,
		name: 'rawMaterials'
	});

	const handleOpenDialog = (index?: number) => {
		if (index !== undefined) {
			setEditingIndex(index);
			setFormData(fields[index]);
			// Initialize material code type based on existing material code
			const existingCode = fields[index].materialCode;
			if (materialCodeOptions.some(option => option.value === existingCode)) {
				setSelectedMaterialCodeType(existingCode);
				setCustomMaterialCode('');
			} else {
				setSelectedMaterialCodeType('Others');
				setCustomMaterialCode(existingCode);
			}
		} else {
			setEditingIndex(null);
			setFormData(defaultRawMaterial);
			setSelectedMaterialCodeType('');
			setCustomMaterialCode('');
		}
		setDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setDialogOpen(false);
		setEditingIndex(null);
		setFormData(defaultRawMaterial);
		setSelectedMaterialCodeType('');
		setCustomMaterialCode('');
	};

	const handleSave = () => {
		// Set the material code based on selection
		const finalMaterialCode = selectedMaterialCodeType === 'Others' ? customMaterialCode : selectedMaterialCodeType;
		const updatedFormData = {
			...formData,
			materialCode: finalMaterialCode
		};

		if (editingIndex !== null) {
			update(editingIndex, updatedFormData);
		} else {
			append(updatedFormData);
		}
		handleCloseDialog();
	};

	const handleDelete = (index: number) => {
		remove(index);
	};

	const handleInputChange = (field: string, value: string) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}));
	};

	const handleMaterialCodeTypeChange = (value: string) => {
		setSelectedMaterialCodeType(value);
		if (value !== 'Others') {
			setCustomMaterialCode('');
		}
	};

	const handleBatchingChange = (checked: boolean) => {
		setFormData(prev => ({
			...prev,
			batching: checked
		}));
	};

	return (
		<Box>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
				<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
					Raw Materials
				</Typography>
				<Button
					variant="contained"
					startIcon={<AddIcon />}
					onClick={() => handleOpenDialog()}
					sx={{
						textTransform: 'none',
						backgroundColor: '#1976d2',
						'&:hover': { backgroundColor: '#1565c0' }
					}}
				>
					Add Material
				</Button>
			</Box>

			<Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				{errors.rawMaterials && (
					<Alert severity="error" sx={{ mb: 3 }}>
						{errors.rawMaterials.message}
					</Alert>
				)}

				{fields.length === 0 ? (
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							height: 200,
							border: '2px dashed #e0e0e0',
							borderRadius: 2,
							backgroundColor: '#fafafa'
						}}
					>
						<Typography color="textSecondary" textAlign="center">
							No raw materials added yet.
							<br />
							Click "Add Material" to add raw materials for this part.
						</Typography>
					</Box>
				) : (
					<TableContainer>
						<Table>
							<TableHead>
								<TableRow sx={{ backgroundColor: '#f8f9fa' }}>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Material Name</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Material Code</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Quantity</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>UOM</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Batching</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333', width: 120 }}>Actions</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{fields.map((field, index) => (
									<TableRow key={field.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
										<TableCell sx={{ fontWeight: 500, color: '#333' }}>{field.materialName}</TableCell>
										<TableCell sx={{ color: '#666' }}>{field.materialCode}</TableCell>
										<TableCell sx={{ color: '#666' }}>{field.quantity}</TableCell>
										<TableCell sx={{ color: '#666' }}>{field.uom}</TableCell>
										<TableCell sx={{ color: '#666' }}>{field.batching ? 'Yes' : 'No'}</TableCell>
										<TableCell>
											<Box sx={{ display: 'flex', gap: 1 }}>
												<IconButton size="small" onClick={() => handleOpenDialog(index)} sx={{ color: '#1976d2' }}>
													<EditIcon fontSize="small" />
												</IconButton>
												<IconButton size="small" onClick={() => handleDelete(index)} sx={{ color: '#d32f2f' }}>
													<DeleteIcon fontSize="small" />
												</IconButton>
											</Box>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</Paper>

			{/* Add/Edit Dialog */}
			<Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
				<DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
					<Typography variant="h6">{editingIndex !== null ? 'Edit Raw Material' : 'Add Raw Material'}</Typography>
					<IconButton onClick={handleCloseDialog} size="small">
						<CloseIcon />
					</IconButton>
				</DialogTitle>

				<DialogContent sx={{ pt: 1, pb: 2 }}>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
						<TextField
							fullWidth
							label="Material Name"
							value={formData.materialName}
							onChange={e => handleInputChange('materialName', e.target.value)}
							placeholder="e.g., Aluminium Sheet 6061"
							required
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: '8px'
								}
							}}
						/>

						<FormControl fullWidth>
							<InputLabel>Material Code</InputLabel>
							<Select
								value={selectedMaterialCodeType}
								onChange={e => handleMaterialCodeTypeChange(e.target.value)}
								label="Material Code"
								required
								sx={{
									borderRadius: '8px'
								}}
							>
								{materialCodeOptions.map(option => (
									<MenuItem key={option.value} value={option.value}>
										{option.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>

						{selectedMaterialCodeType === 'Others' && (
							<TextField
								fullWidth
								label="Custom Material Code"
								value={customMaterialCode}
								onChange={e => setCustomMaterialCode(e.target.value)}
								placeholder="Enter custom material code"
								required
								sx={{
									'& .MuiOutlinedInput-root': {
										borderRadius: '8px'
									}
								}}
							/>
						)}

						<TextField
							fullWidth
							label="Quantity"
							type="number"
							value={formData.quantity}
							onChange={e => handleInputChange('quantity', e.target.value)}
							placeholder="e.g., 2.5"
							required
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: '8px'
								}
							}}
						/>

						<FormControl fullWidth>
							<InputLabel>Unit of Measure</InputLabel>
							<Select
								value={formData.uom}
								onChange={e => handleInputChange('uom', e.target.value)}
								label="Unit of Measure"
								sx={{
									borderRadius: '8px'
								}}
							>
								{uomOptions.map(uom => (
									<MenuItem key={uom.value} value={uom.value}>
										{uom.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>

						<FormControlLabel
							control={
								<Switch
									checked={formData.batching}
									onChange={e => handleBatchingChange(e.target.checked)}
									color="primary"
								/>
							}
							label="Batching"
							sx={{ alignSelf: 'flex-start', mt: 1 }}
						/>
					</Box>
				</DialogContent>

				<DialogActions sx={{ p: 3, pt: 1 }}>
					<Button onClick={handleCloseDialog} variant="outlined">
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						variant="contained"
						disabled={
							!formData.materialName ||
							!selectedMaterialCodeType ||
							(selectedMaterialCodeType === 'Others' && !customMaterialCode) ||
							!formData.quantity ||
							!formData.uom
						}
						sx={{
							textTransform: 'none',
							backgroundColor: '#1976d2',
							'&:hover': { backgroundColor: '#1565c0' }
						}}
					>
						{editingIndex !== null ? 'Update' : 'Add'} Material
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default RawMaterialsTab;
