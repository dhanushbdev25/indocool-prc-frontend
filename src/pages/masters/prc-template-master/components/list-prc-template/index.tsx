import { useState, useMemo } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatFilteredListSummary, MasterListLandingPage, masterListTableFrame } from '../../../../../components/masters';
import PrcTemplateHeader from './components/PrcTemplateHeader';
import SummaryCards from './components/SummaryCards';
import PrcTemplateManagement, { PRC_TEMPLATE_ALL_CATALOGUE } from './components/PrcTemplateManagement';
import PrcTemplateTable, { PrcTemplateData } from './components/PrcTemplateTable';
import CatalystTableSkeleton from '../../../../../components/common/skeleton/CatalystTableSkeleton';
import {
	useFetchPrcTemplatesQuery,
	useDeletePrcTemplateTaskMutation
} from '../../../../../store/api/business/prc-template/prc-template.api';
import {
	type DeletePrcTemplateTaskRequest,
	type PrcTemplate,
	type PrcTemplateStep
} from '../../../../../store/api/business/prc-template/prc-template.validators';

const ListPrcTemplate = () => {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState('');
	const [activeFilter, setActiveFilter] = useState('All Templates');
	const [catalogueFilter, setCatalogueFilter] = useState(PRC_TEMPLATE_ALL_CATALOGUE);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [templateToDelete, setTemplateToDelete] = useState<PrcTemplateData | null>(null);

	// Fetch all PRC templates using the API
	const {
		data: prcTemplateData,
		isLoading: isPrcTemplateDataLoading,
		refetch: refetchPrcTemplates
	} = useFetchPrcTemplatesQuery();

	// Delete task mutation
	const [deletePrcTemplateTask, { isLoading: isDeleting }] = useDeletePrcTemplateTaskMutation();

	// Extract template data for table
	const allTemplateData: PrcTemplateData[] = useMemo(() => {
		if (!prcTemplateData) return [];
		return prcTemplateData.detail
			.filter(
				(item: { prcTemplate: PrcTemplate; prcTemplateSteps: PrcTemplateStep[] }) => item.prcTemplate.id !== undefined
			)
			.map((item: { prcTemplate: PrcTemplate; prcTemplateSteps: PrcTemplateStep[] }) => ({
				id: item.prcTemplate.id!,
				templateId: item.prcTemplate.templateId,
				templateName: item.prcTemplate.templateName,
				status: item.prcTemplate.status,
				version: item.prcTemplate.version,
				totalSteps: item.prcTemplateSteps.length,
				notes: item.prcTemplate.notes,
				createdAt: item.prcTemplate.createdAt || '',
				updatedAt: item.prcTemplate.updatedAt || '',
				isActive: item.prcTemplate.isActive
			}));
	}, [prcTemplateData]);

	// Filter and search logic
	const filteredData = useMemo(() => {
		let filtered = allTemplateData;

		// Apply status filter
		if (activeFilter !== 'All Templates') {
			filtered = filtered.filter(template => template.status === activeFilter);
		}

		if (catalogueFilter === 'In catalogue') {
			filtered = filtered.filter(t => t.isActive);
		} else if (catalogueFilter === 'Out of catalogue') {
			filtered = filtered.filter(t => !t.isActive);
		}

		// Apply search filter
		if (searchTerm) {
			filtered = filtered.filter(
				template =>
					template.templateId.toLowerCase().includes(searchTerm.toLowerCase()) ||
					template.templateName.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		return filtered;
	}, [allTemplateData, activeFilter, catalogueFilter, searchTerm]);

	const listSummary = useMemo(
		() => formatFilteredListSummary(filteredData.length, allTemplateData.length, 'templates'),
		[filteredData.length, allTemplateData.length]
	);

	const handleSearchChange = (searchValue: string) => {
		setSearchTerm(searchValue);
	};

	const handleFilterChange = (filter: string) => {
		setActiveFilter(filter);
	};

	const handleCatalogueFilterChange = (value: string) => {
		setCatalogueFilter(value);
	};

	const handleActionClick = (templateId: string, action: string) => {
		if (action === 'delete') {
			const template = allTemplateData.find(t => t.templateId === templateId);
			if (template) {
				setTemplateToDelete(template);
				setDeleteDialogOpen(true);
			}
		}
	};

	const handleDeleteConfirm = async () => {
		if (!templateToDelete) return;

		try {
			// Find the full template data from the existing data
			const fullTemplateDetail = prcTemplateData?.detail.find(item => item.prcTemplate.id === templateToDelete.id);

			if (fullTemplateDetail) {
				const deleteRequest: DeletePrcTemplateTaskRequest = {
					prcTemplate: {
						id: fullTemplateDetail.prcTemplate.id!,
						status: fullTemplateDetail.prcTemplate.status,
						templateId: fullTemplateDetail.prcTemplate.templateId,
						templateName: fullTemplateDetail.prcTemplate.templateName,
						notes: fullTemplateDetail.prcTemplate.notes,
						version: fullTemplateDetail.prcTemplate.version,
						isLatest: fullTemplateDetail.prcTemplate.isLatest,
						isActive: fullTemplateDetail.prcTemplate.isActive
					},
					prcTemplateSteps: fullTemplateDetail.prcTemplateSteps.map(step => ({
						version: step.version,
						isLatest: step.isLatest,
						sequence: step.sequence,
						stepId: step.stepId || 0,
						type: step.type,
						blockCatalystMixing: step.blockCatalystMixing,
						requestSupervisorApproval: step.requestSupervisorApproval
					}))
				};

				await deletePrcTemplateTask(deleteRequest).unwrap();

				// Manually refetch the data to ensure it's updated
				await refetchPrcTemplates();

				setDeleteDialogOpen(false);
				setTemplateToDelete(null);
			}
		} catch (error) {
			console.error('Failed to delete PRC template task:', error);
		}
	};

	const handleDeleteCancel = () => {
		setDeleteDialogOpen(false);
		setTemplateToDelete(null);
	};

	const handleEdit = (templateId: number) => {
		navigate(`/prc-template-master/edit-prc-template/${templateId}`);
	};

	const handleView = (templateId: number) => {
		navigate(`/prc-template-master/view-prc-template/${templateId}`);
	};

	// Show loading state with skeleton
	if (isPrcTemplateDataLoading) {
		return (
			<Box sx={{ minWidth: 0 }}>
				<PrcTemplateHeader />
				<CatalystTableSkeleton />
			</Box>
		);
	}

	return (
		<>
			<MasterListLandingPage
				header={<PrcTemplateHeader />}
				metrics={prcTemplateData ? <SummaryCards headerData={prcTemplateData.header} /> : null}
				toolbar={
					<PrcTemplateManagement
						appliedSearchTerm={searchTerm}
						searchAriaLabel="Search templates"
						listSummary={listSummary}
						onSearchChange={handleSearchChange}
						onFilterChange={handleFilterChange}
						onCatalogueActiveFilterChange={handleCatalogueFilterChange}
					/>
				}
				table={
					<Box sx={masterListTableFrame}>
						<PrcTemplateTable data={filteredData} onActionClick={handleActionClick} onEdit={handleEdit} onView={handleView} />
					</Box>
				}
			/>

			<Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
				<DialogTitle>Delete PRC Template</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to delete the PRC template <strong>{templateToDelete?.templateId}</strong>? This will
						set the status to INACTIVE and preserve all remaining data.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleDeleteCancel} disabled={isDeleting}>
						Cancel
					</Button>
					<Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={isDeleting}>
						{isDeleting ? 'Deleting...' : 'Delete Template'}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default ListPrcTemplate;
