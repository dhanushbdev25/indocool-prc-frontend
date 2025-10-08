import React, { useEffect } from 'react';
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
import { Controller, useFieldArray, Control, FieldErrors } from 'react-hook-form';
import { SequenceStepGroupsProps, stepTypeOptions, targetValueTypeOptions, uomOptions } from '../types';
import { SequenceFormData } from '../schemas';

const SequenceStepGroups: React.FC<SequenceStepGroupsProps> = ({ control, errors }) => {
	const {
		fields: stepGroupFields,
		append: appendStepGroup,
		remove: removeStepGroup
	} = useFieldArray({
		control,
		name: 'processStepGroups'
	});

	const addStepGroup = () => {
		appendStepGroup({
			processName: '',
			processDescription: '',
			processSteps: [
				{
					parameterDescription: '',
					stepNumber: 1,
					stepType: 'Measurement',
					evaluationMethod: '',
					targetValueType: 'range',
					minimumAcceptanceValue: null,
					maximumAcceptanceValue: null,
					multipleMeasurements: false,
					multipleMeasurementMaximumCount: null,
					uom: '',
					ctq: false,
					allowAttachments: false,
					notes: ''
				}
			]
		});
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
				<Accordion
					key={stepGroup.id}
					defaultExpanded
					sx={{
						mb: 3,
						borderRadius: '12px',
						boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
						'&:before': { display: 'none' },
						'&.Mui-expanded': { margin: '0 0 24px 0' }
					}}
				>
					<AccordionSummary
						expandIcon={<ExpandMoreIcon />}
						sx={{
							backgroundColor: '#f8f9fa',
							borderRadius: '12px 12px 0 0',
							'&.Mui-expanded': { borderRadius: '12px 12px 0 0' }
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
							<Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
								<StepIcon sx={{ mr: 1, color: '#1976d2' }} />
								<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
									Step Group {groupIndex + 1}
								</Typography>
							</Box>
							<Box sx={{ ml: 'auto', mr: 2 }}>
								<IconButton
									size="small"
									onClick={e => {
										e.stopPropagation();
										removeStepGroup(groupIndex);
									}}
									sx={{
										color: 'error.main',
										'&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' }
									}}
								>
									<DeleteIcon />
								</IconButton>
							</Box>
						</Box>
					</AccordionSummary>
					<AccordionDetails sx={{ p: 3 }}>
						<StepGroupForm control={control} errors={errors} groupIndex={groupIndex} />
					</AccordionDetails>
				</Accordion>
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

interface StepGroupFormProps {
	control: Control<SequenceFormData>;
	errors: FieldErrors<SequenceFormData>;
	groupIndex: number;
}

const StepGroupForm: React.FC<StepGroupFormProps> = ({ control, errors, groupIndex }) => {
	const {
		fields: stepFields,
		append: appendStep,
		remove: removeStep
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
			stepType: 'Measurement',
			evaluationMethod: '',
			targetValueType: 'range',
			minimumAcceptanceValue: null,
			maximumAcceptanceValue: null,
			multipleMeasurements: false,
			multipleMeasurementMaximumCount: null,
			uom: '',
			ctq: false,
			allowAttachments: false,
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
					<Grid item xs={12}>
						<Controller
							name={`processStepGroups.${groupIndex}.processName`}
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									fullWidth
									label="Process Name"
									required
									placeholder="e.g., Gelcoat Preparation"
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
					<Grid item xs={12}>
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

						<Grid container spacing={2}>
							{/* Parameter Description */}
							<Grid item xs={12} md={6}>
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
							<Grid item xs={12} md={2}>
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

							{/* Step Type */}
							<Grid item xs={12} md={4}>
								<Controller
									name={`processStepGroups.${groupIndex}.processSteps.${stepIndex}.stepType`}
									control={control}
									render={({ field }) => (
										<FormControl
											fullWidth
											error={!!errors.processStepGroups?.[groupIndex]?.processSteps?.[stepIndex]?.stepType}
										>
											<InputLabel>Step Type</InputLabel>
											<Select {...field} label="Step Type" sx={{ borderRadius: '8px' }}>
												{stepTypeOptions.map(option => (
													<MenuItem key={option.value} value={option.value}>
														{option.label}
													</MenuItem>
												))}
											</Select>
										</FormControl>
									)}
								/>
							</Grid>

							{/* Evaluation Method */}
							<Grid item xs={12} md={6}>
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
							<Grid item xs={12} md={6}>
								<Controller
									name={`processStepGroups.${groupIndex}.processSteps.${stepIndex}.targetValueType`}
									control={control}
									render={({ field }) => (
										<FormControl
											fullWidth
											error={!!errors.processStepGroups?.[groupIndex]?.processSteps?.[stepIndex]?.targetValueType}
										>
											<InputLabel>Target Value Type</InputLabel>
											<Select {...field} label="Target Value Type" sx={{ borderRadius: '8px' }}>
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

							{/* Min/Max Values - Conditional based on targetValueType */}
							<Controller
								name={`processStepGroups.${groupIndex}.processSteps.${stepIndex}.targetValueType`}
								control={control}
								render={({ field: { value: targetValueType } }) => {
									if (targetValueType === 'ok/not ok') return <></>;

									return (
										<>
											<Grid item xs={12} md={6}>
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
											<Grid item xs={12} md={6}>
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

							{/* Multiple Measurements */}
							<Grid item xs={12} md={6}>
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
													name={`processStepGroups.${groupIndex}.processSteps.${stepIndex}.multipleMeasurementMaximumCount`}
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
																	?.multipleMeasurementMaximumCount?.message
															}
															error={
																!!errors.processStepGroups?.[groupIndex]?.processSteps?.[stepIndex]
																	?.multipleMeasurementMaximumCount
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
							<Grid item xs={12} md={6}>
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

							{/* CTQ and Allow Attachments */}
							<Grid item xs={12} md={6}>
								<Box sx={{ display: 'flex', gap: 2 }}>
									<Controller
										name={`processStepGroups.${groupIndex}.processSteps.${stepIndex}.ctq`}
										control={control}
										render={({ field }) => (
											<FormControlLabel
												control={<Checkbox checked={field.value} onChange={field.onChange} color="primary" />}
												label="CTQ"
											/>
										)}
									/>
									<Controller
										name={`processStepGroups.${groupIndex}.processSteps.${stepIndex}.allowAttachments`}
										control={control}
										render={({ field }) => (
											<FormControlLabel
												control={<Checkbox checked={field.value} onChange={field.onChange} color="primary" />}
												label="Allow Attachments"
											/>
										)}
									/>
								</Box>
							</Grid>

							{/* Notes */}
							<Grid item xs={12}>
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
