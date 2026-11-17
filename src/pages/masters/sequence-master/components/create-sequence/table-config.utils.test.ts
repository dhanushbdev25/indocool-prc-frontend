import { describe, expect, it } from 'vitest';
import { normalizeTableConfig } from './table-config.utils';

describe('normalizeTableConfig', () => {
	it('remaps col_0 placeholder to named date column', () => {
		const result = normalizeTableConfig({
			columns: [{ name: 'Date', type: 'date' }],
			rows: [{ cells: { col_0: { value: '2026-06-17', readOnly: true } } }]
		});

		expect(result?.rows[0].cells.Date.value).toBe('2026-06-17');
		expect(result?.rows[0].cells.col_0).toBeUndefined();
	});

	it('keeps per-cell data types when loading', () => {
		const result = normalizeTableConfig({
			cellTypes: true,
			columns: [{ name: 'Temp', type: 'text' }],
			rows: [
				{
					cells: {
						Temp: { value: '', readOnly: false, type: 'range', minimumAcceptanceValue: 1, maximumAcceptanceValue: 5 }
					}
				}
			]
		});

		expect(result?.cellTypes).toBe(true);
		expect(result?.rows[0].cells.Temp.type).toBe('range');
	});
});
