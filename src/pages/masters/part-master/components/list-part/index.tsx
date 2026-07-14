import { useState, useMemo, useCallback } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
	deriveOptions,
	InlineFilterBar,
	MasterListLandingPage,
	masterListTableFrame,
	matchesMulti,
	ToolbarAddButton,
	type FilterFieldConfig,
	type FilterValue
} from '../../../../../components/masters';
import { isStringArrayValue, isFilterValueEmpty } from '../../../../../components/masters/filters/types';
import { useListView } from '../../../../../hooks/useListView';
import PartHeader from './components/PartHeader';
import PartTable, { PartData } from './components/PartTable';
import CatalystTableSkeleton from '../../../../../components/common/skeleton/CatalystTableSkeleton';
import { useFetchPartsQuery, useDeletePartTaskMutation } from '../../../../../store/api/business/part-master/part.api';
import { FullScreenFormSavingOverlay } from '../../../../../components/common/FullScreenFormSavingOverlay';
import {
	type DeletePartRequest,
	type PartMaster,
	type RawMaterial,
	type Drilling,
	type Cutting,
	type Mould
} from '../../../../../store/api/business/part-master/part.validators';
import { useCurrentRole } from '../../../../../hooks/useCurrentRole';

const SEARCH_PLACEHOLDER = 'Part number, SAP, drawing, description, or customer';

interface PartRow extends PartData {
	mouldCodes: string[];
	variantId: string;
}

function getMouldSummaryFromDetails(mouldDetails: Mould[] | undefined) {
	const list = mouldDetails ?? [];
	const totalMoulds = list.length;
	const dueMoulds = list.filter(
		m =>
			Number(m.reconciliationCount ?? 0) > 0 &&
			Number(m.currentCount ?? 0) >= Number(m.reconciliationCount)
	).length;
	return { totalMoulds, dueMoulds };
}

function partCustomerLabel(p: PartRow): string {
	const name = (p.customerName ?? '').trim();
	if (name) return name;
	return (p.customer ?? '').trim();
}

const ListPart = () => {
	const navigate = useNavigate();
	const { hasPermission } = useCurrentRole();
	const canCreate = hasPermission('PART_MASTER_CREATE');
	const { searchTerm, filters, pagination, setSearchTerm, setFilters, setPagination } = useListView('part');
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [partToDelete, setPartToDelete] = useState<PartRow | null>(null);

	const { data: partData, isLoading: isPartDataLoading, refetch: refetchParts } = useFetchPartsQuery();

	const [deletePartTask, { isLoading: isDeleting }] = useDeletePartTaskMutation();

	const allPartData: PartRow[] = useMemo(() => {
		if (!partData) return [];
		return partData.detail
			.filter((item: { partMaster: PartMaster }) => item.partMaster.id !== undefined)
			.map(
				(item: {
					partMaster: PartMaster;
					rawMaterials: RawMaterial[];
					drilling: Drilling[];
					cutting: Cutting[];
				}) => {
					const mouldSummary = getMouldSummaryFromDetails(item.partMaster.mouldDetails);
					const mouldCodes = (item.partMaster.mouldDetails ?? [])
						.map(m => (m.mouldCode ?? '').trim())
						.filter(c => c.length > 0);
					return {
						id: item.partMaster.id!,
						partNumber: item.partMaster.partNumber,
						drawingNumber: item.partMaster.drawingNumber,
						sqM: item.partMaster.sqM ?? null,
						status: item.partMaster.status ?? 'NEW',
						customer: item.partMaster.customer,
						customerName: item.partMaster.customerName || '',
						description: item.partMaster.description,
						sapReferenceNumber: item.partMaster.sapReferenceNumber ?? undefined,
						layupType: item.partMaster.layupType ?? '',
						model: item.partMaster.model ?? '',
						version: item.partMaster.version ?? 1,
						totalRawMaterials: item.rawMaterials.length,
						totalDrilling: item.drilling.length,
						totalCutting: item.cutting.length,
						totalMoulds: mouldSummary.totalMoulds,
						dueMoulds: mouldSummary.dueMoulds,
						createdAt: item.partMaster.createdAt || '',
						updatedAt: item.partMaster.updatedAt || '',
						mouldCodes,
						variantId: item.partMaster.customerVariantName != null ? String(item.partMaster.customerVariantName) : ''
					};
				}
			);
	}, [partData]);

	const fields = useMemo<FilterFieldConfig[]>(
		() => [
			{
				kind: 'autocomplete',
				key: 'sapReferenceNumber',
				label: 'SAP Number',
				options: deriveOptions(allPartData, r => r.sapReferenceNumber)
			},
			{
				kind: 'autocomplete',
				key: 'partNumber',
				label: 'Part Number',
				options: deriveOptions(allPartData, r => r.partNumber)
			},
			{
				kind: 'autocomplete',
				key: 'description',
				label: 'Part Description',
				options: deriveOptions(allPartData, r => r.description)
			},
			{
				kind: 'autocomplete',
				key: 'customerName',
				label: 'Customer Name',
				options: deriveOptions(allPartData, partCustomerLabel)
			},
			{
				kind: 'autocomplete',
				key: 'variantId',
				label: 'Variant',
				options: deriveOptions(allPartData, r => r.variantId)
			},
			{
				kind: 'autocomplete',
				key: 'mouldCodes',
				label: 'Moulds',
				options: deriveOptions(
					allPartData.flatMap(r => r.mouldCodes.map(code => ({ code }))),
					r => r.code
				)
			},
			{
				kind: 'autocomplete',
				key: 'status',
				label: 'Status',
				options: ['ACTIVE', 'NEW', 'INACTIVE']
			}
		],
		[allPartData]
	);

	const filteredData = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();
		const mouldFilter = filters.mouldCodes;
		return allPartData.filter(p => {
			if (!matchesMulti(p.sapReferenceNumber, filters.sapReferenceNumber)) return false;
			if (!matchesMulti(p.partNumber, filters.partNumber)) return false;
			if (!matchesMulti(p.description, filters.description)) return false;
			if (!matchesMulti(partCustomerLabel(p), filters.customerName)) return false;
			if (!matchesMulti(p.variantId, filters.variantId)) return false;
			if (!matchesMulti(p.status, filters.status)) return false;
			if (!isFilterValueEmpty(mouldFilter)) {
				const selected = isStringArrayValue(mouldFilter) ? mouldFilter : [];
				if (selected.length > 0 && !p.mouldCodes.some(c => selected.includes(c))) return false;
			}
			if (!term) return true;
			const sap = (p.sapReferenceNumber ?? '').toLowerCase();
			const layup = (p.layupType ?? '').toLowerCase();
			const model = (p.model ?? '').toLowerCase();
			return (
				(p.partNumber ?? '').toLowerCase().includes(term) ||
				(p.drawingNumber ?? '').toLowerCase().includes(term) ||
				(p.description ?? '').toLowerCase().includes(term) ||
				(p.customerName ?? '').toLowerCase().includes(term) ||
				(p.customer ?? '').toLowerCase().includes(term) ||
				sap.includes(term) ||
				layup.includes(term) ||
				model.includes(term)
			);
		});
	}, [allPartData, filters, searchTerm]);

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

	const handleActionClick = (partId: string, action: string) => {
		if (action === 'delete') {
			const part = allPartData.find(p => p.partNumber === partId);
			if (part) {
				setPartToDelete(part);
				setDeleteDialogOpen(true);
			}
		}
	};

	const handleDeleteConfirm = async () => {
		if (!partToDelete) return;

		try {
			const fullPartDetail = partData?.detail.find(item => item.partMaster.id === partToDelete.id);

			if (fullPartDetail) {
				const deleteRequest: DeletePartRequest = {
					partMaster: {
						id: fullPartDetail.partMaster.id,
						partNumber: fullPartDetail.partMaster.partNumber,
						drawingNumber: fullPartDetail.partMaster.drawingNumber,
						drawingRevision: fullPartDetail.partMaster.drawingRevision,
						partRevision: fullPartDetail.partMaster.partRevision,
						sqM: fullPartDetail.partMaster.sqM ?? null,
						status: fullPartDetail.partMaster.status,
						customer: fullPartDetail.partMaster.customer,
						description: fullPartDetail.partMaster.description,
						notes: fullPartDetail.partMaster.notes || '',
						layupType: fullPartDetail.partMaster.layupType || '',
						model: fullPartDetail.partMaster.model || '',
						version: fullPartDetail.partMaster.version,
						isLatest: fullPartDetail.partMaster.isLatest,
						catalyst: fullPartDetail.partMaster.catalyst,
						prcTemplate: fullPartDetail.partMaster.prcTemplate,
						mouldDetails: fullPartDetail.partMaster.mouldDetails ?? [],
						sapReferenceNumber: fullPartDetail.partMaster.sapReferenceNumber ?? ''
					},
					rawMaterials: fullPartDetail.rawMaterials.map(rm => ({
						materialName: rm.materialName,
						materialCode: rm.materialCode,
						materialGroup: rm.materialGroup ?? '',
						quantity: rm.quantity,
						uom: rm.uom,
						version: rm.version,
						isLatest: rm.isLatest,
						batching: rm.batching || false,
						splitting: rm.splitting || false,
						splittingConfiguration: rm.splittingConfiguration || null
					})),
					drilling: fullPartDetail.drilling.map(d => ({
						characteristics: d.characteristics,
						specification: d.specification,
						noOfHoles: d.noOfHoles,
						diaOfHoles: d.diaOfHoles,
						tolerance: d.tolerance,
						version: d.version,
						isLatest: d.isLatest
					})),
					cutting: fullPartDetail.cutting.map(c => ({
						characteristics: c.characteristics,
						specification: c.specification,
						tolerance: c.tolerance,
						version: c.version,
						isLatest: c.isLatest
					}))
				};

				await deletePartTask(deleteRequest).unwrap();
				await refetchParts();

				setDeleteDialogOpen(false);
				setPartToDelete(null);
			}
		} catch (error) {
			console.error('Failed to delete part task:', error);
		}
	};

	const handleDeleteCancel = () => {
		setDeleteDialogOpen(false);
		setPartToDelete(null);
	};

	const handleEdit = (partId: number) => {
		navigate(`/part-master/edit-part/${partId}`);
	};

	const handleView = (partId: number) => {
		navigate(`/part-master/view-part/${partId}`);
	};

	if (isPartDataLoading) {
		return (
			<Box sx={{ minWidth: 0 }}>
				<PartHeader />
				<CatalystTableSkeleton />
			</Box>
		);
	}

	return (
		<>
			<MasterListLandingPage
				header={
					<PartHeader
						action={
							canCreate ? (
								<ToolbarAddButton label="Add Part" onClick={() => navigate('/part-master/create-part')} />
							) : null
						}
					/>
				}
				toolbar={
					<InlineFilterBar
						title="Filter"
						searchPlaceholder={SEARCH_PLACEHOLDER}
						searchTerm={searchTerm}
						fields={fields}
						values={filters}
						onSearchChange={handleSearchChange}
						onApply={({ values }) => handleFiltersChange(values)}
						onReset={() => {
							setSearchTerm('');
							setFilters({});
							setPagination(prev => ({ ...prev, pageIndex: 0 }));
						}}
					/>
				}
				table={
					<Box sx={masterListTableFrame}>
						<PartTable
							data={filteredData}
							onActionClick={handleActionClick}
							onEdit={handleEdit}
							onView={handleView}
							pagination={pagination}
							onPaginationChange={setPagination}
						/>
					</Box>
				}
			/>

			<Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
				<DialogTitle>Delete Part</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to delete the part <strong>{partToDelete?.partNumber}</strong>? This will set the
						status to INACTIVE and preserve all remaining data.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleDeleteCancel} disabled={isDeleting}>
						Cancel
					</Button>
					<Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={isDeleting}>
						Delete Part
					</Button>
				</DialogActions>
			</Dialog>
			<FullScreenFormSavingOverlay open={isDeleting} message="Deleting…" />
		</>
	);
};

export default ListPart;
