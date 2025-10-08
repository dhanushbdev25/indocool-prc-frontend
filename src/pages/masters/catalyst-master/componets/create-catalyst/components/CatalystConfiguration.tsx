import { useState, useEffect } from 'react';
import {
	Box,
	Paper,
	Typography,
	Button,
	Grid,
	TextField,
	FormControlLabel,
	Switch,
	Card,
	CardContent,
	IconButton,
	Divider,
	Alert,
	Collapse
} from '@mui/material';
import {
	Add as AddIcon,
	Delete as DeleteIcon,
	Settings as SettingsIcon,
	ExpandMore as ExpandMoreIcon,
	ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { Controller, useFieldArray } from 'react-hook-form';
import { CatalystConfigurationProps } from '../types';
import { defaultCatalystConfiguration } from '../schemas';

const CatalystConfiguration = ({ control, errors }: CatalystConfigurationProps) => {
	const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set([0]));
	const [manuallyCollapsed, setManuallyCollapsed] = useState<Set<number>>(new Set());

	const { fields, append, remove } = useFieldArray({
		control,
		name: 'catalystConfiguration'
	});

	// Auto-expand cards with validation errors and ensure first card is expanded
	useEffect(() => {
		const newExpanded = new Set(expandedCards);
		let hasChanges = false;

		// Always ensure first configuration is expanded unless manually collapsed
		if (fields.length > 0 && !manuallyCollapsed.has(0) && !newExpanded.has(0)) {
			newExpanded.add(0);
			hasChanges = true;
		}

		// Auto-expand cards with validation errors
		if (errors.catalystConfiguration && Array.isArray(errors.catalystConfiguration)) {
			(errors.catalystConfiguration as Record<string, unknown>[]).forEach(
				(fieldErrors: Record<string, unknown>, index: number) => {
					if (fieldErrors && Object.keys(fieldErrors).length > 0 && !manuallyCollapsed.has(index)) {
						if (!newExpanded.has(index)) {
							newExpanded.add(index);
							hasChanges = true;
						}
					}
				}
			);
		}

		if (hasChanges) {
			setExpandedCards(newExpanded);
		}
	}, [errors.catalystConfiguration, expandedCards, manuallyCollapsed, fields.length]);

	const addConfiguration = () => {
		append(defaultCatalystConfiguration);
		const newIndex = fields.length;
		setExpandedCards(prev => new Set([...prev, newIndex]));
	};

	const removeConfiguration = (index: number) => {
		remove(index);

		// Update expanded cards
		const newExpanded = new Set<number>();
		const newManuallyCollapsed = new Set<number>();

		expandedCards.forEach(cardIndex => {
			if (cardIndex < index) {
				newExpanded.add(cardIndex);
			} else if (cardIndex > index) {
				newExpanded.add(cardIndex - 1);
			}
		});

		manuallyCollapsed.forEach(cardIndex => {
			if (cardIndex < index) {
				newManuallyCollapsed.add(cardIndex);
			} else if (cardIndex > index) {
				newManuallyCollapsed.add(cardIndex - 1);
			}
		});

		setExpandedCards(newExpanded);
		setManuallyCollapsed(newManuallyCollapsed);
	};

	const toggleCardExpansion = (index: number) => {
		const newExpanded = new Set(expandedCards);
		const newManuallyCollapsed = new Set(manuallyCollapsed);

		if (newExpanded.has(index)) {
			newExpanded.delete(index);
			newManuallyCollapsed.add(index);
		} else {
			newExpanded.add(index);
			newManuallyCollapsed.delete(index);
		}

		setExpandedCards(newExpanded);
		setManuallyCollapsed(newManuallyCollapsed);
	};

	const renderConfigurationCard = (_field: Record<string, unknown>, index: number) => {
		const isExpanded = expandedCards.has(index);
		const isFirst = index === 0;
		const fieldErrors = errors.catalystConfiguration?.[index] as Record<string, unknown>;
		const isManuallyCollapsed = manuallyCollapsed.has(index);

		// Auto-expand card if it has validation errors, unless manually collapsed
		// First configuration should always be expanded unless manually collapsed
		const hasErrors = fieldErrors && Object.keys(fieldErrors).length > 0;
		const shouldBeExpanded = isExpanded || (hasErrors && !isManuallyCollapsed) || (isFirst && !isManuallyCollapsed);

		return (
			<Card
				key={index}
				sx={{
					mb: 2,
					border: '1px solid #e0e0e0',
					borderRadius: '12px',
					boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
				}}
			>
				<CardContent sx={{ pb: shouldBeExpanded ? 2 : 1 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<Box sx={{ display: 'flex', alignItems: 'center' }}>
							<SettingsIcon sx={{ mr: 1, color: '#1976d2' }} />
							<Typography variant="h6" sx={{ fontWeight: 600 }}>
								Configuration {index + 1}
							</Typography>
							{isFirst && (
								<Alert severity="info" sx={{ ml: 2, py: 0, fontSize: '0.75rem' }}>
									Default Configuration
								</Alert>
							)}
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'center' }}>
							{fields.length > 1 && (
								<IconButton onClick={() => removeConfiguration(index)} color="error" size="small" sx={{ mr: 1 }}>
									<DeleteIcon />
								</IconButton>
							)}
							<IconButton onClick={() => toggleCardExpansion(index)} size="small">
								{shouldBeExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
							</IconButton>
						</Box>
					</Box>

					<Collapse in={shouldBeExpanded}>
						<Divider sx={{ my: 2 }} />

						<Grid container spacing={3}>
							{/* Temperature Range */}
							<Grid size={{ xs: 12 }}>
								<Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#555' }}>
									Temperature Range (°C)
								</Typography>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Controller
									name={`catalystConfiguration.${index}.minTemperature`}
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											label="Min Temperature"
											type="number"
											required
											placeholder="e.g., 20"
											error={!!fieldErrors?.minTemperature}
											helperText={fieldErrors?.minTemperature?.message}
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
										/>
									)}
								/>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Controller
									name={`catalystConfiguration.${index}.maxTemperature`}
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											label="Max Temperature"
											type="number"
											required
											placeholder="e.g., 35"
											error={!!fieldErrors?.maxTemperature}
											helperText={fieldErrors?.maxTemperature?.message}
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
										/>
									)}
								/>
							</Grid>

							{/* Humidity Range */}
							<Grid size={{ xs: 12 }}>
								<Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#555' }}>
									Humidity Range (%)
								</Typography>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Controller
									name={`catalystConfiguration.${index}.minHumidity`}
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											label="Min Humidity"
											type="number"
											required
											placeholder="e.g., 40"
											error={!!fieldErrors?.minHumidity}
											helperText={fieldErrors?.minHumidity?.message}
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
										/>
									)}
								/>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Controller
									name={`catalystConfiguration.${index}.maxHumidity`}
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											label="Max Humidity"
											type="number"
											required
											placeholder="e.g., 65"
											error={!!fieldErrors?.maxHumidity}
											helperText={fieldErrors?.maxHumidity?.message}
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
										/>
									)}
								/>
							</Grid>

							{/* Gelcoat Settings */}
							<Grid size={{ xs: 12 }}>
								<Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#555' }}>
									Gelcoat Settings
								</Typography>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Controller
									name={`catalystConfiguration.${index}.minGelcoat`}
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											label="Min Gelcoat"
											type="number"
											required
											placeholder="e.g., 1.5"
											inputProps={{ step: '0.1' }}
											error={!!fieldErrors?.minGelcoat}
											helperText={fieldErrors?.minGelcoat?.message}
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
										/>
									)}
								/>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Controller
									name={`catalystConfiguration.${index}.maxGelcoat`}
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											label="Max Gelcoat"
											type="number"
											required
											placeholder="e.g., 2.5"
											inputProps={{ step: '0.1' }}
											error={!!fieldErrors?.maxGelcoat}
											helperText={fieldErrors?.maxGelcoat?.message}
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
										/>
									)}
								/>
							</Grid>
							<Grid size={{ xs: 12 }}>
								<Controller
									name={`catalystConfiguration.${index}.gelcoatLabel`}
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											label="Gelcoat Label"
											required
											placeholder="e.g., Standard Gelcoat Mix"
											error={!!fieldErrors?.gelcoatLabel}
											helperText={fieldErrors?.gelcoatLabel?.message}
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
										/>
									)}
								/>
							</Grid>

							{/* Resin Settings */}
							<Grid size={{ xs: 12 }}>
								<Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#555' }}>
									Resin Settings
								</Typography>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Controller
									name={`catalystConfiguration.${index}.minResinDosage`}
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											label="Min Resin Dosage"
											type="number"
											required
											placeholder="e.g., 0.8"
											inputProps={{ step: '0.1' }}
											error={!!fieldErrors?.minResinDosage}
											helperText={fieldErrors?.minResinDosage?.message}
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
										/>
									)}
								/>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Controller
									name={`catalystConfiguration.${index}.maxResinDosage`}
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											label="Max Resin Dosage"
											type="number"
											required
											placeholder="e.g., 1.2"
											inputProps={{ step: '0.1' }}
											error={!!fieldErrors?.maxResinDosage}
											helperText={fieldErrors?.maxResinDosage?.message}
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
										/>
									)}
								/>
							</Grid>
							<Grid size={{ xs: 12 }}>
								<Controller
									name={`catalystConfiguration.${index}.resinLabel`}
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											label="Resin Label"
											required
											placeholder="e.g., General Purpose Resin"
											error={!!fieldErrors?.resinLabel}
											helperText={fieldErrors?.resinLabel?.message}
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
										/>
									)}
								/>
							</Grid>

							{/* Safety Settings */}
							<Grid size={{ xs: 12 }}>
								<Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#555' }}>
									Safety & Approval Settings
								</Typography>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Controller
									name={`catalystConfiguration.${index}.blockCatalystMixing`}
									control={control}
									render={({ field }) => (
										<FormControlLabel
											control={<Switch checked={field.value} onChange={field.onChange} color="warning" />}
											label="Block Catalyst Mixing"
										/>
									)}
								/>
							</Grid>
							<Grid size={{ xs: 6 }}>
								<Controller
									name={`catalystConfiguration.${index}.requestSupervisorApproval`}
									control={control}
									render={({ field }) => (
										<FormControlLabel
											control={<Switch checked={field.value} onChange={field.onChange} color="primary" />}
											label="Request Supervisor Approval"
										/>
									)}
								/>
							</Grid>
						</Grid>
					</Collapse>
				</CardContent>
			</Card>
		);
	};

	return (
		<Box>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<SettingsIcon sx={{ mr: 1, color: '#1976d2' }} />
					<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
						Configuration Settings
					</Typography>
				</Box>
				<Button
					variant="outlined"
					startIcon={<AddIcon />}
					onClick={addConfiguration}
					sx={{
						textTransform: 'none',
						borderRadius: '8px',
						borderColor: '#1976d2',
						color: '#1976d2',
						'&:hover': {
							borderColor: '#1565c0',
							backgroundColor: 'rgba(25, 118, 210, 0.04)'
						}
					}}
				>
					Add Configuration
				</Button>
			</Box>

			<Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				{fields.length === 0 ? (
					<Box sx={{ textAlign: 'center', py: 4 }}>
						<SettingsIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
						<Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
							No configurations added yet
						</Typography>
						<Typography variant="body2" sx={{ color: '#999', mb: 3 }}>
							Add at least one configuration to define temperature and humidity ranges
						</Typography>
						<Button
							variant="contained"
							startIcon={<AddIcon />}
							onClick={addConfiguration}
							sx={{
								textTransform: 'none',
								backgroundColor: '#1976d2',
								'&:hover': { backgroundColor: '#1565c0' }
							}}
						>
							Add First Configuration
						</Button>
					</Box>
				) : (
					<Box>
						<Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
							Define different configurations for various temperature and humidity conditions. Each configuration
							specifies dosage ranges and safety settings.
						</Typography>
						{fields.map((field, index) => renderConfigurationCard(field, index))}
					</Box>
				)}
			</Paper>
		</Box>
	);
};

export default CatalystConfiguration;
