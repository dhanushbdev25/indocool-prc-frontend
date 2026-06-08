import { useState, useMemo, useCallback } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
	deriveOptions,
	MasterFilterToolbar,
	MasterListLandingPage,
	masterListTableFrame,
	matchesMulti,
	ToolbarAddButton,
	type FilterFieldConfig,
	type FilterValue
} from '../../../../../components/masters';
import { useListView } from '../../../../../hooks/useListView';
import PrcTemplateHeader from './components/PrcTemplateHeader';
import PrcTemplateTable, { PrcTemplateData } from './components/PrcTemplateTable';
import CatalystTableSkeleton from '../../../../../components/common/skeleton/CatalystTableSkeleton';
import {
	useFetchPrcTemplatesQuery,
	useDeletePrcTemplateTaskMutation
} from '../../../../../store/api/business/prc-template/prc-template.api';
import { FullScreenFormSavingOverlay } from '../../../../../components/common/FullScreenFormSavingOverlay';
import {
	type DeletePrcTemplateTaskRequest,
	type PrcTemplate,
	type PrcTemplateStep
} from '../../../../../store/api/business/prc-template/prc-template.validators';

const SEARCH_PLACEHOLDER = 'Template ID or name';

const ListPrcTemplate = () => {
	const navigate = useNavigate();
	const { searchTerm, filters, pagination, setSearchTerm, setFilters, setPagination } = useListView('prcTemplate');
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [templateToDelete, setTemplateToDelete] = useState<PrcTemplateData | null>(null);

	const {
		data: prcTemplateData,
		isLoading: isPrcTemplateDataLoading,
		refetch: refetchPrcTemplates
	} = useFetchPrcTemplatesQuery();

	const [deletePrcTemplateTask, { isLoading: isDeleting }] = useDeletePrcTemplateTaskMutation();

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

	const fields = useMemo<FilterFieldConfig[]>(
		() => [
			{
				kind: 'autocomplete',
				key: 'templateId',
				label: 'Template ID',
				options: deriveOptions(allTemplateData, r => r.templateId)
			},
			{
				kind: 'autocomplete',
				key: 'templateName',
				label: 'Template Name',
				options: deriveOptions(allTemplateData, r => r.templateName)
			},
			{
				kind: 'autocomplete',
				key: 'catalogue',
				label: 'Catalogue',
				options: ['In catalogue', 'Out of catalogue']
			},
			{
				kind: 'dateRange',
				key: 'createdAt',
				label: 'Created On'
			},
			{
				kind: 'autocomplete',
				key: 'status',
				label: 'Status',
				options: ['ACTIVE', 'NEW', 'INACTIVE']
			}
		],
		[allTemplateData]
	);

	const filteredData = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();
		return allTemplateData.filter(t => {
			if (!matchesMulti(t.templateId, filters.templateId)) return false;
			if (!matchesMulti(t.templateName, filters.templateName)) return false;
			if (!matchesMulti(t.status, filters.status)) return false;
			if (!matchesMulti(t.isActive ? 'In catalogue' : 'Out of catalogue', filters.catalogue)) return false;
			if (!term) return true;
			return t.templateId.toLowerCase().includes(term) || t.templateName.toLowerCase().includes(term);
		});
	}, [allTemplateData, filters, searchTerm]);

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
				toolbar={
					<MasterFilterToolbar
						title="Filter"
						searchPlaceholder={SEARCH_PLACEHOLDER}
						searchTerm={searchTerm}
						fields={fields}
						values={filters}
						onSearchChange={handleSearchChange}
						onFiltersChange={handleFiltersChange}
						actions={
							<ToolbarAddButton
								label="Add Template"
								onClick={() => navigate('/prc-template-master/create-prc-template')}
							/>
						}
					/>
				}
				table={
					<Box sx={masterListTableFrame}>
						<PrcTemplateTable
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
						Delete Template
					</Button>
				</DialogActions>
			</Dialog>
			<FullScreenFormSavingOverlay open={isDeleting} message="Deleting…" />
		</>
	);
};

export default ListPrcTemplate;
