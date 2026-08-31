import {
	Box,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Button
} from '@mui/material';
import { type TimelineStep, type FormData } from '../../../../types/execution.types';
import { type RawMaterialItem } from '../../../../../../store/api/business/sap-job-runs/sap-job-runs.validators';

interface RawMaterialsStepProps {
	step?: TimelineStep;
	onStepComplete?: (formData: FormData) => void | Promise<void>;
	readOnlyOverride?: boolean;
	/** When provided, render fresh SAP-sourced raw materials in read-only mode (no Proceed). */
	sapRawMaterials?: RawMaterialItem[];
	/** Optional title for SAP mode (defaults to "Raw Materials"). */
	sapTitle?: string;
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

const RawMaterialsStep = ({
	step,
	onStepComplete,
	readOnlyOverride,
	sapRawMaterials,
	sapTitle
}: RawMaterialsStepProps) => {
	if (sapRawMaterials) {
		return (
			<Box sx={{ p: 2, backgroundColor: 'white' }}>
				<Box sx={{ mb: 2 }}>
					<Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 0.5, lineHeight: 1.3 }}>
						{sapTitle ?? 'Raw Materials'}
					</Typography>
				</Box>

				<TableContainer component={Paper} sx={{ mb: 2 }}>
					<Table size="small">
						<TableHead>
							<TableRow sx={{ backgroundColor: '#f5f5f5' }}>
								<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Material Code</TableCell>
								<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Material Name</TableCell>
								<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Material Group</TableCell>
								<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Required Qty</TableCell>
								<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Planned UOM</TableCell>
								<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Actual Quantity</TableCell>
								<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>UOM</TableCell>
								<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Batch No</TableCell>
								<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Expiry Date</TableCell>
								<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>PRC Set ID</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{sapRawMaterials.map(rm => (
								<TableRow key={rm.id}>
									<TableCell sx={{ py: 1 }}>
										<Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
											{displayCell(rm.materialCode)}
										</Typography>
									</TableCell>
									<TableCell sx={{ py: 1 }}>
										<Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
											{displayCell(rm.materialName)}
										</Typography>
									</TableCell>
									<TableCell sx={{ py: 1 }}>
										<Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
											{displayCell(rm.materialGroup)}
										</Typography>
									</TableCell>
									<TableCell sx={{ py: 1 }}>
										<Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
											{displayCell(rm.quantity)}
										</Typography>
									</TableCell>
									<TableCell sx={{ py: 1 }}>
										<Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
											{displayCell(rm.uom)}
										</Typography>
									</TableCell>
									<TableCell sx={{ py: 1 }}>
										<Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
											{displayCell(rm.actualQuantity)}
										</Typography>
									</TableCell>
									<TableCell sx={{ py: 1 }}>
										<Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
											{displayCell(rm.actualUom ?? rm.uom)}
										</Typography>
									</TableCell>
									<TableCell sx={{ py: 1 }}>
										<Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
											{displayCell(rm.batchNumber)}
										</Typography>
									</TableCell>
									<TableCell sx={{ py: 1 }}>
										<Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
											{displayCell(rm.expiryDate)}
										</Typography>
									</TableCell>
									<TableCell sx={{ py: 1 }}>
										<Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
											{displayCell(rm.prcSetId)}
										</Typography>
									</TableCell>
								</TableRow>
							))}
							{sapRawMaterials.length === 0 && (
								<TableRow>
									<TableCell colSpan={9} sx={{ py: 2, textAlign: 'center' }}>
										<Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
											No raw materials returned from SAP.
										</Typography>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</TableContainer>
			</Box>
		);
	}

	if (!step) return null;
	const isReadOnly = Boolean(readOnlyOverride) || step.status === 'completed';

	const handleProceed = () => {
		if (!onStepComplete) return;
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
							<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>Expiry Date</TableCell>
							<TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', py: 1 }}>PRC Set ID</TableCell>
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
								<TableCell sx={{ py: 1 }}>
									<Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
										{displayCell(item.expiryDate)}
									</Typography>
								</TableCell>
								<TableCell sx={{ py: 1 }}>
									<Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
										{displayCell(item.prcSetId)}
									</Typography>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>

			{!isReadOnly && onStepComplete && (
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
