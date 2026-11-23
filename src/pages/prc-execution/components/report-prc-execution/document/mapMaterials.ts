import type { TimelineStep } from '../../../types/execution.types';
import { formatDisplayDate, formatDisplayDateTime } from '../../../../../utils/formatDisplayDate';
import { OK_NOT_OK_OPTIONS, acceptsOkNotOkComment } from '../../../../../utils/okNotOkLabels';
import { EMPTY, dash, isNotOk, rangeResult } from './formatters';
import type { DocRow, DocSectionBody } from './types';

type Item = Record<string, unknown>;

const items = (step: TimelineStep): Item[] => (Array.isArray(step.items) ? (step.items as unknown as Item[]) : []);

/** Bill of material validation: one row per raw material. */
export function mapRawMaterials(step: TimelineStep): DocSectionBody {
	const rows: DocRow[] = items(step).map((item, i) => ({
		key: `rm-${i}`,
		cells: {
			no: String(i + 1),
			material: dash(item.description),
			name: dash(item.name),
			reqQty: dash(item.quantity),
			uom: dash(item.uom),
			actualQty: dash(item.actualQuantity),
			actualUom: dash(item.actualUom ?? item.uom),
			batch: dash(item.batchNumber),
			expiry: formatDisplayDate(typeof item.expiryDate === 'string' ? item.expiryDate : null)
		}
	}));
	const hasData = items(step).some(item => dash(item.actualQuantity) !== EMPTY || dash(item.batchNumber) !== EMPTY);
	return {
		hasData,
		notes: [],
		tables: [
			{
				table: {
					columns: [
						{ key: 'no', label: 'No', width: '5%' },
						{ key: 'material', label: 'Material', width: '13%' },
						{ key: 'name', label: 'Description' },
						{ key: 'reqQty', label: 'Req. qty', align: 'right', width: '9%' },
						{ key: 'uom', label: 'UoM', width: '7%' },
						{ key: 'actualQty', label: 'Actual qty', align: 'right', width: '9%' },
						{ key: 'actualUom', label: 'UoM', width: '7%' },
						{ key: 'batch', label: 'Batch no.', width: '14%' },
						{ key: 'expiry', label: 'Expiry', width: '11%' }
					],
					rows
				}
			}
		]
	};
}

interface BomEntry {
	id: number;
	code: string;
	name: string;
	quantity: string;
	uom: string;
	order: number;
	isSplit: boolean;
	saved: Record<string, unknown>;
}

/** Entries in the catalyst screen's order: material by first appearance, then split order. */
function bomEntries(step: TimelineStep, agg: Record<string, unknown>): BomEntry[] {
	const groups = new Map<string, Item[]>();
	for (const item of items(step)) {
		const code = typeof item.materialCode === 'string' && item.materialCode ? item.materialCode : 'Unknown';
		groups.set(code, [...(groups.get(code) ?? []), item]);
	}
	const bom = (agg.bom && typeof agg.bom === 'object' ? agg.bom : {}) as Record<string, Record<string, unknown>>;
	const entries: BomEntry[] = [];
	for (const [code, group] of groups) {
		const sorted = [...group].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
		for (const item of sorted) {
			const order = Number(item.order) || 0;
			const savedByOrder = bom[String(item.id)];
			const saved = savedByOrder?.[String(order)];
			entries.push({
				id: Number(item.id),
				code,
				name: dash(item.materialName),
				quantity: dash(item.splitting ? item.splitQuantity : item.quantity),
				uom: typeof item.uom === 'string' ? item.uom : '',
				order,
				isSplit: item.splitting === true,
				saved: saved && typeof saved === 'object' ? (saved as Record<string, unknown>) : {}
			});
		}
	}
	return entries;
}

function fodLabel(value: unknown): string {
	return OK_NOT_OK_OPTIONS.find(option => option.value === value)?.label ?? dash(value);
}

function operator(saved: Record<string, unknown>): string {
	const name = dash(saved.employeeName);
	if (name === EMPTY) return EMPTY;
	const code = dash(saved.employeeCode);
	const role = typeof saved.role === 'string' && saved.role ? saved.role.toUpperCase() : '';
	return [code === EMPTY ? name : `${name} (${code})`, role].filter(Boolean).join(', ');
}

function recommended(saved: Record<string, unknown>): string {
	const min = Number(saved.calculatedMin);
	const max = Number(saved.calculatedMax);
	return min > 0 && max > 0 ? `${min.toFixed(2)} – ${max.toFixed(2)}` : EMPTY;
}

const POT_LIFE_NOTE =
	'Prepared chemical mixtures shall be utilized within the specified pot life: gelcoat 15 mins, resin 30 mins, topcoat 15 mins.';
const FOD_NOTE = 'FOD: mixing material is free from Foreign Object Debris (FOD) and stirred as per Work Instruction.';

/** Catalyst mixing: a Mixing table and a Checks table, one row per entry in each. */
export function mapBom(step: TimelineStep, agg: Record<string, unknown>): DocSectionBody {
	const entries = bomEntries(step, agg);
	const anySplit = entries.some(e => e.isSplit);

	const mixingRows: DocRow[] = entries.map(e => {
		const range = rangeResult(e.saved.validationStatus, e.saved.acknowledged);
		return {
			key: `mix-${e.id}-${e.order}`,
			cells: {
				material: `${e.code}\n${e.name}`,
				order: e.isSplit && e.order ? String(e.order) : EMPTY,
				reqQty: e.quantity === EMPTY ? EMPTY : `${e.quantity} ${e.uom}`.trim(),
				actualQty: dash(e.saved.actualQuantity),
				catalyst: dash(e.saved.catalystQuantity),
				recommended: recommended(e.saved),
				range: Object.keys(e.saved).length ? range : EMPTY,
				temp: dash(e.saved.temperature),
				rh: dash(e.saved.humidity)
			},
			strong: isNotOk(range) ? ['range'] : undefined
		};
	});

	const checkRows: DocRow[] = entries.map(e => {
		const fod = e.saved.fodCheckpoint;
		return {
			key: `chk-${e.id}-${e.order}`,
			cells: {
				material: anySplit && e.isSplit && e.order ? `${e.code} / ${e.order}` : e.code,
				can: dash(e.saved.canNumber),
				hygrometer: dash(e.saved.hygrometerInstrumentId),
				weighing: dash(e.saved.weighingMachineInstrumentId),
				fod: fodLabel(fod),
				comment: acceptsOkNotOkComment(fod) ? dash(e.saved.fodDeviationComment) : EMPTY,
				operator: operator(e.saved),
				captured: typeof e.saved.capturedAt === 'string' ? formatDisplayDateTime(e.saved.capturedAt) : EMPTY
			},
			strong: fod === 'not ok' ? ['fod'] : undefined
		};
	});

	const mixingColumns = [
		{ key: 'material', label: 'Material' },
		...(anySplit ? [{ key: 'order', label: 'Order', width: '7%' }] : []),
		{ key: 'reqQty', label: 'Req. qty', align: 'right' as const, width: '10%' },
		{ key: 'actualQty', label: 'Actual qty', align: 'right' as const, width: '9%' },
		{ key: 'catalyst', label: 'Catalyst (ml)', align: 'right' as const, width: '10%' },
		{ key: 'recommended', label: 'Recommended (ml)', align: 'right' as const, width: '14%' },
		{ key: 'range', label: 'Range', width: '9%' },
		{ key: 'temp', label: 'Temp (°C)', align: 'right' as const, width: '8%' },
		{ key: 'rh', label: 'RH (%)', align: 'right' as const, width: '8%' }
	];

	return {
		hasData: entries.some(e => Object.keys(e.saved).length > 0),
		notes: [POT_LIFE_NOTE, FOD_NOTE],
		tables: [
			{ title: 'Mixing', table: { columns: mixingColumns, rows: mixingRows } },
			{
				title: 'Checks and operator',
				table: {
					columns: [
						{ key: 'material', label: 'Material', width: '14%' },
						{ key: 'can', label: 'Can no.', width: '9%' },
						{ key: 'hygrometer', label: 'Hygrometer', width: '11%' },
						{ key: 'weighing', label: 'Weighing m/c', width: '11%' },
						{ key: 'fod', label: 'FOD', width: '10%' },
						{ key: 'comment', label: 'Deviation / comment', width: '12%' },
						{ key: 'operator', label: 'Operator' },
						{ key: 'captured', label: 'Captured at', width: '13%' }
					],
					rows: checkRows
				}
			}
		]
	};
}
