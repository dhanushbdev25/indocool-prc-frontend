import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { BOM } from '../../../../../../store/api/business/part-master/part.validators';

interface ViewBOMProps {
	bom: BOM[];
}

const ViewBOM = ({ bom }: ViewBOMProps) => {
	if (bom.length === 0) {
		return (
			<Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
				<Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
					Bill of Materials (BOM)
				</Typography>
				<Typography variant="body1" color="textSecondary" textAlign="center" sx={{ py: 4 }}>
					No BOM items configured for this part
				</Typography>
			</Paper>
		);
	}

	return (
		<Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
			<Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#333' }}>
				Bill of Materials (BOM) ({bom.length})
			</Typography>

			<TableContainer>
				<Table>
					<TableHead>
						<TableRow sx={{ backgroundColor: '#f8f9fa' }}>
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>Material Type</TableCell>
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>Description</TableCell>
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>BOM Quantity</TableCell>
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>Version</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{bom.map((item, index) => (
							<TableRow key={item.id || index} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
								<TableCell sx={{ fontWeight: 500, color: '#333' }}>{item.materialType}</TableCell>
								<TableCell sx={{ color: '#666' }}>{item.description}</TableCell>
								<TableCell sx={{ color: '#666' }}>{item.bomQuantity}</TableCell>
								<TableCell sx={{ color: '#666' }}>v{item.version}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Paper>
	);
};

export default ViewBOM;
