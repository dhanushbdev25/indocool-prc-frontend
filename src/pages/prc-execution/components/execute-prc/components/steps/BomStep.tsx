import { useState, useEffect, useMemo } from 'react';
import {
	Box,
	Typography,
	TextField,
	Button,
	Alert,
	Card,
	CardContent,
	Chip,
	FormControlLabel,
	Checkbox,
	Grid,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Paper,
	Avatar
} from '@mui/material';
import {
	CheckCircle as CheckCircleIcon,
	Warning as WarningIcon,
	Error as ErrorIcon,
	Block as BlockIcon,
	ExpandMore as ExpandMoreIcon,
	Thermostat as ThermostatIcon,
	WaterDrop as WaterDropIcon,
	Science as ScienceIcon,
	Check as CheckIcon
} from '@mui/icons-material';
import {
	type TimelineStep,
	type ExecutionData,
	type FormData,
	type CatalystMixingEntry,
	type CatalystMixingFormData
} from '../../../../types/execution.types';

interface BomStepProps {
	step: TimelineStep;
	executionData: ExecutionData;
	onStepComplete: (formData: FormData) => void;
}

// Helper function to find matching catalyst configuration
const findCatalystConfiguration = (
	temperature: number,
	humidity: number,
	catalystConfigurations: Array<{
		minTemperature: string;
		maxTemperature: string;
		minHumidity: string;
		maxHumidity: string;
		blockCatalystMixing: boolean;
		requestSupervisorApproval: boolean;
		[key: string]: unknown;
	}>
) => {
	return catalystConfigurations.find(config => {
		const minTemp = parseFloat(config.minTemperature);
		const maxTemp = parseFloat(config.maxTemperature);
		const minHum = parseFloat(config.minHumidity);
		const maxHum = parseFloat(config.maxHumidity);

		return temperature >= minTemp && temperature <= maxTemp && humidity >= minHum && humidity <= maxHum;
	});
};

// Helper function to get material code key for catalyst configuration
const getMaterialCodeKey = (materialCode: string) => {
	switch (materialCode.toLowerCase()) {
		case 'gelcoat':
			return 'gelcoat';
		case 'resin':
			return 'resinDosage';
		case 'topcoat':
			return 'topCoat';
		default:
			return 'gelcoat'; // Default fallback
	}
};

// Helper function to calculate catalyst range
const calculateCatalystRange = (
	quantity: number,
	materialCode: string,
	catalystConfig: {
		[key: string]: string;
	}
) => {
	const key = getMaterialCodeKey(materialCode);
	const minKey = `min${key.charAt(0).toUpperCase()}${key.slice(1)}`;
	const maxKey = `max${key.charAt(0).toUpperCase()}${key.slice(1)}`;

	const minPerKg = parseFloat(catalystConfig[minKey] || '0');
	const maxPerKg = parseFloat(catalystConfig[maxKey] || '0');

	return {
		min: minPerKg * quantity,
		max: maxPerKg * quantity
	};
};

// Helper function to validate catalyst quantity
const validateCatalystQuantity = (quantity: number, min: number, max: number): 'Accepted' | 'Lesser' | 'Greater' => {
	if (quantity < min) return 'Lesser';
	if (quantity > max) return 'Greater';
	return 'Accepted';
};

// Helper function to group and sort BOM items
const groupAndSortBOMItems = (
	bomItems: Array<{
		id: number;
		materialCode?: string;
		materialName?: string;
		quantity: string;
		splitQuantity?: string;
		uom: string;
		order?: number;
		splitting?: boolean;
		splittingConfiguration?: Array<{ order: number; splitQuantity: string }> | null;
	}>
) => {
	const grouped: Record<
		string,
		Array<{
			id: number;
			materialCode?: string;
			materialName?: string;
			quantity: string;
			splitQuantity?: string;
			uom: string;
			order?: number;
			splitting?: boolean;
			splittingConfiguration?: Array<{ order: number; splitQuantity: string }> | null;
		}>
	> = {};

	// Group by material code
	bomItems.forEach(item => {
		const materialCode = item.materialCode || 'Unknown';
		if (!grouped[materialCode]) {
			grouped[materialCode] = [];
		}
		grouped[materialCode].push(item);
	});

	// Sort each group by order
	Object.keys(grouped).forEach(materialCode => {
		grouped[materialCode].sort((a, b) => (a.order || 0) - (b.order || 0));
	});

	return grouped;
};

const BomStep = ({ step, executionData, onStepComplete }: BomStepProps) => {
	const [formData, setFormData] = useState<CatalystMixingFormData>({
		entries: []
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [acknowledgments, setAcknowledgments] = useState<Record<string, boolean>>({});

	const isReadOnly = step.status === 'completed';

	// Process BOM items into catalyst mixing entries
	const processedEntries = useMemo(() => {
		if (!step.items || !executionData.catalystData?.catalystConfiguration) return [];

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const grouped = groupAndSortBOMItems(step.items as any[]);
		const entries: CatalystMixingEntry[] = [];

		Object.entries(grouped).forEach(([, items]) => {
			items.forEach(item => {
				// Each BOM item is already a separate order/step
				// Use material ID and order directly for the entry ID
				const entryId = `${item.id}_${item.order || 0}`;
				// Use splitQuantity if splitting is true, otherwise use quantity
				const entryQuantity = item.splitting ? item.splitQuantity || '0' : item.quantity;

				entries.push({
					id: entryId,
					materialId: item.id,
					materialCode: item.materialCode || 'Unknown',
					materialName: item.materialName || 'Unknown Material',
					quantity: entryQuantity,
					uom: item.uom,
					order: item.order,
					isSplit: item.splitting || false,
					temperature: '',
					humidity: '',
					catalystQuantity: '',
					calculatedMin: 0,
					calculatedMax: 0,
					validationStatus: 'Accepted',
					acknowledged: false,
					blocked: false,
					requiresSupervisorApproval: false
				});
			});
		});

		return entries;
	}, [step.items, executionData.catalystData?.catalystConfiguration]);

	// Initialize form data when processed entries change
	useEffect(() => {
		if (processedEntries.length > 0 && formData.entries.length === 0) {
			// Load saved data from executionData if available
			// Structure: { materialId: { order: { data } } }
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const savedData = (executionData.prcAggregatedSteps?.bom as Record<string, Record<string, any>>) || {};

			const newFormData: CatalystMixingFormData = {
				entries: processedEntries.map(entry => {
					// Use materialId and order directly from entry
					const materialId = entry.materialId.toString();
					const order = entry.order || 0;

					// Check if we have saved data for this material and order
					const materialData = savedData[materialId];
					const savedEntry = materialData?.[order.toString()];

					if (savedEntry) {
						// Remap saved data back to full structure
						return {
							...entry,
							calculatedMax: savedEntry.calculatedMax || 0,
							calculatedMin: savedEntry.calculatedMin || 0,
							catalystQuantity: savedEntry.catalystQuantity || '',
							validationStatus: savedEntry.validationStatus || 'Accepted',
							humidity: savedEntry.humidity || '',
							temperature: savedEntry.temperature || ''
						};
					}
					return entry;
				})
			};

			// Load acknowledgment states from saved data
			const newAcknowledgments: Record<string, boolean> = {};
			processedEntries.forEach(entry => {
				const materialId = entry.materialId.toString();
				const order = entry.order || 0;
				const materialData = savedData[materialId];
				const savedEntry = materialData?.[order.toString()];

				if (savedEntry && savedEntry.acknowledged) {
					newAcknowledgments[entry.id] = true;
				}
			});
			// Use setTimeout to avoid setState in effect warning
			setTimeout(() => {
				setAcknowledgments(newAcknowledgments);
				setFormData(newFormData);
			}, 0);
		}
	}, [processedEntries, formData.entries.length, executionData.prcAggregatedSteps?.bom]);

	const handleInputChange = (entryId: string, field: keyof CatalystMixingEntry, value: string | boolean) => {
		setFormData(prev => {
			const newEntries = prev.entries.map(entry => {
				if (entry.id === entryId) {
					const updatedEntry = { ...entry, [field]: value };

					// Recalculate catalyst range if temperature or humidity changed
					if ((field === 'temperature' || field === 'humidity') && executionData.catalystData?.catalystConfiguration) {
						// Reset range values when temperature or humidity changes
						updatedEntry.calculatedMin = 0;
						updatedEntry.calculatedMax = 0;
						updatedEntry.blocked = false;
						updatedEntry.requiresSupervisorApproval = false;
						updatedEntry.validationStatus = 'Accepted';

						// Only calculate if both temperature and humidity have valid values
						if (updatedEntry.temperature && updatedEntry.humidity) {
							const temp = parseFloat(updatedEntry.temperature);
							const hum = parseFloat(updatedEntry.humidity);

							// Check if values are valid numbers
							if (!isNaN(temp) && !isNaN(hum)) {
								const config = findCatalystConfiguration(temp, hum, executionData.catalystData.catalystConfiguration);

								if (config) {
									const quantity = parseFloat(updatedEntry.quantity);
									if (!isNaN(quantity)) {
										const range = calculateCatalystRange(
											quantity,
											updatedEntry.materialCode,
											config as Record<string, string>
										);
										updatedEntry.calculatedMin = range.min;
										updatedEntry.calculatedMax = range.max;
										updatedEntry.blocked = config.blockCatalystMixing;
										updatedEntry.requiresSupervisorApproval = config.requestSupervisorApproval;

										// Validate catalyst quantity if it's been entered
										if (updatedEntry.catalystQuantity) {
											const catQty = parseFloat(updatedEntry.catalystQuantity);
											if (!isNaN(catQty)) {
												updatedEntry.validationStatus = validateCatalystQuantity(
													catQty,
													updatedEntry.calculatedMin,
													updatedEntry.calculatedMax
												);
											}
										}
									}
								}
							}
						}
					}

					// Validate catalyst quantity if it changed
					if (
						field === 'catalystQuantity' &&
						value &&
						updatedEntry.calculatedMin > 0 &&
						updatedEntry.calculatedMax > 0
					) {
						const catQty = parseFloat(value as string);
						if (!isNaN(catQty)) {
							updatedEntry.validationStatus = validateCatalystQuantity(
								catQty,
								updatedEntry.calculatedMin,
								updatedEntry.calculatedMax
							);
						}
					}

					return updatedEntry;
				}
				return entry;
			});

			return {
				entries: newEntries
			};
		});

		// Clear error when user starts typing
		if (errors[entryId]) {
			setErrors(prev => ({
				...prev,
				[entryId]: ''
			}));
		}
	};

	const handleAcknowledgmentChange = (entryId: string, acknowledged: boolean) => {
		setAcknowledgments(prev => ({
			...prev,
			[entryId]: acknowledged
		}));
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		formData.entries.forEach(entry => {
			// Check if temperature and humidity are provided
			if (!entry.temperature || entry.temperature.trim() === '') {
				newErrors[`${entry.id}_temperature`] = 'Temperature is required';
			} else {
				const temp = parseFloat(entry.temperature);
				if (isNaN(temp)) {
					newErrors[`${entry.id}_temperature`] = 'Please enter a valid temperature';
				}
			}

			if (!entry.humidity || entry.humidity.trim() === '') {
				newErrors[`${entry.id}_humidity`] = 'Humidity is required';
			} else {
				const hum = parseFloat(entry.humidity);
				if (isNaN(hum)) {
					newErrors[`${entry.id}_humidity`] = 'Please enter a valid humidity';
				}
			}

			// Check if catalyst quantity is provided
			if (!entry.catalystQuantity || entry.catalystQuantity.trim() === '') {
				newErrors[`${entry.id}_catalyst`] = 'Catalyst quantity is required';
			} else {
				const catQty = parseFloat(entry.catalystQuantity);
				if (isNaN(catQty) || catQty < 0) {
					newErrors[`${entry.id}_catalyst`] = 'Please enter a valid catalyst quantity';
				}
			}

			// Check if blocked
			if (entry.blocked) {
				newErrors[`${entry.id}_blocked`] = 'Catalyst mixing is blocked for this configuration';
			}

			// Check if out of range and not acknowledged
			if ((entry.validationStatus === 'Lesser' || entry.validationStatus === 'Greater') && !acknowledgments[entry.id]) {
				newErrors[`${entry.id}_acknowledge`] = 'Please acknowledge the out-of-range value';
			}
		});

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = () => {
		if (validateForm()) {
			// Include acknowledgment state in the form data for saving
			const formDataWithAcknowledgments = {
				...formData,
				acknowledgments
			};
			onStepComplete(formDataWithAcknowledgments as unknown as FormData);
		}
	};

	const getValidationIcon = (status: 'Accepted' | 'Lesser' | 'Greater') => {
		switch (status) {
			case 'Accepted':
				return <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />;
			case 'Lesser':
				return <WarningIcon sx={{ color: 'warning.main', fontSize: 20 }} />;
			case 'Greater':
				return <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />;
		}
	};

	const getValidationChip = (entry: CatalystMixingEntry) => {
		const status = entry.validationStatus;
		const color = status === 'Accepted' ? 'success' : status === 'Lesser' ? 'warning' : 'error';
		const label = `Range: ${status}`;

		return <Chip icon={getValidationIcon(status)} label={label} color={color} size="small" variant="outlined" />;
	};

	// Helper function to get material icon
	const getMaterialIcon = (materialCode: string) => {
		switch (materialCode.toLowerCase()) {
			case 'gelcoat':
				return <ScienceIcon />;
			case 'resin':
				return <WaterDropIcon />;
			case 'topcoat':
				return <ThermostatIcon />;
			default:
				return <ScienceIcon />;
		}
	};

	// Helper function to get validation background color
	const getValidationBackgroundColor = (status: 'Accepted' | 'Lesser' | 'Greater') => {
		switch (status) {
			case 'Accepted':
				return '#e8f5e8';
			case 'Lesser':
				return '#fff3e0';
			case 'Greater':
				return '#ffebee';
			default:
				return '#f5f5f5';
		}
	};

	// Helper function to get validation border color
	const getValidationBorderColor = (status: 'Accepted' | 'Lesser' | 'Greater') => {
		switch (status) {
			case 'Accepted':
				return '#4caf50';
			case 'Lesser':
				return '#ff9800';
			case 'Greater':
				return '#f44336';
			default:
				return '#e0e0e0';
		}
	};

	// Group entries by material code for display
	const groupedEntries = useMemo(() => {
		const grouped: Record<string, CatalystMixingEntry[]> = {};
		formData.entries.forEach(entry => {
			if (!grouped[entry.materialCode]) {
				grouped[entry.materialCode] = [];
			}
			grouped[entry.materialCode].push(entry);
		});
		return grouped;
	}, [formData.entries]);

	return (
		<Box sx={{ p: 3, backgroundColor: '#fafafa' }}>
			{/* Material Groups */}
			{Object.entries(groupedEntries).map(([materialCode, entries], groupIndex) => (
				<Accordion
					key={materialCode}
					defaultExpanded={groupIndex === 0}
					sx={{
						mb: 2,
						borderRadius: 2,
						'&:before': { display: 'none' },
						boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
					}}
				>
					<AccordionSummary
						expandIcon={<ExpandMoreIcon />}
						sx={{
							backgroundColor: 'primary.50',
							borderRadius: '8px 8px 0 0',
							'&.Mui-expanded': {
								borderRadius: '8px 8px 0 0'
							}
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
							<Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 32, height: 32 }}>
								{getMaterialIcon(materialCode)}
							</Avatar>
							<Box sx={{ flex: 1 }}>
								<Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
									{materialCode}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{entries.length} {entries.length === 1 ? 'entry' : 'entries'} •{' '}
									{entries.filter(e => e.temperature && e.humidity && e.catalystQuantity).length} completed
								</Typography>
							</Box>
						</Box>
					</AccordionSummary>

					<AccordionDetails sx={{ p: 0 }}>
						<Box sx={{ p: 2 }}>
							{entries.map(entry => (
								<Card
									key={entry.id}
									sx={{
										mb: 2,
										border: '1px solid #e0e0e0',
										borderRadius: 2,
										overflow: 'hidden',
										position: 'relative'
									}}
								>
									{/* Entry Header */}
									<Box
										sx={{
											backgroundColor: entry.blocked ? 'error.50' : 'grey.50',
											p: 2,
											borderBottom: '1px solid #e0e0e0'
										}}
									>
										<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
											<Box sx={{ display: 'flex', alignItems: 'center' }}>
												{entry.isSplit && entry.order && (
													<Chip
														label={`Order ${entry.order}`}
														size="small"
														color="primary"
														variant="outlined"
														sx={{ mr: 2 }}
													/>
												)}
												<Typography variant="h6" sx={{ fontWeight: 500 }}>
													{entry.materialName}
												</Typography>
											</Box>

											<Box sx={{ display: 'flex', gap: 1 }}>
												{entry.blocked && (
													<Chip icon={<BlockIcon />} label="Blocked" color="error" size="small" variant="filled" />
												)}
												{entry.requiresSupervisorApproval && !entry.blocked && (
													<Chip
														icon={<WarningIcon />}
														label="Supervisor Approval Required"
														color="warning"
														size="small"
														variant="outlined"
													/>
												)}
												{entry.temperature && entry.humidity && entry.catalystQuantity && !entry.blocked && (
													<Chip
														icon={<CheckIcon />}
														label="Completed"
														color="success"
														size="small"
														variant="outlined"
													/>
												)}
											</Box>
										</Box>

										<Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
											Required:{' '}
											<strong>
												{entry.quantity} {entry.uom}
											</strong>
										</Typography>
									</Box>

									<CardContent sx={{ p: 3 }}>
										{/* Input Fields */}
										<Grid container spacing={3}>
											<Grid size={{ xs: 12, md: 4 }}>
												<Box sx={{ position: 'relative' }}>
													<TextField
														fullWidth
														label="Temperature"
														type="number"
														value={entry.temperature}
														onChange={e => handleInputChange(entry.id, 'temperature', e.target.value)}
														error={!!errors[`${entry.id}_temperature`]}
														helperText={errors[`${entry.id}_temperature`] || 'Enter temperature in °C'}
														disabled={isReadOnly || entry.blocked}
														InputProps={{
															startAdornment: (
																<Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
																	<ThermostatIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
																</Box>
															),
															endAdornment: (
																<Typography variant="body2" sx={{ color: 'text.secondary' }}>
																	°C
																</Typography>
															)
														}}
													/>
												</Box>
											</Grid>

											<Grid size={{ xs: 12, md: 4 }}>
												<TextField
													fullWidth
													label="Humidity"
													type="number"
													value={entry.humidity}
													onChange={e => handleInputChange(entry.id, 'humidity', e.target.value)}
													error={!!errors[`${entry.id}_humidity`]}
													helperText={errors[`${entry.id}_humidity`] || 'Enter humidity in %'}
													disabled={isReadOnly || entry.blocked}
													InputProps={{
														startAdornment: (
															<Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
																<WaterDropIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
															</Box>
														),
														endAdornment: (
															<Typography variant="body2" sx={{ color: 'text.secondary' }}>
																%
															</Typography>
														)
													}}
												/>
											</Grid>

											<Grid size={{ xs: 12, md: 4 }}>
												<TextField
													fullWidth
													label="Catalyst Quantity"
													type="number"
													value={entry.catalystQuantity}
													onChange={e => handleInputChange(entry.id, 'catalystQuantity', e.target.value)}
													error={!!errors[`${entry.id}_catalyst`]}
													helperText={errors[`${entry.id}_catalyst`] || 'Enter catalyst quantity'}
													disabled={isReadOnly || entry.blocked}
													InputProps={{
														startAdornment: (
															<Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
																<ScienceIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
															</Box>
														)
													}}
												/>
											</Grid>
										</Grid>

										{/* Range Display and Validation */}
										{entry.calculatedMin > 0 && entry.calculatedMax > 0 && (
											<Paper
												elevation={0}
												sx={{
													mt: 3,
													p: 2,
													backgroundColor: getValidationBackgroundColor(entry.validationStatus),
													border: `1px solid ${getValidationBorderColor(entry.validationStatus)}`,
													borderRadius: 2
												}}
											>
												<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
														{getValidationIcon(entry.validationStatus)}
														<Box>
															<Typography variant="body2" color="text.secondary">
																Recommended Range
															</Typography>
															<Typography variant="h6" sx={{ fontWeight: 600 }}>
																{entry.calculatedMin.toFixed(2)} - {entry.calculatedMax.toFixed(2)} {entry.uom}
															</Typography>
														</Box>
													</Box>
													{getValidationChip(entry)}
												</Box>
											</Paper>
										)}

										{/* Acknowledgment checkbox for out-of-range values */}
										{(entry.validationStatus === 'Lesser' || entry.validationStatus === 'Greater') &&
											!entry.blocked && (
												<Box sx={{ mt: 2 }}>
													<FormControlLabel
														control={
															<Checkbox
																checked={acknowledgments[entry.id] || false}
																onChange={e => handleAcknowledgmentChange(entry.id, e.target.checked)}
																disabled={isReadOnly}
															/>
														}
														label={
															<Typography variant="body2" color="text.secondary">
																I acknowledge that the catalyst quantity is outside the recommended range
															</Typography>
														}
													/>
													{errors[`${entry.id}_acknowledge`] && (
														<Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
															{errors[`${entry.id}_acknowledge`]}
														</Typography>
													)}
												</Box>
											)}

										{/* Blocked message */}
										{entry.blocked && (
											<Alert severity="error" sx={{ mt: 2 }} icon={<BlockIcon />}>
												Catalyst mixing is blocked for this temperature and humidity configuration.
											</Alert>
										)}
									</CardContent>
								</Card>
							))}
						</Box>
					</AccordionDetails>
				</Accordion>
			))}

			{/* Validation Alert */}
			{Object.keys(errors).length > 0 && (
				<Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} icon={<ErrorIcon />}>
					Please fill in all required fields with valid values and acknowledge any out-of-range values.
				</Alert>
			)}

			{/* Submit Button */}
			{!isReadOnly && (
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
					<Button
						variant="contained"
						onClick={handleSubmit}
						startIcon={<CheckIcon />}
						sx={{
							borderRadius: 2,
							fontWeight: 600,
							textTransform: 'none'
						}}
					>
						Complete Catalyst Mixing
					</Button>
				</Box>
			)}
		</Box>
	);
};

export default BomStep;
