import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
	Box,
	Paper,
	Typography,
	Button,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	FormControlLabel,
	Checkbox,
	Card,
	CardContent,
	IconButton,
	Divider,
	Collapse,
	FormLabel,
	RadioGroup,
	Radio
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {
	Add as AddIcon,
	Delete as DeleteIcon,
	Settings as SettingsIcon,
	ExpandMore as ExpandMoreIcon,
	ExpandLess as ExpandLessIcon,
	Assignment as AssignmentIcon
} from '@mui/icons-material';
import { Controller, useFieldArray, Control, useWatch } from 'react-hook-form';
import { InspectionParametersProps } from '../types';
import { InspectionFormData } from '../schemas';
import {
	defaultInspectionParameter,
	defaultColumn,
	roleOptions,
	parameterTypeOptions,
	columnTypeOptions
} from '../schemas';

const InspectionParameters = ({ control, errors }: InspectionParametersProps) => {
	const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set([0]));
	const [manuallyCollapsed, setManuallyCollapsed] = useState<Set<number>>(new Set());

	const {
		fields: parameterFields,
		append: appendParameter,
		remove: removeParameter
	} = useFieldArray({
		control,
		name: 'inspectionParameters'
	});

	// Watch all parameter types at the top level
	const parameterTypes = useWatch({
		control: control as Control<InspectionFormData>,
		name: 'inspectionParameters'
	});

	// Memoize parameter types for better performance
	const memoizedParameterTypes = useMemo(() => parameterTypes, [parameterTypes]);

	// Auto-expand cards with validation errors and ensure first card is expanded
	useEffect(() => {
		const newExpanded = new Set(expandedCards);
		let hasChanges = false;

		// Always ensure first parameter is expanded unless manually collapsed
		if (parameterFields.length > 0 && !manuallyCollapsed.has(0) && !newExpanded.has(0)) {
			newExpanded.add(0);
			hasChanges = true;
		}

		// Auto-expand cards with validation errors
		if (errors.inspectionParameters && Array.isArray(errors.inspectionParameters)) {
			(errors.inspectionParameters as Record<string, unknown>[]).forEach(
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
			// Use setTimeout to avoid synchronous setState in effect
			setTimeout(() => setExpandedCards(newExpanded), 0);
		}
	}, [errors.inspectionParameters, expandedCards, manuallyCollapsed, parameterFields.length]);

	const addParameter = useCallback(() => {
		appendParameter({
			...defaultInspectionParameter,
			order: parameterFields.length + 1
		});
	}, [appendParameter, parameterFields.length]);

	const toggleCardExpansion = useCallback((index: number) => {
		setExpandedCards(prev => {
			const newExpanded = new Set(prev);
			if (newExpanded.has(index)) {
				newExpanded.delete(index);
				setManuallyCollapsed(prev => new Set(prev).add(index));
			} else {
				newExpanded.add(index);
				setManuallyCollapsed(prev => {
					const newSet = new Set(prev);
					newSet.delete(index);
					return newSet;
				});
			}
			return newExpanded;
		});
	}, []);

	const renderParameterCard = (_field: Record<string, unknown>, index: number) => {
		const isExpanded = expandedCards.has(index);
		const fieldErrors = (errors.inspectionParameters as Record<string, unknown>[])?.[index] || {};
		const shouldBeExpanded = isExpanded;

		return (
			<Card
				key={String(_field.id)}
				sx={{
					mb: 3,
					border: '1px solid #e0e0e0',
					borderRadius: '12px',
					boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
					backgroundColor: 'white',
					overflow: 'hidden'
				}}
			>
				{/* Card Header */}
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						p: 3,
						backgroundColor: '#f8f9fa',
						borderBottom: '1px solid #e0e0e0'
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
						<AssignmentIcon sx={{ color: '#1976d2', mr: 2, fontSize: '1.5rem' }} />
						<Box sx={{ flex: 1 }}>
							<Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 0.5 }}>
								Parameter {index + 1}
							</Typography>
							<Controller
								name={`inspectionParameters.${index}.parameterName`}
								control={control as Control<InspectionFormData>}
								render={({ field }) => (
									<Typography
										variant="body2"
										sx={{
											color: field.value ? '#333' : '#999',
											fontStyle: field.value ? 'normal' : 'italic',
											fontSize: '0.875rem'
										}}
									>
										{field.value}
									</Typography>
								)}
							/>
						</Box>
					</Box>

					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<IconButton
							onClick={() => toggleCardExpansion(index)}
							sx={{
								color: '#666',
								'&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
							}}
						>
							{isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
						</IconButton>
						<IconButton
							color="error"
							onClick={() => removeParameter(index)}
							sx={{
								backgroundColor: '#ffebee',
								'&:hover': { backgroundColor: '#ffcdd2' }
							}}
						>
							<DeleteIcon />
						</IconButton>
					</Box>
				</Box>

				<Collapse in={shouldBeExpanded}>
					<Divider sx={{ my: 2 }} />

					<CardContent sx={{ p: 3 }}>
						<Grid container spacing={3}>
							{/* Parameter Name */}
							<Grid size={{ xs: 12, md: 6 }}>
								<Controller
									name={`inspectionParameters.${index}.parameterName`}
									control={control as Control<InspectionFormData>}
									render={({ field }) => (
										<TextField
											{...field}
											label="Parameter Name"
											fullWidth
											required
											error={!!fieldErrors?.parameterName}
											helperText={
												(fieldErrors?.parameterName as { message?: string })?.message ||
												'Name of the inspection parameter'
											}
											placeholder="e.g., Mixing Ratio"
											sx={{
												'& .MuiOutlinedInput-root': {
													borderRadius: '8px'
												}
											}}
										/>
									)}
								/>
							</Grid>

							{/* Type */}
							<Grid size={{ xs: 12, md: 6 }}>
								<Controller
									name={`inspectionParameters.${index}.type`}
									control={control as Control<InspectionFormData>}
									render={({ field }) => (
										<FormControl fullWidth error={!!fieldErrors?.type}>
											<InputLabel>Parameter Type</InputLabel>
											<Select {...field} label="Parameter Type">
												{parameterTypeOptions.map(option => (
													<MenuItem key={option.value} value={option.value}>
														{option.label}
													</MenuItem>
												))}
											</Select>
											{(fieldErrors?.type as { message?: string })?.message && (
												<Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
													{(fieldErrors?.type as { message?: string })?.message}
												</Typography>
											)}
										</FormControl>
									)}
								/>
							</Grid>

							{/* Specification */}
							<Grid size={{ xs: 12 }}>
								<Controller
									name={`inspectionParameters.${index}.specification`}
									control={control as Control<InspectionFormData>}
									render={({ field }) => (
										<TextField
											{...field}
											label="Specification"
											fullWidth
											multiline
											rows={3}
											error={!!fieldErrors?.specification}
											helperText={
												(fieldErrors?.specification as { message?: string })?.message ||
												'Detailed specification for this parameter (optional)'
											}
											placeholder="e.g., Resin:Catalyst = 100:1.5 ± 0.2"
											sx={{
												'& .MuiOutlinedInput-root': {
													borderRadius: '8px'
												}
											}}
										/>
									)}
								/>
							</Grid>

							{/* Tolerance - Only show for number type */}
							{(() => {
								const parameterType = memoizedParameterTypes?.[index]?.type || 'text';

								if (parameterType !== 'number') return null;

								return (
									<Grid size={{ xs: 12, md: 6 }}>
										<Controller
											name={`inspectionParameters.${index}.tolerance`}
											control={control as Control<InspectionFormData>}
											render={({ field }) => (
												<TextField
													{...field}
													label="Tolerance"
													fullWidth
													type="number"
													error={!!fieldErrors?.tolerance}
													helperText={
														(fieldErrors?.tolerance as { message?: string })?.message ||
														'Acceptable deviation from specification (numeric value)'
													}
													placeholder="0.2"
													sx={{
														'& .MuiOutlinedInput-root': {
															borderRadius: '8px'
														}
													}}
												/>
											)}
										/>
									</Grid>
								);
							})()}

							{/* Role */}
							<Grid size={{ xs: 12, md: 6 }}>
								<Controller
									name={`inspectionParameters.${index}.role`}
									control={control as Control<InspectionFormData>}
									render={({ field }) => (
										<FormControl fullWidth error={!!fieldErrors?.role}>
											<InputLabel>Responsible Role</InputLabel>
											<Select {...field} label="Responsible Role">
												{roleOptions.map(option => (
													<MenuItem key={option.value} value={option.value}>
														{option.label}
													</MenuItem>
												))}
											</Select>
											{(fieldErrors?.role as { message?: string })?.message && (
												<Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
													{(fieldErrors?.role as { message?: string })?.message}
												</Typography>
											)}
										</FormControl>
									)}
								/>
							</Grid>

							{/* CTQ Checkbox */}
							<Grid size={{ xs: 12 }}>
								<Controller
									name={`inspectionParameters.${index}.ctq`}
									control={control as Control<InspectionFormData>}
									render={({ field }) => (
										<FormControlLabel
											control={<Checkbox checked={field.value} onChange={field.onChange} color="primary" />}
											label={
												<Box>
													<Typography variant="body1" sx={{ fontWeight: 500 }}>
														Critical to Quality (CTQ)
													</Typography>
													<Typography variant="caption" sx={{ color: '#666' }}>
														Mark this parameter as critical for quality control
													</Typography>
												</Box>
											}
										/>
									)}
								/>
							</Grid>

							{/* Columns Section - Only show when parameter type is 'table' */}
							{(() => {
								const parameterType = memoizedParameterTypes?.[index]?.type || 'text';

								if (parameterType !== 'table') return null;

								return (
									<Grid size={{ xs: 12 }}>
										<Divider sx={{ my: 2 }} />
										<ParameterColumns
											parameterIndex={index}
											control={control}
											errors={errors as Record<string, unknown>}
										/>
									</Grid>
								);
							})()}
						</Grid>
					</CardContent>
				</Collapse>
			</Card>
		);
	};

	return (
		<Box>
			<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
				<SettingsIcon sx={{ mr: 1, color: '#1976d2' }} />
				<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
					Inspection Parameters
				</Typography>
			</Box>

			<Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
					<Box>
						<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 0.5 }}>
							Parameter Configuration
						</Typography>
						<Typography variant="body2" sx={{ color: '#666' }}>
							Define inspection parameters with specifications, tolerances, and responsible roles
						</Typography>
					</Box>
					<Button
						variant="contained"
						startIcon={<AddIcon />}
						onClick={addParameter}
						sx={{
							textTransform: 'none',
							borderRadius: '8px',
							backgroundColor: '#1976d2',
							'&:hover': { backgroundColor: '#1565c0' }
						}}
					>
						Add Parameter
					</Button>
				</Box>

				{parameterFields.map((field, index) => renderParameterCard(field, index))}

				{parameterFields.length === 0 && (
					<Box sx={{ textAlign: 'center', py: 6, border: '2px dashed #e0e0e0', borderRadius: 2 }}>
						<AssignmentIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
						<Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
							No Parameters Added
						</Typography>
						<Typography variant="body2" sx={{ color: '#999', mb: 3 }}>
							Add inspection parameters to define what needs to be checked during the inspection process
						</Typography>
						<Button
							variant="outlined"
							startIcon={<AddIcon />}
							onClick={addParameter}
							sx={{
								textTransform: 'none',
								borderRadius: '8px',
								borderColor: '#1976d2',
								color: '#1976d2',
								'&:hover': {
									borderColor: '#1565c0',
									backgroundColor: '#f3f8ff'
								}
							}}
						>
							Add First Parameter
						</Button>
					</Box>
				)}
			</Paper>
		</Box>
	);
};

// Nested component for parameter columns
const ParameterColumns = memo(
	({
		parameterIndex,
		control,
		errors
	}: {
		parameterIndex: number;
		control: unknown;
		errors: Record<string, unknown>;
	}) => {
		const {
			fields: columnFields,
			append: appendColumn,
			remove: removeColumn
		} = useFieldArray({
			control: control as Control<InspectionFormData>,
			name: `inspectionParameters.${parameterIndex}.columns`
		});

		// Watch all column types at the top level
		const columnTypes = useWatch({
			control: control as Control<InspectionFormData>,
			name: `inspectionParameters.${parameterIndex}.columns`
		});

		// Memoize column types for better performance
		const memoizedColumnTypes = useMemo(() => columnTypes, [columnTypes]);

		const handleAddColumn = useCallback(() => {
			appendColumn(defaultColumn);
		}, [appendColumn]);

		const handleRemoveColumn = useCallback(
			(index: number) => {
				removeColumn(index);
			},
			[removeColumn]
		);

		return (
			<Box>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
					<Box>
						<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 0.5 }}>
							Parameter Columns
						</Typography>
						<Typography variant="caption" sx={{ color: '#666' }}>
							Define specific columns for this parameter (e.g., Resin, Catalyst, etc.)
						</Typography>
					</Box>
					<Button
						variant="outlined"
						startIcon={<AddIcon />}
						onClick={handleAddColumn}
						size="small"
						sx={{
							textTransform: 'none',
							borderRadius: '8px',
							borderColor: '#1976d2',
							color: '#1976d2',
							'&:hover': {
								borderColor: '#1565c0',
								backgroundColor: '#f3f8ff'
							}
						}}
					>
						Add Column
					</Button>
				</Box>

				{columnFields.map((field, columnIndex) => (
					<Card
						key={field.id}
						sx={{
							mb: 2,
							border: '1px solid #e0e0e0',
							borderRadius: '8px',
							boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
							backgroundColor: '#fafafa'
						}}
					>
						<CardContent sx={{ p: 2 }}>
							<Grid container spacing={2} sx={{ alignItems: 'flex-start' }}>
								<Grid size={{ xs: 12, sm: 3 }}>
									<Controller
										name={`inspectionParameters.${parameterIndex}.columns.${columnIndex}.name`}
										control={control as Control<InspectionFormData>}
										render={({ field }) => (
											<TextField
												{...field}
												label="Column Name"
												fullWidth
												size="small"
												required
												error={
													// eslint-disable-next-line @typescript-eslint/no-explicit-any
													!!(errors.inspectionParameters as any[])?.[parameterIndex]?.columns?.[columnIndex]?.name
												}
												helperText={
													// eslint-disable-next-line @typescript-eslint/no-explicit-any
													(errors.inspectionParameters as any[])?.[parameterIndex]?.columns?.[columnIndex]?.name
														?.message || 'Name of the column'
												}
												placeholder="e.g., Resin"
												sx={{
													'& .MuiOutlinedInput-root': {
														borderRadius: '6px',
														backgroundColor: 'white'
													}
												}}
											/>
										)}
									/>
								</Grid>
								<Grid size={{ xs: 12, sm: 3 }}>
									<Controller
										name={`inspectionParameters.${parameterIndex}.columns.${columnIndex}.type`}
										control={control as Control<InspectionFormData>}
										render={({ field }) => (
											<FormControl
												fullWidth
												size="small"
												required
												error={
													// eslint-disable-next-line @typescript-eslint/no-explicit-any
													!!(errors.inspectionParameters as any[])?.[parameterIndex]?.columns?.[columnIndex]?.type
												}
											>
												<InputLabel>Data Type</InputLabel>
												<Select {...field} label="Data Type">
													{columnTypeOptions.map(option => (
														<MenuItem key={option.value} value={option.value}>
															{option.label}
														</MenuItem>
													))}
												</Select>
											</FormControl>
										)}
									/>
								</Grid>
								<Grid size={{ xs: 12, sm: 2 }}>
									{(() => {
										const columnType = memoizedColumnTypes?.[columnIndex]?.type || 'text';

										if (columnType === 'datetime') {
											return (
												<Controller
													name={`inspectionParameters.${parameterIndex}.columns.${columnIndex}.defaultValue`}
													control={control as Control<InspectionFormData>}
													render={({ field }) => (
														<LocalizationProvider dateAdapter={AdapterDayjs}>
															<DateTimePicker
																label="Default Value"
																value={field.value ? dayjs(field.value as string) : null}
																onChange={newValue => {
																	const formattedValue = newValue ? newValue.format('YYYY-MM-DDTHH:mm') : '';
																	field.onChange(formattedValue);
																}}
																slotProps={{
																	textField: {
																		fullWidth: true,
																		size: 'small',
																		helperText: 'Default datetime value',
																		sx: {
																			'& .MuiOutlinedInput-root': {
																				borderRadius: '6px',
																				backgroundColor: 'white'
																			}
																		}
																	}
																}}
															/>
														</LocalizationProvider>
													)}
												/>
											);
										}

										if (columnType === 'ok/not ok') {
											return (
												<Controller
													name={`inspectionParameters.${parameterIndex}.columns.${columnIndex}.defaultValue`}
													control={control as Control<InspectionFormData>}
													render={({ field }) => (
														<FormControl component="fieldset" fullWidth>
															<FormLabel component="legend" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>
																Default Value
															</FormLabel>
															<RadioGroup
																row
																value={field.value || ''}
																onChange={e => field.onChange(e.target.value)}
																sx={{ gap: 1 }}
															>
																<FormControlLabel
																	value="ok"
																	control={<Radio size="small" color="success" />}
																	label="OK"
																	sx={{
																		'& .MuiFormControlLabel-label': {
																			fontSize: '0.75rem',
																			color: field.value === 'ok' ? '#2e7d32' : '#666'
																		}
																	}}
																/>
																<FormControlLabel
																	value="not ok"
																	control={<Radio size="small" color="error" />}
																	label="Not OK"
																	sx={{
																		'& .MuiFormControlLabel-label': {
																			fontSize: '0.75rem',
																			color: field.value === 'not ok' ? '#d32f2f' : '#666'
																		}
																	}}
																/>
															</RadioGroup>
														</FormControl>
													)}
												/>
											);
										}

										return (
											<Controller
												name={`inspectionParameters.${parameterIndex}.columns.${columnIndex}.defaultValue`}
												control={control as Control<InspectionFormData>}
												render={({ field }) => (
													<TextField
														{...field}
														label="Default Value"
														fullWidth
														size="small"
														type={columnType === 'number' ? 'number' : 'text'}
														placeholder={
															columnType === 'number'
																? '100'
																: columnType === 'boolean'
																	? 'true/false'
																	: 'default value'
														}
														helperText={
															columnType === 'number'
																? 'Numeric default value'
																: columnType === 'boolean'
																	? 'Boolean default value (true/false)'
																	: 'Default value'
														}
														sx={{
															'& .MuiOutlinedInput-root': {
																borderRadius: '6px',
																backgroundColor: 'white'
															}
														}}
													/>
												)}
											/>
										);
									})()}
								</Grid>
								<Grid size={{ xs: 12, sm: 2 }}>
									{(() => {
										const columnType = memoizedColumnTypes?.[columnIndex]?.type || 'text';

										// Only show tolerance for number type
										if (columnType !== 'number') return null;

										return (
											<Controller
												name={`inspectionParameters.${parameterIndex}.columns.${columnIndex}.tolerance`}
												control={control as Control<InspectionFormData>}
												render={({ field }) => (
													<TextField
														{...field}
														label="Tolerance"
														fullWidth
														size="small"
														type="number"
														placeholder="0.2"
														helperText="Numeric tolerance value"
														sx={{
															'& .MuiOutlinedInput-root': {
																borderRadius: '6px',
																backgroundColor: 'white'
															}
														}}
													/>
												)}
											/>
										);
									})()}
								</Grid>
								<Grid size={{ xs: 12, sm: 2 }}>
									<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', pt: 1 }}>
										<IconButton
											color="error"
											onClick={() => handleRemoveColumn(columnIndex)}
											size="small"
											sx={{
												backgroundColor: '#ffebee',
												'&:hover': { backgroundColor: '#ffcdd2' }
											}}
										>
											<DeleteIcon />
										</IconButton>
									</Box>
								</Grid>
							</Grid>
						</CardContent>
					</Card>
				))}

				{columnFields.length === 0 && (
					<Box
						sx={{
							textAlign: 'center',
							py: 3,
							border: '1px dashed #e0e0e0',
							borderRadius: 1,
							backgroundColor: '#f9f9f9'
						}}
					>
						<Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
							No columns defined for this parameter
						</Typography>
						<Typography variant="caption" sx={{ color: '#999' }}>
							Add columns to define specific data points within this parameter
						</Typography>
					</Box>
				)}
			</Box>
		);
	}
);

ParameterColumns.displayName = 'ParameterColumns';

export default InspectionParameters;
