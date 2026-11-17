import { useEffect, useState } from 'react';
import {
	Box,
	Paper,
	Typography,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	FormControlLabel,
	Checkbox,
	Button,
	IconButton,
	Grid,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Card,
	CardContent,
	Chip
} from '@mui/material';
import {
	Add as AddIcon,
	Delete as DeleteIcon,
	ExpandMore as ExpandMoreIcon,
	PlaylistAdd as StepIcon,
	Group as GroupIcon
} from '@mui/icons-material';
import {
	Controller,
	useFieldArray,
	useWatch,
	Control,
	FieldErrors,
	useFormContext
} from 'react-hook-form';
import { SequenceStepGroupsProps, targetValueTypeOptions, uomOptions } from '../types';
import { ProcessStepFormData, SequenceFormData } from '../schemas';
import { CriticalityField, FixedTableEditor, ListConfigEditor, ReorderControls } from '../../../../../../components/masters';
import type { TableConfig } from '../../../../../../types/table-config.types';
import { getListItemProblems } from '../../../../../../utils/listConfigSchema';
import { createListItem } from '../../../../../../utils/listConfig';
import type { ListConfig } from '../../../../../../types/list-config.types';
import { CRITICALITY_FIELD_LABEL, SEQUENCE_CRITICALITY_OPTIONS } from '../../../../../../utils/criticality';

interface StepGroupAccordionBlockProps {
	groupIndex: number;
	control: Control<SequenceFormData>;
	errors: FieldErrors<SequenceFormData>;
	isExpanded: boolean;
	onToggle: () => void;
	onRemove: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	canMoveUp: boolean;
	canMoveDown: boolean;
}

const StepGroupAccordionBlock = ({
	groupIndex,
	control,
	errors,
	isExpanded,
	onToggle,
	onRemove,
	onMoveUp,
	onMoveDown,
	canMoveUp,
	canMoveDown
}: StepGroupAccordionBlockProps) => {
	const processDescription =
		useWatch({
			control,
			name: `processStepGroups.${groupIndex}.processDescription`
		}) ?? '';
	const trimmed = typeof processDescription === 'string' ? processDescription.trim() : '';

	return (
		<Box sx={{ mb: 3 }}>
			<Accordion
				expanded={isExpanded}
				onChange={onToggle}
				sx={{
					borderRadius: '12px',
					boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
					'&:before': { display: 'none' },
					'&.Mui-expanded': { margin: 0 }
				}}
			>
				<AccordionSummary
					component="div"
					expandIcon={<ExpandMoreIcon />}
					sx={{
						backgroundColor: '#f8f9fa',
						borderRadius: '12px 12px 0 0',
						'&.Mui-expanded': { borderRadius: '12px 12px 0 0' },
						cursor: 'pointer',
						alignItems: 'flex-start',
						minHeight: 'unset',
						py: 1.5,
						px: 1,
						'& .MuiAccordionSummary-content': {
							alignItems: 'flex-start',
							margin: '0 !important',
							flexWrap: 'nowrap',
							flex: 1,
							minWidth: 0
						},
						'& .MuiAccordionSummary-expandIconWrapper': {
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: 40,
							height: 40,
							flexShrink: 0,
							padding: 0,
							margin: 0
						}
					}}
				>
					<Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, pr: 0.5 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', minHeight: 40 }}>
							<StepIcon sx={{ color: '#1976d2', flexShrink: 0, fontSize: '1.5rem' }} />
							<Typography variant="h6" sx={{ fontWeight: 600, color: '#333', flex: 1, minWidth: 0 }}>
								Step Group {groupIndex + 1}
							</Typography>
							<ReorderControls
								itemLabel="group"
								position={groupIndex + 1}
								canMoveUp={canMoveUp}
								canMoveDown={canMoveDown}
								onMoveUp={onMoveUp}
								onMoveDown={onMoveDown}
							/>
							<IconButton
								size="small"
								data-delete-button
								onClick={e => {
									e.stopPropagation();
									onRemove();
								}}
								sx={{
									color: 'error.main',
									flexShrink: 0,
									mt: 0,
									alignSelf: 'center',
									'&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' }
								}}
							>
								<DeleteIcon />
							</IconButton>
						</Box>
						<Box sx={{ pl: 4, mt: 0.75 }}>
							<Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block' }}>
								Process description
							</Typography>
							<Typography
								variant="body2"
								sx={{
									mt: 0.25,
									color: trimmed ? 'text.secondary' : 'text.disabled',
									fontStyle: trimmed ? 'normal' : 'italic',
									whiteSpace: 'pre-wrap',
									wordBreak: 'break-word'
								}}
							>
								{trimmed || 'Not set — expand to add in the form below.'}
							</Typography>
						</Box>
					</Box>
				</AccordionSummary>
				<AccordionDetails sx={{ p: 3 }}>
					<StepGroupForm control={control} errors={errors} groupIndex={groupIndex} />
				</AccordionDetails>
			</Accordion>
		</Box>
	);
};

const SequenceStepGroups = ({ control, errors }: SequenceStepGroupsProps) => {
	const { setValue } = useFormContext<SequenceFormData>();
	const {
		fields: stepGroupFields,
		append: appendStepGroup,
		remove: removeStepGroup,
		move: moveStepGroup
	} = useFieldArray({
		control,
		name: 'processStepGroups'
	});

	const [expandedGroups, setExpandedGroups] = useState<number[]>(() => stepGroupFields.map((_, index) => index));

	const renumberStepGroups = (groupCount: number) => {
		for (let index = 0; index < groupCount; index += 1) {
			setValue(`processStepGroups.${index}.sequence`, index + 1, {
				shouldDirty: true,
				shouldValidate: false
			});
		}
	};

	const addStepGroup = () => {
		appendStepGroup({
			sequence: stepGroupFields.length + 1,
			processName: '',
			processDescription: '',
			sequenceTiming: '00:01',
			shift: '',
			pfdNumber: '',
			processSteps: [
				{
					parameterDescription: '',
					stepNumber: 1,
					evaluationMethod: '',
					targetValueType: 'range',
					minimumAcceptanceValue: null,
					maximumAcceptanceValue: null,
					multipleMeasurements: false,
					multipleMeasurementMaxCount: null,
					tableConfig: null,
					listConfig: null,
					uom: '',
					ctq: false,
					criticalityTag: null,
					allowAttachments: false,
					responsiblePerson: false,
					getInstrumentId: false,
					notes: ''
				}
			]
		});
		setExpandedGroups(prev => [...prev, stepGroupFields.length]);
	};

	const removeGroup = (groupIndex: number) => {
		removeStepGroup(groupIndex);
		renumberStepGroups(stepGroupFields.length - 1);
		setExpandedGroups(prev =>
			prev.filter(index => index !== groupIndex).map(index => (index > groupIndex ? index - 1 : index))
		);
	};

	const moveGroup = (fromIndex: number, toIndex: number) => {
		if (toIndex < 0 || toIndex >= stepGroupFields.length) return;

		moveStepGroup(fromIndex, toIndex);
		renumberStepGroups(stepGroupFields.length);
		setExpandedGroups(prev =>
			prev.map(index => {
				if (index === fromIndex) return toIndex;
				if (fromIndex < toIndex && index > fromIndex && index <= toIndex) return index - 1;
				if (toIndex < fromIndex && index >= toIndex && index < fromIndex) return index + 1;
				return index;
			})
		);
	};

	const handleAccordionToggle = (groupIndex: number) => {
		setExpandedGroups(prev =>
			prev.includes(groupIndex) ? prev.filter(index => index !== groupIndex) : [...prev, groupIndex]
		);
	};

	return (
		<Box>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<GroupIcon sx={{ mr: 1, color: '#1976d2', fontSize: '1.5rem' }} />
					<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
						Process Step Groups & Steps
					</Typography>
				</Box>
				<Button
					variant="contained"
					startIcon={<AddIcon />}
					onClick={addStepGroup}
					sx={{
						textTransform: 'none',
						backgroundColor: '#1976d2',
						borderRadius: '8px',
						px: 3,
						py: 1,
						'&:hover': { backgroundColor: '#1565c0' }
					}}
				>
					Add Step Group
				</Button>
			</Box>

			{stepGroupFields.map((stepGroup, groupIndex) => (
				<StepGroupAccordionBlock
					key={stepGroup.id}
					groupIndex={groupIndex}
					control={control}
					errors={errors}
					isExpanded={expandedGroups.includes(groupIndex)}
					onToggle={() => handleAccordionToggle(groupIndex)}
					onRemove={() => removeGroup(groupIndex)}
					onMoveUp={() => moveGroup(groupIndex, groupIndex - 1)}
					onMoveDown={() => moveGroup(groupIndex, groupIndex + 1)}
					canMoveUp={groupIndex > 0}
					canMoveDown={groupIndex < stepGroupFields.length - 1}
				/>
			))}

			{stepGroupFields.length === 0 && (
				<Paper
					sx={{
						p: 4,
						textAlign: 'center',
						border: '2px dashed #e0e0e0',
						borderRadius: '12px',
						backgroundColor: '#fafafa'
					}}
				>
					<GroupIcon sx={{ fontSize: '3rem', color: '#ccc', mb: 2 }} />
					<Typography variant="h6" sx={{ color: '#666', mb: 1, fontWeight: 500 }}>
						No Step Groups Added
					</Typography>
					<Typography variant="body2" sx={{ color: '#999', mb: 3 }}>
						Create your first step group to define process sequences
					</Typography>
					<Button
						variant="contained"
						startIcon={<AddIcon />}
						onClick={addStepGroup}
						sx={{
							textTransform: 'none',
							borderRadius: '8px',
							px: 3,
							py: 1
						}}
					>
						Add First Step Group
					</Button>
				</Paper>
			)}
		</Box>
	);
};

interface TableConfigEditorProps {
	control: Control<SequenceFormData>;
	errors: FieldErrors<SequenceFormData>;
	groupIndex: number;
	stepIndex: number;
}

const TableConfigEditor = ({ control, groupIndex, stepIndex }: TableConfigEditorProps) => {
	const {
		setValue,
		formState: { errors }
	} = useFormContext<SequenceFormData>();
	const basePath = `processStepGroups.${groupIndex}.processSteps.${stepIndex}` as const;
	const tableConfigPath = `${basePath}.tableConfig` as const;
	const targetValueType = useWatch({ control, name: `${basePath}.targetValueType` });
	const tableConfig = useWatch({
		control,
		name: tableConfigPath
	});

	if (targetValueType !== 'table') return null;

	const tableConfigError = errors.processStepGroups?.[groupIndex]?.processSteps?.[stepIndex]?.tableConfig;
	const tableConfigErrorMessage =
		typeof tableConfigError?.message === 'string'
			? tableConfigError.message
			: typeof tableConfigError?.rows?.message === 'string'
				? tableConfigError.rows.message
				: typeof tableConfigError?.columns?.message === 'string'
					? tableConfigError.columns.message
					: undefined;

	return (
		<Grid size={{ xs: 12 }}>
			<FixedTableEditor
				config={tableConfig as Partial<TableConfig> | null | undefined}
				errorMessage={tableConfigErrorMessage}
				onChange={config =>
					setValue(tableConfigPath, config as NonNullable<ProcessStepFormData['tableConfig']>, {
						shouldDirty: true,
						shouldTouch: true,
						shouldValidate: true
					})
				}
			/>
		</Grid>
	);
};

interface SequenceListConfigEditorProps {
	control: Control<SequenceFormData>;
	groupIndex: number;
	stepIndex: number;
}

const SequenceListConfigEditor = ({ control, groupIndex, stepIndex }: SequenceListConfigEditorProps) => {
	const {
		setValue,
		formState: { errors, isSubmitted }
	} = useFormContext<SequenceFormData>();
	const basePath = `processStepGroups.${groupIndex}.processSteps.${stepIndex}` as const;
	const targetValueType = useWatch({ control, name: `${basePath}.targetValueType` });
	const listConfig = useWatch({ control, name: `${basePath}.listConfig` }) as ListConfig | null | undefined;

	if (targetValueType !== 'list') return null;

	const listError = errors.processStepGroups?.[groupIndex]?.processSteps?.[stepIndex]?.listConfig;
	const errorMessage = typeof listError?.message === 'string' ? listError.message : undefined;

	return (
		<Grid size={{ xs: 12 }}>
			<ListConfigEditor
				config={listConfig}
				errorMessage={errorMessage}
				itemErrors={isSubmitted || errorMessage ? getListItemProblems(listConfig) : undefined}
				onChange={next =>
					setValue(`${basePath}.listConfig`, next, {
						shouldDirty: true,
						shouldTouch: true,
						shouldValidate: true
					})
				}
			/>
		</Grid>
	);
};

interface StepGroupFormProps {
	control: Control<SequenceFormData>;
	errors: FieldErrors<SequenceFormData>;
	groupIndex: number;
}

const StepGroupForm = ({ control, errors, groupIndex }: StepGroupFormProps) => {
	const { setValue, getValues } = useFormContext<SequenceFormData>();
	const {
		fields: stepFields,
		append: appendStep,
		remove: removeStep,
		move: moveStep
	} = useFieldArray({
		control,
		name: `processStepGroups.${groupIndex}.processSteps`
	});

	// Auto-calculate step numbers when steps are added/removed
	useEffect(() => {
		stepFields.forEach(() => {
			// Update step number to be sequential
			// This will be handled by the form's setValue in the component
		});
	}, [stepFields]);

	const addStep = () => {
		appendStep({
			parameterDescription: '',
			stepNumber: stepFields.length + 1,
			evaluationMethod: '',
			targetValueType: 'range',
			minimumAcceptanceValue: null,
			maximumAcceptanceValue: null,
			multipleMeasurements: false,
			multipleMeasurementMaxCount: null,
			tableConfig: null,
			listConfig: null,
			uom: '',
			ctq: false,
			criticalityTag: null,
			allowAttachments: false,
			responsiblePerson: false,
			getInstrumentId: false,
			notes: ''
		});
	};

	return (
		<Box>
			{/* Step Group Basic Info */}
			<Paper sx={{ p: 3, mb: 3, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
				<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2 }}>
					Process Information
				</Typography>
				<Grid container spacing={3}>
					<Grid size={{ xs: 12 }}>
						<Controller
							name={`processStepGroups.${groupIndex}.processName`}
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Process ID"
									required
									placeholder="e.g., OP-101-GELCOAT"
									helperText={errors.processStepGroups?.[groupIndex]?.processName?.message}
									error={!!errors.processStepGroups?.[groupIndex]?.processName}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px',
											backgroundColor: 'white'
										}
									}}
								/>
							)}
						/>
					</Grid>
					<Grid size={{ xs: 12 }}>
						<Controller
							name={`processStepGroups.${groupIndex}.processDescription`}
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Process Description"
									required
									multiline
									rows={2}
									placeholder="e.g., Mixing and preparing gelcoat with proper viscosity"
									helperText={errors.processStepGroups?.[groupIndex]?.processDescription?.message}
									error={!!errors.processStepGroups?.[groupIndex]?.processDescription}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px',
											backgroundColor: 'white'
										}
									}}
								/>
							)}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name={`processStepGroups.${groupIndex}.sequenceTiming`}
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Expected Duration"
									required
									type="time"
									placeholder="HH:MM"
									helperText={
										errors.processStepGroups?.[groupIndex]?.sequenceTiming?.message ||
										'Enter expected duration in HH:MM format'
									}
									error={!!errors.processStepGroups?.[groupIndex]?.sequenceTiming}
									InputLabelProps={{
										shrink: true
									}}
									inputProps={{
										step: 60 // 1 minute steps
									}}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px',
											backgroundColor: 'white'
										}
									}}
								/>
							)}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name={`processStepGroups.${groupIndex}.shift`}
							control={control}
							render={({ field }) => (
								<FormControl
									fullWidth
									error={!!errors.processStepGroups?.[groupIndex]?.shift}
									sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: 'white' } }}
								>
									<InputLabel>Shift</InputLabel>
									<Select {...field} value={field.value ?? ''} label="Shift">
										<MenuItem value="">
											<em>None</em>
										</MenuItem>
										{['Shift A', 'Shift B', 'Shift C', 'Shift G'].map(option => (
											<MenuItem key={option} value={option}>
												{option}
											</MenuItem>
										))}
									</Select>
									{errors.processStepGroups?.[groupIndex]?.shift && (
										<Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
											{errors.processStepGroups[groupIndex].shift.message}
										</Typography>
									)}
								</FormControl>
							)}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Controller
							name={`processStepGroups.${groupIndex}.pfdNumber`}
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									value={field.value ?? ''}
									fullWidth
									label="PFD Number"
									placeholder="e.g., PFD-001"
									helperText={errors.processStepGroups?.[groupIndex]?.pfdNumber?.message}
									error={!!errors.processStepGroups?.[groupIndex]?.pfdNumber}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px',
											backgroundColor: 'white'
										}
									}}
								/>
							)}
						/>
					</Grid>
				</Grid>
			</Paper>

			{/* Steps Section */}
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<StepIcon sx={{ mr: 1, color: '#1976d2' }} />
					<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
						Process Steps
					</Typography>
					<Chip
						label={`${stepFields.length} steps`}
						size="small"
						sx={{ ml: 2, backgroundColor: '#e3f2fd', color: '#1976d2' }}
					/>
				</Box>
				<Button
					variant="contained"
					size="small"
					startIcon={<AddIcon />}
					onClick={addStep}
					sx={{
						textTransform: 'none',
						borderRadius: '8px',
						px: 2,
						py: 1
					}}
				>
					Add Step
				</Button>
			</Box>

			{stepFields.map((step, stepIndex) => (
				<Card
					key={step.id}
					sx={{
						mb: 2,
						border: '1px solid #e0e0e0',
						borderRadius: '12px',
						boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
					}}
				>
					<CardContent sx={{ p: 3 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
							<Box sx={{ display: 'flex', alignItems: 'center' }}>
								<Box
									sx={{
										width: 32,
										height: 32,
										borderRadius: '50%',
										backgroundColor: '#1976d2',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										mr: 2
									}}
								>
									<Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
										{stepIndex + 1}
									</Typography>
								</Box>
								<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
									Step {stepIndex + 1}
								</Typography>
							</Box>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
								<ReorderControls
									itemLabel="step"
									position={stepIndex + 1}
									canMoveUp={stepIndex > 0}
									canMoveDown={stepIndex < stepFields.length - 1}
									onMoveUp={() => moveStep(stepIndex, stepIndex - 1)}
									onMoveDown={() => moveStep(stepIndex, stepIndex + 1)}
								/>
								<IconButton
									size="small"
									onClick={() => removeStep(stepIndex)}
									sx={{
										color: 'error.main',
										'&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' }
									}}
								>
									<DeleteIcon />
								</IconButton>
							</Box>
						</Box>

						<Grid container spacing={2}>
							{/* Parameter Description */}
							<Grid size={{ xs: 12, md: 6 }}>
								<Controller
									name={`processStepGroups.${groupIndex}.processSteps.${stepIndex}.parameterDescription`}
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											label="Parameter Description"
											required
											placeholder="e.g., Check MEKP Ratio"
											helperText={
												errors.processStepGroups?.[groupIndex]?.processSteps?.[stepIndex]?.parameterDescription?.message
											}
											error={!!errors.processStepGroups?.[groupIndex]?.processSteps?.[stepIndex]?.parameterDescription}
											sx={{
												'& .MuiOutlinedInput-root': {
													borderRadius: '8px'
												}
											}}
										/>
									)}
								/>
							</Grid>

							{/* Step Number - Auto-calculated */}
							<Grid size={{ xs: 12, md: 2 }}>
								<TextField
									fullWidth
									label="Step #"
									value={stepIndex + 1}
									disabled
									helperText="Auto-calculated"
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '8px',
											backgroundColor: '#f5f5f5'
										}
									}}
								/>
							</Grid>

							{/* Evaluation Method */}
							<Grid size={{ xs: 12, md: 6 }}>
								<Controller
									name={`processStepGroups.${groupIndex}.processSteps.${stepIndex}.evaluationMethod`}
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											label="Evaluation Method"
											required
											placeholder="e.g., Visual, Wet film thickness Gauge"
											helperText={
												errors.processStepGroups?.[groupIndex]?.processSteps?.[stepIndex]?.evaluationMethod?.message
											}
											error={!!errors.processStepGroups?.[groupIndex]?.processSteps?.[stepIndex]?.evaluationMethod}
											sx={{
												'& .MuiOutlinedInput-root': {
													borderRadius: '8px'
												}
											}}
										/>
									)}
								/>
							</Grid>

							{/* Target Value Type */}
							<Grid size={{ xs: 12, md: 6 }}>
								<Controller
									name={`processStepGroups.${groupIndex}.processSteps.${stepIndex}.targetValueType`}
									control={control}
									render={({ field }) => (
										<FormControl
											fullWidth
											error={!!errors.processStepGroups?.[groupIndex]?.processSteps?.[stepIndex]?.targetValueType}
										>
											<InputLabel>Target Value Type</InputLabel>
											<Select
												{...field}
												label="Target Value Type"
												sx={{ borderRadius: '8px' }}
												onChange={e => {
													const v = e.target.value as string;
													field.onChange(v);
													const basePath = `processStepGroups.${groupIndex}.processSteps.${stepIndex}` as const;
													if (v === 'list' && !getValues(`${basePath}.listConfig`)?.items?.length) {
														setValue(`${basePath}.listConfig`, { items: [createListItem()] }, { shouldDirty: true });
													}
													if (v === 'exact value') {
														const minVal = getValues(`${basePath}.minimumAcceptanceValue`);
														if (minVal != null && typeof minVal === 'number' && !Number.isNaN(minVal)) {
															setValue(`${basePath}.maximumAcceptanceValue`, minVal, {
																shouldDirty: true,
																shouldValidate: true
															});
														}
													}
												}}
											>
												{targetValueTypeOptions.map(option => (
													<MenuItem key={option.value} value={option.value}>
														{option.label}
													</MenuItem>
												))}
											</Select>
										</FormControl>
									)}
								/>
							</Grid>

						{/* Min/Max or exact target — conditional on targetValueType */}
						<Controller
							name={`processStepGroups.${groupIndex}.processSteps.${stepIndex}.targetValueType`}
							control={control}
							render={({ field: { value: targetValueType } }) => {
								if (targetValueType === 'ok/not ok' || targetValueType === 'table' || targetValueType === 'list')
									return <></>;

								const basePath = `processStepGroups.${groupIndex}.processSteps.${stepIndex}` as const;

								if (targetValueType === 'exact value') {
									return (
										<Grid size={{ xs: 12, md: 6 }}>
											<Controller
												name={`${basePath}.minimumAcceptanceValue`}
												control={control}
												render={({ field }) => (
													<TextField
														{...field}
														value={field.value ?? ''}
														onChange={e => {
															const raw = e.target.value;
															const next = raw === '' ? null : parseFloat(raw);
															field.onChange(next);
															if (next != null && typeof next === 'number' && !Number.isNaN(next)) {
																setValue(`${basePath}.maximumAcceptanceValue`, next, {
																	shouldDirty: true,
																	shouldValidate: true
																});
															} else {
																setValue(`${basePath}.maximumAcceptanceValue`, null, {
																	shouldDirty: true,
																	shouldValidate: true
																});
															}
														}}
														fullWidth
														label="Exact target value"
														required
														type="number"
														placeholder="e.g., 2.0"
														helperText={
															errors.processStepGroups?.[groupIndex]?.processSteps?.[stepIndex]
																?.minimumAcceptanceValue?.message
														}
														error={
															!!errors.processStepGroups?.[groupIndex]?.processSteps?.[stepIndex]
																?.minimumAcceptanceValue
														}
														sx={{
															'& .MuiOutlinedInput-root': {
																borderRadius: '8px'
															}
														}}
													/>
												)}
											/>
										</Grid>
									);
								}

								return (
									<>
										<Grid size={{ xs: 12, md: 6 }}>
											<Controller
												name={`processStepGroups.${groupIndex}.processSteps.${stepIndex}.minimumAcceptanceValue`}
												control={control}
												render={({ field }) => (
													<TextField
														{...field}
														value={field.value ?? ''}
														onChange={e => {
															const value = e.target.value;
															field.onChange(value === '' ? null : parseFloat(value));
														}}
														fullWidth
														label="Minimum Value"
														required
														type="number"
														placeholder="e.g., 1.8"
														helperText={
															errors.processStepGroups?.[groupIndex]?.processSteps?.[stepIndex]
																?.minimumAcceptanceValue?.message
														}
														error={
															!!errors.processStepGroups?.[groupIndex]?.processSteps?.[stepIndex]
																?.minimumAcceptanceValue
														}
														sx={{
															'& .MuiOutlinedInput-root': {
																borderRadius: '8px'
															}
														}}
													/>
												)}
											/>
										</Grid>
										<Grid size={{ xs: 12, md: 6 }}>
											<Controller
												name={`processStepGroups.${groupIndex}.processSteps.${stepIndex}.maximumAcceptanceValue`}
												control={control}
												render={({ field }) => (
													<TextField
														{...field}
														value={field.value ?? ''}
														onChange={e => {
															const value = e.target.value;
															field.onChange(value === '' ? null : parseFloat(value));
														}}
														fullWidth
														label="Maximum Value"
														required
														type="number"
														placeholder="e.g., 2.2"
														helperText={
															errors.processStepGroups?.[groupIndex]?.processSteps?.[stepIndex]
																?.maximumAcceptanceValue?.message
														}
														error={
															!!errors.processStepGroups?.[groupIndex]?.processSteps?.[stepIndex]
																?.maximumAcceptanceValue
														}
														sx={{
															'& .MuiOutlinedInput-root': {
																borderRadius: '8px'
															}
														}}
													/>
												)}
											/>
										</Grid>
									</>
								);
							}}
						/>

						{/* Table Configuration - Shown when targetValueType is 'table' */}
						<TableConfigEditor
							control={control}
							errors={errors}
							groupIndex={groupIndex}
							stepIndex={stepIndex}
						/>

						{/* List Configuration - Shown when targetValueType is 'list' */}
						<SequenceListConfigEditor control={control} groupIndex={groupIndex} stepIndex={stepIndex} />

							{/* Multiple Measurements */}
							<Grid size={{ xs: 12, md: 6 }}>
								<Controller
									name={`processStepGroups.${groupIndex}.processSteps.${stepIndex}.multipleMeasurements`}
									control={control}
									render={({ field }) => (
										<FormControlLabel
											control={<Checkbox checked={field.value} onChange={field.onChange} color="primary" />}
											label="Allow Multiple Measurements"
										/>
									)}
								/>
								<Controller
									name={`processStepGroups.${groupIndex}.processSteps.${stepIndex}.multipleMeasurements`}
									control={control}
									render={({ field: { value: multipleMeasurements } }) => {
										if (!multipleMeasurements) return <></>;

										return (
											<Box sx={{ mt: 1 }}>
												<Controller
													name={`processStepGroups.${groupIndex}.processSteps.${stepIndex}.multipleMeasurementMaxCount`}
													control={control}
													render={({ field }) => (
														<TextField
															{...field}
															value={field.value ?? ''}
															onChange={e => {
																const value = e.target.value;
																field.onChange(value === '' ? null : parseInt(value, 10));
															}}
															label="Max Count"
															type="number"
															size="small"
															fullWidth
															required
															placeholder="e.g., 3"
															helperText={
																errors.processStepGroups?.[groupIndex]?.processSteps?.[stepIndex]
																	?.multipleMeasurementMaxCount?.message
															}
															error={
																!!errors.processStepGroups?.[groupIndex]?.processSteps?.[stepIndex]
																	?.multipleMeasurementMaxCount
															}
															sx={{
																'& .MuiOutlinedInput-root': {
																	borderRadius: '8px'
																}
															}}
														/>
													)}
												/>
											</Box>
										);
									}}
								/>
							</Grid>

							{/* UOM */}
							<Grid size={{ xs: 12, md: 6 }}>
								<Controller
									name={`processStepGroups.${groupIndex}.processSteps.${stepIndex}.uom`}
									control={control}
									render={({ field }) => (
										<FormControl
											fullWidth
											error={!!errors.processStepGroups?.[groupIndex]?.processSteps?.[stepIndex]?.uom}
										>
											<InputLabel>Unit of Measurement</InputLabel>
											<Select {...field} label="Unit of Measurement" sx={{ borderRadius: '8px' }}>
												{uomOptions.map(option => (
													<MenuItem key={option.value} value={option.value}>
														{option.label}
													</MenuItem>
												))}
											</Select>
										</FormControl>
									)}
								/>
							</Grid>

							{/* Criticality */}
							<Grid size={{ xs: 12, md: 6 }}>
								<CriticalityField
									ctqName={`processStepGroups.${groupIndex}.processSteps.${stepIndex}.ctq`}
									tagName={`processStepGroups.${groupIndex}.processSteps.${stepIndex}.criticalityTag`}
									options={SEQUENCE_CRITICALITY_OPTIONS}
									label={CRITICALITY_FIELD_LABEL}
									helperText="Only CTQ requires quality approval during execution. CTA and CTP are labels."
								/>
							</Grid>

							{/* Responsible Person */}
							<Grid size={{ xs: 12, md: 6 }}>
								<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
									<Controller
										name={`processStepGroups.${groupIndex}.processSteps.${stepIndex}.responsiblePerson`}
										control={control}
										render={({ field }) => (
											<FormControlLabel
												control={<Checkbox checked={field.value} onChange={field.onChange} color="primary" />}
												label="Get Responsible Person"
											/>
										)}
									/>
									<Controller
										name={`processStepGroups.${groupIndex}.processSteps.${stepIndex}.getInstrumentId`}
										control={control}
										render={({ field }) => (
											<FormControlLabel
												control={<Checkbox checked={field.value} onChange={field.onChange} color="primary" />}
												label="Get Instrument id"
											/>
										)}
									/>
								</Box>
							</Grid>

							{/* Notes */}
							<Grid size={{ xs: 12 }}>
								<Controller
									name={`processStepGroups.${groupIndex}.processSteps.${stepIndex}.notes`}
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											label="Notes"
											multiline
											rows={2}
											placeholder="Additional notes for this step..."
											helperText={errors.processStepGroups?.[groupIndex]?.processSteps?.[stepIndex]?.notes?.message}
											error={!!errors.processStepGroups?.[groupIndex]?.processSteps?.[stepIndex]?.notes}
											sx={{
												'& .MuiOutlinedInput-root': {
													borderRadius: '8px'
												}
											}}
										/>
									)}
								/>
							</Grid>
						</Grid>
					</CardContent>
				</Card>
			))}

			{stepFields.length === 0 && (
				<Paper
					sx={{
						p: 4,
						textAlign: 'center',
						border: '2px dashed #e0e0e0',
						borderRadius: '12px',
						backgroundColor: '#fafafa'
					}}
				>
					<StepIcon sx={{ fontSize: '3rem', color: '#ccc', mb: 2 }} />
					<Typography variant="h6" sx={{ color: '#666', mb: 1, fontWeight: 500 }}>
						No Steps Added
					</Typography>
					<Typography variant="body2" sx={{ color: '#999', mb: 3 }}>
						Add process steps to define the sequence workflow
					</Typography>
					<Button
						variant="contained"
						size="small"
						startIcon={<AddIcon />}
						onClick={addStep}
						sx={{
							textTransform: 'none',
							borderRadius: '8px',
							px: 3,
							py: 1
						}}
					>
						Add First Step
					</Button>
				</Paper>
			)}
		</Box>
	);
};

export default SequenceStepGroups;
