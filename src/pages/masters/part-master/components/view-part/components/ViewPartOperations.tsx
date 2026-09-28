import {
	Alert,
	Box,
	Chip,
	Paper,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography
} from '@mui/material';
import type { OperationWisePartRow } from '../../../../../../store/api/business/part-master/part.validators';
import { useFetchPlantComboQuery } from '../../../../../../store/api/business/prc-template/prc-template.api';
import { useFetchPrcExecutionsQuery } from '../../../../../../store/api/business/prc-execution/prc-execution.api';

interface ViewPartOperationsProps {
	partId: number;
	/** Used to look up this part's PRC executions, which record the plant it actually ran in. */
	sapReferenceNumber?: string | null;
	operationWiseData?: OperationWisePartRow[];
}

const SKILL_KEYS = ['l1Count', 'l2Count', 'l3Count', 'l4Count'] as const;
const SKILL_LABELS = ['L1', 'L2', 'L3', 'L4'] as const;

const headcount = (row: OperationWisePartRow) => SKILL_KEYS.reduce((total, key) => total + (Number(row[key]) || 0), 0);

/**
 * The operation mapping the part carries for PRC execution: which routing operations it runs, the
 * plant they belong to, and how much manpower each needs by skill level.
 *
 * Plant is resolved in order of authority:
 *   1. `prc_execution.plantCode` — recorded on every execution of this part, so it is the plant the
 *      part has actually run in. Absent only for a part that has never been executed.
 *   2. The plant stamped on the saved operation rows when Linked Masters last wrote them.
 *   3. The part's routing combo, and only when it names exactly one plant — plants share operation
 *      numbers (1102 and 1103 both carry 10/20/30), so a multi-plant routing names nothing.
 * The caption says which of these the answer came from whenever it is not the first.
 */

const ViewPartOperations = ({ partId, sapReferenceNumber, operationWiseData }: ViewPartOperationsProps) => {
	const rows = operationWiseData || [];

	// The plant the part has actually run in, straight off its executions.
	const { data: executionData, isLoading: isExecutionLoading } = useFetchPrcExecutionsQuery(
		{
			page: 1,
			pageSize: 100,
			// The server forces a last-80-days window when no dates are given; this part may not
			// have run recently, so ask for everything.
			fromDate: '2000-01-01',
			toDate: '2100-12-31',
			sapReferenceNumber: sapReferenceNumber ? [sapReferenceNumber] : []
		},
		{ skip: !sapReferenceNumber }
	);
	const executedPlants = [
		...new Set((executionData?.data || []).map(row => row.plantCode).filter((p): p is string => !!p))
	];

	const savedPlants = [...new Set(rows.map(row => row.plant).filter((p): p is string => !!p))];

	// Only ask the routing combo when neither better source answered.
	const needsRouting =
		!isExecutionLoading && executedPlants.length === 0 && savedPlants.length === 0 && rows.length > 0;
	const { data: plantData, isLoading: isPlantLoading } = useFetchPlantComboQuery(
		{ partId },
		{ skip: !partId || !needsRouting }
	);
	const routingPlants = plantData?.data || [];

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
				<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555' }}>
					Plant
				</Typography>
				{isExecutionLoading ? (
					<Skeleton variant="rounded" width={72} height={24} />
				) : executedPlants.length > 0 ? (
					executedPlants.map(plant => (
						<Chip key={plant} label={plant} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
					))
				) : savedPlants.length > 0 ? (
					<>
						{savedPlants.map(plant => (
							<Chip key={plant} label={plant} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
						))}
						<Typography variant="caption" sx={{ color: '#888' }}>
							as configured — this part has no PRC executions yet
						</Typography>
					</>
				) : isPlantLoading ? (
					<Skeleton variant="rounded" width={72} height={24} />
				) : routingPlants.length === 1 ? (
					<>
						<Chip label={routingPlants[0].label} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
						<Typography variant="caption" sx={{ color: '#888' }}>
							from the part's routing — no PRC execution to confirm it
						</Typography>
					</>
				) : (
					<Typography variant="body2" sx={{ color: '#888' }}>
						{routingPlants.length > 1
							? `Not recorded — no PRC execution yet, and this part is routed in ${routingPlants.length} plants (${routingPlants
									.map(p => p.label)
									.join(', ')}).`
							: 'No plant mapped for this part'}
					</Typography>
				)}
			</Box>

			{rows.length === 0 ? (
				<Alert severity="info">No operations mapped for this part</Alert>
			) : (
				<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: '#e0e0e0' }}>
					<Table size="small">
						<TableHead>
							<TableRow sx={{ backgroundColor: '#fafafa' }}>
								<TableCell sx={{ fontWeight: 600 }}>Operation</TableCell>
								{SKILL_LABELS.map(label => (
									<TableCell key={label} align="right" sx={{ fontWeight: 600, width: 72 }}>
										{label}
									</TableCell>
								))}
								<TableCell align="right" sx={{ fontWeight: 600, width: 88 }}>
									Total
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{rows.map((row, index) => (
								<TableRow key={row.id ?? index} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
									<TableCell>
										<Typography variant="body2" sx={{ fontWeight: 500, color: '#333' }}>
											{row.operationName || `Operation ${row.operationID}`}
										</Typography>
										<Typography variant="caption" sx={{ display: 'block', color: '#888' }}>
											Operation {row.operationID}
										</Typography>
									</TableCell>
									{SKILL_KEYS.map(key => (
										<TableCell key={key} align="right" sx={{ color: '#666' }}>
											{Number(row[key]) || 0}
										</TableCell>
									))}
									<TableCell align="right" sx={{ fontWeight: 600, color: '#333' }}>
										{headcount(row)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Box>
	);
};

export default ViewPartOperations;
