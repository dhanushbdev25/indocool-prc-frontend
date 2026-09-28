import type { PartDetail } from '../../../../store/api/business/part-master/part.validators';
import type { PrcTemplateDetail } from '../../../../store/api/business/prc-template/prc-template.validators';
import { defaultPartMasterFormData, type PartMasterFormData } from '../components/create-part/schemas';
import { resolveTemplateStepDetail } from '../../prc-template-master/utils/templateStepDetail';

/**
 * Rebuilds the form snapshot the PRC execution preview expects from data the view screen already
 * holds, so the preview can run without the edit form.
 *
 * The edit screen resolves each step's name by loading every sequence and every inspection and
 * matching on id. This does not: `GET prcTemplate/:id` hydrates each step with its linked master,
 * so the names come straight off the step (see `resolveTemplateStepDetail`) and the view screen
 * needs no extra list fetches.
 *
 * Starts from `defaultPartMasterFormData` so every field the schema requires is present; only the
 * fields the preview actually reads are overridden.
 */
export function buildPartPreviewSnapshot(
	part: PartDetail,
	template: PrcTemplateDetail | undefined
): PartMasterFormData {
	const partMaster = part.partMaster;
	const tpl = template?.prcTemplate;

	const prcTemplateSteps = (template?.prcTemplateSteps || []).map(step => {
		const detail = resolveTemplateStepDetail(step);
		const group = step.operationID ?? step.group ?? '';
		const operationText =
			typeof step.operationText === 'string' && step.operationText.trim().length > 0 ? step.operationText : undefined;

		return {
			id: step.id,
			version: step.version,
			isLatest: step.isLatest,
			sequence: step.sequence,
			stepId: step.stepId ?? undefined,
			type: step.type,
			blockCatalystMixing: step.blockCatalystMixing,
			requestSupervisorApproval: step.requestSupervisorApproval,
			itemName: detail.name ?? '',
			itemId: detail.code ?? '',
			itemType: step.type as 'sequence' | 'inspection',
			group,
			operationText
		};
	});

	return {
		...defaultPartMasterFormData,
		id: partMaster.id,
		partNumber: partMaster.partNumber,
		drawingNumber: partMaster.drawingNumber,
		drawingRevision: partMaster.drawingRevision ?? 1,
		partRevision: partMaster.partRevision ?? 1,
		isActive: partMaster.status === 'ACTIVE',
		customer: partMaster.customer,
		customerVariantId: partMaster.customerVariantId ?? undefined,
		description: partMaster.description,
		notes: partMaster.notes || '',
		layupType: partMaster.layupType || '',
		model: partMaster.model || '',
		sapReferenceNumber: partMaster.sapReferenceNumber || '',
		version: partMaster.version ?? 1,
		isLatest: partMaster.isLatest ?? true,
		catalyst: partMaster.catalyst || undefined,
		prcTemplate: partMaster.prcTemplate || undefined,
		templateId: tpl?.templateId ?? '',
		templateName: tpl?.templateName ?? '',
		templateNotes: tpl?.notes || '',
		isTemplateActive: tpl?.isActive ?? true,
		templateVersion: tpl?.version ?? 1,
		templateIsLatest: tpl?.isLatest ?? true,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		prcTemplateSteps: prcTemplateSteps as any,
		rawMaterials: (part.rawMaterials || []).map(rm => ({
			id: rm.id,
			materialName: rm.materialName,
			materialCode: rm.materialCode,
			materialGroup: rm.materialGroup ?? '',
			quantity: rm.quantity,
			uom: rm.uom,
			batching: rm.batching ?? false,
			splitting: rm.splitting ?? false,
			splittingConfiguration: rm.splittingConfiguration
				? rm.splittingConfiguration.map(split => ({ order: split.order, splitQuantity: String(split.splitQuantity) }))
				: null,
			version: rm.version ?? 1,
			isLatest: rm.isLatest ?? true
		})),
		operationWiseData: partMaster.operationWiseData ?? [],
		files: partMaster.files || [],
		inspectionDiagrams: partMaster.inspectionDiagrams
			? (() => {
					const d = Array.isArray(partMaster.inspectionDiagrams)
						? partMaster.inspectionDiagrams[0]
						: partMaster.inspectionDiagrams;
					return { partId: d.partId, files: d.files ?? [] };
				})()
			: undefined,
		createdAt: partMaster.createdAt || undefined,
		updatedAt: partMaster.updatedAt || undefined
	};
}
