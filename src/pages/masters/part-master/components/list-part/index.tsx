import { useState, useMemo } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatFilteredListSummary, MasterListLandingPage, masterListTableFrame } from '../../../../../components/masters';
import PartHeader from './components/PartHeader';
import SummaryCards from './components/SummaryCards';
import PartManagement, { PART_ALL_CUSTOMERS } from './components/PartManagement';
import PartTable, { PartData } from './components/PartTable';
import CatalystTableSkeleton from '../../../../../components/common/skeleton/CatalystTableSkeleton';
import { useFetchPartsQuery, useDeletePartTaskMutation } from '../../../../../store/api/business/part-master/part.api';
import {
	type DeletePartRequest,
	type PartMaster,
	type RawMaterial,
	type Drilling,
	type Cutting,
	type Mould
} from '../../../../../store/api/business/part-master/part.validators';

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

function partCustomerLabel(p: PartData): string {
	const name = (p.customerName ?? '').trim();
	if (name) return name;
	return (p.customer ?? '').trim();
}

const ListPart = () => {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState('');
	const [activeFilter, setActiveFilter] = useState('All Parts');
	const [activeLayupFilter, setActiveLayupFilter] = useState('All layup types');
	const [activeModelFilter, setActiveModelFilter] = useState('All models');
	const [activeCustomerFilter, setActiveCustomerFilter] = useState(PART_ALL_CUSTOMERS);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [partToDelete, setPartToDelete] = useState<PartData | null>(null);

	// Fetch all parts using the API
	const { data: partData, isLoading: isPartDataLoading, refetch: refetchParts } = useFetchPartsQuery();

	// Delete task mutation
	const [deletePartTask, { isLoading: isDeleting }] = useDeletePartTaskMutation();

	// Extract part data for table
	const allPartData: PartData[] = useMemo(() => {
		if (!partData) return [];
		return partData.detail
			.filter((item: { partMaster: PartMaster }) => item.partMaster.id !== undefined)
			.map((item: { partMaster: PartMaster; rawMaterials: RawMaterial[]; drilling: Drilling[]; cutting: Cutting[] }) => {
				const mouldSummary = getMouldSummaryFromDetails(item.partMaster.mouldDetails);
				return {
					id: item.partMaster.id!,
					partNumber: item.partMaster.partNumber,
					drawingNumber: item.partMaster.drawingNumber,
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
					updatedAt: item.partMaster.updatedAt || ''
				};
			});
	}, [partData]);

	const layupOptions = useMemo(() => {
		const s = new Set<string>();
		for (const p of allPartData) {
			const v = (p.layupType ?? '').trim();
			if (v) s.add(v);
		}
		return [...s].sort((a, b) => a.localeCompare(b));
	}, [allPartData]);

	const modelOptions = useMemo(() => {
		const s = new Set<string>();
		for (const p of allPartData) {
			const v = (p.model ?? '').trim();
			if (v) s.add(v);
		}
		return [...s].sort((a, b) => a.localeCompare(b));
	}, [allPartData]);

	const customerOptions = useMemo(() => {
		const s = new Set<string>();
		for (const p of allPartData) {
			const label = partCustomerLabel(p);
			if (label) s.add(label);
		}
		return [...s].sort((a, b) => a.localeCompare(b));
	}, [allPartData]);

	// Filter and search logic
	const filteredData = useMemo(() => {
		let filtered = allPartData;

		if (activeLayupFilter !== 'All layup types') {
			filtered = filtered.filter(p => (p.layupType ?? '').trim() === activeLayupFilter);
		}
		if (activeModelFilter !== 'All models') {
			filtered = filtered.filter(p => (p.model ?? '').trim() === activeModelFilter);
		}

		if (activeCustomerFilter !== PART_ALL_CUSTOMERS) {
			filtered = filtered.filter(p => partCustomerLabel(p) === activeCustomerFilter);
		}

		// Apply status filter
		if (activeFilter !== 'All Parts') {
			filtered = filtered.filter(part => part.status === activeFilter);
		}

		// Apply search filter
		if (searchTerm) {
			const t = searchTerm.toLowerCase();
			filtered = filtered.filter(part => {
				const sap = (part.sapReferenceNumber ?? '').toLowerCase();
				const layup = (part.layupType ?? '').toLowerCase();
				const model = (part.model ?? '').toLowerCase();
				return (
					part.partNumber.toLowerCase().includes(t) ||
					part.drawingNumber.toLowerCase().includes(t) ||
					part.description.toLowerCase().includes(t) ||
					part.customerName.toLowerCase().includes(t) ||
					part.customer.toLowerCase().includes(t) ||
					sap.includes(t) ||
					layup.includes(t) ||
					model.includes(t)
				);
			});
		}

		return filtered;
	}, [allPartData, activeFilter, searchTerm, activeLayupFilter, activeModelFilter, activeCustomerFilter]);

	const listSummary = useMemo(
		() => formatFilteredListSummary(filteredData.length, allPartData.length, 'parts'),
		[filteredData.length, allPartData.length]
	);

	const handleSearchChange = (searchValue: string) => {
		setSearchTerm(searchValue);
	};

	const handleFilterChange = (filter: string) => {
		setActiveFilter(filter);
	};

	const handleLayupFilterChange = (value: string) => {
		setActiveLayupFilter(value);
	};

	const handleModelFilterChange = (value: string) => {
		setActiveModelFilter(value);
	};

	const handleCustomerFilterChange = (value: string) => {
		setActiveCustomerFilter(value);
	};

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
			// Find the full part data from the existing data
			const fullPartDetail = partData?.detail.find(item => item.partMaster.id === partToDelete.id);

			if (fullPartDetail) {
				const deleteRequest: DeletePartRequest = {
					partMaster: {
						id: fullPartDetail.partMaster.id,
						partNumber: fullPartDetail.partMaster.partNumber,
						drawingNumber: fullPartDetail.partMaster.drawingNumber,
						drawingRevision: fullPartDetail.partMaster.drawingRevision,
						partRevision: fullPartDetail.partMaster.partRevision,
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

				// Manually refetch the data to ensure it's updated
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

	// Show loading state with skeleton
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
				header={<PartHeader />}
				metrics={partData ? <SummaryCards headerData={partData.header} /> : null}
				toolbar={
					<PartManagement
						appliedSearchTerm={searchTerm}
						searchAriaLabel="Search parts"
						listSummary={listSummary}
						onSearchChange={handleSearchChange}
						onFilterChange={handleFilterChange}
						onLayupFilterChange={handleLayupFilterChange}
						onModelFilterChange={handleModelFilterChange}
						onCustomerFilterChange={handleCustomerFilterChange}
						layupOptions={layupOptions}
						modelOptions={modelOptions}
						customerOptions={customerOptions}
					/>
				}
				table={
					<Box sx={masterListTableFrame}>
						<PartTable data={filteredData} onActionClick={handleActionClick} onEdit={handleEdit} onView={handleView} />
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
						{isDeleting ? 'Deleting...' : 'Delete Part'}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default ListPart;
