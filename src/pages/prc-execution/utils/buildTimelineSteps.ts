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
				description: material.materialCode
			}))
		});
	}

	// Step 2: BOM
	if (executionData.bom && executionData.bom.length > 0) {
		const isCompleted = executionData.prcAggregatedSteps?.bom !== undefined;
		steps.push({
			stepNumber: stepNumber++,
			type: 'bom',
			title: 'BOM Validation',
			description: 'Validate bill of materials quantities',
			status: isCompleted ? 'completed' : 'pending',
			ctq: false,
			items: executionData.bom.map(bom => ({
				id: bom.id,
				name: bom.description,
				quantity: bom.bomQuantity,
				uom: '', // BOM doesn't have UOM in the API response
				description: bom.materialType
			}))
		});
	}

	// Process prcTemplateSteps
	if (executionData.prcCurrentTemplate?.prcTemplateSteps) {
		const sortedSteps = [...executionData.prcCurrentTemplate.prcTemplateSteps].sort((a, b) => a.sequence - b.sequence);

		for (const prcTemplateStep of sortedSteps) {
			if (prcTemplateStep.type === 'sequence' && prcTemplateStep.data) {
				// For sequence type, flatten stepGroups into individual timeline steps
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
						for (const step of stepGroup.steps) {
							const isCompleted = isSequenceStepCompleted(
								executionData.prcAggregatedSteps,
								prcTemplateStep.id,
								stepGroup.id,
								step.id
							);

							steps.push({
								stepNumber: stepNumber++,
								type: 'sequence',
								title: `${stepGroup.processName} - ${step.parameterDescription}`,
								description: step.notes || stepGroup.processDescription,
								status: isCompleted ? 'completed' : 'pending',
								ctq: step.ctq,
								stepData: {
									prcTemplateStepId: prcTemplateStep.id,
									stepGroupId: stepGroup.id,
									stepId: step.id,
									stepType: step.stepType,
									targetValueType: step.targetValueType,
									uom: step.uom,
									minValue: step.minValue,
									maxValue: step.maxValue,
									multipleMeasurements: step.multipleMeasurements,
									notes: step.notes,
									parameterDescription: step.parameterDescription,
									evaluationMethod: step.evaluationMethod,
									allowAttachments: step.allowAttachments
								}
							});
						}
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
						files?: Record<string, string>;
					}>;
				};
				const isCompleted = isInspectionStepCompleted(executionData.prcAggregatedSteps, prcTemplateStep.id);

				steps.push({
					stepNumber: stepNumber++,
					type: 'inspection',
					title: `${inspectionData.inspection?.inspectionName || 'Inspection'}`,
					description: inspectionData.inspection?.inspectionName || 'Quality inspection parameters',
					status: isCompleted ? 'completed' : 'pending',
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
							files: param.files || {}
						})) || []
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

function isSequenceStepCompleted(
	prcAggregatedSteps: Record<string, unknown> | undefined,
	prcTemplateStepId: number,
	stepGroupId: number,
	stepId: number
): boolean {
	if (!prcAggregatedSteps) return false;

	const stepData = prcAggregatedSteps[prcTemplateStepId.toString()] as Record<string, unknown>;
	if (!stepData) return false;

	const groupData = stepData[stepGroupId.toString()] as Record<string, unknown>;
	if (!groupData) return false;

	return groupData[stepId.toString()] !== undefined;
}

function isInspectionStepCompleted(
	prcAggregatedSteps: Record<string, unknown> | undefined,
	prcTemplateStepId: number
): boolean {
	if (!prcAggregatedSteps) return false;

	const stepData = prcAggregatedSteps[prcTemplateStepId.toString()] as Record<string, unknown>;
	return stepData !== undefined && Object.keys(stepData).length > 0;
}
