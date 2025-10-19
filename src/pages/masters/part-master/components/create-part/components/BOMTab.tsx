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
import { PartMasterFormData, defaultBOM } from '../schemas';

interface BOMTabProps {
	control: Control<PartMasterFormData>;
	errors: FieldErrors<PartMasterFormData>;
}

const BOMTab = ({ control, errors }: BOMTabProps) => {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [formData, setFormData] = useState(defaultBOM);

	const { fields, append, remove, update } = useFieldArray({
		control,
		name: 'bom'
	});

	const handleOpenDialog = (index?: number) => {
		if (index !== undefined) {
			setEditingIndex(index);
			setFormData(fields[index]);
		} else {
			setEditingIndex(null);
			setFormData(defaultBOM);
		}
		setDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setDialogOpen(false);
		setEditingIndex(null);
		setFormData(defaultBOM);
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

	const materialTypeOptions = [
		'Sub Assembly',
		'Fastener',
		'Component',
		'Raw Material',
		'Hardware',
		'Electrical',
		'Mechanical',
		'Other'
	];

	return (
		<Box>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
				<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
					Bill of Materials (BOM)
				</Typography>
				<Button
					variant="contained"
					startIcon={<AddIcon />}
					onClick={() => handleOpenDialog()}
					sx={{
						textTransform: 'none',
						backgroundColor: '#1976d2',
						'&:hover': { backgroundColor: '#1565c0' },
						mb: 2
					}}
				>
					Add BOM Item
				</Button>
			</Box>

			<Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				{errors.bom && (
					<Alert severity="error" sx={{ mb: 3 }}>
						{errors.bom.message}
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
							No BOM items added yet.
							<br />
							Click "Add BOM Item" to add bill of materials for this part.
						</Typography>
					</Box>
				) : (
					<TableContainer>
						<Table>
							<TableHead>
								<TableRow sx={{ backgroundColor: '#f8f9fa' }}>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Material Type</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Description</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>BOM Quantity</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333', width: 120 }}>Actions</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{fields.map((field, index) => (
									<TableRow key={field.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
										<TableCell sx={{ fontWeight: 500, color: '#333' }}>{field.materialType}</TableCell>
										<TableCell sx={{ color: '#666' }}>{field.description}</TableCell>
										<TableCell sx={{ color: '#666' }}>{field.bomQuantity}</TableCell>
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
					<Typography variant="h6">{editingIndex !== null ? 'Edit BOM Item' : 'Add BOM Item'}</Typography>
					<IconButton onClick={handleCloseDialog} size="small">
						<CloseIcon />
					</IconButton>
				</DialogTitle>

				<DialogContent sx={{ pt: 1, pb: 2 }}>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
						<FormControl fullWidth>
							<InputLabel>Material Type</InputLabel>
							<Select
								value={formData.materialType}
								onChange={e => handleInputChange('materialType', e.target.value)}
								label="Material Type"
								sx={{
									borderRadius: '8px'
								}}
							>
								{materialTypeOptions.map(type => (
									<MenuItem key={type} value={type}>
										{type}
									</MenuItem>
								))}
							</Select>
						</FormControl>

						<TextField
							fullWidth
							label="Description"
							value={formData.description}
							onChange={e => handleInputChange('description', e.target.value)}
							placeholder="e.g., Bracket Base Assembly"
							required
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: '8px'
								}
							}}
						/>

						<TextField
							fullWidth
							label="BOM Quantity"
							value={formData.bomQuantity}
							onChange={e => handleInputChange('bomQuantity', e.target.value)}
							placeholder="e.g., 1"
							required
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: '8px'
								}
							}}
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
						disabled={!formData.materialType || !formData.description || !formData.bomQuantity}
						sx={{
							textTransform: 'none',
							backgroundColor: '#1976d2',
							'&:hover': { backgroundColor: '#1565c0' }
						}}
					>
						{editingIndex !== null ? 'Update' : 'Add'} BOM Item
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default BOMTab;
