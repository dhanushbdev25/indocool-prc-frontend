import type { ExecutionData, TimelineStep } from '../../../types/execution.types';
import { mapInspection } from './mapInspection';
import { mapBom, mapRawMaterials } from './mapMaterials';
import { mapSectionShell } from './mapSectionShell';
import { mapSequence } from './mapSequence';
import type { DocSectionBody, DocSectionModel } from './types';

function body(
	step: TimelineStep,
	agg: Record<string, unknown>,
	tim: Record<string, unknown>,
	shellHasContent: boolean
): DocSectionBody {
	switch (step.type) {
		case 'setup':
			// SAP Set ID is in the header, so setup carries only its timing and approvals.
			return { hasData: shellHasContent, tables: [], notes: [] };
		case 'rawMaterials':
			return mapRawMaterials(step);
		case 'bom':
			return mapBom(step, agg);
		case 'sequence':
			return mapSequence(step, agg, tim);
		case 'inspection':
			return mapInspection(step, agg);
		default:
			return { hasData: true, unavailable: 'This step is not included in the printed report.', tables: [], notes: [] };
	}
}

/** One printed section per timeline step. */
export function mapSection(
	step: TimelineStep,
	index: number,
	_execution: ExecutionData,
	agg: Record<string, unknown>,
	tim: Record<string, unknown>
): DocSectionModel {
	const shell = mapSectionShell(step, `${step.type}-${step.stepNumber}-${index}`, agg, tim);
	return { ...shell, ...body(step, agg, tim, shell.meta.length > 0 || shell.approvals.length > 0) };
}
