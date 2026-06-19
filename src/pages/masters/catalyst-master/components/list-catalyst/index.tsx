import { useState, useMemo, useCallback } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
	deriveOptions,
	MasterFilterToolbar,
	MasterListLandingPage,
	masterListTableFrame,
	matchesDateRange,
	matchesMulti,
	ToolbarAddButton,
	type FilterFieldConfig,
	type FilterValue
} from '../../../../../components/masters';
import { useListView } from '../../../../../hooks/useListView';
import CatalystHeader from './components/CatalystHeader';
import CatalystTable, { CatalystData } from './components/CatalystTable';
import CatalystTableSkeleton from '../../../../../components/common/skeleton/CatalystTableSkeleton';
import {
	useFetchCatalystChartsQuery,
	useDeleteCatalystTaskMutation
} from '../../../../../store/api/business/catalyst-master/catalyst.api';
import { FullScreenFormSavingOverlay } from '../../../../../components/common/FullScreenFormSavingOverlay';
import { type DeleteCatalystTaskRequest } from '../../../../../store/api/business/catalyst-master/catalyst.validators';
import { useCurrentRole } from '../../../../../hooks/useCurrentRole';

const SEARCH_PLACEHOLDER = 'Chart ID, customer name, or notes';

const ListCatalyst = () => {
	const navigate = useNavigate();
	const { hasPermission } = useCurrentRole();
	const canCreate = hasPermission('CATALYST_MASTER_CREATE');
	const { searchTerm, filters, pagination, setSearchTerm, setFilters, setPagination } = useListView('catalyst');
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [catalystToDelete, setCatalystToDelete] = useState<CatalystData | null>(null);

	const {
		data: catalystChartData,
		isLoading: isCatalystDataLoading,
		refetch: refetchCatalystCharts
	} = useFetchCatalystChartsQuery();

	const [deleteCatalystTask, { isLoading: isDeleting }] = useDeleteCatalystTaskMutation();

	const allCatalystData: CatalystData[] = useMemo(() => {
		if (!catalystChartData) return [];
		return catalystChartData.detail.map((item: { catalyst: CatalystData }) => item.catalyst);
	}, [catalystChartData]);

	const fields = useMemo<FilterFieldConfig[]>(
		() => [
			{
				kind: 'autocomplete',
				key: 'chartId',
				label: 'Chart ID',
				options: deriveOptions(allCatalystData, r => r.chartId)
			},
			{
				kind: 'autocomplete',
				key: 'customerName',
				label: 'Customer Name',
				options: deriveOptions(allCatalystData, r => r.chartSupplier)
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
		[allCatalystData]
	);

	const filteredData = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();
		return allCatalystData.filter(c => {
			if (!matchesMulti(c.chartId, filters.chartId)) return false;
			if (!matchesMulti(c.chartSupplier, filters.customerName)) return false;
			if (!matchesDateRange(c.createdAt, filters.createdAt)) return false;
			if (!matchesMulti(c.status, filters.status)) return false;
			if (!term) return true;
			return (
				c.chartId.toLowerCase().includes(term) ||
				c.chartSupplier.toLowerCase().includes(term) ||
				c.notes.toLowerCase().includes(term)
			);
		});
	}, [allCatalystData, filters, searchTerm]);

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

	const handleActionClick = (chartId: string, action: string) => {
		if (action === 'delete') {
			const catalyst = allCatalystData.find(c => c.chartId === chartId);
			if (catalyst) {
				setCatalystToDelete(catalyst);
				setDeleteDialogOpen(true);
			}
		}
	};

	const handleDeleteConfirm = async () => {
		if (!catalystToDelete) return;

		try {
			const fullCatalystDetail = catalystChartData?.detail.find(item => item.catalyst.id === catalystToDelete.id);

			if (fullCatalystDetail) {
				const deleteRequest: DeleteCatalystTaskRequest = {
					catalyst: {
						id: catalystToDelete.id,
						version: fullCatalystDetail.catalyst.version,
						status: 'INACTIVE',
						chartId: fullCatalystDetail.catalyst.chartId,
						chartSupplier: fullCatalystDetail.catalyst.chartSupplier,
						notes: fullCatalystDetail.catalyst.notes,
						isActive: fullCatalystDetail.catalyst.isActive
					},
					catalystConfiguration: fullCatalystDetail.catalystConfiguration.map(config => ({
						minTemperature: parseFloat(config.minTemperature),
						maxTemperature: parseFloat(config.maxTemperature),
						minHumidity: parseFloat(config.minHumidity),
						maxHumidity: parseFloat(config.maxHumidity),
						minGelcoat: parseFloat(config.minGelcoat),
						maxGelcoat: parseFloat(config.maxGelcoat),
						gelcoatLabel: config.gelcoatLabel,
						minResinDosage: parseFloat(config.minResinDosage),
						maxResinDosage: parseFloat(config.maxResinDosage),
						resinLabel: config.resinLabel,
						minTopCoat: config.minTopCoat ? parseFloat(config.minTopCoat) : 0,
						maxTopCoat: config.maxTopCoat ? parseFloat(config.maxTopCoat) : 0,
						topCoatLabel: config.topCoatLabel || '',
						blockCatalystMixing: config.blockCatalystMixing,
						requestSupervisorApproval: config.requestSupervisorApproval
					}))
				};

				await deleteCatalystTask(deleteRequest).unwrap();
				await refetchCatalystCharts();

				setDeleteDialogOpen(false);
				setCatalystToDelete(null);
			}
		} catch (error) {
			console.error('Failed to delete catalyst task:', error);
		}
	};

	const handleDeleteCancel = () => {
		setDeleteDialogOpen(false);
		setCatalystToDelete(null);
	};

	const handleEdit = (catalystId: number) => {
		navigate(`/catalyst-master/edit-catalyst/${catalystId}`);
	};

	const handleView = (catalystId: number) => {
		navigate(`/catalyst-master/view-catalyst/${catalystId}`);
	};

	if (isCatalystDataLoading) {
		return (
			<Box sx={{ minWidth: 0 }}>
				<CatalystHeader />
				<CatalystTableSkeleton />
			</Box>
		);
	}

	return (
		<>
			<MasterListLandingPage
				header={<CatalystHeader />}
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
							canCreate ? (
								<ToolbarAddButton label="Add Chart" onClick={() => navigate('/catalyst-master/create-catalyst')} />
							) : null
						}
					/>
				}
				table={
					<Box sx={masterListTableFrame}>
						<CatalystTable
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
				<DialogTitle>Delete Catalyst Task</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to delete the catalyst task for <strong>{catalystToDelete?.chartId}</strong>? This
						will set the status to INACTIVE and preserve all remaining data.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleDeleteCancel} disabled={isDeleting}>
						Cancel
					</Button>
					<Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={isDeleting}>
						Delete Task
					</Button>
				</DialogActions>
			</Dialog>
			<FullScreenFormSavingOverlay open={isDeleting} message="Deleting…" />
		</>
	);
};

export default ListCatalyst;
