import {
	Box,
	Button,
	Chip,
	Divider,
	FormControlLabel,
	IconButton,
	MenuItem,
	Paper,
	Select,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Add as AddIcon, Delete as DeleteIcon, Lock as LockIcon, LockOpen as LockOpenIcon } from '@mui/icons-material';
import { Control, useFormContext, useWatch } from 'react-hook-form';
import { ReorderControls } from '../../../../../../components/masters';
import type { TableCellConfig, TableCellType, TableColumn } from '../../../../../../types/table-config.types';
import {
	BOOLEAN_CELL_OPTIONS,
	FIXED_TABLE_DATA_TYPE_OPTIONS,
	isNumericCellType,
	resolveFixedTableCellSpec,
	validateCellSpecRange,
	withCellType,
	type FixedTableCellSpec
} from '../../../../../../utils/fixedTableCellSpec';
import { LIST_SHIFT_OPTIONS } from '../../../../../../utils/listConfig';
import { OK_NOT_OK_OPTIONS, OK_NOT_OK_TYPE_KEY } from '../../../../../../utils/okNotOkLabels';
import { InspectionFormData } from '../schemas';

type Bound = 'minimumAcceptanceValue' | 'maximumAcceptanceValue';
type Cells = Record<string, TableCellConfig>;
type Row = { cells: Cells };

const boundSx = {
	width: 90,
	'& .MuiOutlinedInput-root': { borderRadius: '6px', backgroundColor: 'white' },
	'& .MuiOutlinedInput-input': { py: '6px', fontSize: '0.875rem' }
};

/** Blank stays blank — an empty bound must not become 0, which would read as a 0-to-0 range. */
const withBound = <T extends Partial<FixedTableCellSpec>>(spec: T, field: Bound, rawValue: string): T => {
	const next = { ...spec };
	if (rawValue.trim() === '') delete next[field];
	else next[field] = rawValue;
	return next;
};

/** Data type select plus the range inputs that type takes: Min/Max, or a single target for an exact value. */
const DataTypeFields = ({
	spec,
	onChange
}: {
	spec: Partial<FixedTableCellSpec>;
	onChange: (spec: Partial<FixedTableCellSpec>) => void;
}) => {
	const type = spec.type ?? 'text';
	return (
		<>
			<Select
				size="small"
				value={type}
				onChange={e => onChange(withCellType(spec, e.target.value as TableCellType))}
				inputProps={{ 'aria-label': 'Data type' }}
				sx={{
					minWidth: 120,
					borderRadius: '6px',
					backgroundColor: 'white',
					'& .MuiSelect-select': { py: '6px', fontSize: '0.875rem' }
				}}
			>
				{FIXED_TABLE_DATA_TYPE_OPTIONS.map(opt => (
					<MenuItem key={opt.value} value={opt.value}>
						{opt.label}
					</MenuItem>
				))}
			</Select>
			{type === 'exact value' && (
				<TextField
					size="small"
					type="number"
					placeholder="Target"
					value={spec.minimumAcceptanceValue ?? ''}
					onChange={e =>
						onChange(
							withBound(
								withBound(spec, 'minimumAcceptanceValue', e.target.value),
								'maximumAcceptanceValue',
								e.target.value
							)
						)
					}
					sx={boundSx}
				/>
			)}
			{isNumericCellType(type) && type !== 'exact value' && (
				<>
					<TextField
						size="small"
						type="number"
						placeholder="Min"
						value={spec.minimumAcceptanceValue ?? ''}
						onChange={e => onChange(withBound(spec, 'minimumAcceptanceValue', e.target.value))}
						sx={boundSx}
					/>
					<TextField
						size="small"
						type="number"
						placeholder="Max"
						value={spec.maximumAcceptanceValue ?? ''}
						onChange={e => onChange(withBound(spec, 'maximumAcceptanceValue', e.target.value))}
						sx={boundSx}
					/>
				</>
			)}
		</>
	);
};

/** The value a cell starts with at execution (or always shows, when locked), typed to fit its data type. */
const CellValueField = ({
	type,
	cell,
	onChange
}: {
	type: TableCellType;
	cell: TableCellConfig;
	onChange: (value: string) => void;
}) => {
	const common = {
		size: 'small' as const,
		variant: 'standard' as const,
		value: cell.value ?? '',
		onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
		sx: {
			flex: 1,
			minWidth: 90,
			'& .MuiInput-input': {
				fontSize: '0.85rem',
				py: '4px',
				...(cell.readOnly ? { color: '#1565c0', fontWeight: 500 } : {})
			},
			'& .MuiInput-underline:before': {
				borderBottomColor: cell.readOnly ? '#90caf9' : '#e0e0e0'
			}
		}
	};

	const choices =
		type === OK_NOT_OK_TYPE_KEY
			? OK_NOT_OK_OPTIONS.map(o => ({ value: o.value, label: o.label }))
			: type === 'boolean'
				? BOOLEAN_CELL_OPTIONS.map(o => ({ value: o, label: o }))
				: type === 'shift'
					? LIST_SHIFT_OPTIONS.map(o => ({ value: o, label: o }))
					: null;

	if (choices) {
		return (
			<TextField {...common} select slotProps={{ select: { displayEmpty: true } }}>
				<MenuItem value="">
					<em>{cell.readOnly ? '-' : 'Enter value'}</em>
				</MenuItem>
				{choices.map(choice => (
					<MenuItem key={choice.value} value={choice.value}>
						{choice.label}
					</MenuItem>
				))}
			</TextField>
		);
	}

	const inputType =
		type === 'date' ? 'date' : type === 'datetime' ? 'datetime-local' : isNumericCellType(type) ? 'number' : 'text';
	return (
		<TextField
			{...common}
			type={inputType}
			placeholder={cell.readOnly ? '' : 'Enter value'}
			slotProps={inputType === 'date' || inputType === 'datetime-local' ? { inputLabel: { shrink: true } } : undefined}
		/>
	);
};

/** Fixed table configuration editor for the 'fixed-table' parameter type. */
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
	const columns: TableColumn[] = (tableConfig as any)?.columns || [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const rows: Row[] = (tableConfig as any)?.rows || [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const cellTypes = (tableConfig as any)?.cellTypes === true;

	const setConfig = (newColumns: TableColumn[], newRows: Row[], newCellTypes: boolean = cellTypes) => {
		setValue(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			`inspectionParameters.${parameterIndex}.tableConfig` as any,
			newCellTypes ? { columns: newColumns, rows: newRows, cellTypes: true } : { columns: newColumns, rows: newRows },
			{ shouldDirty: true }
		);
	};

	/** A fresh cell; with per-cell types on it starts with its column's type and range. */
	const newCell = (col: TableColumn | undefined): TableCellConfig => {
		if (!cellTypes || !col) return { value: '', readOnly: false };
		const { type, minimumAcceptanceValue, maximumAcceptanceValue } = col;
		const cell: TableCellConfig = { value: '', readOnly: false, type };
		if (minimumAcceptanceValue !== undefined) cell.minimumAcceptanceValue = minimumAcceptanceValue;
		if (maximumAcceptanceValue !== undefined) cell.maximumAcceptanceValue = maximumAcceptanceValue;
		return cell;
	};

	const toggleCellTypes = (on: boolean) => {
		const newRows = rows.map(row => {
			const cells: Cells = {};
			Object.entries(row.cells).forEach(([key, cell]) => {
				const { type: _type, minimumAcceptanceValue: _min, maximumAcceptanceValue: _max, ...plain } = cell;
				cells[key] = plain;
			});
			if (on) {
				// Seed every cell from its column, so turning the option on changes nothing until edited.
				columns.forEach((col, colIndex) => {
					const key = getReadKeyForColumn(col, colIndex, row.cells);
					const spec = resolveFixedTableCellSpec(null, col, null);
					const cell: TableCellConfig = { ...(cells[key] ?? { value: '', readOnly: false }), type: spec.type };
					if (spec.minimumAcceptanceValue !== undefined) cell.minimumAcceptanceValue = spec.minimumAcceptanceValue;
					if (spec.maximumAcceptanceValue !== undefined) cell.maximumAcceptanceValue = spec.maximumAcceptanceValue;
					cells[key] = cell;
				});
			}
			return { cells };
		});
		setConfig(columns, newRows, on);
	};

	const addColumn = () => {
		const column: TableColumn = { name: '', type: 'text' };
		const newColumns = [...columns, column];
		const newRows = rows.map(row => ({
			cells: {
				...row.cells,
				[`col_${newColumns.length}`]: newCell(column)
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

	function getReadKeyForColumn(col: { name: string }, columnIndex: number, cells: Cells): string {
		const named = col.name?.trim();
		if (named && Object.prototype.hasOwnProperty.call(cells, named)) return named;
		const ph = `col_${columnIndex}`;
		if (Object.prototype.hasOwnProperty.call(cells, ph)) return ph;
		const legacy = `col_${columnIndex + 1}`;
		if (Object.prototype.hasOwnProperty.call(cells, legacy)) return legacy;
		if (named) return named;
		return ph;
	}

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
				return row.cells[k] ?? newCell(col);
			});
			const newCells: Cells = {};
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
			const newCells: Cells = {};
			Object.entries(row.cells).forEach(([key, val]) => {
				newCells[key === oldName ? newName : key] = val;
			});
			return { cells: newCells };
		});
		setConfig(newColumns, newRows);
	};

	const updateColumnSpec = (colIndex: number, spec: Partial<FixedTableCellSpec>) => {
		const newColumns = columns.map((col, i) => (i === colIndex ? ({ name: col.name, ...spec } as TableColumn) : col));
		setConfig(newColumns, rows);
	};

	const addRow = () => {
		const newCells: Cells = {};
		columns.forEach((col, colIndex) => {
			newCells[col.name || `col_${colIndex}`] = newCell(col);
		});
		setConfig(columns, [...rows, { cells: newCells }]);
	};

	const removeRow = (rowIndex: number) => {
		setConfig(
			columns,
			rows.filter((_, i) => i !== rowIndex)
		);
	};

	/** Replaces one cell outright, so fields left out (e.g. a dropped range) are really gone. */
	const replaceCell = (rowIndex: number, colName: string, cell: TableCellConfig) => {
		const newRows = rows.map((row, i) => (i === rowIndex ? { cells: { ...row.cells, [colName]: cell } } : row));
		setConfig(columns, newRows);
	};

	const updateCell = (rowIndex: number, colName: string, patch: Partial<TableCellConfig>) => {
		const current = rows[rowIndex]?.cells[colName] ?? { value: '', readOnly: false };
		replaceCell(rowIndex, colName, { ...current, ...patch });
	};

	return (
		<Grid size={{ xs: 12 }}>
			<Divider sx={{ my: 2 }} />
			<Paper sx={{ p: 2.5, backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
					<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333' }}>
						Fixed Table Configuration
					</Typography>
					<Chip
						label={`${columns.length} col${columns.length !== 1 ? 's' : ''} · ${rows.length} row${rows.length !== 1 ? 's' : ''}`}
						size="small"
						sx={{ backgroundColor: '#e3f2fd', color: '#1976d2', fontWeight: 500 }}
					/>
				</Box>
				<FormControlLabel
					control={<Switch size="small" checked={cellTypes} onChange={e => toggleCellTypes(e.target.checked)} />}
					label={<Typography variant="body2">Set data type per cell</Typography>}
					sx={{ mb: 1 }}
				/>
				<Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 2 }}>
					{cellTypes
						? 'Each cell has its own data type and range. Columns only need a name.'
						: 'Every cell in a column takes that column’s data type and range.'}
				</Typography>

				{/* Step 1 - Column Setup */}
				<Box sx={{ mb: 2 }}>
					<Typography
						variant="caption"
						sx={{ fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 }}
					>
						Step 1 &mdash; Define Columns
					</Typography>
					<Box sx={{ mt: 1 }}>
						{columns.map((col, colIndex) => {
							const rangeError = cellTypes ? null : validateCellSpecRange(col);
							return (
								<Box key={colIndex} sx={{ mb: 1 }}>
									<Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
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
												minWidth: 160,
												'& .MuiOutlinedInput-root': { borderRadius: '6px', backgroundColor: 'white' },
												'& .MuiOutlinedInput-input': { py: '6px', fontSize: '0.875rem' }
											}}
										/>
										{!cellTypes && <DataTypeFields spec={col} onChange={spec => updateColumnSpec(colIndex, spec)} />}
										<ReorderControls
											itemLabel="column"
											position={colIndex + 1}
											canMoveUp={colIndex > 0}
											canMoveDown={colIndex < columns.length - 1}
											onMoveUp={() => moveColumn(colIndex, colIndex - 1)}
											onMoveDown={() => moveColumn(colIndex, colIndex + 1)}
										/>
										<IconButton
											size="small"
											onClick={() => removeColumn(colIndex)}
											sx={{ color: '#bbb', '&:hover': { color: '#f44336' } }}
										>
											<DeleteIcon sx={{ fontSize: 18 }} />
										</IconButton>
									</Box>
									{rangeError && (
										<Typography variant="caption" color="error" sx={{ display: 'block', pl: 3.5 }}>
											{rangeError}
										</Typography>
									)}
								</Box>
							);
						})}
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
							<Typography
								variant="caption"
								sx={{ fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 }}
							>
								Step 2 &mdash; Define Rows &amp; Cell {cellTypes ? 'Types & ' : ''}Values
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

						<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflowX: 'auto' }}>
							<Table size="small">
								<TableHead>
									<TableRow sx={{ backgroundColor: '#e8eaf6' }}>
										<TableCell
											sx={{
												fontWeight: 600,
												fontSize: '0.75rem',
												color: '#333',
												py: 1,
												width: 40,
												textAlign: 'center'
											}}
										>
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
												const spec = resolveFixedTableCellSpec({ cellTypes }, col, cell);
												const cellRangeError = cellTypes ? validateCellSpecRange(spec) : null;
												return (
													<TableCell key={colIndex} sx={{ py: 0.5, px: 1, verticalAlign: 'top' }}>
														<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
															<CellValueField
																type={spec.type}
																cell={cell}
																onChange={value => updateCell(rowIndex, colKey, { value })}
															/>
															<Tooltip
																title={
																	cell.readOnly ? 'Cell is read-only (click to unlock)' : 'Click to lock as read-only'
																}
																arrow
															>
																<IconButton
																	size="small"
																	onClick={() => updateCell(rowIndex, colKey, { readOnly: !cell.readOnly })}
																	sx={{
																		p: 0.5,
																		color: cell.readOnly ? '#1976d2' : '#ccc',
																		'&:hover': { color: cell.readOnly ? '#1565c0' : '#999' }
																	}}
																>
																	{cell.readOnly ? (
																		<LockIcon sx={{ fontSize: 16 }} />
																	) : (
																		<LockOpenIcon sx={{ fontSize: 16 }} />
																	)}
																</IconButton>
															</Tooltip>
														</Box>
														{cellTypes && (
															<Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap', mt: 0.75 }}>
																<DataTypeFields
																	spec={spec}
																	onChange={next => {
																		const {
																			type: _t,
																			minimumAcceptanceValue: _min,
																			maximumAcceptanceValue: _max,
																			...plain
																		} = cell;
																		// A new type rarely fits the old value.
																		const value = next.type !== spec.type ? '' : cell.value;
																		replaceCell(rowIndex, colKey, { ...plain, ...next, value } as TableCellConfig);
																	}}
																/>
															</Box>
														)}
														{cellRangeError && (
															<Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
																{cellRangeError}
															</Typography>
														)}
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
						<Typography variant="body2">Add columns above to start building your table.</Typography>
					</Box>
				)}
			</Paper>
		</Grid>
	);
};

export default FixedTableConfigEditor;
