import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import { type TimelineStep, type FormData } from '../../../../types/execution.types';

interface RawMaterialsStepProps {
	step: TimelineStep;
	onStepComplete: (formData: FormData) => void | Promise<void>;
	readOnlyOverride?: boolean;
}

/** Flat shape expected by `buildAggregatedData` for raw materials (matches prior editable step). */
const buildRawMaterialsProceedFormData = (step: TimelineStep): FormData => {
	const out: FormData = {};
	step.items?.forEach(item => {
		const qty = item.actualQuantity;
		out[item.id.toString()] = qty != null && String(qty).trim() !== '' ? String(qty) : '';
		const bn = item.batchNumber;
		if (bn != null && String(bn).trim() !== '') {
			out[`${item.id}_batchNumber`] = String(bn);
		}
	});
	return out;
};

const displayCell = (value: unknown): string => {
	if (value === undefined || value === null) return '—';
	const s = String(value).trim();
	return s === '' ? '—' : s;
};

const RawMaterialsStep = ({ step, onStepComplete, readOnlyOverride }: RawMaterialsStepProps) => {
	const isReadOnly = Boolean(readOnlyOverride) || step.status === 'completed';

	const handleProceed = () => {
		void onStepComplete(buildRawMaterialsProceedFormData(step));
	};

	return (
		<Box sx={{ p: 2, backgroundColor: 'white' }}>
			<Box sx={{ mb: 2 }}>
				<Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 0.5, lineHeight: 1.3 }}>
					{step.title}
				</Typography>
				{step.description && step.description !== step.title && (
					<Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
						{step.description}
					</Typography>
				)}
			</Box>

			<TableContainer component={Paper} sx={{ mb: 2 }}>
				<Table size="small">
					<TableHead>
						<TableRow sx={{ backgroundColor: '#f5f5f5' }}>
							<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Material Code</TableCell>
							<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Material Name</TableCell>
							<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Required Qty</TableCell>
							<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Planned UOM</TableCell>
							<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Actual Quantity</TableCell>
							<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>UOM</TableCell>
							<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Batch No</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{step.items?.map(item => (
							<TableRow key={item.id}>
								<TableCell sx={{ py: 1 }}>
									<Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
										{displayCell(item.description)}
									</Typography>
								</TableCell>
								<TableCell sx={{ py: 1 }}>
									<Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
										{displayCell(item.name)}
									</Typography>
								</TableCell>
								<TableCell sx={{ py: 1 }}>
									<Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
										{displayCell(item.quantity)}
									</Typography>
								</TableCell>
								<TableCell sx={{ py: 1 }}>
									<Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
										{displayCell(item.uom)}
									</Typography>
								</TableCell>
								<TableCell sx={{ py: 1 }}>
									<Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
										{displayCell(item.actualQuantity)}
									</Typography>
								</TableCell>
								<TableCell sx={{ py: 1 }}>
									<Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
										{displayCell(item.actualUom ?? item.uom)}
									</Typography>
								</TableCell>
								<TableCell sx={{ py: 1 }}>
									<Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
										{displayCell(item.batchNumber)}
									</Typography>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>

			{!isReadOnly && (
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
					<Button
						variant="contained"
						onClick={handleProceed}
						sx={{
							backgroundColor: '#1976d2',
							'&:hover': { backgroundColor: '#1565c0' }
						}}
					>
						Proceed
					</Button>
				</Box>
			)}
		</Box>
	);
};

export default RawMaterialsStep;
