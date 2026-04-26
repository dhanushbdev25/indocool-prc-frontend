import type { ExecutionData, OperationWiseExecutionRow } from '../../../prc-execution/types/execution.types';
import type { PrcTemplateDetail } from '../../../../store/api/business/prc-template/prc-template.validators';
import type { PartMasterFormData } from '../components/create-part/schemas';

export function normalizeResolvedTemplateForExecution(
	detail: PrcTemplateDetail
): NonNullable<ExecutionData['prcCurrentTemplate']> {
	const { prcTemplate, prcTemplateSteps } = detail;
	const normalizedSteps = prcTemplateSteps.map((step, i) => {
		const id =
			typeof step.id === 'number' && step.id > 0
				? step.id
				: typeof step.sequence === 'number'
					? -Math.abs(step.sequence) - i
					: -(i + 1);
		return { ...step, id };
	});

	return {
		prcTemplate: {
			id: prcTemplate.id ?? 0,
			templateId: prcTemplate.templateId,
			templateName: prcTemplate.templateName,
			version: prcTemplate.version,
			status: prcTemplate.status,
			notes: prcTemplate.notes
		},
		prcTemplateSteps: normalizedSteps.map(s => ({
			id: s.id as number,
			type: s.type,
			stepId: s.stepId ?? undefined,
			sequence: s.sequence,
			data: s.data
		}))
	};
}

function mapOperationWiseToExecution(
	rows: PartMasterFormData['operationWiseData'] | undefined
): OperationWiseExecutionRow[] | undefined {
	if (!rows?.length) return undefined;
	return rows.map(row => {
		const l1 = Number(row.l1Count) || 0;
		const l2 = Number(row.l2Count) || 0;
		const l3 = Number(row.l3Count) || 0;
		const l4 = Number(row.l4Count) || 0;
		const sumSkills = l1 + l2 + l3 + l4;
		const fallback = Number(row.responsiblePersonCount);
		const count =
			sumSkills >= 1 ? sumSkills : Number.isFinite(fallback) && fallback >= 1 ? Math.floor(fallback) : 1;
		return {
			id: row.id,
			operationID: row.operationID,
			operationName: row.operationName,
			responsiblePersonCount: count
		};
	});
}

function mapRawMaterials(form: PartMasterFormData): ExecutionData['rawMaterials'] {
	const rm = form.rawMaterials || [];
	if (!rm.length) return undefined;
	return rm.map((r, i) => ({
		id: typeof r.id === 'number' ? r.id : -(i + 1),
		materialCode: r.materialCode,
		materialName: r.materialName,
		quantity: String(r.quantity ?? ''),
		uom: r.uom,
		batching: r.batching ?? false
	}));
}

type BomFormRow = {
	id?: number;
	uom?: string;
	order?: number;
	version?: number;
	batching?: boolean;
	isLatest?: boolean;
	quantity?: string;
	createdAt?: string;
	splitting?: boolean;
	updatedAt?: string;
	materialCode?: string;
	materialName?: string;
	splitQuantity?: string;
	splittingConfiguration?: Array<{ order: number; splitQuantity: string }> | null;
};

function mapBomFromForm(form: PartMasterFormData): ExecutionData['bom'] {
	const bom = (form as PartMasterFormData & { bom?: BomFormRow[] }).bom;
	if (!Array.isArray(bom) || bom.length === 0) return undefined;
	const now = new Date().toISOString();
	return bom.map((row, i) => ({
		id: typeof row.id === 'number' ? row.id : -(i + 1),
		uom: String(row.uom ?? ''),
		order: typeof row.order === 'number' ? row.order : i,
		partId: form.id ?? 0,
		version: typeof row.version === 'number' ? row.version : 1,
		batching: Boolean(row.batching),
		isLatest: row.isLatest !== false,
		quantity: String(row.quantity ?? ''),
		createdAt: typeof row.createdAt === 'string' ? row.createdAt : now,
		splitting: Boolean(row.splitting),
		updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : now,
		materialCode: String(row.materialCode ?? ''),
		materialName: String(row.materialName ?? ''),
		splitQuantity: String(row.splitQuantity ?? ''),
		splittingConfiguration: Array.isArray(row.splittingConfiguration) ? row.splittingConfiguration : null
	}));
}

function mapInspectionDiagramsForExecution(
	diagrams: PartMasterFormData['inspectionDiagrams'] | undefined
): ExecutionData['inspectionDiagrams'] {
	if (!diagrams?.files?.length) return undefined;

	const normalizeFileEntries = (
		entries: Array<{
			fileName?: string;
			filePath?: string;
			originalFileName?: string;
		}>
	) =>
		(entries || []).filter(
			fileObj => fileObj !== undefined && fileObj !== null && typeof fileObj === 'object'
		);

	return {
		files: diagrams.files.map(file => ({
			inspectionParameterId: file.inspectionParameterId || 0,
			fileName: normalizeFileEntries(file.fileName || []),
			rowMappings: (file.rowMappings || [])
				.filter((row): row is { rowIndex: number; fileName?: typeof file.fileName } => typeof row?.rowIndex === 'number')
				.map(row => ({
					rowIndex: row.rowIndex,
					fileName: normalizeFileEntries(row.fileName || [])
				}))
		}))
	};
}

export function buildExecutionPreviewStub(
	form: PartMasterFormData,
	resolvedDetail: PrcTemplateDetail
): ExecutionData {
	const now = new Date().toISOString();
	const prcCurrentTemplate = normalizeResolvedTemplateForExecution(resolvedDetail);

	return {
		id: 0,
		customer: form.customer || '—',
		partId: form.id ?? 0,
		partNumber: form.partNumber || '—',
		partDescription: form.description || '',
		version: form.version ?? 1,
		productionSetId: '',
		mouldId: '',
		date: now.slice(0, 10),
		shift: '',
		inCharge: 0,
		drawingNumber: form.drawingNumber || '',
		status: 'PREVIEW',
		prcTemplate: form.prcTemplate ?? 0,
		catalyst: form.catalyst ?? 0,
		progress: 0,
		completedCtq: 0,
		totalCtq: 0,
		duration: 0,
		stepsCompleted: 0,
		totalSteps: 0,
		currentStage: 0,
		nextStage: 0,
		createdBy: 0,
		updatedBy: 0,
		createdAt: now,
		updatedAt: now,
		customerVariantId: form.customerVariantId ?? null,
		operationWiseData: mapOperationWiseToExecution(form.operationWiseData),
		mouldingInspectionParentId: 0,
		mouldingInspectionId: 0,
		ctqMap: {},
		sequenceIds: {},
		prcCurrentTemplate,
		rawMaterials: mapRawMaterials(form),
		bom: mapBomFromForm(form),
		inspectionDiagrams: mapInspectionDiagramsForExecution(form.inspectionDiagrams),
		prcAggregatedSteps: {}
	};
}
