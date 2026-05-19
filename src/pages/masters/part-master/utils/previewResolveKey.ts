import type { PartMasterFormData } from '../components/create-part/schemas';
import type { OperationsComboResponse } from '../../../../store/api/business/prc-template/prc-template.validators';

/**
 * Stable key for deduping resolveTemplate: ignores object identity of RTK cache results.
 */
export function buildPreviewResolveRequestKey(
	form: PartMasterFormData,
	operationsData: OperationsComboResponse | undefined
): string {
	const steps = (form.prcTemplateSteps || []).map(s => ({
		stepId: s.stepId,
		type: s.type,
		group: s.group,
		blockCatalystMixing: s.blockCatalystMixing,
		requestSupervisorApproval: s.requestSupervisorApproval,
		version: s.version,
		isLatest: s.isLatest
	}));
	const opSig = (operationsData?.data ?? [])
		.map(o => `${o.value}:${o.data.operationText}:${o.data.operation}`)
		.join('|');
	return JSON.stringify({
		tid: form.templateId,
		tname: form.templateName,
		tnotes: form.templateNotes,
		tver: form.templateVersion,
		tlatest: form.templateIsLatest,
		tact: form.isTemplateActive,
		pn: form.partNumber,
		dn: form.drawingNumber,
		desc: form.description,
		pid: form.id,
		prcT: form.prcTemplate,
		steps,
		opSig
	});
}
