import { describe, expect, it, vi } from 'vitest';
import { buildDashboardQueryParams, parseMetricsResponse } from './dashboard.validators';

const stageBlocks = {
	moulding: { total: 10, completed: 5, percentage: 50 },
	drilling: { total: 8, completed: 2, percentage: 25 },
	cutting: { total: 4, completed: 1, percentage: 25 },
	subAssembly: { total: 0, completed: 0, percentage: 0 },
	assembly: { total: 2, completed: 2, percentage: 100 },
	topCoat: { total: 1, completed: 0, percentage: 0 },
	antiskid: { total: 0, completed: 0, percentage: 0 },
	packaging: { total: 0, completed: 0, percentage: 0 }
};

describe('parseMetricsResponse', () => {
	it('reads selectedRange and extendedRange from the wire response', () => {
		const result = parseMetricsResponse({
			data: {
				selectedRange: { output: stageBlocks, manpower: stageBlocks, delayReasons: {} },
				extendedRange: {
					output: { ...stageBlocks, moulding: { total: 20, completed: 15, percentage: 75 } },
					manpower: stageBlocks,
					delayReasons: {}
				}
			}
		});

		expect(result.selectedRange.output.moulding.percentage).toBe(50);
		expect(result.extendedRange.output.moulding.percentage).toBe(75);
		expect(result.selectedRange.output.drilling.total).toBe(8);
	});

	it('keeps delay reasons per range', () => {
		const result = parseMetricsResponse({
			data: {
				selectedRange: {
					output: stageBlocks,
					manpower: stageBlocks,
					delayReasons: { moulding: [{ reasonLabel: 'Mould change', remarks: 'die swap', count: 3 }] }
				},
				extendedRange: { output: stageBlocks, manpower: stageBlocks, delayReasons: {} }
			}
		});

		expect(result.selectedRange.delayReasons.moulding).toHaveLength(1);
		expect(result.selectedRange.delayReasons.moulding[0].reasonLabel).toBe('Mould change');
		expect(result.extendedRange.delayReasons.moulding).toEqual([]);
	});

	it('warns and returns zeroed ranges when the shape is wrong', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const result = parseMetricsResponse({ data: { output: stageBlocks, manpower: stageBlocks } });

		expect(warn).toHaveBeenCalled();
		expect(result.selectedRange.output.moulding.total).toBe(0);
		expect(result.extendedRange.output.moulding.total).toBe(0);
		expect(result.selectedRange.delayReasons.packaging).toEqual([]);
		warn.mockRestore();
	});
});

describe('buildDashboardQueryParams', () => {
	it('sends plantCode and customer, the names the backend reads', () => {
		const params = buildDashboardQueryParams({
			from: '2026-07-01',
			to: '2026-08-17',
			units: ['P100', 'P200'],
			projects: ['Acme'],
			shift: ['A'],
			workstation: ['WS1'],
			sapReferenceNumber: ['SAP1'],
			customerVariantId: ['7']
		});

		expect(params.plantCode).toBe('P100,P200');
		expect(params.customer).toBe('Acme');
		expect(params).not.toHaveProperty('units');
		expect(params).not.toHaveProperty('projects');
		expect(params.workstation).toBe('WS1');
		expect(params.sapReferenceNumber).toBe('SAP1');
		expect(params.customerVariantId).toBe('7');
	});

	it('omits empty filters entirely', () => {
		const params = buildDashboardQueryParams({ from: '2026-07-01', to: '2026-08-17', units: [], projects: ['  '] });
		expect(params).toEqual({ from: '2026-07-01', to: '2026-08-17' });
	});
});
