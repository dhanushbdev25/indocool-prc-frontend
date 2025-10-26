import React, { useState } from 'react';
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
	Switch,
	Collapse
} from '@mui/material';
import {
	Add as AddIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
	Close as CloseIcon,
	KeyboardArrowDown,
	KeyboardArrowRight,
	Delete as BinIcon
} from '@mui/icons-material';
import { useFieldArray, Control, FieldErrors } from 'react-hook-form';
import { PartMasterFormData, defaultRawMaterial } from '../schemas';
import { uomOptions } from '../../../../sequence-master/components/create-sequence/types';

// Material code options
const materialCodeOptions = [
	{ value: 'Gelcoat', label: 'Gelcoat' },
	{ value: 'Resin', label: 'Resin' },
	{ value: 'Topcoat', label: 'Top Coat' },
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
	const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

	const { fields, append, remove, update } = useFieldArray({
		control,
		name: 'rawMaterials'
	});

	const handleOpenDialog = (index?: number) => {
		if (index !== undefined) {
			setEditingIndex(index);
			// Convert splitQuantity from number to string if needed
			const fieldData = { ...fields[index] };
			if (fieldData.splittingConfiguration) {
				fieldData.splittingConfiguration = fieldData.splittingConfiguration.map(split => ({
					...split,
					splitQuantity: String(split.splitQuantity)
				}));
			}
			setFormData(fieldData);
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

	const handleSplittingChange = (checked: boolean) => {
		setFormData(prev => ({
			...prev,
			splitting: checked,
			splittingConfiguration: checked ? [{ order: 1, splitQuantity: '' }] : null
		}));
	};

	const handleAddSplitRow = () => {
		const newOrder = (formData.splittingConfiguration?.length || 0) + 1;
		setFormData(prev => ({
			...prev,
			splittingConfiguration: [...(prev.splittingConfiguration || []), { order: newOrder, splitQuantity: '' }]
		}));
	};

	const handleRemoveSplitRow = (index: number) => {
		setFormData(prev => ({
			...prev,
			splittingConfiguration: prev.splittingConfiguration?.filter((_, i) => i !== index) || null
		}));
	};

	const handleSplitQuantityChange = (index: number, value: string) => {
		setFormData(prev => ({
			...prev,
			splittingConfiguration:
				prev.splittingConfiguration?.map((item, i) => (i === index ? { ...item, splitQuantity: value } : item)) || null
		}));
	};

	const toggleRowExpansion = (index: number) => {
		const newExpanded = new Set(expandedRows);
		if (newExpanded.has(index)) {
			newExpanded.delete(index);
		} else {
			newExpanded.add(index);
		}
		setExpandedRows(newExpanded);
	};

	const validateSplitQuantities = () => {
		if (!formData.splitting || !formData.splittingConfiguration) return true;
		const totalQuantity = parseFloat(formData.quantity) || 0;
		const splitSum = formData.splittingConfiguration.reduce((sum, item) => {
			const quantity = parseFloat(String(item.splitQuantity || '')) || 0;
			return sum + quantity;
		}, 0);
		return Math.abs(totalQuantity - splitSum) < 0.01; // Allow small floating point differences
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
									<TableCell sx={{ fontWeight: 600, color: '#333', width: 50 }}></TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Material Name</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Material Code</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Quantity</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>UOM</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Batching</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Splitting</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333', width: 120 }}>Actions</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{fields.map((field, index) => (
									<React.Fragment key={field.id}>
										<TableRow sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
											<TableCell>
												{field.splitting && field.splittingConfiguration && field.splittingConfiguration.length > 0 && (
													<IconButton size="small" onClick={() => toggleRowExpansion(index)} sx={{ color: '#1976d2' }}>
														{expandedRows.has(index) ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
													</IconButton>
												)}
											</TableCell>
											<TableCell sx={{ fontWeight: 500, color: '#333' }}>{field.materialName}</TableCell>
											<TableCell sx={{ color: '#666' }}>{field.materialCode}</TableCell>
											<TableCell sx={{ color: '#666' }}>{field.quantity}</TableCell>
											<TableCell sx={{ color: '#666' }}>{field.uom}</TableCell>
											<TableCell sx={{ color: '#666' }}>{field.batching ? 'Yes' : 'No'}</TableCell>
											<TableCell sx={{ color: '#666' }}>{field.splitting ? 'Yes' : 'No'}</TableCell>
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
										{field.splitting && field.splittingConfiguration && field.splittingConfiguration.length > 0 && (
											<TableRow>
												<TableCell colSpan={8} sx={{ py: 0 }}>
													<Collapse in={expandedRows.has(index)} timeout="auto" unmountOnExit>
														<Box sx={{ margin: 1 }}>
															<Typography
																variant="h6"
																gutterBottom
																component="div"
																sx={{ fontSize: '0.9rem', fontWeight: 600 }}
															>
																Split Configuration
															</Typography>
															<Table size="small">
																<TableHead>
																	<TableRow>
																		<TableCell sx={{ fontWeight: 600, color: '#333' }}>Order</TableCell>
																		<TableCell sx={{ fontWeight: 600, color: '#333' }}>Split Quantity</TableCell>
																	</TableRow>
																</TableHead>
																<TableBody>
																	{field.splittingConfiguration.map((split, splitIndex) => (
																		<TableRow key={splitIndex}>
																			<TableCell sx={{ color: '#666' }}>{split.order}</TableCell>
																			<TableCell sx={{ color: '#666' }}>{String(split.splitQuantity ?? '')}</TableCell>
																		</TableRow>
																	))}
																</TableBody>
															</Table>
														</Box>
													</Collapse>
												</TableCell>
											</TableRow>
										)}
									</React.Fragment>
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

						<Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
							<FormControlLabel
								control={
									<Switch
										checked={formData.batching}
										onChange={e => handleBatchingChange(e.target.checked)}
										color="primary"
									/>
								}
								label="Batching"
							/>

							<FormControlLabel
								control={
									<Switch
										checked={formData.splitting}
										onChange={e => handleSplittingChange(e.target.checked)}
										color="primary"
									/>
								}
								label="Splitting"
							/>
						</Box>

						{formData.splitting && (
							<Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
								<Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
									Split Configuration
								</Typography>
								{formData.splittingConfiguration?.map((split, index) => (
									<Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
										<TextField label="Order" value={split.order} disabled size="small" sx={{ width: 80 }} />
										<TextField
											label="Split Quantity"
											type="number"
											value={split.splitQuantity}
											onChange={e => handleSplitQuantityChange(index, e.target.value)}
											size="small"
											sx={{ flexGrow: 1 }}
										/>
										<IconButton size="small" onClick={() => handleRemoveSplitRow(index)} sx={{ color: '#d32f2f' }}>
											<BinIcon />
										</IconButton>
									</Box>
								))}
								<Button
									variant="outlined"
									startIcon={<AddIcon />}
									onClick={handleAddSplitRow}
									size="small"
									sx={{ textTransform: 'none' }}
								>
									Add Split
								</Button>
								{!validateSplitQuantities() && (
									<Alert severity="error" sx={{ mt: 1 }}>
										Sum of split quantities must equal total quantity
									</Alert>
								)}
							</Box>
						)}
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
							!formData.uom ||
							!validateSplitQuantities()
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
