import { useState } from 'react';
import {
	Box,
	Paper,
	Typography,
	Button,
	Grid,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	IconButton,
	Alert,
	Tabs,
	Tab
} from '@mui/material';
import {
	Add as AddIcon,
	Close as CloseIcon,
	Science as CatalystIcon,
	Assignment as TemplateIcon
} from '@mui/icons-material';
import { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { PartMasterFormData } from '../schemas';
import { useFetchCatalystChartsQuery } from '../../../../../../store/api/business/catalyst-master/catalyst.api';
import { useFetchPrcTemplatesQuery } from '../../../../../../store/api/business/prc-template/prc-template.api';
import LinkedMasterCard from './LinkedMasterCard';
import { SelectableCatalyst, SelectablePrcTemplate, isCatalystItem, isPrcTemplateItem } from '../types';

interface LinkedMastersTabProps {
	control: Control<PartMasterFormData>;
	errors: FieldErrors<PartMasterFormData>;
	setValue: UseFormSetValue<PartMasterFormData>;
}

const LinkedMastersTab = ({ control, errors, setValue }: LinkedMastersTabProps) => {
	const [modalOpen, setModalOpen] = useState(false);
	const [modalType, setModalType] = useState<'catalyst' | 'prcTemplate'>('catalyst');
	const [activeTab, setActiveTab] = useState(0);

	// Fetch catalyst and PRC template data
	const { data: catalystData, isLoading: isCatalystLoading } = useFetchCatalystChartsQuery();
	const { data: prcTemplateData, isLoading: isPrcTemplateLoading } = useFetchPrcTemplatesQuery();

	// Get current selections from form
	const selectedCatalyst = control._formValues.catalyst;
	const selectedPrcTemplate = control._formValues.prcTemplate;

	// Transform data to selectable format
	const catalystItems: SelectableCatalyst[] = (catalystData?.detail || []).map(catalyst => ({
		id: catalyst.catalyst.id,
		chartId: catalyst.catalyst.chartId,
		chartSupplier: catalyst.catalyst.chartSupplier,
		status: catalyst.catalyst.status,
		version: catalyst.catalyst.version,
		isLatest: catalyst.catalyst.isLatest
	}));

	const prcTemplateItems: SelectablePrcTemplate[] = (prcTemplateData?.detail || []).map(template => ({
		id: template.prcTemplate.id!,
		templateId: template.prcTemplate.templateId,
		templateName: template.prcTemplate.templateName,
		status: template.prcTemplate.status,
		version: template.prcTemplate.version,
		isLatest: template.prcTemplate.isLatest
	}));

	const handleOpenModal = (type: 'catalyst' | 'prcTemplate') => {
		setModalType(type);
		setActiveTab(type === 'catalyst' ? 0 : 1);
		setModalOpen(true);
	};

	const handleCloseModal = () => {
		setModalOpen(false);
	};

	const handleItemClick = (item: SelectableCatalyst | SelectablePrcTemplate) => {
		if (isCatalystItem(item)) {
			setValue('catalyst', item.id);
		} else if (isPrcTemplateItem(item)) {
			setValue('prcTemplate', item.id);
		}
		handleCloseModal();
	};

	const handleRemoveSelection = (type: 'catalyst' | 'prcTemplate') => {
		if (type === 'catalyst') {
			setValue('catalyst', undefined);
		} else {
			setValue('prcTemplate', undefined);
		}
	};

	const getCurrentTabItems = () => {
		return activeTab === 0 ? catalystItems : prcTemplateItems;
	};

	const currentTabItems = getCurrentTabItems();

	// Find selected items for display
	const selectedCatalystItem = catalystItems.find(item => item.id === selectedCatalyst);
	const selectedPrcTemplateItem = prcTemplateItems.find(item => item.id === selectedPrcTemplate);

	return (
		<Box>
			<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
				<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
					Linked Masters
				</Typography>
			</Box>

			<Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				{(errors.catalyst || errors.prcTemplate) && (
					<Alert severity="error" sx={{ mb: 3 }}>
						{errors.catalyst?.message || errors.prcTemplate?.message}
					</Alert>
				)}

				<Grid container spacing={3}>
					{/* Catalyst Selection */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
							<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
								Catalyst Chart
							</Typography>
							<Button
								variant="outlined"
								startIcon={<AddIcon />}
								onClick={() => handleOpenModal('catalyst')}
								sx={{
									textTransform: 'none',
									borderColor: '#1976d2',
									color: '#1976d2',
									'&:hover': {
										borderColor: '#1565c0',
										backgroundColor: 'rgba(25, 118, 210, 0.04)'
									}
								}}
							>
								{selectedCatalystItem ? 'Change' : 'Select'} Catalyst
							</Button>
						</Box>

						{selectedCatalystItem ? (
							<Box sx={{ position: 'relative' }}>
								<LinkedMasterCard
									item={selectedCatalystItem}
									onClick={() => handleOpenModal('catalyst')}
									isSelected={true}
									onRemove={() => handleRemoveSelection('catalyst')}
								/>
							</Box>
						) : (
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
									height: 120,
									border: '2px dashed #e0e0e0',
									borderRadius: 2,
									backgroundColor: '#fafafa'
								}}
							>
								<Typography color="textSecondary" textAlign="center">
									No catalyst chart selected
									<br />
									<Button
										size="small"
										onClick={() => handleOpenModal('catalyst')}
										sx={{ textTransform: 'none', mt: 1 }}
									>
										Select Catalyst
									</Button>
								</Typography>
							</Box>
						)}
					</Grid>

					{/* PRC Template Selection */}
					<Grid size={{ xs: 12, md: 6 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
							<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
								PRC Template
							</Typography>
							<Button
								variant="outlined"
								startIcon={<AddIcon />}
								onClick={() => handleOpenModal('prcTemplate')}
								sx={{
									textTransform: 'none',
									borderColor: '#1976d2',
									color: '#1976d2',
									'&:hover': {
										borderColor: '#1565c0',
										backgroundColor: 'rgba(25, 118, 210, 0.04)'
									}
								}}
							>
								{selectedPrcTemplateItem ? 'Change' : 'Select'} Template
							</Button>
						</Box>

						{selectedPrcTemplateItem ? (
							<Box sx={{ position: 'relative' }}>
								<LinkedMasterCard
									item={selectedPrcTemplateItem}
									onClick={() => handleOpenModal('prcTemplate')}
									isSelected={true}
									onRemove={() => handleRemoveSelection('prcTemplate')}
								/>
							</Box>
						) : (
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
									height: 120,
									border: '2px dashed #e0e0e0',
									borderRadius: 2,
									backgroundColor: '#fafafa'
								}}
							>
								<Typography color="textSecondary" textAlign="center">
									No PRC template selected
									<br />
									<Button
										size="small"
										onClick={() => handleOpenModal('prcTemplate')}
										sx={{ textTransform: 'none', mt: 1 }}
									>
										Select Template
									</Button>
								</Typography>
							</Box>
						)}
					</Grid>
				</Grid>
			</Paper>

			{/* Selection Modal */}
			<Dialog
				open={modalOpen}
				onClose={handleCloseModal}
				maxWidth="md"
				fullWidth
				PaperProps={{
					sx: { borderRadius: 2 }
				}}
			>
				<DialogTitle
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						pb: 2
					}}
				>
					<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
						Select {modalType === 'catalyst' ? 'Catalyst Chart' : 'PRC Template'}
					</Typography>
					<IconButton onClick={handleCloseModal} size="small">
						<CloseIcon />
					</IconButton>
				</DialogTitle>

				<DialogContent sx={{ p: 0 }}>
					<Box sx={{ p: 2, mt: 1 }}>
						<Tabs
							value={activeTab}
							onChange={(_, newValue) => setActiveTab(newValue)}
							sx={{ mb: 2, borderBottom: '1px solid #e0e0e0' }}
						>
							<Tab
								label={`Catalyst Charts (${catalystItems.length})`}
								sx={{ textTransform: 'none', fontWeight: 500 }}
								icon={<CatalystIcon />}
								iconPosition="start"
							/>
							<Tab
								label={`PRC Templates (${prcTemplateItems.length})`}
								sx={{ textTransform: 'none', fontWeight: 500 }}
								icon={<TemplateIcon />}
								iconPosition="start"
							/>
						</Tabs>

						{isCatalystLoading || isPrcTemplateLoading ? (
							<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
								<Typography color="textSecondary">Loading items...</Typography>
							</Box>
						) : currentTabItems.length === 0 ? (
							<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
								<Typography color="textSecondary">
									No {activeTab === 0 ? 'catalyst charts' : 'PRC templates'} available
								</Typography>
							</Box>
						) : (
							<Grid container spacing={2} sx={{ maxHeight: 400, overflow: 'auto' }}>
								{currentTabItems.map(item => (
									<Grid size={{ xs: 12, sm: 6 }} key={item.id}>
										<LinkedMasterCard item={item} onClick={handleItemClick} isSelected={false} />
									</Grid>
								))}
							</Grid>
						)}
					</Box>
				</DialogContent>

				<DialogActions sx={{ p: 2, pt: 1 }}>
					<Button onClick={handleCloseModal} variant="outlined">
						Done
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default LinkedMastersTab;
