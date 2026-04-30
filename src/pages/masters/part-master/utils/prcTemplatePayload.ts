import type { PartMasterFormData } from '../components/create-part/schemas';
import type { CreatePrcTemplateRequest } from '../../../../store/api/business/prc-template/prc-template.validators';

export type OperationComboData = {
	data?: Array<{
		value: string;
		data: { operationText: string };
	}>;
};

export type NormalizedPrcTemplateStep = {
	version: number;
	isLatest: boolean;
	sequence: number;
	stepId: number;
	type: 'sequence' | 'inspection';
	blockCatalystMixing: boolean;
	requestSupervisorApproval: boolean;
	operationID: string;
	operationText?: string;
};

export const normalizePrcTemplateSteps = (
	data: PartMasterFormData,
	operationsData?: OperationComboData
): { steps: NormalizedPrcTemplateStep[]; error: string | null } => {
	const steps = data.prcTemplateSteps || [];
	const operationTextByValue = new Map(
		(operationsData?.data ?? []).map(op => [op.value, op.data.operationText] as const)
	);

	const normalized: NormalizedPrcTemplateStep[] = [];

	for (let index = 0; index < steps.length; index += 1) {
		const step = steps[index];
		if (!step || typeof step !== 'object') {
			return { steps: [], error: `PRC step ${index + 1} is empty. Please remove it and try again.` };
		}

		const stepNumber = index + 1;
		const stepId = step.stepId;
		const stepKind = step.type;
		const group = step.group;

		if (typeof stepId !== 'number' || Number.isNaN(stepId) || stepId <= 0) {
			return { steps: [], error: `PRC step ${stepNumber} has an invalid Step ID.` };
		}
		if (stepKind !== 'sequence' && stepKind !== 'inspection') {
			return { steps: [], error: `PRC step ${stepNumber} has an invalid Step Type.` };
		}
		if (typeof group !== 'string' || group.trim().length === 0) {
			return { steps: [], error: `PRC step ${stepNumber} has no Operation Group selected.` };
		}

		const operationText = operationTextByValue.get(group);

		normalized.push({
			version: step.version ?? 1,
			isLatest: step.isLatest ?? true,
			sequence: index + 3,
			stepId,
			type: stepKind,
			blockCatalystMixing: step.blockCatalystMixing ?? false,
			requestSupervisorApproval: step.requestSupervisorApproval ?? false,
			operationID: group,
			...(typeof operationText === 'string' && operationText.trim().length > 0 ? { operationText } : {})
		});
	}

	return { steps: normalized, error: null };
};

export const buildPrcTemplatePayload = (
	data: PartMasterFormData,
	normalizedSteps: NormalizedPrcTemplateStep[]
): CreatePrcTemplateRequest => {
	const resolvedTemplateId =
		typeof data.templateId === 'string' && data.templateId.trim().length > 0
			? data.templateId.trim()
			: `${(data.partNumber || data.drawingNumber || 'part').trim()}-prc-1`;
	const resolvedTemplateName =
		typeof data.templateName === 'string' && data.templateName.trim().length > 0
			? data.templateName.trim()
			: `${(data.partNumber || data.drawingNumber || 'part').trim()}-prc-1`;

	const templateRequestData = {
		status: data.isTemplateActive ? ('ACTIVE' as const) : ('INACTIVE' as const),
		templateId: resolvedTemplateId,
		templateName: resolvedTemplateName,
		notes: data.templateNotes || '',
		version: data.templateVersion ?? 1,
		isLatest: data.templateIsLatest ?? true,
		isActive: data.isTemplateActive ?? true
	};

	return {
		prcTemplate: templateRequestData,
		prcTemplateSteps: normalizedSteps
	};
};
