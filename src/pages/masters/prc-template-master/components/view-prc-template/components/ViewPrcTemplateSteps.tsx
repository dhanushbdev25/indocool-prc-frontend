import {
	Box,
	Typography,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip
} from '@mui/material';
import { PrcTemplateStep } from '../../../../../../store/api/business/prc-template/prc-template.validators';

interface ViewPrcTemplateStepsProps {
	steps: PrcTemplateStep[];
}

const ViewPrcTemplateSteps = ({ steps }: ViewPrcTemplateStepsProps) => {
	const getTypeColor = (type: string) => {
		if (type === 'sequence') return '#1976d2';
		if (type === 'inspection') return '#4caf50';
		// Handle custom types like "mixing h1"
		return '#ff9800';
	};

	if (steps.length === 0) {
		return (
			<Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
				<Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
					Template Steps
				</Typography>
				<Typography variant="body1" color="textSecondary" textAlign="center" sx={{ py: 4 }}>
					No steps configured for this template
				</Typography>
			</Paper>
		);
	}

	return (
		<Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
			<Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#333' }}>
				Template Steps ({steps.length})
			</Typography>

			<TableContainer>
				<Table>
					<TableHead>
						<TableRow sx={{ backgroundColor: '#f8f9fa' }}>
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>Sequence</TableCell>
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>Step ID</TableCell>
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>Type</TableCell>
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>Block Catalyst Mixing</TableCell>
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>Request Supervisor Approval</TableCell>
							<TableCell sx={{ fontWeight: 600, color: '#333' }}>Version</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{[...steps]
							.sort((a, b) => a.sequence - b.sequence)
							.map((step, index) => (
								<TableRow key={step.id || index} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
									<TableCell>
										<Box
											sx={{
												width: 32,
												height: 32,
												borderRadius: '50%',
												backgroundColor: getTypeColor(step.type),
												color: 'white',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												fontWeight: 'bold',
												fontSize: '0.9rem'
											}}
										>
											{step.sequence}
										</Box>
									</TableCell>
									<TableCell sx={{ fontWeight: 500, color: '#333' }}>{step.stepId || 'N/A'}</TableCell>
									<TableCell>
										<Chip
											label={step.type ? step.type.toUpperCase() : 'UNKNOWN'}
											size="small"
											sx={{
												backgroundColor: getTypeColor(step.type),
												color: 'white',
												fontSize: '0.7rem',
												fontWeight: 600
											}}
										/>
									</TableCell>
									<TableCell>
										<Chip
											label={step.blockCatalystMixing ? 'Yes' : 'No'}
											color={step.blockCatalystMixing ? 'warning' : 'default'}
											size="small"
											variant="outlined"
										/>
									</TableCell>
									<TableCell>
										<Chip
											label={step.requestSupervisorApproval ? 'Yes' : 'No'}
											color={step.requestSupervisorApproval ? 'info' : 'default'}
											size="small"
											variant="outlined"
										/>
									</TableCell>
									<TableCell sx={{ color: '#666' }}>v{step.version}</TableCell>
								</TableRow>
							))}
					</TableBody>
				</Table>
			</TableContainer>
		</Paper>
	);
};

export default ViewPrcTemplateSteps;
