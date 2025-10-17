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
	Alert
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';
import { useFieldArray, Control, FieldErrors } from 'react-hook-form';
import { PartMasterFormData, defaultRawMaterial } from '../schemas';
import { uomOptions } from '../../../../sequence-master/components/create-sequence/types';

interface RawMaterialsTabProps {
	control: Control<PartMasterFormData>;
	errors: FieldErrors<PartMasterFormData>;
}

const RawMaterialsTab = ({ control, errors }: RawMaterialsTabProps) => {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [formData, setFormData] = useState(defaultRawMaterial);

	const { fields, append, remove, update } = useFieldArray({
		control,
		name: 'rawMaterials'
	});

	const handleOpenDialog = (index?: number) => {
		if (index !== undefined) {
			setEditingIndex(index);
			setFormData(fields[index]);
		} else {
			setEditingIndex(null);
			setFormData(defaultRawMaterial);
		}
		setDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setDialogOpen(false);
		setEditingIndex(null);
		setFormData(defaultRawMaterial);
	};

	const handleSave = () => {
		if (editingIndex !== null) {
			update(editingIndex, formData);
		} else {
			append(formData);
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

						<TextField
							fullWidth
							label="Material Code"
							value={formData.materialCode}
							onChange={e => handleInputChange('materialCode', e.target.value)}
							placeholder="e.g., AL-6061-3MM"
							required
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: '8px'
								}
							}}
						/>

						<TextField
							fullWidth
							label="Quantity"
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
					</Box>
				</DialogContent>

				<DialogActions sx={{ p: 3, pt: 1 }}>
					<Button onClick={handleCloseDialog} variant="outlined">
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						variant="contained"
						disabled={!formData.materialName || !formData.materialCode || !formData.quantity || !formData.uom}
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
