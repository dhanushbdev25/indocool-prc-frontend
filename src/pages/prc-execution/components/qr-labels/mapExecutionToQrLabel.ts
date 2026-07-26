import dayjs from 'dayjs';
import { DATE_PICKER_FORMAT } from '../../../../utils/dateConfig';
import type { ExecutionData } from '../../types/execution.types';

export type PrcQrLabelFields = {
	executionId: number;
	customerName: string;
	partNumber: string;
	partDescription: string;
	drawingNumber: string;
	revNo: string;
	modelNo: string;
	setIdSerialNo: string;
	productionDate: string;
	purchaseOrderNo: string;
	/** Absolute URL encoded in the QR code */
	qrUrl: string;
};

const asDisplay = (value: unknown): string => {
	if (value == null) return '';
	const s = String(value).trim();
	return s;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	value !== null && typeof value === 'object' && !Array.isArray(value);

/** Read first non-empty key from root and common nested part payloads. */
const pickField = (root: Record<string, unknown>, keys: string[]): string => {
	const sources: Record<string, unknown>[] = [root];
	for (const nestKey of ['part', 'partMaster', 'partDetails', 'partData', 'partInfo']) {
		const nested = root[nestKey];
		if (isRecord(nested)) sources.push(nested);
	}

	for (const source of sources) {
		for (const key of keys) {
			const value = asDisplay(source[key]);
			if (value) return value;
		}
	}
	return '';
};

const formatProductionDate = (date: string | undefined): string => {
	if (!date?.trim()) return '';
	const parsed = dayjs(date);
	return parsed.isValid() ? parsed.format(DATE_PICKER_FORMAT) : date.trim();
};

export function buildPrcExecutionViewUrl(executionId: number, origin = window.location.origin): string {
	return `${origin}/prc-execution/view/${executionId}`;
}

/** Map GET /prcExecution/:id payload → sticker label fields. */
export function mapExecutionToQrLabel(execution: ExecutionData): PrcQrLabelFields {
	const root = execution as unknown as Record<string, unknown>;

	const rev = pickField(root, [
		'drawingRevision',
		'drawing_revision',
		'partRevision',
		'part_revision',
		'revNo',
		'rev_no',
		'revision',
		'Revision'
	]);

	const modelNo = pickField(root, ['model', 'modelNo', 'model_no', 'modelNumber', 'model_number']);

	return {
		executionId: execution.id,
		customerName:
			asDisplay(execution.customerName) ||
			pickField(root, ['customerName', 'customer_name']) ||
			asDisplay(execution.customer),
		partNumber: asDisplay(execution.partNumber) || pickField(root, ['partNumber', 'part_number']),
		partDescription:
			asDisplay(execution.partDescription) ||
			pickField(root, ['partDescription', 'part_description', 'description']),
		drawingNumber:
			asDisplay(execution.drawingNumber) || pickField(root, ['drawingNumber', 'drawing_number']),
		revNo: rev,
		modelNo,
		setIdSerialNo:
			asDisplay(execution.productionSetId) ||
			pickField(root, ['productionSetId', 'production_set_id', 'serialNo', 'serial_no']),
		productionDate: formatProductionDate(execution.date) || formatProductionDate(pickField(root, ['date'])),
		purchaseOrderNo:
			asDisplay(execution.orderId) ||
			pickField(root, ['orderId', 'order_id', 'purchaseOrderNo', 'purchase_order_no', 'poNumber']),
		qrUrl: buildPrcExecutionViewUrl(execution.id)
	};
}

export function unwrapExecutionDetail(response: unknown): ExecutionData | null {
	if (!response || typeof response !== 'object') return null;
	const root = response as { data?: unknown };
	const data = root.data ?? response;
	if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
	const row = data as ExecutionData;
	if (typeof row.id !== 'number' || !Number.isFinite(row.id)) return null;
	return row;
}
