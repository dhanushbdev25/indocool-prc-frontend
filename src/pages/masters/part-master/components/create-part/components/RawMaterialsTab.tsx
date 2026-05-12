import React, { useState } from 'react';
import {
	Box,
	Paper,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	IconButton,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Collapse,
	Switch,
	TextField
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
	Edit as EditIcon,
	Close as CloseIcon,
	KeyboardArrowDown,
	KeyboardArrowRight,
	Add as AddIcon,
	Delete as BinIcon
} from '@mui/icons-material';
import { useFieldArray, Control } from 'react-hook-form';
import { PartMasterFormData, defaultRawMaterial, RawMaterialFormData } from '../schemas';
import { uomOptions } from '../../../../sequence-master/components/create-sequence/types';

interface RawMaterialsTabProps {
	control: Control<PartMasterFormData>;
}

const ReadOnlyField = ({ label, children }: { label: string; children: React.ReactNode }) => (
	<Box>
		<Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}>
			{label}
		</Typography>
		<Typography variant="body1" sx={{ color: '#333', wordBreak: 'break-word' }}>
			{children ?? '—'}
		</Typography>
	</Box>
);

const RawMaterialsTab = ({ control }: RawMaterialsTabProps) => {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [formData, setFormData] = useState<RawMaterialFormData>(defaultRawMaterial);
	const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

	const { fields, update } = useFieldArray({
		control,
		name: 'rawMaterials'
	});

	const handleOpenDialog = (index: number) => {
		setEditingIndex(index);
		const fieldData = { ...fields[index] } as RawMaterialFormData;
		if (fieldData.splittingConfiguration) {
			fieldData.splittingConfiguration = fieldData.splittingConfiguration.map(split => ({
				...split,
				splitQuantity: String(split.splitQuantity)
			}));
		}
		setFormData(fieldData);
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
		}
		handleCloseDialog();
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

	const handleRemoveSplitRow = (rowIndex: number) => {
		setFormData(prev => ({
			...prev,
			splittingConfiguration: prev.splittingConfiguration?.filter((_, i) => i !== rowIndex) || null
		}));
	};

	const handleSplitQuantityChange = (rowIndex: number, value: string) => {
		setFormData(prev => ({
			...prev,
			splittingConfiguration:
				prev.splittingConfiguration?.map((item, i) => (i === rowIndex ? { ...item, splitQuantity: value } : item)) || null
		}));
	};

	const validateSplitQuantities = () => {
		if (!formData.splitting || !formData.splittingConfiguration) return true;
		const totalQuantity = parseFloat(String(formData.quantity)) || 0;
		const splitSum = formData.splittingConfiguration.reduce((sum, item) => {
			const quantity = parseFloat(String(item.splitQuantity || '')) || 0;
			return sum + quantity;
		}, 0);
		return Math.abs(totalQuantity - splitSum) < 0.01;
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

	const uomLabel = uomOptions.find(u => u.value === formData.uom)?.label ?? formData.uom;

	return (
		<Box>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
				<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
					Bill of Material
				</Typography>
			</Box>

			<Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>

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
							No bill of material entries configured for this part.
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
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Material Group</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>Quantity</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333' }}>UOM</TableCell>
									<TableCell sx={{ fontWeight: 600, color: '#333', width: 80 }} align="right">
										Actions
									</TableCell>
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
											<TableCell sx={{ color: '#666' }}>
												{field.materialGroup != null && String(field.materialGroup).trim() !== ''
													? field.materialGroup
													: '—'}
											</TableCell>
											<TableCell sx={{ color: '#666' }}>{field.quantity}</TableCell>
											<TableCell sx={{ color: '#666' }}>{field.uom}</TableCell>
											<TableCell align="right">
												<IconButton size="small" onClick={() => handleOpenDialog(index)} sx={{ color: '#1976d2' }}>
													<EditIcon fontSize="small" />
												</IconButton>
											</TableCell>
										</TableRow>
										{field.splitting && field.splittingConfiguration && field.splittingConfiguration.length > 0 && (
											<TableRow>
												<TableCell colSpan={7} sx={{ py: 0 }}>
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

			<Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
				<DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
					<Typography variant="h6">Bill of Material details</Typography>
					<IconButton onClick={handleCloseDialog} size="small">
						<CloseIcon />
					</IconButton>
				</DialogTitle>

				<DialogContent sx={{ pt: 1, pb: 2 }}>
					<Grid container spacing={2.5} sx={{ mt: 0 }}>
						<Grid size={{ xs: 12, sm: 6 }}>
							<ReadOnlyField label="Material Name">{formData.materialName}</ReadOnlyField>
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							<ReadOnlyField label="Material Code">{formData.materialCode}</ReadOnlyField>
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							<ReadOnlyField label="Material group">{formData.materialGroup?.trim() ? formData.materialGroup : '—'}</ReadOnlyField>
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							<ReadOnlyField label="Quantity">{formData.quantity}</ReadOnlyField>
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							<ReadOnlyField label="Unit of Measure">{uomLabel || '—'}</ReadOnlyField>
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							<Box>
								<Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.25 }}>
									Splitting
								</Typography>
								<Switch
									checked={Boolean(formData.splitting)}
									onChange={e => handleSplittingChange(e.target.checked)}
									color="primary"
									inputProps={{ 'aria-label': 'Splitting' }}
								/>
							</Box>
						</Grid>

						{formData.splitting && (
							<Grid size={{ xs: 12 }}>
								<Box sx={{ mt: 0.5, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
									<Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
										Split configuration
									</Typography>
									{formData.splittingConfiguration && formData.splittingConfiguration.length > 0 ? (
										formData.splittingConfiguration.map((split, index) => (
											<Box key={`${split.order}-${index}`} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
												<TextField label="Order" value={split.order} disabled size="small" sx={{ width: 80 }} />
												<TextField
													label="Split quantity"
													type="number"
													value={split.splitQuantity}
													onChange={e => handleSplitQuantityChange(index, e.target.value)}
													size="small"
													sx={{ flexGrow: 1, minWidth: 0 }}
												/>
												<IconButton size="small" onClick={() => handleRemoveSplitRow(index)} sx={{ color: '#d32f2f' }}>
													<BinIcon />
												</IconButton>
											</Box>
										))
									) : (
										<Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
											No split rows. Use Add split to add rows.
										</Typography>
									)}
									<Button
										variant="outlined"
										startIcon={<AddIcon />}
										onClick={handleAddSplitRow}
										size="small"
										sx={{ textTransform: 'none' }}
									>
										Add split
									</Button>
								</Box>
							</Grid>
						)}
					</Grid>
				</DialogContent>

				<DialogActions sx={{ p: 3, pt: 1 }}>
					<Button onClick={handleCloseDialog} variant="outlined" sx={{ textTransform: 'none' }}>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						variant="contained"
						disabled={!validateSplitQuantities()}
						sx={{
							textTransform: 'none',
							backgroundColor: '#1976d2',
							'&:hover': { backgroundColor: '#1565c0' }
						}}
					>
						Update material
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default RawMaterialsTab;
