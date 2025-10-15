import { useState } from 'react';
import {
	Box,
	Typography,
	Tabs,
	Tab,
	Grid,
	Paper,
	Alert,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	IconButton
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { useFieldArray, Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { useFetchProcessSequencesQuery } from '../../../../../../store/api/business/sequence-master/sequence.api';
import { useFetchInspectionsQuery } from '../../../../../../store/api/business/inspection-master/inspection.api';
import StepSelectionCard from './StepSelectionCard';
import SelectedStepItem from './SelectedStepItem';
import DefaultStepItem from './DefaultStepItem';
import { SelectableItem, ExtendedPrcTemplateStep, isSequenceItem, isInspectionItem } from '../types';
import { PrcTemplateFormData } from '../schemas';

interface PrcTemplateStepsExtendedProps {
	control: Control<PrcTemplateFormData>;
	errors: FieldErrors<PrcTemplateFormData>;
	setValue?: UseFormSetValue<PrcTemplateFormData>;
}

const PrcTemplateSteps = ({ control, errors, setValue }: PrcTemplateStepsExtendedProps) => {
	const [modalOpen, setModalOpen] = useState(false);
	const [modalType, setModalType] = useState<'sequence' | 'inspection'>('sequence');
	const [activeTab, setActiveTab] = useState(0);

	// Fetch sequences and inspections
	const { data: sequencesData, isLoading: isSequencesLoading } = useFetchProcessSequencesQuery();
	const { data: inspectionsData, isLoading: isInspectionsLoading } = useFetchInspectionsQuery();

	// Use field array for managing steps
	const { fields, append, remove, move } = useFieldArray({
		control,
		name: 'prcTemplateSteps'
	});

	// Get all selectable items
	const allItems: SelectableItem[] = [
		...(sequencesData?.detail || []).map(seq => ({
			id: seq.id,
			sequenceId: seq.sequenceId,
			sequenceName: seq.sequenceName,
			status: seq.status,
			category: seq.category,
			type: seq.type,
			version: seq.version,
			isLatest: seq.isLatest
		})),
		...(inspectionsData?.detail || [])
			.filter(ins => ins.inspection.id !== undefined)
			.map(ins => ({
				id: ins.inspection.id!,
				inspectionId: ins.inspection.inspectionId,
				inspectionName: ins.inspection.inspectionName,
				status: ins.inspection.status,
				type: ins.inspection.type,
				version: ins.inspection.version,
				isLatest: ins.inspection.isLatest
			}))
	];

	// Filter items by type
	const sequenceItems = allItems.filter(isSequenceItem);
	const inspectionItems = allItems.filter(isInspectionItem);

	// Handle opening modal
	const handleOpenModal = (type: 'sequence' | 'inspection') => {
		setModalType(type);
		setActiveTab(type === 'sequence' ? 0 : 1);
		setModalOpen(true);
	};

	// Handle closing modal
	const handleCloseModal = () => {
		setModalOpen(false);
	};

	// Handle item selection in modal
	const handleItemClick = (item: SelectableItem) => {
		// Check if item is already selected (considering both stepId and itemType to avoid conflicts)
		const isAlreadySelected = fields.some(step => {
			const currentStep = step as unknown as ExtendedPrcTemplateStep;
			return (
				currentStep.stepId === item.id && currentStep.itemType === (isSequenceItem(item) ? 'sequence' : 'inspection')
			);
		});

		if (isAlreadySelected) {
			// Remove the item if already selected
			const stepIndex = fields.findIndex(step => {
				const currentStep = step as unknown as ExtendedPrcTemplateStep;
				return (
					currentStep.stepId === item.id && currentStep.itemType === (isSequenceItem(item) ? 'sequence' : 'inspection')
				);
			});
			if (stepIndex !== -1) {
				remove(stepIndex);
				// Update sequence numbers after removal
				setTimeout(() => updateSequenceNumbers(), 0);
			}
		} else {
			// Add the item as a new step
			const itemType = isSequenceItem(item) ? 'sequence' : 'inspection';

			const newStep: ExtendedPrcTemplateStep = {
				version: 1,
				isLatest: true,
				sequence: fields.length + 3, // Auto-increment sequence number Start from 3 (after 2 default steps)
				stepId: item.id, // Use the actual ID of the selected sequence or inspection
				type: itemType,
				blockCatalystMixing: false,
				requestSupervisorApproval: false,
				itemName: isSequenceItem(item) ? item.sequenceName : item.inspectionName,
				itemId: isSequenceItem(item) ? item.sequenceId : item.inspectionId,
				itemType: itemType
			};
			append(newStep);
			// Update sequence numbers after adding
			setTimeout(() => updateSequenceNumbers(), 0);
		}
	};

	// Handle step reordering
	const handleReorder = (fromIndex: number, toIndex: number) => {
		move(fromIndex, toIndex);
		// Update sequence numbers after reordering
		setTimeout(() => updateSequenceNumbers(), 0);
	};

	// Handle step removal
	const handleRemove = (index: number) => {
		remove(index);
		// Update sequence numbers after removal
		setTimeout(() => updateSequenceNumbers(), 0);
	};

	// Update sequence numbers
	const updateSequenceNumbers = () => {
		// Update sequence numbers for all steps (starting from 3, since we have 2 default steps)
		if (setValue) {
			fields.forEach((field, index) => {
				const currentStep = field as unknown as ExtendedPrcTemplateStep;
				const newSequence = index + 3; // Start from 3 (after 2 default steps)
				if (currentStep.sequence !== newSequence) {
					// Update the sequence number if it's different
					setValue(`prcTemplateSteps.${index}.sequence`, newSequence);
				}
			});
		}
	};

	// Handle step updates
	const handleUpdateStep = (_index: number, _updatedStep: Partial<ExtendedPrcTemplateStep>) => {
		// Update the specific field in the form
		// This would need to be implemented with form's setValue
		// For now, we'll handle it in the parent component
	};

	// Check if item is selected (considering both stepId and itemType to avoid conflicts)
	const isItemSelected = (item: SelectableItem) => {
		return fields.some(step => {
			const currentStep = step as unknown as ExtendedPrcTemplateStep;
			return (
				currentStep.stepId === item.id && currentStep.itemType === (isSequenceItem(item) ? 'sequence' : 'inspection')
			);
		});
	};

	// Get items for current tab
	const getCurrentTabItems = () => {
		return activeTab === 0 ? sequenceItems : inspectionItems;
	};

	const currentTabItems = getCurrentTabItems();

	return (
		<Box>
			<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
				<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
					Template Steps Configuration
				</Typography>
			</Box>

			<Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				{errors.prcTemplateSteps && (
					<Alert severity="error" sx={{ mb: 3 }}>
						{errors.prcTemplateSteps.message}
					</Alert>
				)}

				{/* Add Step Buttons */}
				<Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
					<Button
						variant="outlined"
						startIcon={<AddIcon />}
						onClick={() => handleOpenModal('sequence')}
						sx={{
							borderColor: '#1976d2',
							color: '#1976d2',
							'&:hover': {
								borderColor: '#1565c0',
								backgroundColor: 'rgba(25, 118, 210, 0.04)'
							}
						}}
					>
						Add Sequence ({sequenceItems.length})
					</Button>
					<Button
						variant="outlined"
						startIcon={<AddIcon />}
						onClick={() => handleOpenModal('inspection')}
						sx={{
							borderColor: '#1976d2',
							color: '#1976d2',
							'&:hover': {
								borderColor: '#1565c0',
								backgroundColor: 'rgba(25, 118, 210, 0.04)'
							}
						}}
					>
						Add Inspection ({inspectionItems.length})
					</Button>
				</Box>

				{/* Template Steps */}
				<Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
					Template Steps ({fields.length + 2})
				</Typography>

				<Box>
					{/* Default Steps */}
					<DefaultStepItem
						stepNumber={1}
						stepName="Raw Materials"
						stepDescription="Preparation and verification of raw materials"
					/>
					<DefaultStepItem stepNumber={2} stepName="Catalyst Mixing" stepDescription="Mixing of catalyst components" />

					{/* User Selected Steps */}
					{fields.map((field, index) => (
						<SelectedStepItem
							key={field.id}
							step={field as unknown as ExtendedPrcTemplateStep}
							index={index}
							totalSteps={fields.length + 2}
							onReorder={handleReorder}
							onRemove={handleRemove}
							onUpdateStep={handleUpdateStep}
							control={control}
						/>
					))}

					{/* Empty State for User Steps */}
					{fields.length === 0 && (
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								height: 120,
								border: '2px dashed #e0e0e0',
								borderRadius: 2,
								backgroundColor: '#fafafa',
								mt: 2
							}}
						>
							<Typography color="textSecondary" textAlign="center">
								No additional steps selected yet.
								<br />
								Click "Add Sequence" or "Add Inspection" to add more steps.
							</Typography>
						</Box>
					)}
				</Box>
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
						pb: 1
					}}
				>
					<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
						Select {modalType === 'sequence' ? 'Sequences' : 'Inspections'}
					</Typography>
					<IconButton onClick={handleCloseModal} size="small">
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

						{isSequencesLoading || isInspectionsLoading ? (
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
					<Button onClick={handleCloseModal} variant="outlined">
						Done
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default PrcTemplateSteps;
