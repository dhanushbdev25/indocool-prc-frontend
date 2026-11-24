import type { TimelineStep } from '../../../types/execution.types';
import type { ListConfig } from '../../../../../types/list-config.types';
import type { TableConfig } from '../../../../../types/table-config.types';
import {
	buildSequenceDetailedMeasurements,
	type SequenceStepTimings
} from '../../../utils/sequencePreviewMeasurements';
import { formatCompactTimeRange } from '../../../utils/timelineCardTiming';
import { formatSequenceCriticality } from '../../../../../utils/criticality';
import { OK_NOT_OK_TYPE_KEY } from '../../../../../utils/okNotOkLabels';
import { EMPTY, dash, withUnit } from './formatters';
import { fixedSubTable, listSubTable, okNotOkText } from './mapSubTables';
import type { DocDetail, DocRow, DocSectionBody, DocTableModel } from './types';

const UNAVAILABLE = 'Data not available for this step.';
/** Saved next to the readings by the edit-after-submit flow; not readings themselves. */
const NON_READING_KEYS = new Set(['editedAfterSubmit', 'editedAfterSubmitAt']);

type Measurement = Record<string, unknown>;

const text = (value: unknown) => (typeof value === 'string' ? value : value == null ? '' : String(value));

/** Readings saved for one parameter: one value, or several when it takes multiple measurements. */
function readings(saved: unknown): unknown[] | null {
	const data =
		saved && typeof saved === 'object'
			? ((saved as Record<string, unknown>).data ?? (saved as Record<string, unknown>).value)
			: undefined;
	if (!Array.isArray(data)) return null;
	return data.map(item =>
		item && typeof item === 'object' && 'value' in item ? (item as Record<string, unknown>).value : item
	);
}

function valueCell(m: Measurement, saved: unknown): { value: string; details?: DocDetail[] } {
	const type = text(m.targetValueType);
	if (type === 'list') {
		const sub = listSubTable(m.value, m.listConfig as ListConfig | undefined);
		return { value: 'See below', details: [{ kind: 'table', table: sub.table }] };
	}
	if (type === 'table') {
		const sub = fixedSubTable(m.value, m.tableConfig as TableConfig | undefined);
		return { value: 'See below', details: [{ kind: 'table', table: sub.table }] };
	}
	if (type === OK_NOT_OK_TYPE_KEY) return { value: okNotOkText(m.value) };
	const list = readings(saved);
	if (list && list.length > 0) return { value: withUnit(list.map(dash).join(', '), text(m.uom)) };
	return { value: withUnit(m.value, text(m.uom)) };
}

function timeCell(m: Measurement): string {
	const range = formatCompactTimeRange(text(m.stepStartTime) || null, text(m.stepEndTime) || null);
	return range ? `${range.primary}\n${range.secondary}` : EMPTY;
}

/** Process sequence step: one row per parameter in template order, sub-tables under their row. */
export function mapSequence(
	step: TimelineStep,
	agg: Record<string, unknown>,
	tim: Record<string, unknown>
): DocSectionBody {
	const pid = step.prcTemplateStepId;
	const group = step.stepGroup;
	if (!pid || !group) return { hasData: true, unavailable: UNAVAILABLE, tables: [], notes: [] };

	const bucket = (agg[String(pid)] as Record<string, unknown> | undefined)?.[String(group.id)];
	const groupData = Object.fromEntries(
		Object.entries(bucket && typeof bucket === 'object' ? (bucket as Record<string, unknown>) : {}).filter(
			([key]) => !NON_READING_KEYS.has(key)
		)
	);
	const timings = (tim[String(pid)] as Record<string, SequenceStepTimings> | undefined)?.[String(group.id)];
	const position = new Map(group.steps.map((s, i) => [String(s.id), i]));
	const measurements = buildSequenceDetailedMeasurements(groupData, group.steps, timings).sort(
		(a, b) =>
			(position.get(text(a.stepId)) ?? Number.MAX_SAFE_INTEGER) -
			(position.get(text(b.stepId)) ?? Number.MAX_SAFE_INTEGER)
	);

	const rows: DocRow[] = measurements.map((m, i) => {
		const { value, details } = valueCell(m, groupData[text(m.stepId)]);
		const instrument = dash(m.instrumentId);
		const criticality = formatSequenceCriticality(m as Parameters<typeof formatSequenceCriticality>[0]);
		return {
			key: `seq-${text(m.stepId)}`,
			cells: {
				no: String(i + 1),
				parameter: dash(m.parameterDescription),
				criticality: criticality === 'None' ? EMPTY : criticality,
				value: instrument === EMPTY ? value : `${value}\nInstrument: ${instrument}`,
				method: text(m.evaluationMethod) === 'Unknown' ? EMPTY : dash(m.evaluationMethod),
				time: timeCell(m)
			},
			details
		};
	});

	const people = measurements.flatMap(m =>
		(Array.isArray(m.responsiblePersons) ? (m.responsiblePersons as Array<Record<string, unknown>>) : []).map(p => ({
			parameter: dash(m.parameterDescription),
			person: p
		}))
	);
	const tables: DocSectionBody['tables'] = [
		{
			table: {
				columns: [
					{ key: 'no', label: 'No', width: '5%' },
					{ key: 'parameter', label: 'Parameter' },
					{ key: 'criticality', label: 'Criticality', width: '11%' },
					{ key: 'value', label: 'Value', width: '24%' },
					{ key: 'method', label: 'Method', width: '14%' },
					{ key: 'time', label: 'Start – End', width: '15%' }
				],
				rows
			}
		}
	];
	if (people.length > 0) {
		const peopleTable: DocTableModel = {
			columns: [
				{ key: 'parameter', label: 'Parameter' },
				{ key: 'role', label: 'Role', width: '12%' },
				{ key: 'name', label: 'Name', width: '28%' },
				{ key: 'code', label: 'Employee no.', width: '18%' }
			],
			rows: people.map(({ parameter, person }, i) => ({
				key: `rp-${i}`,
				cells: {
					parameter,
					role: dash(person.role).toUpperCase(),
					name: dash(person.employeeName),
					code: dash(person.employeeCode)
				}
			}))
		};
		tables.push({ title: 'Responsible persons', table: peopleTable });
	}

	return {
		hasData: measurements.length > 0,
		tables,
		notes: measurements
			.filter(m => text(m.notes).trim())
			.map(m => `${dash(m.parameterDescription)}: ${text(m.notes).trim()}`)
	};
}
