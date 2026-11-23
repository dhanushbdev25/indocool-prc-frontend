import type { ExecutionData, TimelineStep } from '../../../types/execution.types';
import { formatDisplayDate } from '../../../../../utils/formatDisplayDate';
import { dash } from './formatters';
import type { DocHeaderModel } from './types';

function prcMetadata(execution: ExecutionData): Record<string, unknown> {
	const meta = (execution.prcAggregatedSteps as { prcmetadata?: unknown } | undefined)?.prcmetadata;
	return meta && typeof meta === 'object' ? (meta as Record<string, unknown>) : {};
}

function stringOf(value: unknown): string {
	return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

/** SAP Set ID as the setup step saves it, falling back to the execution row. */
function sapSetId(execution: ExecutionData): string {
	return stringOf(prcMetadata(execution).productionSetId) || stringOf(execution.productionSetId);
}

export function mapHeader(execution: ExecutionData, singleStep?: TimelineStep | null): DocHeaderModel {
	const mould = [execution.mouldCode, execution.mouldId].filter(Boolean).join(' · ');
	return {
		subtitle: singleStep ? `${singleStep.stepNumber}. ${singleStep.title}` : undefined,
		orderNo: dash(execution.orderId),
		date: formatDisplayDate(execution.date),
		fields: [
			{ label: 'Part no.', value: dash(execution.partNumber) },
			{ label: 'SAP no.', value: dash(execution.sapReferenceNumber) },
			{ label: 'Part description', value: dash(execution.partDescription), span: 2 },
			{ label: 'Drawing no.', value: dash(execution.drawingNumber) },
			{ label: 'Customer', value: dash(execution.customer) },
			{ label: 'Variant', value: dash(execution.customerVariantName) },
			{ label: 'Mould', value: dash(mould) },
			{ label: 'PRC Set ID', value: dash(stringOf(prcMetadata(execution).prcSetId)) },
			{ label: 'SAP Set ID', value: dash(sapSetId(execution)) },
			{ label: 'Reservation no.', value: dash(execution.reservation) },
			{ label: 'Status', value: dash(execution.status) }
		],
		remarks: dash(execution.remarks)
	};
}
