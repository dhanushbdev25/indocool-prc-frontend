import { describe, expect, it } from 'vitest';
import type { TimelineStep } from '../../../types/execution.types';
import { mapSequence } from './mapSequence';

const def = (id: number, over: Record<string, unknown>) => ({
	id,
	ctq: false,
	criticalityTag: null,
	stepNumber: id,
	parameterDescription: `P${id}`,
	evaluationMethod: 'Visual',
	uom: 'mm',
	notes: '',
	multipleMeasurements: false,
	minimumAcceptanceValue: '',
	maximumAcceptanceValue: '',
	...over
});

const step = {
	stepNumber: 6,
	title: 'Lamination',
	type: 'sequence',
	status: 'completed',
	prcTemplateStepId: 40,
	stepGroup: {
		id: 3,
		steps: [
			def(11, {
				targetValueType: 'range',
				minimumAcceptanceValue: '10',
				maximumAcceptanceValue: '14',
				multipleMeasurements: true,
				notes: 'Measure at 3 points'
			}),
			def(12, { targetValueType: 'exact value', minimumAcceptanceValue: '5', maximumAcceptanceValue: '5', ctq: true }),
			def(13, { targetValueType: 'ok/not ok', uom: 'None' }),
			def(14, {
				targetValueType: 'table',
				tableConfig: {
					columns: [
						{ name: 'Zone', type: 'text' },
						{ name: 'Thk', type: 'number' }
					],
					rows: []
				}
			})
		]
	}
} as unknown as TimelineStep;

const agg = {
	40: {
		3: {
			// Key order deliberately differs from template order.
			14: { data: { '0': { Zone: 'A', Thk: '3', Thk_validationStatus: 'Greater' }, '1': { Zone: 'B', Thk: '2' } } },
			13: { data: { value: 'not ok', comments: 'DEV-9' } },
			12: { data: '5.2', instrumentId: 'VC-01' },
			11: {
				data: [
					{ value: '12.1', validationStatus: 'Accepted' },
					{ value: '15', validationStatus: 'Greater' }
				],
				responsiblePersons: [{ role: 'l1', employeeName: 'Arun', employeeCode: 'E5' }]
			},
			editedAfterSubmit: true,
			editedAfterSubmitAt: '2026-11-21T10:00:00Z',
			productionApproved: true
		}
	}
};

describe('mapSequence', () => {
	const body = mapSequence(step, agg, {});
	const main = body.tables[0].table;
	const byParam = Object.fromEntries(main.rows.map(r => [r.cells.parameter, r]));

	it('orders rows by the template and skips non-reading keys', () => {
		expect(main.rows.map(r => r.cells.parameter)).toEqual(['P11', 'P12', 'P13', 'P14']);
		expect(body.hasData).toBe(true);
	});

	it('prints several readings in one cell with a combined result', () => {
		expect(byParam.P11.cells.value).toBe('12.1, 15 mm');
		expect(byParam.P11.cells.target).toBe('10 – 14 mm');
		expect(byParam.P11.cells.result).toBe('Not OK (1 of 2)');
		expect(byParam.P11.strong).toEqual(['result']);
	});

	it('compares an exact target and shows the instrument', () => {
		expect(byParam.P12.cells.value).toBe('5.2 mm\nInstrument: VC-01');
		expect(byParam.P12.cells.target).toBe('5 mm');
		expect(byParam.P12.cells.result).toBe('Deviation +0.2');
		expect(byParam.P12.cells.criticality).toBe('CTQ');
	});

	it('prints ok / not ok with its deviation number', () => {
		expect(byParam.P13.cells.value).toBe('OK with deviation\nDeviation Number: DEV-9');
		expect(byParam.P13.cells.result).toBe('OK with deviation');
		expect(byParam.P13.cells.criticality).toBe('—');
	});

	it('puts a legacy index-keyed table under its row', () => {
		expect(byParam.P14.cells.value).toBe('See below');
		expect(byParam.P14.cells.result).toBe('Not OK');
		const detail = byParam.P14.details?.[0];
		expect(detail?.kind).toBe('table');
		if (detail?.kind !== 'table') return;
		expect(detail.table.columns.map(c => c.label)).toEqual(['Zone', 'Thk']);
		expect(detail.table.rows.map(r => r.cells)).toEqual([
			{ c0: 'A', c1: '3' },
			{ c0: 'B', c1: '2' }
		]);
		expect(detail.table.rows[0].strong).toEqual(['c1']);
	});

	it('lists responsible persons and notes', () => {
		expect(body.tables[1].title).toBe('Responsible persons');
		expect(body.tables[1].table.rows[0].cells).toEqual({ parameter: 'P11', role: 'L1', name: 'Arun', code: 'E5' });
		expect(body.notes).toEqual(['P11: Measure at 3 points']);
	});

	it('says the data is unavailable when the template data is missing', () => {
		const broken = mapSequence({ ...step, stepGroup: undefined } as TimelineStep, agg, {});
		expect(broken.unavailable).toBe('Data not available for this step.');
	});

	it('has no data when nothing was saved', () => {
		expect(mapSequence(step, {}, {}).hasData).toBe(false);
	});
});
