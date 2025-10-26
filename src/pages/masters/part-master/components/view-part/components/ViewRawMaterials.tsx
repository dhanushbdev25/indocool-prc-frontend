import React, { useState } from 'react';
import {
	Typography,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	IconButton,
	Collapse,
	Box
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';
import { RawMaterial } from '../../../../../../store/api/business/part-master/part.validators';

interface ViewRawMaterialsProps {
	rawMaterials: RawMaterial[];
}

const ViewRawMaterials = ({ rawMaterials }: ViewRawMaterialsProps) => {
	const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

	const toggleRowExpansion = (index: number) => {
		const newExpanded = new Set(expandedRows);
		if (newExpanded.has(index)) {
			newExpanded.delete(index);
		} else {
			newExpanded.add(index);
		}
		setExpandedRows(newExpanded);
	};
	if (rawMaterials.length === 0) {
		return (
			<Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
				<Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
					Raw Materials
				</Typography>
				<Typography variant="body1" color="textSecondary" textAlign="center" sx={{ py: 4 }}>
					No raw materials configured for this part
				</Typography>
			</Paper>
		);
	}

	return (
		<Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
			<Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#333' }}>
				Raw Materials ({rawMaterials.length})
			</Typography>

			<TableContainer>
				<Table>
					<TableHead>
						<TableRow sx={{ backgroundColor: '#f8f9fa' }}>
							<TableCell sx={{ fontWeight: 600, color: '#333', width: 50 }}></TableCell>
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>Material Name</TableCell>
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>Material Code</TableCell>
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>Quantity</TableCell>
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>UOM</TableCell>
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>Batching</TableCell>
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>Splitting</TableCell>
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>Version</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{rawMaterials.map((material, index) => (
							<React.Fragment key={material.id || index}>
								<TableRow sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
									<TableCell>
										{material.splitting &&
											material.splittingConfiguration &&
											material.splittingConfiguration.length > 0 && (
												<IconButton size="small" onClick={() => toggleRowExpansion(index)} sx={{ color: '#1976d2' }}>
													{expandedRows.has(index) ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
												</IconButton>
											)}
									</TableCell>
									<TableCell sx={{ fontWeight: 500, color: '#333' }}>{material.materialName}</TableCell>
									<TableCell sx={{ color: '#666' }}>{material.materialCode}</TableCell>
									<TableCell sx={{ color: '#666' }}>{material.quantity}</TableCell>
									<TableCell sx={{ color: '#666' }}>{material.uom}</TableCell>
									<TableCell sx={{ color: '#666' }}>{material.batching ? 'Yes' : 'No'}</TableCell>
									<TableCell sx={{ color: '#666' }}>{material.splitting ? 'Yes' : 'No'}</TableCell>
									<TableCell sx={{ color: '#666' }}>v{material.version}</TableCell>
								</TableRow>
								{material.splitting &&
									material.splittingConfiguration &&
									material.splittingConfiguration.length > 0 && (
										<TableRow>
											<TableCell colSpan={8} sx={{ py: 0 }}>
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
																{material.splittingConfiguration.map((split, splitIndex) => (
																	<TableRow key={splitIndex}>
																		<TableCell sx={{ color: '#666' }}>{split.order}</TableCell>
																		<TableCell sx={{ color: '#666' }}>{String(split.splitQuantity)}</TableCell>
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
		</Paper>
	);
};

export default ViewRawMaterials;
