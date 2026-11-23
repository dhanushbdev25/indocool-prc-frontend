import { describe, expect, it } from 'vitest';
import type { TimelineStep } from '../../../types/execution.types';
import { mapBom, mapRawMaterials } from './mapMaterials';

describe('mapRawMaterials', () => {
	it('prints one row per material with a formatted expiry', () => {
		const step = {
			items: [
				{
					description: '1000000015',
					name: 'Ortho resin',
					quantity: '7',
					uom: 'KG',
					actualQuantity: '7.1',
					batchNumber: 'B1',
					expiryDate: '2027-01-31'
				},
				{ description: '1000000016', name: 'Gelcoat', quantity: '2', uom: 'KG' }
			]
		} as unknown as TimelineStep;
		const body = mapRawMaterials(step);
		const [first, second] = body.tables[0].table.rows;
		expect(body.hasData).toBe(true);
		expect(first.cells).toMatchObject({
			no: '1',
			material: '1000000015',
			actualQty: '7.1',
			actualUom: 'KG',
			expiry: '31/01/2027'
		});
		expect(second.cells).toMatchObject({ batch: '—', expiry: '—' });
		expect(body.tables[0].table.columns.map(c => c.label)).not.toContain('PRC Set ID');
	});

	it('has no data when nothing was recorded', () => {
		const step = { items: [{ description: 'X', quantity: '1' }] } as unknown as TimelineStep;
		expect(mapRawMaterials(step).hasData).toBe(false);
	});
});

describe('mapBom', () => {
	const step = {
		items: [
			{ id: 15, materialCode: '1000000015', materialName: 'Ortho resin', quantity: '7.03', uom: 'KG', order: 1 },
			{
				id: 16,
				materialCode: 'GC',
				materialName: 'Gelcoat',
				quantity: '4',
				splitQuantity: '2',
				uom: 'KG',
				order: 2,
				splitting: true
			},
			{
				id: 16,
				materialCode: 'GC',
				materialName: 'Gelcoat',
				quantity: '4',
				splitQuantity: '2',
				uom: 'KG',
				order: 1,
				splitting: true
			}
		]
	} as unknown as TimelineStep;
	const agg = {
		bom: {
			15: {
				1: {
					temperature: '24.5',
					humidity: '75.3',
					actualQuantity: '7.03',
					catalystQuantity: '126.54',
					calculatedMin: 140.6,
					calculatedMax: 210.9,
					validationStatus: 'Lesser',
					acknowledged: false,
					canNumber: '',
					fodCheckpoint: 'not ok',
					fodDeviationComment: 'DEV-7',
					employeeName: 'Ravi',
					employeeCode: 'E12',
					role: 'l2'
				}
			}
		}
	};

	it('prints one row per entry, split entries in order', () => {
		const body = mapBom(step, agg);
		const mixing = body.tables[0].table;
		expect(mixing.rows.map(r => r.cells.material.split('\n')[0])).toEqual(['1000000015', 'GC', 'GC']);
		expect(mixing.rows.map(r => r.cells.order)).toEqual(['—', '1', '2']);
		expect(mixing.columns.map(c => c.label)).toContain('Order');
		expect(mixing.rows[1].cells.reqQty).toBe('2 KG');
	});

	it('shows recorded values, the range result in bold and the operator', () => {
		const body = mapBom(step, agg);
		const mix = body.tables[0].table.rows[0];
		const check = body.tables[1].table.rows[0];
		expect(mix.cells).toMatchObject({
			catalyst: '126.54',
			recommended: '140.60 – 210.90',
			range: 'Low',
			temp: '24.5',
			rh: '75.3'
		});
		expect(mix.strong).toEqual(['range']);
		expect(check.cells).toMatchObject({
			can: '—',
			fod: 'OK with deviation',
			comment: 'DEV-7',
			operator: 'Ravi (E12), L2'
		});
		expect(body.hasData).toBe(true);
		expect(body.notes).toHaveLength(2);
	});

	it('prints entries with no saved data as dashes', () => {
		const row = mapBom(step, agg).tables[0].table.rows[1];
		expect(row.cells).toMatchObject({ catalyst: '—', range: '—', recommended: '—' });
	});

	it('leaves out the order column when nothing is split', () => {
		const single = { items: [step.items![0]] } as unknown as TimelineStep;
		expect(mapBom(single, {}).tables[0].table.columns.map(c => c.label)).not.toContain('Order');
		expect(mapBom(single, {}).hasData).toBe(false);
	});
});
