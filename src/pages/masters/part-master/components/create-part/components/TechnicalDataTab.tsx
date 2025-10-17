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
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Alert,
	Tabs,
	Tab,
	Grid
} from '@mui/material';
import {
	Add as AddIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
	Close as CloseIcon,
	Build as BuildIcon,
	ContentCut as CutIcon
} from '@mui/icons-material';
import { useFieldArray, Control, FieldErrors } from 'react-hook-form';
import { PartMasterFormData, defaultDrilling, defaultCutting } from '../schemas';

interface TechnicalDataTabProps {
	control: Control<PartMasterFormData>;
	errors: FieldErrors<PartMasterFormData>;
}

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`technical-tabpanel-${index}`}
			aria-labelledby={`technical-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ py: 2 }}>{children}</Box>}
		</div>
	);
}

const TechnicalDataTab = ({ control, errors }: TechnicalDataTabProps) => {
	const [activeSubTab, setActiveSubTab] = useState(0);
	const [drillingDialogOpen, setDrillingDialogOpen] = useState(false);
	const [cuttingDialogOpen, setCuttingDialogOpen] = useState(false);
	const [editingDrillingIndex, setEditingDrillingIndex] = useState<number | null>(null);
	const [editingCuttingIndex, setEditingCuttingIndex] = useState<number | null>(null);
	const [drillingFormData, setDrillingFormData] = useState(defaultDrilling);
	const [cuttingFormData, setCuttingFormData] = useState(defaultCutting);

	const {
		fields: drillingFields,
		append: appendDrilling,
		remove: removeDrilling,
		update: updateDrilling
	} = useFieldArray({
		control,
		name: 'drilling'
	});

	const {
		fields: cuttingFields,
		append: appendCutting,
		remove: removeCutting,
		update: updateCutting
	} = useFieldArray({
		control,
		name: 'cutting'
	});

	const handleSubTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setActiveSubTab(newValue);
	};

	// Drilling handlers
	const handleOpenDrillingDialog = (index?: number) => {
		if (index !== undefined) {
			setEditingDrillingIndex(index);
			setDrillingFormData(drillingFields[index]);
		} else {
			setEditingDrillingIndex(null);
			setDrillingFormData(defaultDrilling);
		}
		setDrillingDialogOpen(true);
	};

	const handleCloseDrillingDialog = () => {
		setDrillingDialogOpen(false);
		setEditingDrillingIndex(null);
		setDrillingFormData(defaultDrilling);
	};

	const handleSaveDrilling = () => {
		if (editingDrillingIndex !== null) {
			updateDrilling(editingDrillingIndex, drillingFormData);
		} else {
			appendDrilling(drillingFormData);
		}
		handleCloseDrillingDialog();
	};

	const handleDeleteDrilling = (index: number) => {
		removeDrilling(index);
	};

	const handleDrillingInputChange = (field: string, value: string) => {
		setDrillingFormData(prev => ({
			...prev,
			[field]: value
		}));
	};

	// Cutting handlers
	const handleOpenCuttingDialog = (index?: number) => {
		if (index !== undefined) {
			setEditingCuttingIndex(index);
			setCuttingFormData(cuttingFields[index]);
		} else {
			setEditingCuttingIndex(null);
			setCuttingFormData(defaultCutting);
		}
		setCuttingDialogOpen(true);
	};

	const handleCloseCuttingDialog = () => {
		setCuttingDialogOpen(false);
		setEditingCuttingIndex(null);
		setCuttingFormData(defaultCutting);
	};

	const handleSaveCutting = () => {
		if (editingCuttingIndex !== null) {
			updateCutting(editingCuttingIndex, cuttingFormData);
		} else {
			appendCutting(cuttingFormData);
		}
		handleCloseCuttingDialog();
	};

	const handleDeleteCutting = (index: number) => {
		removeCutting(index);
	};

	const handleCuttingInputChange = (field: string, value: string) => {
		setCuttingFormData(prev => ({
			...prev,
			[field]: value
		}));
	};

	return (
		<Box>
			<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
				<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
					Technical Data
				</Typography>
			</Box>

			<Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				{(errors.drilling || errors.cutting) && (
					<Alert severity="error" sx={{ mb: 3 }}>
						{errors.drilling?.message || errors.cutting?.message}
					</Alert>
				)}

				<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
					<Tabs value={activeSubTab} onChange={handleSubTabChange} aria-label="technical data tabs">
						<Tab
							label={`Drilling (${drillingFields.length})`}
							id="technical-tab-0"
							aria-controls="technical-tabpanel-0"
							icon={<BuildIcon />}
							iconPosition="start"
						/>
						<Tab
							label={`Cutting (${cuttingFields.length})`}
							id="technical-tab-1"
							aria-controls="technical-tabpanel-1"
							icon={<CutIcon />}
							iconPosition="start"
						/>
					</Tabs>
				</Box>

				{/* Drilling Tab */}
				<TabPanel value={activeSubTab} index={0}>
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
						<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
							Drilling Specifications
						</Typography>
						<Button
							variant="contained"
							startIcon={<AddIcon />}
							onClick={() => handleOpenDrillingDialog()}
							sx={{
								textTransform: 'none',
								backgroundColor: '#1976d2',
								'&:hover': { backgroundColor: '#1565c0' }
							}}
						>
							Add Drilling
						</Button>
					</Box>

					{drillingFields.length === 0 ? (
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								height: 150,
								border: '2px dashed #e0e0e0',
								borderRadius: 2,
								backgroundColor: '#fafafa'
							}}
						>
							<Typography color="textSecondary" textAlign="center">
								No drilling specifications added yet.
								<br />
								Click "Add Drilling" to add drilling details.
							</Typography>
						</Box>
					) : (
						<TableContainer>
							<Table>
								<TableHead>
									<TableRow sx={{ backgroundColor: '#f8f9fa' }}>
										<TableCell sx={{ fontWeight: 600, color: '#333' }}>Characteristics</TableCell>
										<TableCell sx={{ fontWeight: 600, color: '#333' }}>Specification</TableCell>
										<TableCell sx={{ fontWeight: 600, color: '#333' }}>No. of Holes</TableCell>
										<TableCell sx={{ fontWeight: 600, color: '#333' }}>Diameter (mm)</TableCell>
										<TableCell sx={{ fontWeight: 600, color: '#333' }}>Tolerance</TableCell>
										<TableCell sx={{ fontWeight: 600, color: '#333', width: 120 }}>Actions</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{drillingFields.map((field, index) => (
										<TableRow key={field.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
											<TableCell sx={{ fontWeight: 500, color: '#333' }}>{field.characteristics}</TableCell>
											<TableCell sx={{ color: '#666' }}>{field.specification}</TableCell>
											<TableCell sx={{ color: '#666' }}>{field.noOfHoles}</TableCell>
											<TableCell sx={{ color: '#666' }}>{field.diaOfHoles}</TableCell>
											<TableCell sx={{ color: '#666' }}>{field.tolerance}</TableCell>
											<TableCell>
												<Box sx={{ display: 'flex', gap: 1 }}>
													<IconButton
														size="small"
														onClick={() => handleOpenDrillingDialog(index)}
														sx={{ color: '#1976d2' }}
													>
														<EditIcon fontSize="small" />
													</IconButton>
													<IconButton
														size="small"
														onClick={() => handleDeleteDrilling(index)}
														sx={{ color: '#d32f2f' }}
													>
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
				</TabPanel>

				{/* Cutting Tab */}
				<TabPanel value={activeSubTab} index={1}>
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
						<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
							Cutting Specifications
						</Typography>
						<Button
							variant="contained"
							startIcon={<AddIcon />}
							onClick={() => handleOpenCuttingDialog()}
							sx={{
								textTransform: 'none',
								backgroundColor: '#1976d2',
								'&:hover': { backgroundColor: '#1565c0' }
							}}
						>
							Add Cutting
						</Button>
					</Box>

					{cuttingFields.length === 0 ? (
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								height: 150,
								border: '2px dashed #e0e0e0',
								borderRadius: 2,
								backgroundColor: '#fafafa'
							}}
						>
							<Typography color="textSecondary" textAlign="center">
								No cutting specifications added yet.
								<br />
								Click "Add Cutting" to add cutting details.
							</Typography>
						</Box>
					) : (
						<TableContainer>
							<Table>
								<TableHead>
									<TableRow sx={{ backgroundColor: '#f8f9fa' }}>
										<TableCell sx={{ fontWeight: 600, color: '#333' }}>Characteristics</TableCell>
										<TableCell sx={{ fontWeight: 600, color: '#333' }}>Specification</TableCell>
										<TableCell sx={{ fontWeight: 600, color: '#333' }}>Tolerance</TableCell>
										<TableCell sx={{ fontWeight: 600, color: '#333', width: 120 }}>Actions</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{cuttingFields.map((field, index) => (
										<TableRow key={field.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
											<TableCell sx={{ fontWeight: 500, color: '#333' }}>{field.characteristics}</TableCell>
											<TableCell sx={{ color: '#666' }}>{field.specification}</TableCell>
											<TableCell sx={{ color: '#666' }}>{field.tolerance}</TableCell>
											<TableCell>
												<Box sx={{ display: 'flex', gap: 1 }}>
													<IconButton
														size="small"
														onClick={() => handleOpenCuttingDialog(index)}
														sx={{ color: '#1976d2' }}
													>
														<EditIcon fontSize="small" />
													</IconButton>
													<IconButton size="small" onClick={() => handleDeleteCutting(index)} sx={{ color: '#d32f2f' }}>
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
				</TabPanel>
			</Paper>

			{/* Drilling Add/Edit Dialog */}
			<Dialog open={drillingDialogOpen} onClose={handleCloseDrillingDialog} maxWidth="sm" fullWidth>
				<DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
					<Typography variant="h6">
						{editingDrillingIndex !== null ? 'Edit Drilling Specification' : 'Add Drilling Specification'}
					</Typography>
					<IconButton onClick={handleCloseDrillingDialog} size="small">
						<CloseIcon />
					</IconButton>
				</DialogTitle>

				<DialogContent sx={{ pt: 1, pb: 2 }}>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
						<TextField
							fullWidth
							label="Characteristics"
							value={drillingFormData.characteristics}
							onChange={e => handleDrillingInputChange('characteristics', e.target.value)}
							placeholder="e.g., Mounting Holes"
							required
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: '8px'
								}
							}}
						/>

						<TextField
							fullWidth
							label="Specification"
							value={drillingFormData.specification}
							onChange={e => handleDrillingInputChange('specification', e.target.value)}
							placeholder="e.g., 6mm holes for M6 bolts"
							required
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: '8px'
								}
							}}
						/>

						<Grid container spacing={2}>
							<Grid size={{ xs: 6 }}>
								<TextField
									fullWidth
									label="Number of Holes"
									value={drillingFormData.noOfHoles}
									onChange={e => handleDrillingInputChange('noOfHoles', e.target.value)}
									placeholder="e.g., 4"
									required
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px'
										}
									}}
								/>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<TextField
									fullWidth
									label="Diameter of Holes (mm)"
									value={drillingFormData.diaOfHoles}
									onChange={e => handleDrillingInputChange('diaOfHoles', e.target.value)}
									placeholder="e.g., 6"
									required
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px'
										}
									}}
								/>
							</Grid>
						</Grid>

						<TextField
							fullWidth
							label="Tolerance"
							value={drillingFormData.tolerance}
							onChange={e => handleDrillingInputChange('tolerance', e.target.value)}
							placeholder="e.g., 0.1"
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
					<Button onClick={handleCloseDrillingDialog} variant="outlined">
						Cancel
					</Button>
					<Button
						onClick={handleSaveDrilling}
						variant="contained"
						disabled={
							!drillingFormData.characteristics ||
							!drillingFormData.specification ||
							!drillingFormData.noOfHoles ||
							!drillingFormData.diaOfHoles ||
							!drillingFormData.tolerance
						}
						sx={{
							textTransform: 'none',
							backgroundColor: '#1976d2',
							'&:hover': { backgroundColor: '#1565c0' }
						}}
					>
						{editingDrillingIndex !== null ? 'Update' : 'Add'} Drilling
					</Button>
				</DialogActions>
			</Dialog>

			{/* Cutting Add/Edit Dialog */}
			<Dialog open={cuttingDialogOpen} onClose={handleCloseCuttingDialog} maxWidth="sm" fullWidth>
				<DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
					<Typography variant="h6">
						{editingCuttingIndex !== null ? 'Edit Cutting Specification' : 'Add Cutting Specification'}
					</Typography>
					<IconButton onClick={handleCloseCuttingDialog} size="small">
						<CloseIcon />
					</IconButton>
				</DialogTitle>

				<DialogContent sx={{ pt: 1, pb: 2 }}>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
						<TextField
							fullWidth
							label="Characteristics"
							value={cuttingFormData.characteristics}
							onChange={e => handleCuttingInputChange('characteristics', e.target.value)}
							placeholder="e.g., Laser Cut Edges"
							required
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: '8px'
								}
							}}
						/>

						<TextField
							fullWidth
							label="Specification"
							value={cuttingFormData.specification}
							onChange={e => handleCuttingInputChange('specification', e.target.value)}
							placeholder="e.g., ±0.5mm tolerance on outer profile"
							required
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: '8px'
								}
							}}
						/>

						<TextField
							fullWidth
							label="Tolerance"
							value={cuttingFormData.tolerance}
							onChange={e => handleCuttingInputChange('tolerance', e.target.value)}
							placeholder="e.g., 0.5"
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
					<Button onClick={handleCloseCuttingDialog} variant="outlined">
						Cancel
					</Button>
					<Button
						onClick={handleSaveCutting}
						variant="contained"
						disabled={!cuttingFormData.characteristics || !cuttingFormData.specification || !cuttingFormData.tolerance}
						sx={{
							textTransform: 'none',
							backgroundColor: '#1976d2',
							'&:hover': { backgroundColor: '#1565c0' }
						}}
					>
						{editingCuttingIndex !== null ? 'Update' : 'Add'} Cutting
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default TechnicalDataTab;
