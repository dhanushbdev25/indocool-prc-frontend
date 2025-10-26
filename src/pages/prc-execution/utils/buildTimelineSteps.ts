import { type TimelineStep, type ExecutionData } from '../types/execution.types';

export function buildTimelineSteps(executionData: ExecutionData): TimelineStep[] {
	const steps: TimelineStep[] = [];
	let stepNumber = 1;

	// Step 1: Raw Materials
	if (executionData.rawMaterials && executionData.rawMaterials.length > 0) {
		const isCompleted = executionData.prcAggregatedSteps?.rawMaterials !== undefined;
		steps.push({
			stepNumber: stepNumber++,
			type: 'rawMaterials',
			title: 'Raw Materials Validation',
			description: 'Validate raw materials quantities and batch tracking',
			status: isCompleted ? 'completed' : 'pending',
			ctq: false,
			items: executionData.rawMaterials.map(material => ({
				id: material.id,
				name: material.materialName,
				quantity: material.quantity,
				uom: material.uom,
				description: material.materialCode,
				batching: material.batching
			}))
		});
	}

	// Step 2: Catalyst Mixing (formerly BOM)
	if (executionData.bom && executionData.bom.length > 0) {
		const isCompleted = executionData.prcAggregatedSteps?.bom !== undefined;
		steps.push({
			stepNumber: stepNumber++,
			type: 'bom',
			title: 'Catalyst Mixing',
			description: 'Configure catalyst mixing based on temperature, humidity, and material quantities',
			status: isCompleted ? 'completed' : 'pending',
			ctq: false,
			items: executionData.bom.map(bom => ({
				id: bom.id,
				name: bom.materialName,
				quantity: bom.quantity,
				splitQuantity: bom.splitQuantity,
				uom: bom.uom,
				description: bom.materialCode,
				materialType: bom.materialCode,
				materialCode: bom.materialCode,
				materialName: bom.materialName,
				order: bom.order,
				splitting: bom.splitting,
				splittingConfiguration: bom.splittingConfiguration
			}))
		});
	}

	// Process prcTemplateSteps
	if (executionData.prcCurrentTemplate?.prcTemplateSteps) {
		const sortedSteps = [...executionData.prcCurrentTemplate.prcTemplateSteps].sort((a, b) => a.sequence - b.sequence);

		for (const prcTemplateStep of sortedSteps) {
			if (prcTemplateStep.type === 'sequence' && prcTemplateStep.data) {
				// For sequence type, create step groups as main timeline steps
				const sequenceData = prcTemplateStep.data as {
					stepGroups: Array<{
						id: number;
						steps: Array<{
							id: number;
							ctq: boolean;
							stepType: string;
							targetValueType: string;
							uom: string;
							minValue?: string;
							maxValue?: string;
							multipleMeasurements: boolean;
							notes: string;
							parameterDescription: string;
							evaluationMethod: string;
							allowAttachments: boolean;
						}>;
						processName: string;
						processDescription: string;
					}>;
				};
				if (sequenceData.stepGroups) {
					for (const stepGroup of sequenceData.stepGroups) {
						const isCompleted = isSequenceStepGroupCompleted(
							executionData.prcAggregatedSteps,
							prcTemplateStep.id,
							stepGroup.id,
							stepGroup.steps,
							stepGroup.steps.some(step => step.ctq)
						);

						// Check if ready for completion (all approvals done but not completed)
						const isReadyForCompletion = isSequenceStepGroupReadyForCompletion(
							executionData.prcAggregatedSteps,
							prcTemplateStep.id,
							stepGroup.id,
							stepGroup.steps,
							stepGroup.steps.some(step => step.ctq)
						);

						steps.push({
							stepNumber: stepNumber++,
							type: 'sequence',
							title: stepGroup.processName,
							description: stepGroup.processDescription,
							status: isCompleted ? 'completed' : isReadyForCompletion ? 'in-progress' : 'pending',
							ctq: stepGroup.steps.some(step => step.ctq),
							prcTemplateStepId: prcTemplateStep.id,
							stepGroup: {
								id: stepGroup.id,
								processName: stepGroup.processName,
								processDescription: stepGroup.processDescription,
								sequenceTiming: stepGroup.sequenceTiming,
								steps: stepGroup.steps.map(step => ({
									...step,
									minValue: step.minValue,
									maxValue: step.maxValue,
									minimumAcceptanceValue: step.minValue,
									maximumAcceptanceValue: step.maxValue,
									stepNumber: step.id, // Use step id as step number for now
									version: 1,
									isLatest: true,
									createdAt: new Date().toISOString(),
									updatedAt: new Date().toISOString(),
									processStepGroupId: stepGroup.id,
									responsiblePerson: step.responsiblePerson
								}))
							}
						});
					}
				}
			} else if (prcTemplateStep.type === 'inspection' && prcTemplateStep.data) {
				// For inspection type, group all parameters into one timeline step
				const inspectionData = prcTemplateStep.data as {
					inspection: {
						inspectionName: string;
					};
					inspectionParameters: Array<{
						id: number;
						parameterName: string;
						type: string;
						ctq: boolean;
						role: string;
						columns: Array<{
							name: string;
							type: string;
							defaultValue?: string;
							tolerance?: string;
						}>;
						specification: string;
						order: number;
						files?: Array<{
							fileName: string;
							filePath: string;
							originalFileName: string;
						}>;
					}>;
				};
				const isCompleted = isInspectionStepCompleted(
					executionData.prcAggregatedSteps,
					prcTemplateStep.id,
					inspectionData.inspectionParameters?.some(p => p.ctq) || false
				);

				// Check if ready for completion (all approvals done but not completed)
				const isReadyForCompletion = isInspectionStepReadyForCompletion(
					executionData.prcAggregatedSteps,
					prcTemplateStep.id,
					inspectionData.inspectionParameters?.some(p => p.ctq) || false
				);

				steps.push({
					stepNumber: stepNumber++,
					type: 'inspection',
					title: `${inspectionData.inspection?.inspectionName || 'Inspection'}`,
					description: inspectionData.inspection?.inspectionName || 'Quality inspection parameters',
					status: isCompleted ? 'completed' : isReadyForCompletion ? 'in-progress' : 'pending',
					ctq: inspectionData.inspectionParameters?.some(p => p.ctq) || false,
					stepData: {
						prcTemplateStepId: prcTemplateStep.id,
						stepGroupId: 0,
						stepId: 0,
						stepType: 'inspection',
						targetValueType: 'text',
						uom: '',
						multipleMeasurements: false,
						notes: '',
						parameterDescription: '',
						evaluationMethod: '',
						allowAttachments: false
					},
					inspectionParameters:
						inspectionData.inspectionParameters?.map(param => ({
							id: param.id,
							parameterName: param.parameterName,
							type: param.type,
							ctq: param.ctq,
							role: param.role,
							columns: param.columns || [],
							specification: param.specification,
							order: param.order,
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							tolerance: (param as any).tolerance || '',
							files: param.files || [],
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							version: (param as any).version || 1,
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							isLatest: (param as any).isLatest !== undefined ? (param as any).isLatest : true,
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							createdAt: (param as any).createdAt || new Date().toISOString(),
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							updatedAt: (param as any).updatedAt || new Date().toISOString(),
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							inspectionId: (param as any).inspectionId || prcTemplateStep.id
						})) || [],
					inspectionMetadata: inspectionData.inspection
						? {
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								id: (inspectionData.inspection as any).id || prcTemplateStep.id,
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								type: (inspectionData.inspection as any).type || 'inspection',
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								status: (inspectionData.inspection as any).status || 'active',
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								version: (inspectionData.inspection as any).version || 1,
								isLatest:
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									(inspectionData.inspection as any).isLatest !== undefined
										? // eslint-disable-next-line @typescript-eslint/no-explicit-any
											(inspectionData.inspection as any).isLatest
										: true,
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								createdAt: (inspectionData.inspection as any).createdAt || new Date().toISOString(),
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								updatedAt: (inspectionData.inspection as any).updatedAt || new Date().toISOString(),
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								inspectionId: (inspectionData.inspection as any).inspectionId || prcTemplateStep.id.toString(),
								inspectionName: inspectionData.inspection.inspectionName || 'Inspection'
							}
						: undefined
				});
			}
		}
	}

	// Mark the first incomplete step as 'in-progress'
	const firstIncompleteIndex = steps.findIndex(step => step.status === 'pending');
	if (firstIncompleteIndex >= 0) {
		steps[firstIncompleteIndex].status = 'in-progress';
	}

	return steps;
}

function isSequenceStepGroupCompleted(
	prcAggregatedSteps: Record<string, unknown> | undefined,
	prcTemplateStepId: number,
	stepGroupId: number,
	steps: Array<{ id: number }>,
	ctq: boolean
): boolean {
	if (!prcAggregatedSteps) return false;

	const stepData = prcAggregatedSteps[prcTemplateStepId.toString()] as Record<string, unknown>;
	if (!stepData) return false;

	const groupData = stepData[stepGroupId.toString()] as Record<string, unknown>;
	if (!groupData) return false;

	// Check if all steps within the group are filled
	const allStepsFilled = steps.every(step => groupData[step.id.toString()] !== undefined);
	if (!allStepsFilled) return false;

	// Check if both productionApproved AND stepCompleted are true
	// CTQ approval is only required if the step is CTQ
	let productionApproved = false;
	let ctqApproved = false;
	let stepCompleted = false;

	const stepGroupData = prcAggregatedSteps[prcTemplateStepId.toString()] as Record<string, unknown>;
	if (stepGroupData && stepGroupData[stepGroupId.toString()]) {
		const groupData = stepGroupData[stepGroupId.toString()] as Record<string, unknown>;
		productionApproved = groupData.productionApproved === true;
		ctqApproved = !ctq || groupData.ctqApproved === true || groupData.partialCtqApprove === true; // Only require CTQ approval if step is CTQ
		stepCompleted = groupData.stepCompleted === true;
	}

	// A step is considered completed only when both productionApproved and stepCompleted are set to true
	// CTQ approval is only required if the step is CTQ
	return productionApproved && stepCompleted && ctqApproved;
}

function isSequenceStepGroupReadyForCompletion(
	prcAggregatedSteps: Record<string, unknown> | undefined,
	prcTemplateStepId: number,
	stepGroupId: number,
	steps: Array<{ id: number }>,
	ctq: boolean
): boolean {
	if (!prcAggregatedSteps) return false;

	const stepData = prcAggregatedSteps[prcTemplateStepId.toString()] as Record<string, unknown>;
	if (!stepData) return false;

	const groupData = stepData[stepGroupId.toString()] as Record<string, unknown>;
	if (!groupData) return false;

	// Check if all steps within the group are filled
	const allStepsFilled = steps.every(step => groupData[step.id.toString()] !== undefined);
	if (!allStepsFilled) return false;

	// Check if both approvals are done (but not necessarily completed)
	let productionApproved = false;
	let ctqApproved = false;

	const stepGroupData = prcAggregatedSteps[prcTemplateStepId.toString()] as Record<string, unknown>;
	if (stepGroupData && stepGroupData[stepGroupId.toString()]) {
		const groupData = stepGroupData[stepGroupId.toString()] as Record<string, unknown>;
		productionApproved = groupData.productionApproved === true;
		ctqApproved = !ctq || groupData.ctqApproved === true || groupData.partialCtqApprove === true;
	}

	return productionApproved && ctqApproved;
}

function isInspectionStepCompleted(
	prcAggregatedSteps: Record<string, unknown> | undefined,
	prcTemplateStepId: number,
	ctq: boolean = false
): boolean {
	if (!prcAggregatedSteps) return false;

	const stepData = prcAggregatedSteps[prcTemplateStepId.toString()] as Record<string, unknown>;
	if (!stepData || Object.keys(stepData).length === 0) return false;

	// Check if both productionApproved AND stepCompleted are true
	// CTQ approval is only required if the step is CTQ
	let productionApproved = false;
	let ctqApproved = false;
	let stepCompleted = false;

	// Look for approval flags in the step data
	productionApproved = stepData.productionApproved === true;
	ctqApproved = !ctq || stepData.ctqApproved === true || stepData.partialCtqApprove === true; // Only require CTQ approval if step is CTQ
	stepCompleted = stepData.stepCompleted === true;

	// A step is considered completed only when both productionApproved and stepCompleted are set to true
	// CTQ approval is only required if the step is CTQ
	return productionApproved && stepCompleted && ctqApproved;
}

function isInspectionStepReadyForCompletion(
	prcAggregatedSteps: Record<string, unknown> | undefined,
	prcTemplateStepId: number,
	ctq: boolean = false
): boolean {
	if (!prcAggregatedSteps) return false;

	const stepData = prcAggregatedSteps[prcTemplateStepId.toString()] as Record<string, unknown>;
	if (!stepData || Object.keys(stepData).length === 0) return false;

	// Check if both approvals are done (but not necessarily completed)
	let productionApproved = false;
	let ctqApproved = false;

	// Look for approval flags in the step data
	productionApproved = stepData.productionApproved === true;
	ctqApproved = !ctq || stepData.ctqApproved === true || stepData.partialCtqApprove === true; // Only require CTQ approval if step is CTQ

	return productionApproved && ctqApproved;
}
