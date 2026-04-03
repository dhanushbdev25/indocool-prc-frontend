import { useState } from 'react';
import {
	Box,
	Typography,
	Button,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Chip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	IconButton,
	Grid,
	Tabs,
	Tab
} from '@mui/material';
import {
	ExpandMore as ExpandMoreIcon,
	Add as AddIcon,
	Close as CloseIcon,
	Delete as DeleteIcon
} from '@mui/icons-material';
import { Control } from 'react-hook-form';
import { PartMasterFormData } from '../schemas';
import {
	OperationGroup as OperationGroupType,
	ExtendedPrcTemplateStep,
	StepSelectableItem,
	SequenceItem,
	InspectionItem,
	isSequenceItem
} from '../types';
import StepSelectionCard from './StepSelectionCard';
import SelectedStepItem from './SelectedStepItem';
import { ImageItem } from '../../../../../../hooks/useImageGallery';

interface OperationGroupProps {
	group: OperationGroupType;
	steps: ExtendedPrcTemplateStep[];
	allStepFields: ExtendedPrcTemplateStep[];
	sequenceItems: SequenceItem[];
	inspectionItems: InspectionItem[];
	isLoading: boolean;
	onAddStep: (item: StepSelectableItem, group: string) => void;
	onRemoveStep: (index: number) => void;
	onReorderStep: (fromIndex: number, toIndex: number) => void;
	onRemoveGroup: (groupId: string) => void;
	control: Control<PartMasterFormData>;
	stepGalleries: Record<string, ImageItem[]>;
	onAddStepImage: (stepKey: string, file: File) => void;
	onRemoveStepImage: (stepKey: string, id: number | string) => void;
}

const OperationGroupComponent = ({
	group,
	steps,
	allStepFields,
	sequenceItems,
	inspectionItems,
	isLoading,
	onAddStep,
	onRemoveStep,
	onReorderStep,
	onRemoveGroup,
	control,
	stepGalleries,
	onAddStepImage,
	onRemoveStepImage
}: OperationGroupProps) => {
	const [modalOpen, setModalOpen] = useState(false);
	const [activeTab, setActiveTab] = useState(0);

	const handleOpenModal = (type: 'sequence' | 'inspection') => {
		setActiveTab(type === 'sequence' ? 0 : 1);
		setModalOpen(true);
	};

	const isItemSelected = (item: StepSelectableItem) => {
		return allStepFields.some(
			step =>
				step.stepId === item.id &&
				step.itemType === (isSequenceItem(item) ? 'sequence' : 'inspection') &&
				step.group === group.id
		);
	};

	const handleItemClick = (item: StepSelectableItem) => {
		if (isItemSelected(item)) {
			const globalIndex = allStepFields.findIndex(
				step =>
					step.stepId === item.id &&
					step.itemType === (isSequenceItem(item) ? 'sequence' : 'inspection') &&
					step.group === group.id
			);
			if (globalIndex !== -1) {
				onRemoveStep(globalIndex);
			}
		} else {
			onAddStep(item, group.id);
		}
	};

	const currentTabItems: StepSelectableItem[] = activeTab === 0 ? sequenceItems : inspectionItems;

	return (
		<Accordion defaultExpanded sx={{ border: '1px solid #e0e0e0', borderRadius: '8px !important', mb: 2, '&:before': { display: 'none' } }}>
			<AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
					<Typography variant="h6" sx={{ fontWeight: 600, color: '#333', flex: 1 }}>
						{group.label}
					</Typography>
					<Chip label={`${steps.length} steps`} size="small" color="primary" variant="outlined" />
					<IconButton
						size="small"
						onClick={e => {
							e.stopPropagation();
							onRemoveGroup(group.id);
						}}
						sx={{ color: '#f44336', '&:hover': { backgroundColor: '#ffebee' } }}
					>
						<DeleteIcon fontSize="small" />
					</IconButton>
				</Box>
			</AccordionSummary>
			<AccordionDetails sx={{ p: 3 }}>
				<Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
					<Button
						variant="outlined"
						startIcon={<AddIcon />}
						onClick={() => handleOpenModal('sequence')}
						sx={{
							textTransform: 'none',
							borderColor: '#1976d2',
							color: '#1976d2',
							'&:hover': { borderColor: '#1565c0', backgroundColor: 'rgba(25, 118, 210, 0.04)' }
						}}
					>
						Add Sequence ({sequenceItems.length})
					</Button>
					<Button
						variant="outlined"
						startIcon={<AddIcon />}
						onClick={() => handleOpenModal('inspection')}
						sx={{
							textTransform: 'none',
							borderColor: '#4caf50',
							color: '#4caf50',
							'&:hover': { borderColor: '#388e3c', backgroundColor: 'rgba(76, 175, 80, 0.04)' }
						}}
					>
						Add Inspection ({inspectionItems.length})
					</Button>
				</Box>

				{steps.length > 0 ? (
					<Box>
						{steps.map(step => {
							const globalIndex = allStepFields.findIndex(
								s => s.stepId === step.stepId && s.itemType === step.itemType && s.group === step.group
							);
							const stepKey = `${step.group}-${step.itemType}-${step.stepId}`;
							return (
								<SelectedStepItem
									key={stepKey}
									step={step}
									index={globalIndex}
									totalSteps={allStepFields.length}
									onReorder={onReorderStep}
									onRemove={onRemoveStep}
									control={control}
									stepGallery={stepGalleries[stepKey] || []}
									onAddStepImage={(file: File) => onAddStepImage(stepKey, file)}
									onRemoveStepImage={(id: number | string) => onRemoveStepImage(stepKey, id)}
								/>
							);
						})}
					</Box>
				) : (
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							height: 80,
							border: '2px dashed #e0e0e0',
							borderRadius: 2,
							backgroundColor: '#fafafa'
						}}
					>
						<Typography color="textSecondary" textAlign="center" variant="body2">
							No steps added. Click "Add Sequence" or "Add Inspection" to add steps to this group.
						</Typography>
					</Box>
				)}
			</AccordionDetails>

			<Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
				<DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
					<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
						Add Steps to {group.label}
					</Typography>
					<IconButton onClick={() => setModalOpen(false)} size="small">
						<CloseIcon />
					</IconButton>
				</DialogTitle>

				<DialogContent sx={{ p: 0 }}>
					<Box sx={{ p: 2 }}>
						<Tabs
							value={activeTab}
							onChange={(_, newValue) => setActiveTab(newValue)}
							sx={{ mb: 2, borderBottom: '1px solid #e0e0e0' }}
						>
							<Tab label={`Sequences (${sequenceItems.length})`} sx={{ textTransform: 'none', fontWeight: 500 }} />
							<Tab label={`Inspections (${inspectionItems.length})`} sx={{ textTransform: 'none', fontWeight: 500 }} />
						</Tabs>

						{isLoading ? (
							<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
								<Typography color="textSecondary">Loading items...</Typography>
							</Box>
						) : currentTabItems.length === 0 ? (
							<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
								<Typography color="textSecondary">
									No {activeTab === 0 ? 'sequences' : 'inspections'} available
								</Typography>
							</Box>
						) : (
							<Grid container spacing={2} sx={{ maxHeight: 400, overflow: 'auto' }}>
								{currentTabItems.map(item => (
									<Grid size={{ xs: 12, sm: 6 }} key={item.id}>
										<StepSelectionCard item={item} onClick={handleItemClick} isSelected={isItemSelected(item)} />
									</Grid>
								))}
							</Grid>
						)}
					</Box>
				</DialogContent>

				<DialogActions sx={{ p: 2, pt: 1 }}>
					<Button onClick={() => setModalOpen(false)} variant="outlined">
						Done
					</Button>
				</DialogActions>
			</Dialog>
		</Accordion>
	);
};

export default OperationGroupComponent;
