import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { RawMaterial } from '../../../../../../store/api/business/part-master/part.validators';

interface ViewRawMaterialsProps {
	rawMaterials: RawMaterial[];
}

const ViewRawMaterials = ({ rawMaterials }: ViewRawMaterialsProps) => {
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
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>Material Name</TableCell>
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>Material Code</TableCell>
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>Quantity</TableCell>
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>UOM</TableCell>
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>Version</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{rawMaterials.map((material, index) => (
							<TableRow key={material.id || index} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
								<TableCell sx={{ fontWeight: 500, color: '#333' }}>{material.materialName}</TableCell>
								<TableCell sx={{ color: '#666' }}>{material.materialCode}</TableCell>
								<TableCell sx={{ color: '#666' }}>{material.quantity}</TableCell>
								<TableCell sx={{ color: '#666' }}>{material.uom}</TableCell>
								<TableCell sx={{ color: '#666' }}>v{material.version}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Paper>
	);
};

export default ViewRawMaterials;
