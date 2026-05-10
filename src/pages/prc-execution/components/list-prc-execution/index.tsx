import { useState, useMemo, useCallback } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PrcExecutionHeader from './components/PrcExecutionHeader';
import PrcExecutionManagement, {
	PRC_OPERATION_SCOPE_ALL,
	PRC_EXECUTION_ALL_STATUSES,
	type PrcOperationCompletionValue
} from './components/PrcExecutionManagement';
import PrcExecutionTable, { PrcExecutionData } from './components/PrcExecutionTable';
import CatalystTableSkeleton from '../../../../components/common/skeleton/CatalystTableSkeleton';
import { useFetchPrcExecutionsQuery } from '../../../../store/api/business/prc-execution/prc-execution.api';
import {
	parsePrcExecutionOperationStatusList,
	executionOperationsAllComplete,
	executionOperationsHasIncomplete
} from '../../../../store/api/business/prc-execution/prc-execution.validators';

function rowMatchesOperationHierarchy(
	row: PrcExecutionData,
	operationScope: string,
	completion: PrcOperationCompletionValue
): boolean {
	const ops = row.operationStatus ?? [];
	const scopeAll = operationScope === PRC_OPERATION_SCOPE_ALL;

	if (!scopeAll) {
		const match = ops.find(op => (op.operationText ?? '').trim() === operationScope);
		if (!match) return false;
		if (completion === 'complete') return Boolean(match.prcStatus && match.sapStatus);
		if (completion === 'incomplete') return !(match.prcStatus && match.sapStatus);
		return true;
	}

	if (completion === 'complete') return executionOperationsAllComplete(ops);
	if (completion === 'incomplete') return executionOperationsHasIncomplete(ops);
	return true;
}

const ListPrcExecution = () => {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState('');
	const [activeStatusFilter, setActiveStatusFilter] = useState(PRC_EXECUTION_ALL_STATUSES);
	const [operationScope, setOperationScope] = useState(PRC_OPERATION_SCOPE_ALL);
	const [operationCompletion, setOperationCompletion] = useState<PrcOperationCompletionValue>('any');
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [executionToDelete, setExecutionToDelete] = useState<PrcExecutionData | null>(null);
	// Fetch all PRC executions using the API
	const {
		data: prcExecutionData,
		isLoading: isPrcExecutionDataLoading,
		isFetching: isPrcExecutionDataFetching
	} = useFetchPrcExecutionsQuery();

	// Extract execution data for table (normalize list API field names)
	const allExecutionData: PrcExecutionData[] = useMemo(() => {
		if (!prcExecutionData) return [];
		const raw = (prcExecutionData as { data?: PrcExecutionData[] })?.data || [];
		return raw.map(row => {
			const legacy = row as { operation_status?: unknown };
			const rawOps = legacy.operation_status ?? row.operationStatus;
			return {
				...row,
				operationStatus: parsePrcExecutionOperationStatusList(rawOps)
			};
		});
	}, [prcExecutionData]);

	const statusOptions = useMemo(() => {
		const u = new Set<string>();
		for (const e of allExecutionData) {
			if (e.status) u.add(e.status);
		}
		return [PRC_EXECUTION_ALL_STATUSES, ...[...u].sort((a, b) => a.localeCompare(b))];
	}, [allExecutionData]);

	const operationTextOptions = useMemo(() => {
		const u = new Set<string>();
		for (const e of allExecutionData) {
			for (const op of e.operationStatus ?? []) {
				const t = (op.operationText ?? '').trim();
				if (t) u.add(t);
			}
		}
		return [...u].sort((a, b) => a.localeCompare(b));
	}, [allExecutionData]);

	/** Clamp scope when underlying data drops an operation title (avoid invalid filter). */
	const appliedOperationScope = useMemo(() => {
		if (operationScope === PRC_OPERATION_SCOPE_ALL) return PRC_OPERATION_SCOPE_ALL;
		return operationTextOptions.includes(operationScope) ? operationScope : PRC_OPERATION_SCOPE_ALL;
	}, [operationScope, operationTextOptions]);

	const handleOperationScopeChange = useCallback((value: string) => {
		setOperationScope(value);
		setOperationCompletion('any');
	}, []);

	// Filter and search logic
	const filteredData = useMemo(() => {
		let filtered = allExecutionData;

		if (activeStatusFilter !== PRC_EXECUTION_ALL_STATUSES) {
			filtered = filtered.filter(e => e.status === activeStatusFilter);
		}

		filtered = filtered.filter(e =>
			rowMatchesOperationHierarchy(e, appliedOperationScope, operationCompletion)
		);

		// Apply search filter
		if (searchTerm) {
			const q = searchTerm.toLowerCase();
			filtered = filtered.filter(execution => {
				const idStr = String(execution.id ?? '').toLowerCase();
				const orderId = String((execution as { orderId?: string | number | null }).orderId ?? '').toLowerCase();
				const partNumber = (execution.partNumber ?? '').toLowerCase();
				const productionSetId = (execution.productionSetId ?? '').toLowerCase();
				const mould = (execution.mouldId ?? '').toLowerCase();
				const customerName = (execution.customerName ?? '').toLowerCase();
				const sapRef = (execution.sapReferenceNumber ?? '').toLowerCase();
				const opHaystack = (execution.operationStatus ?? [])
					.flatMap(op => [(op.operationText ?? '').toLowerCase(), (op.operationId ?? '').toLowerCase()])
					.join(' ');
				return (
					idStr.includes(q) ||
					orderId.includes(q) ||
					partNumber.includes(q) ||
					productionSetId.includes(q) ||
					mould.includes(q) ||
					customerName.includes(q) ||
					sapRef.includes(q) ||
					opHaystack.includes(q)
				);
			});
		}

		return filtered;
	}, [allExecutionData, searchTerm, activeStatusFilter, appliedOperationScope, operationCompletion]);

	const handleSearchChange = (searchValue: string) => {
		setSearchTerm(searchValue);
	};

	const handleExecute = (executionId: number) => {
		navigate(`/prc-execution/execute/${executionId}`);
	};

	const handleDeleteConfirm = async () => {
		// TODO: Implement delete functionality when API is available
		// For now, just close the dialog
		setDeleteDialogOpen(false);
		setExecutionToDelete(null);
	};

	const handleDeleteCancel = () => {
		setDeleteDialogOpen(false);
		setExecutionToDelete(null);
	};

	// Show loading state with skeleton
	if (isPrcExecutionDataLoading || isPrcExecutionDataFetching) {
		return (
			<Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
				<PrcExecutionHeader />
				<CatalystTableSkeleton />
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
			<PrcExecutionHeader />
			<PrcExecutionManagement
				searchTerm={searchTerm}
				onSearchChange={handleSearchChange}
				activeStatusFilter={activeStatusFilter}
				onStatusFilterChange={setActiveStatusFilter}
				statusOptions={statusOptions}
				operationTextOptions={operationTextOptions}
				operationScope={appliedOperationScope}
				onOperationScopeChange={handleOperationScopeChange}
				operationCompletion={operationCompletion}
				onOperationCompletionChange={setOperationCompletion}
			/>
			<PrcExecutionTable data={filteredData} onExecute={handleExecute} />

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
				<DialogTitle>Delete PRC Execution</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to delete the PRC execution for <strong>{executionToDelete?.partNumber}</strong>? This
						will set the status to INACTIVE and preserve all remaining data.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleDeleteCancel}>Cancel</Button>
					<Button onClick={handleDeleteConfirm} color="error" variant="contained">
						Delete Execution
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default ListPrcExecution;
