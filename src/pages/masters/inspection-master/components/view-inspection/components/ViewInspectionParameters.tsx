import {
	Box,
	Typography,
	Card,
	CardContent,
	Chip,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Divider
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { ExpandMore, Warning, Link, Lock as LockIcon } from '@mui/icons-material';
import { InspectionParameter } from '../../../../../../store/api/business/inspection-master/inspection.validators';
import { roleOptions } from '../../create-inspection/schemas';
import { formatOkNotOkTypeForDisplay } from '../../../../../../utils/okNotOkLabels';
import { GATE_FIELD_LABEL } from '../../../../../../utils/gateLabels';
import {
	CRITICALITY_CHIP_HEX,
	formatInspectionCriticality,
	getCriticalityChipColor,
	resolveCriticality
} from '../../../../../../utils/criticality';
import { sortByNumericOrder } from '../../../../../../utils/orderedRecords';

interface ViewInspectionParametersProps {
	parameters: InspectionParameter[];
}

const ViewInspectionParameters = ({ parameters }: ViewInspectionParametersProps) => {
	const orderedParameters = sortByNumericOrder(parameters);
	const formatRange = (min?: unknown, max?: unknown) => {
		if (min === undefined && max === undefined) return 'Not specified';
		return `${min ?? '-'} to ${max ?? '-'}`;
	};
	const getRoleLabel = (roleValue: string) => {
		const role = roleOptions.find(r => r.value === roleValue);
		return role ? role.label : roleValue;
	};

	const getTypeColor = (type: string) => {
		switch (type) {
			case 'number':
				return '#2196f3';
			case 'text':
				return '#4caf50';
			case 'boolean':
				return '#ff9800';
			case 'files':
				return '#9c27b0';
			case 'table':
				return '#607d8b';
			case 'fixed-table':
				return '#7b1fa2';
			case 'ok/not ok':
				return '#ff9800';
			case 'date':
			case 'datetime':
				return '#795548';
			case 'shift':
				return '#00897b';
			default:
				return '#666';
		}
	};

	const getRoleColor = (role: string) => {
		switch (role) {
			case 'QUALITY_ENGINEER':
				return '#9c27b0';
			case 'SUPERVISOR':
				return '#f44336';
			case 'QUALITY_INSPECTOR':
				return '#ff9800';
			case 'OPERATOR':
				return '#4caf50';
			case 'MANAGER':
				return '#2196f3';
			default:
				return '#666';
		}
	};

	return (
		<Card>
			<CardContent>
				<Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#333' }}>
					Inspection Parameters ({orderedParameters.length})
				</Typography>

				{orderedParameters.length > 0 ? (
					<Box>
						{orderedParameters.map((parameter, index) => (
							<Accordion key={parameter.id || index} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
								<AccordionSummary expandIcon={<ExpandMore />}>
									<Box sx={{ display: 'flex', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 1 }}>
										<Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 2 }}>
											{parameter.parameterName}
										</Typography>
										<Chip
											label={formatOkNotOkTypeForDisplay(parameter.type)}
											size="small"
											sx={{
												backgroundColor: getTypeColor(parameter.type),
												color: 'white',
												fontWeight: 500
											}}
										/>
										{resolveCriticality(parameter) !== 'NONE' && (
											<Chip
												icon={parameter.ctq ? <Warning /> : undefined}
												label={formatInspectionCriticality(parameter)}
												size="small"
												color={getCriticalityChipColor(resolveCriticality(parameter))}
												variant="outlined"
											/>
										)}
										{parameter.getInstrumentId && (
											<Chip label="Instrument ID" size="small" color="info" variant="outlined" />
										)}
										<Chip
											label={getRoleLabel(parameter.role)}
											size="small"
											sx={{
												backgroundColor: getRoleColor(parameter.role),
												color: 'white',
												fontWeight: 500
											}}
										/>
									</Box>
								</AccordionSummary>
								<AccordionDetails>
									<Grid container spacing={3}>
										<Grid size={{ xs: 12, md: 6 }}>
											<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
												Specification
											</Typography>
											<Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
												{parameter.specification}
											</Typography>
										</Grid>
										<Grid size={{ xs: 12, md: 6 }}>
											<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
												Range (Min-Max)
											</Typography>
											<Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
												{formatRange(parameter.minimumAcceptanceValue, parameter.maximumAcceptanceValue)}
											</Typography>
										</Grid>
										<Grid size={{ xs: 12, md: 6 }}>
											<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
												Order
											</Typography>
											<Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
												{parameter.order ?? '—'}
											</Typography>
										</Grid>
										<Grid size={{ xs: 12, md: 6 }}>
											<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
												{GATE_FIELD_LABEL}
											</Typography>
											<Chip
												icon={parameter.ctq ? <Warning /> : undefined}
												label={formatInspectionCriticality(parameter)}
												size="small"
												sx={{
													backgroundColor: CRITICALITY_CHIP_HEX[resolveCriticality(parameter)].background,
													color: 'white',
													fontWeight: 500,
													mb: 2
												}}
											/>
										</Grid>
										<Grid size={{ xs: 12, md: 6 }}>
											<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
												Get Instrument ID
											</Typography>
											<Chip
												label={parameter.getInstrumentId ? 'YES' : 'NO'}
												size="small"
												sx={{
													backgroundColor: parameter.getInstrumentId ? '#1976d2' : '#9e9e9e',
													color: 'white',
													fontWeight: 500,
													mb: 2
												}}
											/>
										</Grid>

										{/* Files Section */}
										{parameter.files && Object.keys(parameter.files).length > 0 && (
											<Grid size={{ xs: 12 }}>
												<Divider sx={{ my: 2 }} />
												<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
													Reference Files
												</Typography>
												<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
													{Object.entries(parameter.files).map(([key, value]) => (
														<Chip
															key={key}
															icon={<Link />}
															label={`${key}: ${value}`}
															variant="outlined"
															clickable
															onClick={() => window.open(String(value), '_blank')}
															sx={{ mb: 1 }}
														/>
													))}
												</Box>
											</Grid>
										)}

										{/* Dynamic table / multi-column: column definitions (aligned with fixed-table styling) */}
										{parameter.columns && parameter.columns.length > 0 && parameter.type !== 'fixed-table' && (
											<Grid size={{ xs: 12 }}>
												<Divider sx={{ my: 2 }} />
												<Box sx={{ p: 2, backgroundColor: parameter.type === 'table' ? '#f0f4ff' : '#f8f9fa', borderRadius: '12px', border: parameter.type === 'table' ? 'none' : '1px solid #e0e0e0' }}>
													<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
														<Typography variant="body2" sx={{ color: parameter.type === 'table' ? '#1a237e' : 'text.secondary', fontWeight: 600 }}>
															{parameter.type === 'table' ? 'Table Columns (rows added at execution)' : 'Parameter Columns'}
														</Typography>
														<Chip
															label={`${parameter.columns.length} column${parameter.columns.length !== 1 ? 's' : ''}`}
															size="small"
															sx={{ backgroundColor: '#ede7f6', color: '#5e35b1', fontWeight: 500, fontSize: '0.7rem' }}
														/>
													</Box>
													<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflow: 'hidden' }}>
														<Table size="small">
															<TableHead>
																<TableRow sx={{ backgroundColor: '#e8eaf6' }}>
																	<TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>Name</TableCell>
																	<TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>Range (Min-Max)</TableCell>
																</TableRow>
															</TableHead>
															<TableBody>
																{parameter.columns.map((column: Record<string, unknown>, colIndex: number) => (
																	<TableRow key={colIndex} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}>
																		<TableCell sx={{ fontSize: '0.8rem' }}>{String(column.name)}</TableCell>
																		<TableCell sx={{ fontSize: '0.8rem' }}>
																			{formatRange(
																				column.minimumAcceptanceValue,
																				column.maximumAcceptanceValue
																			)}
																		</TableCell>
																	</TableRow>
																))}
															</TableBody>
														</Table>
													</TableContainer>
												</Box>
											</Grid>
										)}

										{/* Fixed-table structure preview */}
										{parameter.type === 'fixed-table' && parameter.tableConfig?.columns && parameter.tableConfig.columns.length > 0 && (
											<Grid size={{ xs: 12 }}>
												<Divider sx={{ my: 2 }} />
												<Box sx={{ p: 2, backgroundColor: '#f0f4ff', borderRadius: '12px' }}>
													<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
														<Typography variant="body2" sx={{ color: '#1a237e', fontWeight: 600 }}>
															Fixed Table Preview
														</Typography>
														<Chip
															label={`${parameter.tableConfig.columns.length} col${parameter.tableConfig.columns.length !== 1 ? 's' : ''} \u00b7 ${parameter.tableConfig.rows?.length || 0} row${(parameter.tableConfig.rows?.length || 0) !== 1 ? 's' : ''}`}
															size="small"
															sx={{ backgroundColor: '#ede7f6', color: '#5e35b1', fontWeight: 500, fontSize: '0.7rem' }}
														/>
													</Box>
													<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflow: 'hidden' }}>
														<Table size="small">
															<TableHead>
																<TableRow sx={{ backgroundColor: '#e8eaf6' }}>
																	<TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75, width: 40, textAlign: 'center' }}>#</TableCell>
																	{parameter.tableConfig.columns.map(col => (
																		<TableCell key={col.name} sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>
																			{col.name}
																			<Typography variant="caption" sx={{ display: 'block', color: '#666', fontWeight: 400, fontSize: '0.65rem' }}>
																				{formatOkNotOkTypeForDisplay(col.type)}
																			</Typography>
																		</TableCell>
																	))}
																</TableRow>
															</TableHead>
															<TableBody>
																{(parameter.tableConfig.rows || []).map((row, ri) => (
																	<TableRow key={ri} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}>
																		<TableCell sx={{ textAlign: 'center', color: '#999', fontSize: '0.7rem' }}>{ri + 1}</TableCell>
																		{parameter.tableConfig!.columns!.map(col => {
																			const cell = row.cells[col.name] || { value: '', readOnly: false };
																			return (
																				<TableCell key={col.name} sx={{ fontSize: '0.8rem' }}>
																					<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
																						{cell.readOnly && <LockIcon sx={{ fontSize: 12, color: '#1976d2' }} />}
																						<Typography variant="body2" sx={{ fontSize: '0.8rem', ...(cell.readOnly ? { color: '#1565c0', fontWeight: 500 } : { color: '#999', fontStyle: 'italic' }) }}>
																							{cell.value || (cell.readOnly ? '-' : 'Editable')}
																						</Typography>
																					</Box>
																				</TableCell>
																			);
																		})}
																	</TableRow>
																))}
																{(!parameter.tableConfig.rows || parameter.tableConfig.rows.length === 0) && (
																	<TableRow>
																		<TableCell colSpan={parameter.tableConfig.columns.length + 1} sx={{ textAlign: 'center', py: 2, color: '#aaa' }}>
																			No rows defined
																		</TableCell>
																	</TableRow>
																)}
															</TableBody>
														</Table>
													</TableContainer>
												</Box>
											</Grid>
										)}
									</Grid>
								</AccordionDetails>
							</Accordion>
						))}
					</Box>
				) : (
					<Box sx={{ textAlign: 'center', py: 4 }}>
						<Typography variant="body1" color="text.secondary">
							No inspection parameters found
						</Typography>
					</Box>
				)}
			</CardContent>
		</Card>
	);
};

export default ViewInspectionParameters;
