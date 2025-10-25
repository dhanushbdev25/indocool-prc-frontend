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
import { ExpandMore, Warning, Link } from '@mui/icons-material';
import { InspectionParameter } from '../../../../../../store/api/business/inspection-master/inspection.validators';
import { roleOptions } from '../../create-inspection/schemas';

interface ViewInspectionParametersProps {
	parameters: InspectionParameter[];
}

const ViewInspectionParameters = ({ parameters }: ViewInspectionParametersProps) => {
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
			case 'ok/not ok':
				return '#f44336';
			case 'datetime':
				return '#795548';
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
					Inspection Parameters ({parameters.length})
				</Typography>

				{parameters.length > 0 ? (
					<Box>
						{parameters.map((parameter, index) => (
							<Accordion key={parameter.id || index} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
								<AccordionSummary expandIcon={<ExpandMore />}>
									<Box sx={{ display: 'flex', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 1 }}>
										<Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 2 }}>
											{parameter.parameterName}
										</Typography>
										<Chip
											label={parameter.type}
											size="small"
											sx={{
												backgroundColor: getTypeColor(parameter.type),
												color: 'white',
												fontWeight: 500
											}}
										/>
										{parameter.ctq && (
											<Chip icon={<Warning />} label="CTQ" size="small" color="warning" variant="outlined" />
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
												Tolerance
											</Typography>
											<Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
												{parameter.tolerance || 'Not specified'}
											</Typography>
										</Grid>
										<Grid size={{ xs: 12, md: 6 }}>
											<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
												Order
											</Typography>
											<Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
												{parameter.order}
											</Typography>
										</Grid>
										<Grid size={{ xs: 12, md: 6 }}>
											<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
												Critical to Quality
											</Typography>
											<Chip
												icon={parameter.ctq ? <Warning /> : undefined}
												label={parameter.ctq ? 'YES' : 'NO'}
												size="small"
												sx={{
													backgroundColor: parameter.ctq ? '#ff9800' : '#9e9e9e',
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

										{/* Columns Section */}
										{parameter.columns && parameter.columns.length > 0 && (
											<Grid size={{ xs: 12 }}>
												<Divider sx={{ my: 2 }} />
												<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
													Columns ({parameter.columns.length})
												</Typography>
												<TableContainer component={Paper} variant="outlined">
													<Table size="small">
														<TableHead>
															<TableRow>
																<TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
																<TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
																<TableCell sx={{ fontWeight: 600 }}>Default Value</TableCell>
																<TableCell sx={{ fontWeight: 600 }}>Tolerance</TableCell>
															</TableRow>
														</TableHead>
														<TableBody>
															{parameter.columns.map((column: Record<string, unknown>, colIndex: number) => (
																<TableRow key={colIndex}>
																	<TableCell>{String(column.name)}</TableCell>
																	<TableCell>
																		<Chip
																			label={String(column.type)}
																			size="small"
																			sx={{
																				backgroundColor: getTypeColor(String(column.type)),
																				color: 'white',
																				fontWeight: 500
																			}}
																		/>
																	</TableCell>
																	<TableCell>{String(column.defaultValue || '-')}</TableCell>
																	<TableCell>{String(column.tolerance || '-')}</TableCell>
																</TableRow>
															))}
														</TableBody>
													</Table>
												</TableContainer>
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
