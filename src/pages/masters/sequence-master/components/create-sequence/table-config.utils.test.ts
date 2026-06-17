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
});
