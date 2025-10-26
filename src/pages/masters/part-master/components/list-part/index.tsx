import { useState, useMemo } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PartHeader from './components/PartHeader';
import SummaryCards from './components/SummaryCards';
import PartManagement from './components/PartManagement';
import PartTable, { PartData } from './components/PartTable';
import CatalystTableSkeleton from '../../../../../components/common/skeleton/CatalystTableSkeleton';
import { useFetchPartsQuery, useDeletePartTaskMutation } from '../../../../../store/api/business/part-master/part.api';
import {
	type DeletePartRequest,
	type PartMaster,
	type RawMaterial,
	type Drilling,
	type Cutting
} from '../../../../../store/api/business/part-master/part.validators';

const ListPart = () => {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState('');
	const [activeFilter, setActiveFilter] = useState('All Parts');
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
			.filter(
				(item: {
					partMaster: PartMaster;
					rawMaterials: RawMaterial[];
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					bom?: any[]; // BOM might still be in API response but we ignore it
					drilling: Drilling[];
					cutting: Cutting[];
				}) => item.partMaster.id !== undefined
			)
			.map(
				(item: {
					partMaster: PartMaster;
					rawMaterials: RawMaterial[];
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					bom?: any[]; // BOM might still be in API response but we ignore it
					drilling: Drilling[];
					cutting: Cutting[];
				}) => ({
					id: item.partMaster.id!,
					partNumber: item.partMaster.partNumber,
					drawingNumber: item.partMaster.drawingNumber,
					status: item.partMaster.status,
					customer: item.partMaster.customer,
					customerName: item.partMaster.customerName || '',
					description: item.partMaster.description,
					version: item.partMaster.version,
					totalRawMaterials: item.rawMaterials.length,
					totalDrilling: item.drilling.length,
					totalCutting: item.cutting.length,
					createdAt: item.partMaster.createdAt || '',
					updatedAt: item.partMaster.updatedAt || ''
				})
			);
	}, [partData]);

	// Filter and search logic
	const filteredData = useMemo(() => {
		let filtered = allPartData;

		// Apply status filter
		if (activeFilter !== 'All Parts') {
			filtered = filtered.filter(part => part.status === activeFilter);
		}

		// Apply search filter
		if (searchTerm) {
			filtered = filtered.filter(
				part =>
					part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
					part.drawingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
					part.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
					part.customerName.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		return filtered;
	}, [allPartData, activeFilter, searchTerm]);

	const handleSearchChange = (searchValue: string) => {
		setSearchTerm(searchValue);
	};

	const handleFilterChange = (filter: string) => {
		setActiveFilter(filter);
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
						prcTemplate: fullPartDetail.partMaster.prcTemplate
					},
					rawMaterials: fullPartDetail.rawMaterials.map(rm => ({
						materialName: rm.materialName,
						materialCode: rm.materialCode,
						quantity: rm.quantity,
						uom: rm.uom,
						version: rm.version,
						isLatest: rm.isLatest,
						batching: rm.batching || false,
						splitting: rm.splitting || false,
						splittingConfiguration: rm.splittingConfiguration || null
					})),
					bom: [], // BOM is no longer used
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
			<Box sx={{ p: 3, minHeight: '100vh' }}>
				<PartHeader />
				<CatalystTableSkeleton />
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3, minHeight: '100vh' }}>
			<PartHeader />
			{partData && <SummaryCards headerData={partData.header} />}
			<PartManagement onSearchChange={handleSearchChange} onFilterChange={handleFilterChange} />
			<Box
				sx={{
					backgroundColor: 'white',
					borderRadius: '12px',
					boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
					overflow: 'hidden'
				}}
			>
				<PartTable data={filteredData} onActionClick={handleActionClick} onEdit={handleEdit} onView={handleView} />
			</Box>

			{/* Delete Confirmation Dialog */}
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
		</Box>
	);
};

export default ListPart;
