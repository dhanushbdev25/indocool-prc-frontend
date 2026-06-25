import { useState, useEffect, useMemo, type MutableRefObject } from 'react';
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
	Avatar,
	FormControl,
	FormLabel,
	Radio,
	RadioGroup,
	InputLabel,
	Select,
	MenuItem
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
import { OK_NOT_OK_NEGATIVE_LABEL, OK_NOT_OK_POSITIVE_LABEL } from '../../../../../../utils/okNotOkLabels';

interface BomStepProps {
	step: TimelineStep;
	executionData: ExecutionData;
	onStepComplete: (formData: FormData) => void;
	readOnlyOverride?: boolean;
	/** Consolidated PDF/report: every material group expanded; no interaction needed. */
	expandAccordionsForPdf?: boolean;
	submitLabel?: string;
	hideSubmitButton?: boolean;
	submitActionRef?: MutableRefObject<(() => void) | null>;
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
// Dosage = (min/max dosage from config) / 100
// Min / Max = Dosage * material quantity (kg) * 1000
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

	const minDosage = parseFloat(catalystConfig[minKey] || '0') / 100;
	const maxDosage = parseFloat(catalystConfig[maxKey] || '0') / 100;

	return {
		min: minDosage * quantity * 1000,
		max: maxDosage * quantity * 1000
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

const BomStep = ({
	step,
	executionData,
	onStepComplete,
	readOnlyOverride,
	expandAccordionsForPdf,
	submitLabel = 'Complete Catalyst Mixing',
	hideSubmitButton = false,
	submitActionRef
}: BomStepProps) => {
	const [formData, setFormData] = useState<CatalystMixingFormData>({
		entries: []
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [acknowledgments, setAcknowledgments] = useState<Record<string, boolean>>({});

	const isReadOnly = Boolean(readOnlyOverride) || step.status === 'completed';

	// Process BOM items into catalyst mixing entries
	const processedEntries = useMemo(() => {
		if (!step.items) return [];

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
					canNumber: '',
					hygrometerInstrumentId: '',
					weighingMachineInstrumentId: '',
					actualQuantity: '',
					catalystQuantity: '',
					calculatedMin: 0,
					calculatedMax: 0,
					validationStatus: 'Accepted',
					acknowledged: false,
					blocked: false,
					requiresSupervisorApproval: false,
					fodCheckpoint: '',
					fodDeviationComment: '',
					employeeName: '',
					employeeCode: '',
					role: 'l1'
				});
			});
		});

		return entries;
	}, [step.items]);

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
							savedEntry : savedEntry.catalystQuantity ? true : false,
							validationStatus: savedEntry.validationStatus || 'Accepted',
							humidity: savedEntry.humidity || '',
							canNumber:
								savedEntry.canNumber == null || savedEntry.canNumber === ''
									? ''
									: String(savedEntry.canNumber),
							hygrometerInstrumentId:
								savedEntry.hygrometerInstrumentId == null
									? ''
									: String(savedEntry.hygrometerInstrumentId),
							weighingMachineInstrumentId:
								savedEntry.weighingMachineInstrumentId == null
									? ''
									: String(savedEntry.weighingMachineInstrumentId),
							actualQuantity: savedEntry.actualQuantity || 0,
							temperature: savedEntry.temperature || '',
							fodCheckpoint:
								savedEntry.fodCheckpoint === 'ok' || savedEntry.fodCheckpoint === 'not ok'
									? savedEntry.fodCheckpoint
									: '',
							fodDeviationComment: savedEntry.fodDeviationComment || '',
							employeeName: savedEntry.employeeName || '',
							employeeCode: savedEntry.employeeCode || '',
							role:
								savedEntry.role === 'l2' || savedEntry.role === 'l3' || savedEntry.role === 'l4'
									? savedEntry.role
									: 'l1'
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
					if (
						(field === 'temperature' || field === 'humidity' || field === 'actualQuantity') &&
						executionData.catalystData?.catalystConfiguration
					) {
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
									// Prefer the operator's actual measured quantity; fall back to planned quantity.
									const actualQty = parseFloat(updatedEntry.actualQuantity);
									const plannedQty = parseFloat(updatedEntry.quantity);
									const quantity = !isNaN(actualQty) && actualQty > 0 ? actualQty : plannedQty;
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
		if (field === 'fodCheckpoint' && errors[`${entryId}_fod`]) {
			setErrors(prev => ({ ...prev, [`${entryId}_fod`]: '' }));
		}
		if (field === 'fodDeviationComment' && errors[`${entryId}_fodComment`]) {
			setErrors(prev => ({ ...prev, [`${entryId}_fodComment`]: '' }));
		}
		if (field === 'role' && errors[`${entryId}_role`]) {
			setErrors(prev => ({ ...prev, [`${entryId}_role`]: '' }));
		}
		if (field === 'employeeName' && errors[`${entryId}_employeeName`]) {
			setErrors(prev => ({ ...prev, [`${entryId}_employeeName`]: '' }));
		}
		if (field === 'employeeCode' && errors[`${entryId}_employeeCode`]) {
			setErrors(prev => ({ ...prev, [`${entryId}_employeeCode`]: '' }));
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
			// if (!entry.temperature || entry.temperature.trim() === '') {
			// 	newErrors[`${entry.id}_temperature`] = 'Temperature is required';
			// } else {
			// 	const temp = parseFloat(entry.temperature);
			// 	if (isNaN(temp)) {
			// 		newErrors[`${entry.id}_temperature`] = 'Please enter a valid temperature';
			// 	}
			// }

			// if (!entry.humidity || entry.humidity.trim() === '') {
			// 	newErrors[`${entry.id}_humidity`] = 'Humidity is required';
			// } else {
			// 	const hum = parseFloat(entry.humidity);
			// 	if (isNaN(hum)) {
			// 		newErrors[`${entry.id}_humidity`] = 'Please enter a valid humidity';
			// 	}
			// }

			// // Check if catalyst quantity is provided
			// if (!entry.catalystQuantity || entry.catalystQuantity.trim() === '') {
			// 	newErrors[`${entry.id}_catalyst`] = 'Catalyst quantity is required';
			// } else {
			// 	const catQty = parseFloat(entry.catalystQuantity);
			// 	if (isNaN(catQty) || catQty < 0) {
			// 		newErrors[`${entry.id}_catalyst`] = 'Please enter a valid catalyst quantity';
			// 	}
			// }

			// Check if blocked
			if (entry.blocked) {
				newErrors[`${entry.id}_blocked`] = 'Catalyst mixing is blocked for this configuration';
			}

			// Check if out of range and not acknowledged
			if ((entry.validationStatus === 'Lesser' || entry.validationStatus === 'Greater') && !acknowledgments[entry.id]) {
				newErrors[`${entry.id}_acknowledge`] = 'Please acknowledge the out-of-range value';
			}

			// FOD checkpoint is mandatory only when catalyst quantity has been entered
			// (and the entry isn't blocked). Without a catalyst quantity, the operator
			// hasn't filled the material yet, so we don't force an FOD answer.
			const catalystQuantityEntered = entry.catalystQuantity.trim() !== '';
			if (!entry.blocked && catalystQuantityEntered) {
				if (!entry.role) {
					newErrors[`${entry.id}_role`] = 'Skill level is required';
				}
				if (entry.fodCheckpoint !== 'ok' && entry.fodCheckpoint !== 'not ok') {
					newErrors[`${entry.id}_fod`] = 'FOD checkpoint is required';
				} else if (entry.fodCheckpoint === 'not ok' && !entry.fodDeviationComment.trim()) {
					newErrors[`${entry.id}_fodComment`] = `Comments are required for ${OK_NOT_OK_NEGATIVE_LABEL}`;
				}
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

	useEffect(() => {
		if (!submitActionRef) return;

		submitActionRef.current = handleSubmit;

		return () => {
			submitActionRef.current = null;
		};
	}, [handleSubmit, submitActionRef]);

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
		<Box
			className={expandAccordionsForPdf ? 'prc-report-bom-root' : undefined}
			sx={{ p: 3, backgroundColor: '#fafafa' }}
		>
			{/* Material Groups */}
			{Object.entries(groupedEntries).map(([materialCode, entries], groupIndex) => (
				<Accordion
					key={materialCode}
					{...(expandAccordionsForPdf
						? {
								expanded: true,
								onChange: () => {}
							}
						: {
								defaultExpanded: groupIndex === 0
							})}
					sx={{
						mb: 2,
						borderRadius: 2,
						'&:before': { display: 'none' },
						boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
						...(expandAccordionsForPdf
							? {
									'& .MuiAccordionSummary-expandIconWrapper': { display: 'none' }
								}
							: {})
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
											<Grid size={{ xs: 12, md: 3 }}>
												<Box sx={{ position: 'relative' }}>
													<TextField
														fullWidth
														label="Temperature"
														type="number"
														value={entry.temperature}
														onChange={e => handleInputChange(entry.id, 'temperature', e.target.value)}
														error={!!errors[`${entry.id}_temperature`]}
														helperText={errors[`${entry.id}_temperature`] || 'Enter temperature in °C'}
														disabled={isReadOnly || entry.blocked || entry.savedEntry}
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

											<Grid size={{ xs: 12, md: 3 }}>
												<TextField
													fullWidth
													label="Humidity"
													type="number"
													value={entry.humidity}
													onChange={e => handleInputChange(entry.id, 'humidity', e.target.value)}
													error={!!errors[`${entry.id}_humidity`]}
													helperText={errors[`${entry.id}_humidity`] || 'Enter humidity in %'}
													disabled={isReadOnly || entry.blocked || entry.savedEntry}
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

											<Grid size={{ xs: 12, md: 3 }}>
												<TextField
													fullWidth
													label="Actual Quantity"
													type="number"
													value={entry.actualQuantity}
													onChange={e => handleInputChange(entry.id, 'actualQuantity', e.target.value)}
													error={!!errors[`${entry.id}_actualQuantity`]}
													helperText={errors[`${entry.id}_actualQuantity`] || 'Enter actual quantity'}
													disabled={isReadOnly || entry.blocked || entry.savedEntry}
													InputProps={{
														startAdornment: (
															<Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
																<ScienceIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
															</Box>
														)
													}}
												/>
											</Grid>

											<Grid size={{ xs: 12, md: 3 }}>
												<TextField
													fullWidth
													label="Catalyst Quantity (ml)"
													type="number"
													value={entry.catalystQuantity}
													onChange={e => handleInputChange(entry.id, 'catalystQuantity', e.target.value)}
													error={!!errors[`${entry.id}_catalyst`]}
													helperText={errors[`${entry.id}_catalyst`] || 'Enter catalyst quantity in ml'}
													disabled={isReadOnly || entry.blocked || entry.savedEntry}
													InputProps={{
														startAdornment: (
															<Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
																<ScienceIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
															</Box>
														)
													}}
												/>
											</Grid>

											<Grid size={{ xs: 12, md: 3 }}>
												<TextField
													fullWidth
													label="Can number"
													value={entry.canNumber}
													onChange={e => handleInputChange(entry.id, 'canNumber', e.target.value)}
													helperText="Optional"
													disabled={isReadOnly || entry.blocked || entry.savedEntry}
												/>
											</Grid>

											<Grid size={{ xs: 12, md: 3 }}>
												<TextField
													fullWidth
													label="Hygrometer ID"
													value={entry.hygrometerInstrumentId}
													onChange={e =>
														handleInputChange(entry.id, 'hygrometerInstrumentId', e.target.value)
													}
													helperText="Optional"
													disabled={isReadOnly || entry.blocked || entry.savedEntry}
												/>
											</Grid>

											<Grid size={{ xs: 12, md: 3 }}>
												<TextField
													fullWidth
													label="Weighing Machine ID"
													value={entry.weighingMachineInstrumentId}
													onChange={e =>
														handleInputChange(entry.id, 'weighingMachineInstrumentId', e.target.value)
													}
													helperText="Optional"
													disabled={isReadOnly || entry.blocked || entry.savedEntry}
												/>
											</Grid>
										</Grid>

										<Box sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
											<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333', mb: 2 }}>
												Operator details
											</Typography>
											<Grid container spacing={2}>
												<Grid size={{ xs: 12, md: 4 }}>
													<FormControl fullWidth error={!!errors[`${entry.id}_role`]} disabled={isReadOnly || entry.blocked || entry.savedEntry}>
														<InputLabel>Skill level</InputLabel>
														<Select
															value={entry.role}
															onChange={e => handleInputChange(entry.id, 'role', e.target.value)}
															label="Skill level"
														>
															<MenuItem value="l1">L1</MenuItem>
															<MenuItem value="l2">L2</MenuItem>
															<MenuItem value="l3">L3</MenuItem>
															<MenuItem value="l4">L4</MenuItem>
														</Select>
														{errors[`${entry.id}_role`] && (
															<Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
																{errors[`${entry.id}_role`]}
															</Typography>
														)}
													</FormControl>
												</Grid>
												<Grid size={{ xs: 12, md: 4 }}>
													<TextField
														fullWidth
														label="Employee name"
														value={entry.employeeName}
														onChange={e => handleInputChange(entry.id, 'employeeName', e.target.value)}
														error={!!errors[`${entry.id}_employeeName`]}
														helperText={errors[`${entry.id}_employeeName`]}
														disabled={isReadOnly || entry.blocked || entry.savedEntry}
													/>
												</Grid>
												<Grid size={{ xs: 12, md: 4 }}>
													<TextField
														fullWidth
														label="Employee number"
														value={entry.employeeCode}
														onChange={e => handleInputChange(entry.id, 'employeeCode', e.target.value)}
														error={!!errors[`${entry.id}_employeeCode`]}
														helperText={errors[`${entry.id}_employeeCode`]}
														disabled={isReadOnly || entry.blocked || entry.savedEntry}
													/>
												</Grid>
											</Grid>
										</Box>

										{/* FOD Checkpoint */}
										<Box sx={{ mt: 3 }}>
											<FormControl
												component="fieldset"
												disabled={isReadOnly || entry.blocked || entry.savedEntry}
												fullWidth
												error={!!errors[`${entry.id}_fod`]}
											>
												<FormLabel
													component="legend"
													sx={{ mb: 1, fontWeight: 500 }}
													required={entry.catalystQuantity.trim() !== ''}
												>
													Mixing Material is free from Foreign Object Debris (FOD) and stirred as per Work
													Instruction
												</FormLabel>
												<RadioGroup
													row
													value={entry.fodCheckpoint}
													onChange={e => handleInputChange(entry.id, 'fodCheckpoint', e.target.value)}
												>
													<FormControlLabel
														value="ok"
														control={<Radio size="small" color="success" />}
														label={OK_NOT_OK_POSITIVE_LABEL}
													/>
													<FormControlLabel
														value="not ok"
														control={<Radio size="small" color="warning" />}
														label={OK_NOT_OK_NEGATIVE_LABEL}
													/>
												</RadioGroup>
												{errors[`${entry.id}_fod`] && (
													<Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
														{errors[`${entry.id}_fod`]}
													</Typography>
												)}
												{entry.fodCheckpoint === 'not ok' && (
													<TextField
														fullWidth
														multiline
														rows={2}
														label="Deviation comments"
														placeholder={`Enter comments for ${OK_NOT_OK_NEGATIVE_LABEL}`}
														value={entry.fodDeviationComment}
														onChange={e =>
															handleInputChange(entry.id, 'fodDeviationComment', e.target.value)
														}
														error={!!errors[`${entry.id}_fodComment`]}
														helperText={
															errors[`${entry.id}_fodComment`] ||
															`Required when ${OK_NOT_OK_NEGATIVE_LABEL} is selected`
														}
														disabled={isReadOnly || entry.blocked || entry.savedEntry}
														required
														sx={{ mt: 1.5 }}
													/>
												)}
											</FormControl>
										</Box>

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
																{entry.calculatedMin.toFixed(2)} - {entry.calculatedMax.toFixed(2)} ml
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
			{!isReadOnly && !hideSubmitButton && (
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
						{submitLabel}
					</Button>
				</Box>
			)}
		</Box>
	);
};

export default BomStep;
