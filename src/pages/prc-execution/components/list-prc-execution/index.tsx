import { useState, useMemo, useCallback, useEffect } from 'react';
import {
	Box,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	LinearProgress,
	Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import PrcExecutionHeader from './components/PrcExecutionHeader';
import PrcExecutionTable, { PrcExecutionData } from './components/PrcExecutionTable';
import CatalystTableSkeleton from '../../../../components/common/skeleton/CatalystTableSkeleton';
import {
	useFetchPrcExecutionsQuery,
	useLazyFetchPrcExecutionsQuery,
	useFetchPlantsQuery,
	useLazyFetchPrcExecutionDetailsQuery,
	type PrcExecutionsListArgs
} from '../../../../store/api/business/prc-execution/prc-execution.api';
import {
	PRC_EXECUTION_STATUSES,
	type PrcExecution
} from '../../../../store/api/business/prc-execution/prc-execution.validators';
import { useFetchSapComboQuery, useFetchCustomersQuery } from '../../../../store/api/business/part-master/part.api';
import {
	useFetchReservationComboQuery,
	useFetchPrcSetIdComboQuery,
	useFetchSapSetIdComboQuery
} from '../../../../store/api/business/customer/customer.api';
import { useListView } from '../../../../hooks/useListView';
import {
	InlineFilterBar,
	MasterListLandingPage,
	masterListTableFrame,
	isDateRangeValue,
	isStringArrayValue,
	type FilterFieldConfig,
	type FilterValue
} from '../../../../components/masters';
import { PRC_DATE_RANGE_PRESETS, PRC_DATE_RANGE_DEFAULT_ID, PRC_DATE_RANGE_CUSTOM_ID } from './dateRangePresets';
import {
	BulkQrSelectionDialog,
	PrcQrLabelsDialog,
	ScanQrDialog,
	mapExecutionToQrLabel,
	unwrapExecutionDetail,
	type PrcQrLabelFields
} from '../qr-labels';
import { uniqueSorted, plantCodeOptions } from '../../../../utils/comboOptionHelpers';
import { exportRowsToExcel, type ExportColumn } from '../../../../utils/exportTableToExcel';
import { DATE_PICKER_FORMAT } from '../../../../utils/dateConfig';

const SEARCH_PLACEHOLDER = 'Order ID';

/** Server clamp on POST /prcExecution/list pageSize. */
const EXPORT_PAGE_SIZE = 100;
/** Safety cap for the export-all loop (100 pages × 100 rows = 10k rows). */
const EXPORT_MAX_PAGES = 100;

const formatDateCell = (raw: string | null | undefined): string => {
	const d = raw ? dayjs(raw) : null;
	return d && d.isValid() ? d.format(DATE_PICKER_FORMAT) : '';
};

/** Mirrors the visible table columns for the fetch-all Excel export. */
const PRC_EXPORT_COLUMNS: ExportColumn<PrcExecution>[] = [
	{ header: 'Order No', value: r => (r.orderId != null ? String(r.orderId) : '') },
	{ header: 'SAP Number', value: r => r.sapReferenceNumber ?? '' },
	{ header: 'Reservation', value: r => r.reservation ?? '' },
	{ header: 'Prc Set Id', value: r => r.prcSetId ?? '' },
	{ header: 'Part Number', value: r => r.partNumber ?? '' },
	{ header: 'Part Description', value: r => r.partDescription ?? '' },
	{ header: 'Serial Number', value: r => r.productionSetId ?? '' },
	{ header: 'Customer Name', value: r => r.customerName ?? '' },
	{ header: 'Variant', value: r => r.customerVariantName ?? '' },
	{
		header: 'Operation',
		value: r =>
			(r.operationStatus ?? [])
				.map(op => (op.operationText ?? '').trim())
				.filter(Boolean)
				.join(' | ')
	},
	{ header: 'PRC Date', value: r => formatDateCell(r.date) },
	{ header: 'Plant Code', value: r => r.plant ?? '' },
	{ header: 'Status', value: r => r.status ?? '' }
];

/** Trimmed, sorted copy of an array filter (sorted for stable RTK Query cache keys), or undefined when empty. */
const sortedArrayFilter = (value: FilterValue | undefined): string[] | undefined => {
	if (!isStringArrayValue(value)) return undefined;
	const cleaned = value.map(v => v.trim()).filter(Boolean);
	return cleaned.length ? [...cleaned].sort() : undefined;
};

const ListPrcExecution = () => {
	const navigate = useNavigate();
	const { searchTerm, filters, pagination, setSearchTerm, setFilters, setPagination } = useListView('prcExecution');
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [executionToDelete, setExecutionToDelete] = useState<PrcExecutionData | null>(null);
	const [bulkQrSelectOpen, setBulkQrSelectOpen] = useState(false);
	const [scanQrOpen, setScanQrOpen] = useState(false);
	const [qrDialogOpen, setQrDialogOpen] = useState(false);
	const [qrLabels, setQrLabels] = useState<PrcQrLabelFields[]>([]);
	const [qrLoading, setQrLoading] = useState(false);
	const [qrError, setQrError] = useState<string | null>(null);
	const [fetchPrcExecutionDetails] = useLazyFetchPrcExecutionDetailsQuery();

	// Combo APIs for backend-driven filter options
	const { data: sapComboData, isLoading: isSapComboLoading } = useFetchSapComboQuery();
	const { data: customersData, isLoading: isCustomersLoading } = useFetchCustomersQuery();
	const { data: plantsData, isLoading: isPlantsLoading } = useFetchPlantsQuery();
	const { data: reservationComboData, isLoading: isReservationComboLoading } = useFetchReservationComboQuery();
	const { data: prcSetIdComboData, isLoading: isPrcSetIdComboLoading } = useFetchPrcSetIdComboQuery();
	const { data: sapSetIdComboData, isLoading: isSapSetIdComboLoading } = useFetchSapSetIdComboQuery();

	const sapOptions = useMemo(() => uniqueSorted((sapComboData?.data ?? []).map(r => r.value)), [sapComboData]);
	// Server filters customers with ILIKE on customerName, so options must be the names (labels), not codes.
	const customerOptions = useMemo(
		() => uniqueSorted((customersData?.data ?? []).map(r => r.label)),
		[customersData]
	);
	const plantOptions = useMemo(() => plantCodeOptions(plantsData), [plantsData]);
	const reservationOptions = useMemo(
		() => uniqueSorted((reservationComboData?.data ?? []).map(r => r.value)),
		[reservationComboData]
	);
	const prcSetIdOptions = useMemo(
		() => uniqueSorted((prcSetIdComboData?.data ?? []).map(r => r.value)),
		[prcSetIdComboData]
	);
	const productionSetIdOptions = useMemo(
		() => uniqueSorted((sapSetIdComboData?.data ?? []).map(r => r.value)),
		[sapSetIdComboData]
	);

	// Resolve filter state → API args (sent only when Apply commits to `filters`)
	const queryArgs = useMemo<PrcExecutionsListArgs>(() => {
		const dateRange = isDateRangeValue(filters.dateRange) ? filters.dateRange : null;
		return {
			page: pagination.pageIndex + 1,
			pageSize: pagination.pageSize,
			fromDate: dateRange?.from ?? undefined,
			toDate: dateRange?.to ?? undefined,
			orderId: searchTerm.trim() || undefined,
			customer: sortedArrayFilter(filters.customer),
			plantCode: sortedArrayFilter(filters.plantCode),
			sapReferenceNumber: sortedArrayFilter(filters.sapReferenceNumber),
			status: sortedArrayFilter(filters.status),
			reservation: sortedArrayFilter(filters.reservation),
			prcSetId: sortedArrayFilter(filters.prcSetId),
			productionSetId: sortedArrayFilter(filters.productionSetId)
		};
	}, [
		filters.dateRange,
		filters.customer,
		filters.plantCode,
		filters.sapReferenceNumber,
		filters.status,
		filters.reservation,
		filters.prcSetId,
		filters.productionSetId,
		searchTerm,
		pagination.pageIndex,
		pagination.pageSize
	]);

	const {
		data: prcExecutionData,
		isLoading: isPrcExecutionDataLoading,
		isFetching: isPrcExecutionDataFetching
	} = useFetchPrcExecutionsQuery(queryArgs);

	const rows: PrcExecutionData[] = prcExecutionData?.data ?? [];
	const totalCount = prcExecutionData?.pagination.totalCount ?? 0;

	// Clamp a stale/persisted page index back into range when the result set shrinks.
	const responseTotalPages = prcExecutionData?.pagination.totalPages;
	useEffect(() => {
		if (responseTotalPages == null || responseTotalPages <= 0) return;
		setPagination(prev =>
			prev.pageIndex > responseTotalPages - 1 ? { ...prev, pageIndex: responseTotalPages - 1 } : prev
		);
	}, [responseTotalPages, setPagination]);

	// Export the full filtered dataset by walking every server page.
	const [triggerFetchPrcExecutions] = useLazyFetchPrcExecutionsQuery();
	const [isExporting, setIsExporting] = useState(false);
	const [exportError, setExportError] = useState<string | null>(null);
	const handleExportAll = useCallback(async () => {
		setIsExporting(true);
		setExportError(null);
		try {
			const base: PrcExecutionsListArgs = { ...queryArgs, page: 1, pageSize: EXPORT_PAGE_SIZE };
			const first = await triggerFetchPrcExecutions(base, true).unwrap();
			const byId = new Map<number, PrcExecution>();
			for (const row of first.data) byId.set(row.id, row);
			const totalPages = Math.min(first.pagination.totalPages, EXPORT_MAX_PAGES);
			if (first.pagination.totalPages > EXPORT_MAX_PAGES) {
				setExportError(
					`Export limited to the first ${EXPORT_MAX_PAGES * EXPORT_PAGE_SIZE} of ${first.pagination.totalCount} rows. Narrow the filters to export the rest.`
				);
			}
			for (let page = 2; page <= totalPages; page++) {
				const next = await triggerFetchPrcExecutions({ ...base, page }, true).unwrap();
				for (const row of next.data) byId.set(row.id, row);
			}
			exportRowsToExcel(PRC_EXPORT_COLUMNS, [...byId.values()], 'prc-execution');
		} catch {
			setExportError('Export failed. Try again.');
		} finally {
			setIsExporting(false);
		}
	}, [queryArgs, triggerFetchPrcExecutions]);

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
				options: reservationOptions,
				placeholder: isReservationComboLoading ? 'Loading…' : undefined
			},
			{
				kind: 'autocomplete',
				key: 'prcSetId',
				label: 'Prc Set Id',
				options: prcSetIdOptions,
				placeholder: isPrcSetIdComboLoading ? 'Loading…' : undefined
			},
			{
				kind: 'autocomplete',
				key: 'productionSetId',
				label: 'Serial Number',
				options: productionSetIdOptions,
				placeholder: isSapSetIdComboLoading ? 'Loading…' : undefined
			},
			{
				kind: 'autocomplete',
				key: 'status',
				label: 'Status',
				options: [...PRC_EXECUTION_STATUSES]
			}
		],
		[
			sapOptions,
			customerOptions,
			plantOptions,
			reservationOptions,
			prcSetIdOptions,
			productionSetIdOptions,
			isSapComboLoading,
			isCustomersLoading,
			isPlantsLoading,
			isReservationComboLoading,
			isPrcSetIdComboLoading,
			isSapSetIdComboLoading
		]
	);

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

	const loadQrLabelsForIds = useCallback(
		async (ids: number[]) => {
			setQrDialogOpen(true);
			setQrLoading(true);
			setQrError(null);
			setQrLabels([]);
			try {
				const uniqueIds = [...new Set(ids.filter(id => Number.isFinite(id)))];
				if (uniqueIds.length === 0) {
					setQrError('No PRC executions selected.');
					return;
				}
				const results = await Promise.all(
					uniqueIds.map(async id => {
						const response = await fetchPrcExecutionDetails(id).unwrap();
						const detail = unwrapExecutionDetail(response);
						if (!detail) {
							throw new Error(`Invalid PRC execution detail for #${id}`);
						}
						return mapExecutionToQrLabel(detail);
					})
				);
				setQrLabels(results);
			} catch (err) {
				setQrError(err instanceof Error ? err.message : 'Failed to load PRC details for QR labels.');
			} finally {
				setQrLoading(false);
			}
		},
		[fetchPrcExecutionDetails]
	);

	const handleGenerateQr = useCallback(
		(executionId: number) => {
			void loadQrLabelsForIds([executionId]);
		},
		[loadQrLabelsForIds]
	);

	const handleBulkQrConfirm = useCallback(
		(ids: number[]) => {
			setBulkQrSelectOpen(false);
			void loadQrLabelsForIds(ids);
		},
		[loadQrLabelsForIds]
	);

	const handleQrScanned = useCallback(
		(executionId: number) => {
			setScanQrOpen(false);
			navigate(`/prc-execution/execute/${executionId}`);
		},
		[navigate]
	);

	const handleCloseQrDialog = useCallback(() => {
		setQrDialogOpen(false);
		setQrError(null);
	}, []);

	const handleDeleteConfirm = async () => {
		setDeleteDialogOpen(false);
		setExecutionToDelete(null);
	};

	const handleDeleteCancel = () => {
		setDeleteDialogOpen(false);
		setExecutionToDelete(null);
	};

	if (isPrcExecutionDataLoading) {
		return (
			<Box sx={{ minWidth: 0 }}>
				<PrcExecutionHeader />
				<CatalystTableSkeleton />
			</Box>
		);
	}

	const handleResetAll = () => {
		setSearchTerm('');
		setFilters({});
		setPagination(prev => ({ ...prev, pageIndex: 0 }));
	};

	return (
		<>
			<MasterListLandingPage
				header={<PrcExecutionHeader />}
				toolbar={
					<InlineFilterBar
						title="Filter"
						searchPlaceholder={SEARCH_PLACEHOLDER}
						searchTerm={searchTerm}
						fields={fields}
						values={filters}
						onSearchChange={handleSearchChange}
						onApply={({ values }) => handleFiltersChange(values)}
						onReset={handleResetAll}
					/>
				}
				table={
					<Box sx={{ ...masterListTableFrame, position: 'relative' }}>
						{isPrcExecutionDataFetching && !isPrcExecutionDataLoading ? (
							<LinearProgress
								sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 1 }}
							/>
						) : null}
						{exportError ? (
							<Typography variant="body2" color="error" sx={{ px: 2, pt: 1 }}>
								{exportError}
							</Typography>
						) : null}
						<Box sx={{ opacity: isPrcExecutionDataFetching && !isPrcExecutionDataLoading ? 0.6 : 1 }}>
							<PrcExecutionTable
								data={rows}
								totalCount={totalCount}
								onExportAll={handleExportAll}
								isExporting={isExporting}
								onExecute={handleExecute}
								onView={handleView}
								onOpenReport={handleOpenReport}
								onGenerateQr={handleGenerateQr}
								onBulkGenerateQr={() => setBulkQrSelectOpen(true)}
								onScanQr={() => setScanQrOpen(true)}
								pagination={pagination}
								onPaginationChange={setPagination}
							/>
						</Box>
					</Box>
				}
			/>

			<BulkQrSelectionDialog
				open={bulkQrSelectOpen}
				onClose={() => setBulkQrSelectOpen(false)}
				onConfirm={handleBulkQrConfirm}
			/>

			<ScanQrDialog open={scanQrOpen} onClose={() => setScanQrOpen(false)} onScanned={handleQrScanned} />

			<PrcQrLabelsDialog
				open={qrDialogOpen}
				onClose={handleCloseQrDialog}
				labels={qrLabels}
				loading={qrLoading}
				error={qrError}
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
