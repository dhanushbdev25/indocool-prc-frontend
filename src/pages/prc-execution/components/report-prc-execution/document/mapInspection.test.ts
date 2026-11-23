import { describe, expect, it } from 'vitest';
import type { TimelineStep } from '../../../types/execution.types';
import { mapInspection } from './mapInspection';

const param = (id: number, order: number, over: Record<string, unknown>) => ({
	id,
	order,
	parameterName: `Param ${id}`,
	ctq: false,
	columns: [],
	files: [],
	...over
});

const step = {
	stepNumber: 7,
	title: 'FIR',
	type: 'inspection',
	status: 'completed',
	stepData: { prcTemplateStepId: 31 },
	inspectionParameters: [
		param(3, 3, {
			type: 'fixed-table',
			tableConfig: {
				columns: [
					{ name: 'Point', type: 'text' },
					{ name: 'Thk', type: 'number' }
				],
				rows: []
			},
			rowMappings: [{ rowIndex: 1, fileName: [{ fileName: 'row2.jpg', filePath: 'files/row2.jpg', originalFileName: 'Row 2.jpg' }] }]
		}),
		param(1, 1, { type: 'number', ctq: true }),
		param(2, 2, { type: 'list', listConfig: { items: [{ id: 'b' }, { id: 'a' }] } }),
		param(4, 4, {
			type: 'ok/not ok',
			files: [
				{ fileName: 'top.jpg', filePath: 'files/top.jpg', originalFileName: 'Top face.jpg' },
				{ fileName: 'ref.jpg', filePath: 'files/ref.jpg', originalFileName: 'Reference.jpg' }
			]
		}),
		param(5, 5, { type: 'datetime' })
	]
} as unknown as TimelineStep;

const agg = {
	31: {
		1: { value: 0, validationStatus: 'Greater', instrumentId: 'VC-2' },
		2: {
			value: {
				'0': { id: 'a', label: 'Gloss', type: 'ok/not ok', value: 'not ok', comments: 'D1' },
				'1': { id: 'b', label: 'Width', type: 'number', value: '50', validationStatus: 'InRange', minimumAcceptanceValue: 49, maximumAcceptanceValue: 51 }
			}
		},
		3: {
			value: { '0': { Point: 'P1', Thk: '3' }, '1': { Point: 'P2', Thk: '9', Thk_validationStatus: 'Greater' } },
			rowAnnotations: [{ rowIndex: 1, annotations: [{ imageFileName: 'row2.jpg', regions: [{ type: 'point', id: 'r', x: 0.1, y: 0.1, cls: '', comment: 'Crack' }] }] }]
		},
		4: {
			value: 'ok',
			annotations: [
				{
					imageFileName: 'top.jpg',
					regions: [
						{ type: 'point', id: 'p1', x: 0.2, y: 0.3, cls: '', comment: 'Pin hole', category: 'Surface' },
						{ type: 'point', id: 'p2', x: 0.6, y: 0.5, cls: '', comment: '' }
					]
				}
			],
			defectCounts: { 'Pin hole': 2, Scratch: 0 }
		},
		5: { value: '2026-11-21T09:15:00Z' },
		stepCompleted: true,
		productionApproved: true,
		timingExceeded: false
	}
};

describe('mapInspection', () => {
	const body = mapInspection(step, agg);
	const table = body.tables[0].table;
	const row = (name: string) => table.rows.find(r => r.cells.parameter === name)!;

	it('orders parameters by the template and ignores metadata keys', () => {
		expect(table.rows.map(r => r.cells.parameter)).toEqual(['Param 1', 'Param 2', 'Param 3', 'Param 4', 'Param 5']);
	});

	it('prints zero, its range result in bold, gate and instrument', () => {
		expect(row('Param 1').cells).toMatchObject({ value: '0', result: 'High', gate: 'Gate', instrument: 'VC-2' });
		expect(row('Param 1').strong).toEqual(['result']);
	});

	it('puts a list under its row in master order with a combined result', () => {
		const p2 = row('Param 2');
		expect(p2.cells).toMatchObject({ value: 'See below', result: 'Not OK' });
		const detail = p2.details![0];
		if (detail.kind !== 'table') throw new Error('expected table');
		expect(detail.table.rows.map(r => r.cells.item)).toEqual(['Width', 'Gloss']);
		expect(detail.table.rows[0].cells).toMatchObject({ value: '50', range: '49 to 51', result: 'OK' });
		expect(detail.table.rows[1].cells).toMatchObject({ value: 'OK with deviation', result: 'OK with deviation', comment: 'D1' });
	});

	it('reads legacy fixed-table rows and prints row photos under their row', () => {
		const p3 = row('Param 3');
		expect(p3.cells.result).toBe('Not OK');
		const detail = p3.details![0];
		if (detail.kind !== 'table') throw new Error('expected table');
		expect(detail.table.rows.map(r => r.cells)).toEqual([
			{ c0: 'P1', c1: '3' },
			{ c0: 'P2', c1: '9' }
		]);
		const rowPhotos = detail.table.rows[1].details?.[0];
		if (rowPhotos?.kind !== 'photos') throw new Error('expected photos');
		expect(rowPhotos.photos[0]).toMatchObject({ caption: 'Photo 3.R2.1 — Row 2.jpg', legend: ['1. Crack'] });
		expect(rowPhotos.photos[0].imageUrl).toContain('files/row2.jpg');
	});

	it('prints photos with a legend, reference files and defect counts', () => {
		const photos = row('Param 4').details![0];
		if (photos.kind !== 'photos') throw new Error('expected photos');
		expect(photos.photos.map(p => p.caption)).toEqual(['Photo 4.1 — Top face.jpg', 'Photo 4.2 — Reference.jpg']);
		expect(photos.photos[0].legend).toEqual(['1. Pin hole (Surface)', '2. —']);
		expect(photos.photos[1].legend).toEqual([]);
		expect(photos.defects).toBe('Defects: Pin hole 2');
	});

	it('formats date-time values', () => {
		expect(row('Param 5').cells.value).toMatch(/^21\/11\/2026 /);
	});

	it('totals real parameters only', () => {
		expect(table.footer).toBe('Parameters 5 · Gate 1 · Not OK 3 · Photos 3');
	});

	it('says the data is unavailable without a template step id', () => {
		expect(mapInspection({ ...step, stepData: undefined } as TimelineStep, agg).unavailable).toBe(
			'Data not available for this step.'
		);
	});

	it('has no data before anything is saved', () => {
		expect(mapInspection(step, {}).hasData).toBe(false);
	});
});
