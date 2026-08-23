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
	Radio,
	Chip,
	Table,
	TableHead,
	TableBody,
	TableRow,
	TableCell,
	TableContainer,
	Tooltip
} from '@mui/material';
import Grid from '@mui/material/Grid';
import dayjs from 'dayjs';
import {
	OperationalDatePicker,
	OperationalDateTimePicker
} from '../../../../../../components/common/OperationalDatePicker';
import {
	Add as AddIcon,
	Delete as DeleteIcon,
	KeyboardArrowUp as UpIcon,
	KeyboardArrowDown as DownIcon,
	Settings as SettingsIcon,
	ExpandMore as ExpandMoreIcon,
	ExpandLess as ExpandLessIcon,
	Assignment as AssignmentIcon,
	Lock as LockIcon,
	LockOpen as LockOpenIcon
} from '@mui/icons-material';
import {
	Controller,
	useFieldArray,
	Control,
	useWatch,
	useFormContext,
	UseFormGetValues,
	UseFormSetValue
} from 'react-hook-form';
import { InspectionParametersProps } from '../types';
import { InspectionFormData } from '../schemas';
import { OK_NOT_OK_NEGATIVE_LABEL, OK_NOT_OK_TYPE_KEY, OK_NOT_OK_TYPE_LABEL } from '../../../../../../utils/okNotOkLabels';
import { GATE_FIELD_LABEL } from '../../../../../../utils/gateLabels';
import { INSPECTION_CRITICALITY_OPTIONS } from '../../../../../../utils/criticality';
import { CriticalityField } from '../../../../../../components/masters';
import {
	remapIndexSetAfterMove,
	remapIndexSetAfterRemove
} from '../../../../../../utils/orderedRecords';
import {
	defaultInspectionParameter,
	defaultColumn,
	roleOptions,
	parameterTypeOptions,
	columnTypeOptions
} from '../schemas';

function isEmptyNumericField(value: unknown): boolean {
	return value === '' || value === undefined || value === null;
}

function applyNumberDefaults(
	setValue: UseFormSetValue<InspectionFormData>,
	getValues: UseFormGetValues<InspectionFormData>,
	basePath: string
) {
	const fields = basePath.includes('.columns.')
		? (['defaultValue', 'minimumAcceptanceValue', 'maximumAcceptanceValue'] as const)
		: (['minimumAcceptanceValue', 'maximumAcceptanceValue'] as const);

	for (const field of fields) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const formPath = `${basePath}.${field}` as any;
		if (isEmptyNumericField(getValues(formPath))) {
			setValue(formPath, 0, { shouldDirty: true });
		}
	}
}

const InspectionParameters = ({ control, errors }: InspectionParametersProps) => {
	const { setValue, getValues } = useFormContext<InspectionFormData>();
	const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set([0]));
	const [manuallyCollapsed, setManuallyCollapsed] = useState<Set<number>>(new Set());

	const {
		fields: parameterFields,
		append: appendParameter,
		remove: removeParameter,
		move: moveParameter
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

	// Auto-expand cards with validation errors and ensure first card is expanded.
	// Functional updates avoid racing with addParameter (and stale setTimeout snapshots).
	useEffect(() => {
		setExpandedCards(prev => {
			const next = new Set(prev);
			let hasChanges = false;

			if (parameterFields.length > 0 && !manuallyCollapsed.has(0) && !next.has(0)) {
				next.add(0);
				hasChanges = true;
			}

			if (errors.inspectionParameters && Array.isArray(errors.inspectionParameters)) {
				(errors.inspectionParameters as Record<string, unknown>[]).forEach(
					(fieldErrors: Record<string, unknown>, index: number) => {
						if (fieldErrors && Object.keys(fieldErrors).length > 0 && !manuallyCollapsed.has(index)) {
							if (!next.has(index)) {
								next.add(index);
								hasChanges = true;
							}
						}
					}
				);
			}

			return hasChanges ? next : prev;
		});
	}, [errors.inspectionParameters, manuallyCollapsed, parameterFields.length]);

	const renumberParameters = useCallback(
		(parameterCount: number) => {
			for (let index = 0; index < parameterCount; index += 1) {
				setValue(`inspectionParameters.${index}.order`, index + 1, {
					shouldDirty: true,
					shouldValidate: false
				});
			}
		},
		[setValue]
	);

	const addParameter = useCallback(() => {
		const newIndex = parameterFields.length;
		renumberParameters(newIndex);
		appendParameter({
			...defaultInspectionParameter,
			order: newIndex + 1
		});
		setExpandedCards(prev => new Set(prev).add(newIndex));
		setManuallyCollapsed(prev => {
			const next = new Set(prev);
			next.delete(newIndex);
			return next;
		});
	}, [appendParameter, parameterFields.length, renumberParameters]);

	const removeParameterAt = useCallback(
		(index: number) => {
			removeParameter(index);
			renumberParameters(parameterFields.length - 1);
			setExpandedCards(prev => remapIndexSetAfterRemove(prev, index));
			setManuallyCollapsed(prev => remapIndexSetAfterRemove(prev, index));
		},
		[parameterFields.length, removeParameter, renumberParameters]
	);

	const moveParameterTo = useCallback(
		(fromIndex: number, toIndex: number) => {
			if (toIndex < 0 || toIndex >= parameterFields.length) return;

			moveParameter(fromIndex, toIndex);
			renumberParameters(parameterFields.length);
			setExpandedCards(prev => remapIndexSetAfterMove(prev, fromIndex, toIndex));
			setManuallyCollapsed(prev => remapIndexSetAfterMove(prev, fromIndex, toIndex));
		},
		[moveParameter, parameterFields.length, renumberParameters]
	);

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
						<Tooltip title="Move parameter up">
							<span>
								<IconButton
									aria-label={`Move parameter ${index + 1} up`}
									disabled={index === 0}
									onClick={() => moveParameterTo(index, index - 1)}
									sx={{ color: '#666' }}
								>
									<UpIcon />
								</IconButton>
							</span>
						</Tooltip>
						<Tooltip title="Move parameter down">
							<span>
								<IconButton
									aria-label={`Move parameter ${index + 1} down`}
									disabled={index === parameterFields.length - 1}
									onClick={() => moveParameterTo(index, index + 1)}
									sx={{ color: '#666' }}
								>
									<DownIcon />
								</IconButton>
							</span>
						</Tooltip>
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
							aria-label={`Delete parameter ${index + 1}`}
							color="error"
							onClick={() => removeParameterAt(index)}
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
											<Select
												{...field}
												label="Parameter Type"
												onChange={e => {
													const newType = e.target.value;
													field.onChange(newType);
													if (newType === 'number') {
														applyNumberDefaults(
															setValue,
															getValues,
															`inspectionParameters.${index}`
														);
													}
												}}
											>
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

							{/* Numeric range - Only show for number type */}
							{(() => {
								const parameterType = memoizedParameterTypes?.[index]?.type || 'text';

								if (parameterType !== 'number') return null;

								return (
									<>
										<Grid size={{ xs: 12, md: 3 }}>
											<Controller
												name={`inspectionParameters.${index}.minimumAcceptanceValue`}
												control={control as Control<InspectionFormData>}
												render={({ field }) => (
													<TextField
														{...field}
														label="Min Value"
														fullWidth
														type="number"
														error={!!fieldErrors?.minimumAcceptanceValue}
														helperText={
															(fieldErrors?.minimumAcceptanceValue as { message?: string })?.message ||
															'Minimum acceptable value'
														}
														placeholder="0"
														sx={{
															'& .MuiOutlinedInput-root': {
																borderRadius: '8px'
															}
														}}
													/>
												)}
											/>
										</Grid>
										<Grid size={{ xs: 12, md: 3 }}>
											<Controller
												name={`inspectionParameters.${index}.maximumAcceptanceValue`}
												control={control as Control<InspectionFormData>}
												render={({ field }) => (
													<TextField
														{...field}
														label="Max Value"
														fullWidth
														type="number"
														error={!!fieldErrors?.maximumAcceptanceValue}
														helperText={
															(fieldErrors?.maximumAcceptanceValue as { message?: string })?.message ||
															'Maximum acceptable value'
														}
														placeholder="100"
														sx={{
															'& .MuiOutlinedInput-root': {
																borderRadius: '8px'
															}
														}}
													/>
												)}
											/>
										</Grid>
									</>
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

							{/* Gate / Not Gate / CTA */}
							<Grid size={{ xs: 12, sm: 6 }}>
								<CriticalityField
									ctqName={`inspectionParameters.${index}.ctq`}
									tagName={`inspectionParameters.${index}.criticalityTag`}
									options={INSPECTION_CRITICALITY_OPTIONS}
									label={GATE_FIELD_LABEL}
									helperText="Only Gate requires quality approval during execution. CTA is a label."
								/>
							</Grid>

							{/* Get Instrument ID Checkbox */}
							<Grid size={{ xs: 12, sm: 6 }}>
								<Controller
									name={`inspectionParameters.${index}.getInstrumentId`}
									control={control as Control<InspectionFormData>}
									render={({ field }) => (
										<FormControlLabel
											control={<Checkbox checked={!!field.value} onChange={field.onChange} color="primary" />}
											label={
												<Box>
													<Typography variant="body1" sx={{ fontWeight: 500 }}>
														Get Instrument ID
													</Typography>
													<Typography variant="caption" sx={{ color: '#666' }}>
														Require an instrument ID to be entered during execution
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

						{/* Fixed Table Config - Only show when parameter type is 'fixed-table' */}
						<FixedTableConfigEditor
							control={control as Control<InspectionFormData>}
							parameterIndex={index}
						/>
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
							Define inspection parameters with specifications, ranges, and responsible roles
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

// Fixed Table Configuration Editor for 'fixed-table' parameter type
const FixedTableConfigEditor = ({
	control,
	parameterIndex
}: {
	control: Control<InspectionFormData>;
	parameterIndex: number;
}) => {
	const { setValue } = useFormContext<InspectionFormData>();
	const parameterType = useWatch({ control, name: `inspectionParameters.${parameterIndex}.type` });
	const tableConfig = useWatch({
		control,
		name: `inspectionParameters.${parameterIndex}.tableConfig` as `inspectionParameters.${number}.tableConfig`
	});

	if (parameterType !== 'fixed-table') return null;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const columns: Array<{ name: string; type: string }> = (tableConfig as any)?.columns || [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const rows: Array<{ cells: Record<string, { value: string; readOnly: boolean }> }> = (tableConfig as any)?.rows || [];

	const setConfig = (newColumns: typeof columns, newRows: typeof rows) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		setValue(`inspectionParameters.${parameterIndex}.tableConfig` as any, { columns: newColumns, rows: newRows }, { shouldDirty: true });
	};

	const addColumn = () => {
		const newColumns = [...columns, { name: '', type: 'text' }];
		const newRows = rows.map(row => ({
			cells: {
				...row.cells,
				[`col_${newColumns.length}`]: { value: '', readOnly: false }
			}
		}));
		setConfig(newColumns, newRows.length > 0 ? newRows : []);
	};

	const removeColumn = (colIndex: number) => {
		const colName = columns[colIndex]?.name || `col_${colIndex}`;
		const newColumns = columns.filter((_, i) => i !== colIndex);
		const newRows = rows.map(row => {
			const newCells = { ...row.cells };
			delete newCells[colName];
			return { cells: newCells };
		});
		setConfig(newColumns, newRows);
	};

	const getReadKeyForColumn = (
		col: { name: string },
		columnIndex: number,
		cells: Record<string, { value: string; readOnly: boolean }>
	): string => {
		const named = col.name?.trim();
		if (named && Object.prototype.hasOwnProperty.call(cells, named)) return named;
		const ph = `col_${columnIndex}`;
		if (Object.prototype.hasOwnProperty.call(cells, ph)) return ph;
		const legacy = `col_${columnIndex + 1}`;
		if (Object.prototype.hasOwnProperty.call(cells, legacy)) return legacy;
		if (named) return named;
		return ph;
	};

	const columnOrderAfterMove = (n: number, from: number, to: number): number[] => {
		const order = Array.from({ length: n }, (_, i) => i);
		const [removed] = order.splice(from, 1);
		order.splice(to, 0, removed);
		return order;
	};

	const moveColumn = (fromIndex: number, toIndex: number) => {
		if (
			fromIndex === toIndex ||
			fromIndex < 0 ||
			toIndex < 0 ||
			fromIndex >= columns.length ||
			toIndex >= columns.length
		) {
			return;
		}
		const order = columnOrderAfterMove(columns.length, fromIndex, toIndex);
		const newColumns = order.map(i => columns[i]);
		const newRows = rows.map(row => {
			const byOldIndex = columns.map((col, i) => {
				const k = getReadKeyForColumn(col, i, row.cells);
				return row.cells[k] ?? { value: '', readOnly: false };
			});
			const newCells: Record<string, { value: string; readOnly: boolean }> = {};
			order.forEach((oldIdx, newIdx) => {
				const col = newColumns[newIdx];
				const writeKey = col.name?.trim() || `col_${newIdx}`;
				newCells[writeKey] = byOldIndex[oldIdx];
			});
			return { cells: newCells };
		});
		setConfig(newColumns, newRows);
	};

	const updateColumnName = (colIndex: number, oldName: string, newName: string) => {
		const newColumns = columns.map((col, i) => (i === colIndex ? { ...col, name: newName } : col));
		const newRows = rows.map(row => {
			const newCells: Record<string, { value: string; readOnly: boolean }> = {};
			Object.entries(row.cells).forEach(([key, val]) => {
				newCells[key === oldName ? newName : key] = val;
			});
			return { cells: newCells };
		});
		setConfig(newColumns, newRows);
	};

	const updateColumnType = (colIndex: number, newType: string) => {
		const newColumns = columns.map((col, i) => (i === colIndex ? { ...col, type: newType } : col));
		setConfig(newColumns, rows);
	};

	const addRow = () => {
		const newCells: Record<string, { value: string; readOnly: boolean }> = {};
		columns.forEach(col => {
			newCells[col.name || `col_${columns.indexOf(col)}`] = { value: '', readOnly: false };
		});
		setConfig(columns, [...rows, { cells: newCells }]);
	};

	const removeRow = (rowIndex: number) => {
		setConfig(columns, rows.filter((_, i) => i !== rowIndex));
	};

	const updateCell = (rowIndex: number, colName: string, field: 'value' | 'readOnly', val: string | boolean) => {
		const newRows = rows.map((row, i) => {
			if (i !== rowIndex) return row;
			return {
				cells: {
					...row.cells,
					[colName]: { ...row.cells[colName], [field]: val }
				}
			};
		});
		setConfig(columns, newRows);
	};

	const fixedTableColumnTypeOptions = [
		{ value: 'text', label: 'Text' },
		{ value: 'number', label: 'Number' },
		{ value: OK_NOT_OK_TYPE_KEY, label: OK_NOT_OK_TYPE_LABEL },
		{ value: 'date', label: 'Date' },
		{ value: 'datetime', label: 'Date & Time' },
		{ value: 'shift', label: 'Shift' }
	];

	return (
		<Grid size={{ xs: 12 }}>
			<Divider sx={{ my: 2 }} />
			<Paper sx={{ p: 2.5, backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
					<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333' }}>
						Fixed Table Configuration
					</Typography>
					<Chip
						label={`${columns.length} col${columns.length !== 1 ? 's' : ''} \u00b7 ${rows.length} row${rows.length !== 1 ? 's' : ''}`}
						size="small"
						sx={{ backgroundColor: '#e3f2fd', color: '#1976d2', fontWeight: 500 }}
					/>
				</Box>

				{/* Step 1 - Column Setup */}
				<Box sx={{ mb: 2 }}>
					<Typography variant="caption" sx={{ fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 }}>
						Step 1 &mdash; Define Columns
					</Typography>
					<Box sx={{ mt: 1 }}>
						{columns.map((col, colIndex) => (
							<Box key={colIndex} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
								<Typography variant="caption" sx={{ color: '#999', minWidth: 20, textAlign: 'right' }}>
									{colIndex + 1}.
								</Typography>
								<TextField
									size="small"
									placeholder="Column name"
									value={col.name}
									onChange={e => updateColumnName(colIndex, col.name, e.target.value)}
									sx={{
										flex: 1,
										'& .MuiOutlinedInput-root': { borderRadius: '6px', backgroundColor: 'white' },
										'& .MuiOutlinedInput-input': { py: '6px', fontSize: '0.875rem' }
									}}
								/>
								<Select
									size="small"
									value={col.type}
									onChange={e => updateColumnType(colIndex, e.target.value)}
									sx={{ minWidth: 120, borderRadius: '6px', backgroundColor: 'white', '& .MuiSelect-select': { py: '6px', fontSize: '0.875rem' } }}
								>
									{fixedTableColumnTypeOptions.map(opt => (
										<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
									))}
								</Select>
								<IconButton
									size="small"
									onClick={() => moveColumn(colIndex, colIndex - 1)}
									disabled={colIndex === 0}
									sx={{ color: colIndex === 0 ? '#ccc' : '#666' }}
								>
									<UpIcon sx={{ fontSize: 18 }} />
								</IconButton>
								<IconButton
									size="small"
									onClick={() => moveColumn(colIndex, colIndex + 1)}
									disabled={colIndex >= columns.length - 1}
									sx={{ color: colIndex >= columns.length - 1 ? '#ccc' : '#666' }}
								>
									<DownIcon sx={{ fontSize: 18 }} />
								</IconButton>
								<IconButton size="small" onClick={() => removeColumn(colIndex)} sx={{ color: '#bbb', '&:hover': { color: '#f44336' } }}>
									<DeleteIcon sx={{ fontSize: 18 }} />
								</IconButton>
							</Box>
						))}
						<Button
							size="small"
							startIcon={<AddIcon />}
							onClick={addColumn}
							sx={{ textTransform: 'none', color: '#1976d2', mt: 0.5 }}
						>
							Add Column
						</Button>
					</Box>
				</Box>

				{/* Step 2 - Table Editor */}
				{columns.length > 0 && (
					<Box>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
							<Typography variant="caption" sx={{ fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 }}>
								Step 2 &mdash; Define Rows &amp; Cell Values
							</Typography>
							<Button
								size="small"
								startIcon={<AddIcon />}
								onClick={addRow}
								sx={{ textTransform: 'none', color: '#1976d2' }}
							>
								Add Row
							</Button>
						</Box>
						<Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 1.5 }}>
							Type a value and click the lock icon to make a cell read-only during execution.
						</Typography>

						<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflow: 'hidden' }}>
							<Table size="small">
								<TableHead>
									<TableRow sx={{ backgroundColor: '#e8eaf6' }}>
										<TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#333', py: 1, width: 40, textAlign: 'center' }}>
											#
										</TableCell>
										{columns.map((col, ci) => (
											<TableCell key={ci} sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#333', py: 1 }}>
												{col.name || <em style={{ color: '#bbb' }}>Untitled</em>}
											</TableCell>
										))}
										<TableCell sx={{ width: 48 }} />
									</TableRow>
								</TableHead>
								<TableBody>
									{rows.map((row, rowIndex) => (
										<TableRow key={rowIndex} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}>
											<TableCell sx={{ textAlign: 'center', color: '#999', fontSize: '0.75rem', py: 0.5 }}>
												{rowIndex + 1}
											</TableCell>
											{columns.map((col, colIndex) => {
												const colKey = col.name || `col_${colIndex}`;
												const cell = row.cells[colKey] || { value: '', readOnly: false };
												return (
													<TableCell key={colIndex} sx={{ py: 0.5, px: 1 }}>
														<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
															<TextField
																size="small"
																variant="standard"
																placeholder={cell.readOnly ? '' : 'Enter value'}
																value={cell.value}
																onChange={e => updateCell(rowIndex, colKey, 'value', e.target.value)}
																sx={{
																	flex: 1,
																	'& .MuiInput-input': {
																		fontSize: '0.85rem',
																		py: '4px',
																		...(cell.readOnly ? { color: '#1565c0', fontWeight: 500 } : {})
																	},
																	'& .MuiInput-underline:before': {
																		borderBottomColor: cell.readOnly ? '#90caf9' : '#e0e0e0'
																	}
																}}
															/>
															<Tooltip title={cell.readOnly ? 'Cell is read-only (click to unlock)' : 'Click to lock as read-only'} arrow>
																<IconButton
																	size="small"
																	onClick={() => updateCell(rowIndex, colKey, 'readOnly', !cell.readOnly)}
																	sx={{
																		p: 0.5,
																		color: cell.readOnly ? '#1976d2' : '#ccc',
																		'&:hover': { color: cell.readOnly ? '#1565c0' : '#999' }
																	}}
																>
																	{cell.readOnly ? <LockIcon sx={{ fontSize: 16 }} /> : <LockOpenIcon sx={{ fontSize: 16 }} />}
																</IconButton>
															</Tooltip>
														</Box>
													</TableCell>
												);
											})}
											<TableCell sx={{ py: 0.5 }}>
												<IconButton
													size="small"
													onClick={() => removeRow(rowIndex)}
													sx={{ p: 0.5, color: '#ccc', '&:hover': { color: '#f44336' } }}
												>
													<DeleteIcon sx={{ fontSize: 16 }} />
												</IconButton>
											</TableCell>
										</TableRow>
									))}
									{rows.length === 0 && (
										<TableRow>
											<TableCell colSpan={columns.length + 2} sx={{ textAlign: 'center', py: 3, color: '#aaa' }}>
												No rows yet. Click &quot;Add Row&quot; above.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</TableContainer>
					</Box>
				)}

				{columns.length === 0 && (
					<Box sx={{ textAlign: 'center', py: 2, color: '#aaa' }}>
						<Typography variant="body2">
							Add columns above to start building your table.
						</Typography>
					</Box>
				)}
			</Paper>
		</Grid>
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
		const { setValue, getValues } = useFormContext<InspectionFormData>();
		const {
			fields: columnFields,
			append: appendColumn,
			remove: removeColumn,
			move: moveColumn
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

		const handleMoveColumn = useCallback(
			(index: number, direction: 'up' | 'down') => {
				const to = direction === 'up' ? index - 1 : index + 1;
				if (to < 0 || to >= columnFields.length) return;
				moveColumn(index, to);
			},
			[columnFields.length, moveColumn]
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
												<Select
													{...field}
													label="Data Type"
													onChange={e => {
														const newType = e.target.value;
														field.onChange(newType);
														if (newType === 'number') {
															applyNumberDefaults(
																setValue,
																getValues,
																`inspectionParameters.${parameterIndex}.columns.${columnIndex}`
															);
														}
													}}
												>
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

										if (columnType === 'date') {
											return (
												<Controller
													name={`inspectionParameters.${parameterIndex}.columns.${columnIndex}.defaultValue`}
													control={control as Control<InspectionFormData>}
													render={({ field }) => (
														<OperationalDatePicker
															label="Default Value"
															value={field.value ? dayjs(field.value as string) : null}
															onChange={newValue => {
																const formattedValue = newValue ? newValue.format('YYYY-MM-DD') : '';
																field.onChange(formattedValue);
															}}
															slotProps={{
																textField: {
																	fullWidth: true,
																	size: 'small',
																	helperText: 'Default date value',
																	sx: {
																		'& .MuiOutlinedInput-root': {
																			borderRadius: '6px',
																			backgroundColor: 'white'
																		}
																	}
																}
															}}
														/>
													)}
												/>
											);
										}

										if (columnType === 'datetime') {
											return (
												<Controller
													name={`inspectionParameters.${parameterIndex}.columns.${columnIndex}.defaultValue`}
													control={control as Control<InspectionFormData>}
													render={({ field }) => (
														<OperationalDateTimePicker
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
																	control={<Radio size="small" color="warning" />}
																	label={OK_NOT_OK_NEGATIVE_LABEL}
																	sx={{
																		'& .MuiFormControlLabel-label': {
																			fontSize: '0.75rem',
																			color: field.value === 'not ok' ? '#ed6c02' : '#666'
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

										// Only show range for number type
										if (columnType !== 'number') return null;

										return (
											<Box sx={{ display: 'flex', gap: 1 }}>
												<Controller
													name={`inspectionParameters.${parameterIndex}.columns.${columnIndex}.minimumAcceptanceValue`}
													control={control as Control<InspectionFormData>}
													render={({ field }) => (
														<TextField
															{...field}
															label="Min"
															fullWidth
															size="small"
															type="number"
															placeholder="0"
															helperText="Min"
															sx={{
																'& .MuiOutlinedInput-root': {
																	borderRadius: '6px',
																	backgroundColor: 'white'
																}
															}}
														/>
													)}
												/>
												<Controller
													name={`inspectionParameters.${parameterIndex}.columns.${columnIndex}.maximumAcceptanceValue`}
													control={control as Control<InspectionFormData>}
													render={({ field }) => (
														<TextField
															{...field}
															label="Max"
															fullWidth
															size="small"
															type="number"
															placeholder="100"
															helperText="Max"
															sx={{
																'& .MuiOutlinedInput-root': {
																	borderRadius: '6px',
																	backgroundColor: 'white'
																}
															}}
														/>
													)}
												/>
											</Box>
										);
									})()}
								</Grid>
								<Grid size={{ xs: 12, sm: 2 }}>
									<Box
										sx={{
											display: 'flex',
											justifyContent: 'center',
											alignItems: 'center',
											height: '100%',
											pt: 1,
											gap: 0.5
										}}
									>
										<IconButton
											size="small"
											onClick={() => handleMoveColumn(columnIndex, 'up')}
											disabled={columnIndex === 0}
											sx={{ color: columnIndex === 0 ? '#ccc' : '#666' }}
										>
											<UpIcon fontSize="small" />
										</IconButton>
										<IconButton
											size="small"
											onClick={() => handleMoveColumn(columnIndex, 'down')}
											disabled={columnIndex >= columnFields.length - 1}
											sx={{ color: columnIndex >= columnFields.length - 1 ? '#ccc' : '#666' }}
										>
											<DownIcon fontSize="small" />
										</IconButton>
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
