import { useState, useMemo, useCallback } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PrcExecutionHeader from './components/PrcExecutionHeader';
import PrcExecutionTable, { PrcExecutionData } from './components/PrcExecutionTable';
import CatalystTableSkeleton from '../../../../components/common/skeleton/CatalystTableSkeleton';
import { useFetchPrcExecutionsQuery } from '../../../../store/api/business/prc-execution/prc-execution.api';
import { parsePrcExecutionOperationStatusList } from '../../../../store/api/business/prc-execution/prc-execution.validators';
import { useListView } from '../../../../hooks/useListView';
import {
	deriveOptions,
	MasterFilterToolbar,
	MasterListLandingPage,
	masterListTableFrame,
	matchesMulti,
	type FilterFieldConfig,
	type FilterValue
} from '../../../../components/masters';
import { isFilterValueEmpty, isStringArrayValue } from '../../../../components/masters/filters/types';

const SEARCH_PLACEHOLDER = 'Order, SAP, reservation, part, serial, customer, operation';

const ListPrcExecution = () => {
	const navigate = useNavigate();
	const { searchTerm, filters, pagination, setSearchTerm, setFilters, setPagination } = useListView('prcExecution');
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [executionToDelete, setExecutionToDelete] = useState<PrcExecutionData | null>(null);

	const {
		data: prcExecutionData,
		isLoading: isPrcExecutionDataLoading,
		isFetching: isPrcExecutionDataFetching
	} = useFetchPrcExecutionsQuery();

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

	const fields = useMemo<FilterFieldConfig[]>(
		() => [
			{
				kind: 'autocomplete',
				key: 'orderId',
				label: 'Order No',
				options: deriveOptions(allExecutionData, r => (r.orderId != null ? String(r.orderId) : ''))
			},
			{
				kind: 'autocomplete',
				key: 'sapReferenceNumber',
				label: 'SAP Number',
				options: deriveOptions(allExecutionData, r => r.sapReferenceNumber)
			},
			{
				kind: 'autocomplete',
				key: 'reservation',
				label: 'Reservation',
				options: deriveOptions(allExecutionData, r =>
					r.reservation != null && String(r.reservation).trim() ? String(r.reservation) : ''
				)
			},
			{
				kind: 'autocomplete',
				key: 'partNumber',
				label: 'Part Number',
				options: deriveOptions(allExecutionData, r => r.partNumber)
			},
			{
				kind: 'autocomplete',
				key: 'description',
				label: 'Part Description',
				options: deriveOptions(allExecutionData, r => {
					const desc = (r as unknown as Record<string, unknown>).description;
					return typeof desc === 'string' ? desc : '';
				})
			},
			{
				kind: 'autocomplete',
				key: 'productionSetId',
				label: 'Serial Number',
				options: deriveOptions(allExecutionData, r => r.productionSetId)
			},
			{
				kind: 'autocomplete',
				key: 'customerName',
				label: 'Customer Name',
				options: deriveOptions(allExecutionData, r => r.customerName)
			},
			{
				kind: 'autocomplete',
				key: 'customerVariantName',
				label: 'Variant',
				options: deriveOptions(allExecutionData, r => r.customerVariantName)
			},
			{
				kind: 'autocomplete',
				key: 'operation',
				label: 'Operation',
				options: deriveOptions(
					allExecutionData.flatMap(e =>
						(e.operationStatus ?? []).map(op => ({ text: (op.operationText ?? '').trim() }))
					),
					r => r.text
				)
			},
			{
				kind: 'autocomplete',
				key: 'status',
				label: 'Status',
				options: deriveOptions(allExecutionData, r => r.status)
			}
		],
		[allExecutionData]
	);

	const filteredData = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();
		const opFilter = filters.operation;
		return allExecutionData.filter(e => {
			if (!matchesMulti(e.orderId != null ? String(e.orderId) : '', filters.orderId)) return false;
			if (!matchesMulti(e.sapReferenceNumber, filters.sapReferenceNumber)) return false;
			if (
				!matchesMulti(
					e.reservation != null && String(e.reservation).trim() ? String(e.reservation) : '',
					filters.reservation
				)
			) {
				return false;
			}
			if (!matchesMulti(e.partNumber, filters.partNumber)) return false;
			const description = (e as unknown as Record<string, unknown>).description;
			if (!matchesMulti(typeof description === 'string' ? description : '', filters.description)) return false;
			if (!matchesMulti(e.productionSetId, filters.productionSetId)) return false;
			if (!matchesMulti(e.customerName, filters.customerName)) return false;
			if (!matchesMulti(e.customerVariantName, filters.customerVariantName)) return false;
			if (!matchesMulti(e.status, filters.status)) return false;
			if (!isFilterValueEmpty(opFilter)) {
				const selected = isStringArrayValue(opFilter) ? opFilter : [];
				const ops = (e.operationStatus ?? []).map(op => (op.operationText ?? '').trim()).filter(Boolean);
				if (selected.length > 0 && !ops.some(o => selected.includes(o))) return false;
			}
			if (!term) return true;
			const idStr = String(e.id ?? '').toLowerCase();
			const orderId = String(e.orderId ?? '').toLowerCase();
			const partNumber = (e.partNumber ?? '').toLowerCase();
			const productionSetId = (e.productionSetId ?? '').toLowerCase();
			const mould = (e.mouldId ?? '').toLowerCase();
			const customerName = (e.customerName ?? '').toLowerCase();
			const sapRef = (e.sapReferenceNumber ?? '').toLowerCase();
			const reservation = (e.reservation != null ? String(e.reservation) : '').toLowerCase();
			const opHaystack = (e.operationStatus ?? [])
				.flatMap(op => [(op.operationText ?? '').toLowerCase(), (op.operationId ?? '').toLowerCase()])
				.join(' ');
			return (
				idStr.includes(term) ||
				orderId.includes(term) ||
				partNumber.includes(term) ||
				productionSetId.includes(term) ||
				mould.includes(term) ||
				customerName.includes(term) ||
				sapRef.includes(term) ||
				reservation.includes(term) ||
				opHaystack.includes(term)
			);
		});
	}, [allExecutionData, filters, searchTerm]);

	const handleFiltersChange = useCallback(
		(next: Record<string, FilterValue>) => {
			setFilters(next);
			setPagination(prev => ({ ...prev, pageIndex: 0 }));
		},
		[setFilters, setPagination]
	);

	const handleSearchChange = useCallback(
		(term: string) => {
			setSearchTerm(term);
			setPagination(prev => ({ ...prev, pageIndex: 0 }));
		},
		[setSearchTerm, setPagination]
	);

	const handleExecute = (executionId: number) => {
		navigate(`/prc-execution/execute/${executionId}`);
	};

	const handleView = (executionId: number) => {
		navigate(`/prc-execution/view/${executionId}`);
	};

	const handleOpenReport = (executionId: number) => {
		navigate(`/prc-execution/report/${executionId}`);
	};

	const handleDeleteConfirm = async () => {
		setDeleteDialogOpen(false);
		setExecutionToDelete(null);
	};

	const handleDeleteCancel = () => {
		setDeleteDialogOpen(false);
		setExecutionToDelete(null);
	};

	if (isPrcExecutionDataLoading || isPrcExecutionDataFetching) {
		return (
			<Box sx={{ minWidth: 0 }}>
				<PrcExecutionHeader />
				<CatalystTableSkeleton />
			</Box>
		);
	}

	return (
		<>
			<MasterListLandingPage
				header={<PrcExecutionHeader />}
				toolbar={
					<MasterFilterToolbar
						title="Filter"
						searchPlaceholder={SEARCH_PLACEHOLDER}
						searchTerm={searchTerm}
						fields={fields}
						values={filters}
						onSearchChange={handleSearchChange}
						onFiltersChange={handleFiltersChange}
					/>
				}
				table={
					<Box sx={masterListTableFrame}>
						<PrcExecutionTable
							data={filteredData}
							onExecute={handleExecute}
							onView={handleView}
							onOpenReport={handleOpenReport}
							pagination={pagination}
							onPaginationChange={setPagination}
						/>
					</Box>
				}
			/>

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
		</>
	);
};

export default ListPrcExecution;
