import { useState } from 'react';
import {
	Box,
	Paper,
	Typography,
	Grid,
	Card,
	CardContent,
	Divider,
	Chip,
	Accordion,
	AccordionSummary,
	AccordionDetails
} from '@mui/material';
import {
	Group as GroupIcon,
	ExpandMore as ExpandMoreIcon,
	PlaylistAdd as StepIcon,
	AttachFile as AttachFileIcon,
	Assessment as AssessmentIcon,
	Straighten as StraightenIcon
} from '@mui/icons-material';
import {
	type ProcessStepGroup,
	type ProcessStep
} from '../../../../../../store/api/business/sequence-master/sequence.validators';

interface ViewSequenceStepGroupsProps {
	stepGroups: ProcessStepGroup[];
}

const ViewSequenceStepGroups = ({ stepGroups }: ViewSequenceStepGroupsProps) => {
	const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([0]));

	const toggleGroupExpansion = (index: number) => {
		const newExpanded = new Set(expandedGroups);
		if (newExpanded.has(index)) {
			newExpanded.delete(index);
		} else {
			newExpanded.add(index);
		}
		setExpandedGroups(newExpanded);
	};

	const getStepTypeColor = (stepType: string) => {
		switch (stepType) {
			case 'Measurement':
				return '#2196f3';
			case 'Check':
				return '#4caf50';
			case 'Inspection':
				return '#ff9800';
			case 'Operation':
				return '#9c27b0';
			default:
				return '#9e9e9e';
		}
	};

	const getTargetValueTypeColor = (targetValueType: string) => {
		switch (targetValueType) {
			case 'range':
				return '#2196f3';
			case 'exact value':
				return '#4caf50';
			case 'ok/not ok':
				return '#ff9800';
			default:
				return '#9e9e9e';
		}
	};

	const renderStep = (step: ProcessStep, stepIndex: number) => {
		return (
			<Card
				key={stepIndex}
				sx={{
					mb: 2,
					border: '1px solid #e0e0e0',
					borderRadius: '12px',
					boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
				}}
			>
				<CardContent>
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
						<Box sx={{ display: 'flex', alignItems: 'center' }}>
							<StepIcon sx={{ mr: 1, color: '#1976d2' }} />
							<Typography variant="h6" sx={{ fontWeight: 600 }}>
								Step {step.stepNumber}
							</Typography>
							<Chip
								label={step.stepType}
								size="small"
								sx={{
									ml: 2,
									backgroundColor: getStepTypeColor(step.stepType),
									color: 'white',
									fontSize: '0.75rem',
									height: '24px'
								}}
							/>
							{step.ctq && (
								<Chip
									label="CTQ"
									size="small"
									sx={{
										ml: 1,
										backgroundColor: '#f44336',
										color: 'white',
										fontSize: '0.75rem',
										height: '24px',
										fontWeight: 600
									}}
								/>
							)}
						</Box>
					</Box>

					<Grid container spacing={2}>
						{/* Parameter Description */}
						<Grid size={{ xs: 12 }}>
							<Box>
								<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
									Parameter Description
								</Typography>
								<Typography variant="body1" sx={{ color: '#333', fontWeight: 500 }}>
									{step.parameterDescription}
								</Typography>
							</Box>
						</Grid>

						{/* Evaluation Method */}
						<Grid size={{ xs: 12, md: 6 }}>
							<Box>
								<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
									Evaluation Method
								</Typography>
								<Box sx={{ display: 'flex', alignItems: 'center' }}>
									<AssessmentIcon sx={{ mr: 1, color: '#1976d2', fontSize: '1.2rem' }} />
									<Typography variant="body2" sx={{ color: '#333' }}>
										{step.evaluationMethod}
									</Typography>
								</Box>
							</Box>
						</Grid>

						{/* Target Value Type */}
						<Grid size={{ xs: 12, md: 6 }}>
							<Box>
								<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
									Target Value Type
								</Typography>
								<Chip
									label={step.targetValueType}
									size="small"
									sx={{
										backgroundColor: getTargetValueTypeColor(step.targetValueType),
										color: 'white',
										fontSize: '0.75rem',
										height: '24px'
									}}
								/>
							</Box>
						</Grid>

						{/* Target Values */}
						{(step.targetValueType === 'range' || step.targetValueType === 'exact value') && (
							<Grid size={{ xs: 12 }}>
								<Box>
									<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
										Acceptance Values
									</Typography>
									<Grid container spacing={2}>
										<Grid size={{ xs: 6 }}>
											<Paper sx={{ p: 2, backgroundColor: '#e3f2fd', border: '1px solid #2196f3' }}>
												<Typography variant="caption" sx={{ color: '#1565c0', fontWeight: 600 }}>
													MINIMUM
												</Typography>
												<Typography variant="h6" sx={{ color: '#1565c0', fontWeight: 600 }}>
													{step.minimumAcceptanceValue}
												</Typography>
											</Paper>
										</Grid>
										<Grid size={{ xs: 6 }}>
											<Paper sx={{ p: 2, backgroundColor: '#ffebee', border: '1px solid #f44336' }}>
												<Typography variant="caption" sx={{ color: '#c62828', fontWeight: 600 }}>
													MAXIMUM
												</Typography>
												<Typography variant="h6" sx={{ color: '#c62828', fontWeight: 600 }}>
													{step.maximumAcceptanceValue}
												</Typography>
											</Paper>
										</Grid>
									</Grid>
								</Box>
							</Grid>
						)}

						{/* UOM */}
						<Grid size={{ xs: 12, md: 6 }}>
							<Box>
								<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
									Unit of Measurement
								</Typography>
								<Box sx={{ display: 'flex', alignItems: 'center' }}>
									<StraightenIcon sx={{ mr: 1, color: '#1976d2', fontSize: '1.2rem' }} />
									<Typography variant="body2" sx={{ color: '#333', fontWeight: 500 }}>
										{step.uom}
									</Typography>
								</Box>
							</Box>
						</Grid>

						{/* Multiple Measurements */}
						<Grid size={{ xs: 12, md: 6 }}>
							<Box>
								<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
									Multiple Measurements
								</Typography>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									<Chip
										label={step.multipleMeasurements ? 'Enabled' : 'Disabled'}
										size="small"
										color={step.multipleMeasurements ? 'success' : 'default'}
										sx={{ fontSize: '0.75rem', height: '24px' }}
									/>
									{step.multipleMeasurements && step.multipleMeasurementMaxCount && (
										<Chip
											label={`Max: ${step.multipleMeasurementMaxCount}`}
											size="small"
											sx={{
												backgroundColor: '#ff9800',
												color: 'white',
												fontSize: '0.75rem',
												height: '24px'
											}}
										/>
									)}
								</Box>
							</Box>
						</Grid>

						{/* Additional Options */}
						<Grid size={{ xs: 12 }}>
							<Box>
								<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
									Additional Options
								</Typography>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									{step.allowAttachments && (
										<Chip
											icon={<AttachFileIcon sx={{ fontSize: '0.875rem' }} />}
											label="Attachments Allowed"
											size="small"
											sx={{
												backgroundColor: '#4caf50',
												color: 'white',
												fontSize: '0.75rem',
												height: '24px'
											}}
										/>
									)}
								</Box>
							</Box>
						</Grid>

						{/* Notes */}
						{step.notes && (
							<Grid size={{ xs: 12 }}>
								<Divider sx={{ my: 1 }} />
								<Box>
									<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
										Step Notes
									</Typography>
									<Paper
										sx={{
											p: 2,
											backgroundColor: '#f8f9fa',
											border: '1px solid #e9ecef',
											borderRadius: '8px'
										}}
									>
										<Typography variant="body2" sx={{ color: '#333', lineHeight: 1.5 }}>
											{step.notes}
										</Typography>
									</Paper>
								</Box>
							</Grid>
						)}
					</Grid>
				</CardContent>
			</Card>
		);
	};

	const renderStepGroup = (stepGroup: ProcessStepGroup, groupIndex: number) => {
		const isExpanded = expandedGroups.has(groupIndex);
		const ctqSteps = stepGroup.steps?.filter(step => step.ctq).length || 0;

		return (
			<Accordion
				key={groupIndex}
				expanded={isExpanded}
				onChange={() => toggleGroupExpansion(groupIndex)}
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
						'&.Mui-expanded': {
							borderRadius: '12px 12px 0 0'
						}
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
						<GroupIcon sx={{ mr: 2, color: '#1976d2', fontSize: '1.5rem' }} />
						<Box sx={{ flexGrow: 1 }}>
							<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
								{stepGroup.processName}
							</Typography>
							<Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
								{stepGroup.processDescription}
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<Chip
								label={`${stepGroup.steps?.length || 0} steps`}
								size="small"
								sx={{
									backgroundColor: '#e3f2fd',
									color: '#1976d2',
									fontSize: '0.75rem',
									height: '24px'
								}}
							/>
							{ctqSteps > 0 && (
								<Chip
									label={`${ctqSteps} CTQ`}
									size="small"
									sx={{
										backgroundColor: '#ffebee',
										color: '#f44336',
										fontSize: '0.75rem',
										height: '24px',
										fontWeight: 600
									}}
								/>
							)}
						</Box>
					</Box>
				</AccordionSummary>
				<AccordionDetails sx={{ p: 3 }}>
					{stepGroup.steps && stepGroup.steps.length > 0 ? (
						<Box>
							<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#555', mb: 2 }}>
								Process Steps ({stepGroup.steps.length} total)
							</Typography>
							{stepGroup.steps.map((step, stepIndex) => renderStep(step, stepIndex))}
						</Box>
					) : (
						<Box sx={{ textAlign: 'center', py: 4 }}>
							<StepIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
							<Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
								No steps defined
							</Typography>
							<Typography variant="body2" sx={{ color: '#999' }}>
								This step group has no process steps configured
							</Typography>
						</Box>
					)}
				</AccordionDetails>
			</Accordion>
		);
	};

	return (
		<Box>
			<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
				<GroupIcon sx={{ mr: 1, color: '#1976d2' }} />
				<Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
					Process Step Groups
				</Typography>
			</Box>

			<Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
				{stepGroups.length === 0 ? (
					<Box sx={{ textAlign: 'center', py: 4 }}>
						<GroupIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
						<Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
							No step groups available
						</Typography>
						<Typography variant="body2" sx={{ color: '#999' }}>
							This process sequence has no step groups defined
						</Typography>
					</Box>
				) : (
					<Box>
						<Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
							This process sequence has {stepGroups.length} step group{stepGroups.length > 1 ? 's' : ''} with{' '}
							{stepGroups.reduce((total, group) => total + (group.steps?.length || 0), 0)} total steps.
						</Typography>
						{stepGroups.map((stepGroup, groupIndex) => renderStepGroup(stepGroup, groupIndex))}
					</Box>
				)}
			</Paper>
		</Box>
	);
};

export default ViewSequenceStepGroups;
