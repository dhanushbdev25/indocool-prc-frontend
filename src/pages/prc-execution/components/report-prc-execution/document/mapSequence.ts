import type { TimelineStep } from '../../../types/execution.types';
import type { ListConfig } from '../../../../../types/list-config.types';
import type { TableConfig } from '../../../../../types/table-config.types';
import {
	buildSequenceDetailedMeasurements,
	type SequenceStepTimings
} from '../../../utils/sequencePreviewMeasurements';
import { formatCompactTimeRange } from '../../../utils/timelineCardTiming';
import { formatAcceptanceRange } from '../../../../../components/masters/acceptanceRange';
import { formatSequenceCriticality } from '../../../../../utils/criticality';
import { OK_NOT_OK_TYPE_KEY } from '../../../../../utils/okNotOkLabels';
import { EMPTY, dash, exactResult, isNotOk, okNotOkResult, rangeResult, readingsResult, withUnit } from './formatters';
import { fixedSubTable, listSubTable, okNotOkText, readOkNotOk } from './mapSubTables';
import type { DocDetail, DocRow, DocSectionBody, DocTableModel } from './types';

const UNAVAILABLE = 'Data not available for this step.';
/** Saved next to the readings by the edit-after-submit flow; not readings themselves. */
const NON_READING_KEYS = new Set(['editedAfterSubmit', 'editedAfterSubmitAt']);

type Measurement = Record<string, unknown>;

const text = (value: unknown) => (typeof value === 'string' ? value : value == null ? '' : String(value));

function target(m: Measurement): string {
	const type = text(m.targetValueType);
	if (type === 'list' || type === 'table' || type === OK_NOT_OK_TYPE_KEY) return EMPTY;
	if (type === 'exact value')
		return withUnit(
			dash(m.minimumAcceptanceValue) !== EMPTY ? m.minimumAcceptanceValue : m.maximumAcceptanceValue,
			text(m.uom)
		);
	const range = formatAcceptanceRange(m.minimumAcceptanceValue as string, m.maximumAcceptanceValue as string);
	return range ? withUnit(range.replace(' to ', ' – '), text(m.uom)) : EMPTY;
}

/** Readings saved for one parameter, with each reading's own range check when it has one. */
function readings(saved: unknown): Array<{ value: unknown; validationStatus?: unknown }> | null {
	const data =
		saved && typeof saved === 'object'
			? ((saved as Record<string, unknown>).data ?? (saved as Record<string, unknown>).value)
			: undefined;
	if (!Array.isArray(data)) return null;
	return data.map(item =>
		item && typeof item === 'object' && 'value' in item
			? {
					value: (item as Record<string, unknown>).value,
					validationStatus: (item as Record<string, unknown>).validationStatus
				}
			: { value: item }
	);
}

function numericValueAndResult(m: Measurement, saved: unknown): { value: string; result: string } {
	const exact = text(m.targetValueType) === 'exact value';
	const targetValue = dash(m.minimumAcceptanceValue) !== EMPTY ? m.minimumAcceptanceValue : m.maximumAcceptanceValue;
	const resultOf = (value: unknown, status: unknown) => (exact ? exactResult(value, targetValue) : rangeResult(status));
	const list = readings(saved);
	if (list && list.length > 0) {
		const values = list.map(r => dash(r.value));
		const results = list.map(r => resultOf(r.value, r.validationStatus ?? m.validationStatus));
		return {
			value: withUnit(values.join(', '), text(m.uom)),
			result: list.length > 1 ? readingsResult(results) : results[0]
		};
	}
	return { value: withUnit(m.value, text(m.uom)), result: resultOf(m.value, m.validationStatus) };
}

function valueCell(m: Measurement, saved: unknown): { value: string; result: string; details?: DocDetail[] } {
	const type = text(m.targetValueType);
	if (type === 'list') {
		const sub = listSubTable(m.value, m.listConfig as ListConfig | undefined);
		return { value: 'See below', result: sub.result, details: [{ kind: 'table', table: sub.table }] };
	}
	if (type === 'table') {
		const sub = fixedSubTable(m.value, m.tableConfig as TableConfig | undefined);
		return { value: 'See below', result: sub.result, details: [{ kind: 'table', table: sub.table }] };
	}
	if (type === OK_NOT_OK_TYPE_KEY) {
		return { value: okNotOkText(m.value), result: okNotOkResult(readOkNotOk(m.value).value) };
	}
	return numericValueAndResult(m, saved);
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
		const { value, result, details } = valueCell(m, groupData[text(m.stepId)]);
		const instrument = dash(m.instrumentId);
		const criticality = formatSequenceCriticality(m as Parameters<typeof formatSequenceCriticality>[0]);
		return {
			key: `seq-${text(m.stepId)}`,
			cells: {
				no: String(i + 1),
				parameter: dash(m.parameterDescription),
				criticality: criticality === 'None' ? EMPTY : criticality,
				value: instrument === EMPTY ? value : `${value}\nInstrument: ${instrument}`,
				target: target(m),
				method: text(m.evaluationMethod) === 'Unknown' ? EMPTY : dash(m.evaluationMethod),
				result,
				time: timeCell(m)
			},
			strong: isNotOk(result) ? ['result'] : undefined,
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
					{ key: 'value', label: 'Value', width: '15%' },
					{ key: 'target', label: 'Target', width: '12%' },
					{ key: 'method', label: 'Method', width: '11%' },
					{ key: 'result', label: 'Result', width: '10%' },
					{ key: 'time', label: 'Start – End', width: '13%' }
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
