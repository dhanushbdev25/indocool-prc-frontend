import { useState, useCallback, useEffect, useRef } from 'react';
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
	CircularProgress,
	TextField,
	Divider,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	FormControlLabel,
	Switch
} from '@mui/material';
import {
	Add as AddIcon,
	Close as CloseIcon,
	Science as CatalystIcon,
	Assignment as TemplateIcon
} from '@mui/icons-material';
import { Controller, Control, FieldErrors, UseFormSetValue, useFieldArray } from 'react-hook-form';
import { PartMasterFormData } from '../schemas';
import { useFetchCatalystChartsQuery } from '../../../../../../store/api/business/catalyst-master/catalyst.api';
import { useFetchProcessSequencesQuery } from '../../../../../../store/api/business/sequence-master/sequence.api';
import { useFetchInspectionsQuery } from '../../../../../../store/api/business/inspection-master/inspection.api';
import LinkedMasterCard from './LinkedMasterCard';
import DefaultStepItem from './DefaultStepItem';
import OperationGroupComponent from './OperationGroup';
import {
	SelectableCatalyst,
	OPERATION_GROUPS,
	SequenceItem,
	InspectionItem,
	StepSelectableItem,
	ExtendedPrcTemplateStep,
	isSequenceItem
} from '../types';
import { ImageItem } from '../../../../../../hooks/useImageGallery';

interface LinkedMastersTabProps {
	control: Control<PartMasterFormData>;
	errors: FieldErrors<PartMasterFormData>;
	setValue: UseFormSetValue<PartMasterFormData>;
	stepGalleries: Record<string, ImageItem[]>;
	onAddStepImage: (stepKey: string, file: File) => void;
	onRemoveStepImage: (stepKey: string, id: number | string) => void;
}

const LinkedMastersTab = ({
	control,
	errors,
	setValue,
	stepGalleries,
	onAddStepImage,
	onRemoveStepImage
}: LinkedMastersTabProps) => {
	const [catalystModalOpen, setCatalystModalOpen] = useState(false);
	const [addedGroups, setAddedGroups] = useState<string[]>([]);
	const [selectedGroupToAdd, setSelectedGroupToAdd] = useState('');

	const { data: catalystData, isLoading: isCatalystLoading } = useFetchCatalystChartsQuery();
	const { data: sequencesData, isLoading: isSequencesLoading } = useFetchProcessSequencesQuery();
	const { data: inspectionsData, isLoading: isInspectionsLoading } = useFetchInspectionsQuery();

	const { fields, append, remove, move } = useFieldArray({
		control,
		name: 'prcTemplateSteps'
	});

	const hasInitializedGroups = useRef(false);
	useEffect(() => {
		if (hasInitializedGroups.current) return;
		if (fields.length > 0) {
			const groupsFromSteps = [
				...new Set(
					fields
						.map(f => (f as unknown as ExtendedPrcTemplateStep).group)
						.filter(Boolean)
				)
			];
			if (groupsFromSteps.length > 0) {
				setAddedGroups(groupsFromSteps);
				hasInitializedGroups.current = true;
			}
		}
	}, [fields]);

	const selectedCatalyst = control._formValues.catalyst;

	const catalystItems: SelectableCatalyst[] = (catalystData?.detail || []).map(catalyst => ({
		id: catalyst.catalyst.id,
		chartId: catalyst.catalyst.chartId,
		chartSupplier: catalyst.catalyst.chartSupplier,
		status: catalyst.catalyst.status,
		version: catalyst.catalyst.version,
		isLatest: catalyst.catalyst.isLatest
	}));

	const sequenceItems: SequenceItem[] = (sequencesData?.detail || []).map(seq => ({
		id: seq.id,
		sequenceId: seq.sequenceId,
		sequenceName: seq.sequenceName,
		status: seq.status,
		category: seq.category,
		type: seq.type,
		version: seq.version,
		isLatest: seq.isLatest
	}));

	const inspectionItems: InspectionItem[] = (inspectionsData?.detail || [])
		.filter(ins => ins.inspection.id !== undefined)
		.map(ins => ({
			id: ins.inspection.id!,
			inspectionId: ins.inspection.inspectionId,
			inspectionName: ins.inspection.inspectionName,
			status: ins.inspection.status,
			type: ins.inspection.type,
			version: ins.inspection.version,
			isLatest: ins.inspection.isLatest
		}));

	const selectedCatalystItem = catalystItems.find(item => item.id === selectedCatalyst);

	const allStepFields = fields.map(field => field as unknown as ExtendedPrcTemplateStep);

	const availableGroupsToAdd = OPERATION_GROUPS.filter(g => !addedGroups.includes(g.id));

	const handleCatalystSelect = (item: SelectableCatalyst) => {
		setValue('catalyst', item.id);
		setCatalystModalOpen(false);
	};

	const handleRemoveCatalyst = () => {
		setValue('catalyst', undefined);
	};

	const handleAddGroup = () => {
		if (!selectedGroupToAdd) return;
		setAddedGroups(prev => [...prev, selectedGroupToAdd]);
		setSelectedGroupToAdd('');
	};

	const handleRemoveGroup = useCallback(
		(groupId: string) => {
			const indicesToRemove = allStepFields
				.map((step, idx) => (step.group === groupId ? idx : -1))
				.filter(idx => idx !== -1)
				.sort((a, b) => b - a);
			indicesToRemove.forEach(idx => remove(idx));
			setAddedGroups(prev => prev.filter(id => id !== groupId));
			setTimeout(() => updateSequenceNumbers(), 0);
		},
		[allStepFields, remove] // eslint-disable-line react-hooks/exhaustive-deps
	);

	const handleAddStep = useCallback(
		(item: StepSelectableItem, group: string) => {
			const itemType = isSequenceItem(item) ? 'sequence' : 'inspection';
			const newStep: ExtendedPrcTemplateStep = {
				version: 1,
				isLatest: true,
				sequence: fields.length + 3,
				stepId: item.id,
				type: itemType,
				blockCatalystMixing: false,
				requestSupervisorApproval: false,
				group,
				itemName: isSequenceItem(item) ? item.sequenceName : item.inspectionName,
				itemId: isSequenceItem(item) ? item.sequenceId : item.inspectionId,
				itemType: itemType
			};
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			append(newStep as any);
			setTimeout(() => updateSequenceNumbers(), 0);
		},
		[fields.length, append] // eslint-disable-line react-hooks/exhaustive-deps
	);

	const handleRemoveStep = useCallback(
		(index: number) => {
			remove(index);
			setTimeout(() => updateSequenceNumbers(), 0);
		},
		[remove] // eslint-disable-line react-hooks/exhaustive-deps
	);

	const handleReorderStep = useCallback(
		(fromIndex: number, toIndex: number) => {
			move(fromIndex, toIndex);
			setTimeout(() => updateSequenceNumbers(), 0);
		},
		[move] // eslint-disable-line react-hooks/exhaustive-deps
	);

	const updateSequenceNumbers = () => {
		fields.forEach((_, index) => {
			setValue(`prcTemplateSteps.${index}.sequence`, index + 3);
		});
	};

	const getStepsForGroup = (groupId: string) => {
		return allStepFields.filter(step => step.group === groupId);
	};

	return (
		<Box>
			<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
				<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
					Linked Masters & Operations
				</Typography>
			</Box>

			{/* Section 1: Catalyst Chart */}
			<Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0', mb: 3 }}>
				{errors.catalyst && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{errors.catalyst.message}
					</Alert>
				)}

				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<CatalystIcon sx={{ color: '#1976d2' }} />
						<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
							Catalyst Chart
						</Typography>
					</Box>
					{isCatalystLoading ? (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<CircularProgress size={16} />
							<Typography variant="body2" color="text.secondary">Loading...</Typography>
						</Box>
					) : (
						<Button
							variant="outlined"
							startIcon={<AddIcon />}
							onClick={() => setCatalystModalOpen(true)}
							sx={{
								textTransform: 'none',
								borderColor: '#1976d2',
								color: '#1976d2',
								'&:hover': { borderColor: '#1565c0', backgroundColor: 'rgba(25, 118, 210, 0.04)' }
							}}
						>
							{selectedCatalystItem ? 'Change' : 'Select'} Catalyst
						</Button>
					)}
				</Box>

				{selectedCatalystItem ? (
					<LinkedMasterCard
						item={selectedCatalystItem}
						onClick={() => setCatalystModalOpen(true)}
						isSelected={true}
						onRemove={handleRemoveCatalyst}
					/>
				) : (
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							height: 100,
							border: '2px dashed #e0e0e0',
							borderRadius: 2,
							backgroundColor: '#fafafa'
						}}
					>
						<Typography color="textSecondary" textAlign="center">
							No catalyst chart selected
							<br />
							<Button size="small" onClick={() => setCatalystModalOpen(true)} sx={{ textTransform: 'none', mt: 1 }}>
								Select Catalyst
							</Button>
						</Typography>
					</Box>
				)}
			</Paper>

			{/* Catalyst Selection Modal */}
			<Dialog
				open={catalystModalOpen}
				onClose={() => setCatalystModalOpen(false)}
				maxWidth="md"
				fullWidth
				PaperProps={{ sx: { borderRadius: 2 } }}
			>
				<DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
					<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
						Select Catalyst Chart
					</Typography>
					<IconButton onClick={() => setCatalystModalOpen(false)} size="small">
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					{isCatalystLoading ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
							<Typography color="textSecondary">Loading catalysts...</Typography>
						</Box>
					) : catalystItems.length === 0 ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
							<Typography color="textSecondary">No catalyst charts available</Typography>
						</Box>
					) : (
						<Grid container spacing={2} sx={{ maxHeight: 400, overflow: 'auto' }}>
							{catalystItems.map(item => (
								<Grid size={{ xs: 12, sm: 6 }} key={item.id}>
									<LinkedMasterCard
										item={item}
										onClick={() => handleCatalystSelect(item)}
										isSelected={item.id === selectedCatalyst}
									/>
								</Grid>
							))}
						</Grid>
					)}
				</DialogContent>
				<DialogActions sx={{ p: 2, pt: 1 }}>
					<Button onClick={() => setCatalystModalOpen(false)} variant="outlined">
						Done
					</Button>
				</DialogActions>
			</Dialog>

			{/* Section 2: PRC Template Inline Creation */}
			<Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
					<TemplateIcon sx={{ color: '#4caf50' }} />
					<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
						Operations & PRC Template
					</Typography>
				</Box>

				{/* Template Basic Info */}
				<Grid container spacing={3} sx={{ mb: 3 }}>
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="templateId"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Template ID"
									placeholder="e.g., PRC-TMPL-001"
									helperText={errors.templateId?.message || 'Unique identifier for the PRC template'}
									error={!!errors.templateId}
									sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
								/>
							)}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="templateName"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Template Name"
									placeholder="e.g., Standard Moulding Process"
									helperText={errors.templateName?.message || 'Descriptive name for the template'}
									error={!!errors.templateName}
									sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
								/>
							)}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name="isTemplateActive"
							control={control}
							render={({ field }) => (
								<FormControlLabel
									control={<Switch checked={field.value} onChange={field.onChange} color="primary" />}
									label={
										<Box>
											<Typography variant="body1" sx={{ fontWeight: 500 }}>
												Active Template
											</Typography>
											<Typography variant="caption" sx={{ color: '#666' }}>
												Enable this template for use in production
											</Typography>
										</Box>
									}
								/>
							)}
						/>
					</Grid>
					<Grid size={{ xs: 12 }}>
						<Controller
							name="templateNotes"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Template Notes"
									multiline
									rows={3}
									placeholder="Additional notes about this PRC template"
									helperText={errors.templateNotes?.message || 'Optional notes about usage or special conditions'}
									error={!!errors.templateNotes}
									sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
								/>
							)}
						/>
					</Grid>
				</Grid>

				<Divider sx={{ mb: 3 }} />

				{/* Default Steps */}
				<Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
					Default Steps
				</Typography>
				<DefaultStepItem stepNumber={1} stepName="Raw Materials" stepDescription="Preparation and verification of raw materials" />
				<DefaultStepItem stepNumber={2} stepName="Catalyst Mixing" stepDescription="Mixing of catalyst components" />

				<Divider sx={{ my: 3 }} />

				{/* Add Operation Group */}
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
					<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
						Operation Groups ({addedGroups.length} groups, {fields.length} steps)
					</Typography>
				</Box>

				<Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-start' }}>
					<FormControl size="small" sx={{ minWidth: 280 }}>
						<InputLabel>Select Operation</InputLabel>
						<Select
							value={selectedGroupToAdd}
							onChange={e => setSelectedGroupToAdd(e.target.value)}
							label="Select Operation"
							sx={{ borderRadius: '8px' }}
							disabled={availableGroupsToAdd.length === 0}
						>
							{availableGroupsToAdd.map(group => (
								<MenuItem key={group.id} value={group.id}>
									{group.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<Button
						variant="contained"
						startIcon={<AddIcon />}
						onClick={handleAddGroup}
						disabled={!selectedGroupToAdd}
						sx={{
							textTransform: 'none',
							backgroundColor: '#4caf50',
							height: 40,
							'&:hover': { backgroundColor: '#388e3c' }
						}}
					>
						Add Operation
					</Button>
				</Box>

				{/* Rendered Added Groups */}
				{addedGroups.map(groupId => {
					const group = OPERATION_GROUPS.find(g => g.id === groupId);
					if (!group) return null;
					return (
						<OperationGroupComponent
							key={group.id}
							group={group}
							steps={getStepsForGroup(group.id)}
							allStepFields={allStepFields}
							sequenceItems={sequenceItems}
							inspectionItems={inspectionItems}
							isLoading={isSequencesLoading || isInspectionsLoading}
							onAddStep={handleAddStep}
							onRemoveStep={handleRemoveStep}
							onReorderStep={handleReorderStep}
							onRemoveGroup={handleRemoveGroup}
							control={control}
							stepGalleries={stepGalleries}
							onAddStepImage={onAddStepImage}
							onRemoveStepImage={onRemoveStepImage}
						/>
					);
				})}

				{addedGroups.length === 0 && (
					<Alert severity="info" sx={{ mt: 1 }}>
						No operation groups added yet. Select an operation from the dropdown above and click "Add Operation".
					</Alert>
				)}
			</Paper>
		</Box>
	);
};

export default LinkedMastersTab;
