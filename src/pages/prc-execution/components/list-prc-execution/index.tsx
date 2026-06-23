import { useState, useMemo, useCallback } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PrcExecutionHeader from './components/PrcExecutionHeader';
import PrcExecutionTable, { PrcExecutionData } from './components/PrcExecutionTable';
import CatalystTableSkeleton from '../../../../components/common/skeleton/CatalystTableSkeleton';
import {
	useFetchPrcExecutionsQuery,
	useFetchPlantsQuery,
	type PrcExecutionsListArgs
} from '../../../../store/api/business/prc-execution/prc-execution.api';
import { parsePrcExecutionOperationStatusList } from '../../../../store/api/business/prc-execution/prc-execution.validators';
import { useFetchSapComboQuery, useFetchCustomersQuery } from '../../../../store/api/business/part-master/part.api';
import { useListView } from '../../../../hooks/useListView';
import {
	deriveOptions,
	MasterFilterToolbar,
	MasterListLandingPage,
	masterListTableFrame,
	matchesMulti,
	isDateRangeValue,
	isStringArrayValue,
	isFilterValueEmpty,
	type FilterFieldConfig,
	type FilterValue
} from '../../../../components/masters';
import { PRC_DATE_RANGE_PRESETS, PRC_DATE_RANGE_DEFAULT_ID, PRC_DATE_RANGE_CUSTOM_ID } from './dateRangePresets';

const SEARCH_PLACEHOLDER = 'Order ID';

const isRecord = (v: unknown): v is Record<string, unknown> =>
	v !== null && typeof v === 'object' && !Array.isArray(v);

const coercePlantCode = (row: unknown): string => {
	if (typeof row === 'string') return row.trim();
	if (!isRecord(row)) return '';
	if (typeof row.value === 'string') return row.value.trim();
	if (typeof row.value === 'number') return String(row.value);
	if (typeof row.label === 'string') return row.label.trim();
	return '';
};

const uniqueSorted = (values: string[]): string[] =>
	[...new Set(values.map(v => v.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));

const ListPrcExecution = () => {
	const navigate = useNavigate();
	const { searchTerm, filters, pagination, setSearchTerm, setFilters, setPagination } = useListView('prcExecution');
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [executionToDelete, setExecutionToDelete] = useState<PrcExecutionData | null>(null);

	// Combo APIs for backend-driven filter options
	const { data: sapComboData, isLoading: isSapComboLoading } = useFetchSapComboQuery();
	const { data: customersData, isLoading: isCustomersLoading } = useFetchCustomersQuery();
	const { data: plantsData, isLoading: isPlantsLoading } = useFetchPlantsQuery();

	const sapOptions = useMemo(() => uniqueSorted((sapComboData?.data ?? []).map(r => r.value)), [sapComboData]);
	const customerOptions = useMemo(
		() => uniqueSorted((customersData?.data ?? []).map(r => r.value)),
		[customersData]
	);
	const plantOptions = useMemo(() => {
		const rows = Array.isArray(plantsData)
			? plantsData
			: isRecord(plantsData) && Array.isArray((plantsData as { data?: unknown }).data)
				? ((plantsData as { data: unknown[] }).data)
				: [];
		return uniqueSorted(rows.map(coercePlantCode));
	}, [plantsData]);

	// Resolve filter state → API args (sent only when Apply commits to `filters`)
	const queryArgs = useMemo<PrcExecutionsListArgs>(() => {
		const dateRange = isDateRangeValue(filters.dateRange) ? filters.dateRange : null;
		return {
			fromDate: dateRange?.from ?? undefined,
			toDate: dateRange?.to ?? undefined,
			orderId: searchTerm.trim() || undefined,
			customer: isStringArrayValue(filters.customer) && filters.customer.length ? filters.customer : undefined,
			plantCode: isStringArrayValue(filters.plantCode) && filters.plantCode.length ? filters.plantCode : undefined,
			sapReferenceNumber:
				isStringArrayValue(filters.sapReferenceNumber) && filters.sapReferenceNumber.length
					? filters.sapReferenceNumber
					: undefined
		};
	}, [filters.dateRange, filters.customer, filters.plantCode, filters.sapReferenceNumber, searchTerm]);

	const {
		data: prcExecutionData,
		isLoading: isPrcExecutionDataLoading,
		isFetching: isPrcExecutionDataFetching
	} = useFetchPrcExecutionsQuery(queryArgs);

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
				kind: 'dateRangePreset',
				key: 'dateRange',
				label: 'Date Range',
				presets: PRC_DATE_RANGE_PRESETS,
				presetKey: 'dateRangePreset',
				defaultPresetId: PRC_DATE_RANGE_DEFAULT_ID,
				customPresetId: PRC_DATE_RANGE_CUSTOM_ID
			},
			{
				kind: 'autocomplete',
				key: 'sapReferenceNumber',
				label: 'SAP Number',
				options: sapOptions,
				placeholder: isSapComboLoading ? 'Loading…' : undefined
			},
			{
				kind: 'autocomplete',
				key: 'customer',
				label: 'Customer',
				options: customerOptions,
				placeholder: isCustomersLoading ? 'Loading…' : undefined
			},
			{
				kind: 'autocomplete',
				key: 'plantCode',
				label: 'Plant Code',
				options: plantOptions,
				placeholder: isPlantsLoading ? 'Loading…' : undefined
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
				key: 'partDescription',
				label: 'Part Description',
				options: deriveOptions(allExecutionData, r => r.partDescription ?? '')
			},
			{
				kind: 'autocomplete',
				key: 'productionSetId',
				label: 'Serial Number',
				options: deriveOptions(allExecutionData, r => r.productionSetId)
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
		[
			allExecutionData,
			sapOptions,
			customerOptions,
			plantOptions,
			isSapComboLoading,
			isCustomersLoading,
			isPlantsLoading
		]
	);

	const filteredData = useMemo(() => {
		const opFilter = filters.operation;
		return allExecutionData.filter(e => {
			if (
				!matchesMulti(
					e.reservation != null && String(e.reservation).trim() ? String(e.reservation) : '',
					filters.reservation
				)
			) {
				return false;
			}
			if (!matchesMulti(e.partNumber, filters.partNumber)) return false;
			if (!matchesMulti(e.partDescription ?? '', filters.partDescription)) return false;
			if (!matchesMulti(e.productionSetId, filters.productionSetId)) return false;
			if (!matchesMulti(e.customerVariantName, filters.customerVariantName)) return false;
			if (!matchesMulti(e.status, filters.status)) return false;
			if (!isFilterValueEmpty(opFilter)) {
				const selected = isStringArrayValue(opFilter) ? opFilter : [];
				const ops = (e.operationStatus ?? []).map(op => (op.operationText ?? '').trim()).filter(Boolean);
				if (selected.length > 0 && !ops.some(o => selected.includes(o))) return false;
			}
			return true;
		});
	}, [allExecutionData, filters]);

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
