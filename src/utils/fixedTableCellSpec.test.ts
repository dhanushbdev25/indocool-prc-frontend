import { describe, expect, it } from 'vitest';
import {
	formatCellSpecRange,
	resolveFixedTableCellSpec,
	validateCellSpecRange,
	withCellType
} from './fixedTableCellSpec';

const column = { type: 'number' as const, minimumAcceptanceValue: '5', maximumAcceptanceValue: '10' };
const cell = { value: '', readOnly: false, type: 'text' as const };

describe('resolveFixedTableCellSpec', () => {
	it('uses the column when per-cell types are off', () => {
		expect(resolveFixedTableCellSpec({}, column, cell)).toEqual(column);
		expect(resolveFixedTableCellSpec(null, column, cell)).toEqual(column);
	});

	it('uses the cell when per-cell types are on', () => {
		expect(
			resolveFixedTableCellSpec({ cellTypes: true }, column, {
				...cell,
				type: 'integer',
				minimumAcceptanceValue: 1,
				maximumAcceptanceValue: 3
			})
		).toEqual({ type: 'integer', minimumAcceptanceValue: 1, maximumAcceptanceValue: 3 });
	});

	it('falls back to the column for a cell with no type of its own', () => {
		expect(resolveFixedTableCellSpec({ cellTypes: true }, column, { value: '', readOnly: false })).toEqual(column);
	});
});

describe('withCellType', () => {
	it('drops the range for a type that has none', () => {
		expect(withCellType(column, 'date')).toEqual({ type: 'date' });
	});

	it('collapses the range to one target for an exact value', () => {
		expect(withCellType(column, 'exact value')).toEqual({
			type: 'exact value',
			minimumAcceptanceValue: '5',
			maximumAcceptanceValue: '5'
		});
	});
});

describe('validateCellSpecRange', () => {
	it('needs both ends of a range and the target of an exact value', () => {
		expect(validateCellSpecRange({ type: 'range', minimumAcceptanceValue: '1' })).toMatch(/minimum and maximum/);
		expect(validateCellSpecRange({ type: 'exact value' })).toMatch(/target/);
		expect(validateCellSpecRange({ type: 'number' })).toBeNull();
	});

	it('rejects a minimum above the maximum', () => {
		expect(
			validateCellSpecRange({ type: 'integer', minimumAcceptanceValue: '9', maximumAcceptanceValue: '2' })
		).toMatch(/cannot be greater/);
	});
});

describe('formatCellSpecRange', () => {
	it('describes a range or a target', () => {
		expect(formatCellSpecRange(column)).toBe('Range: 5 to 10');
		expect(formatCellSpecRange({ type: 'exact value', minimumAcceptanceValue: '7', maximumAcceptanceValue: '7' })).toBe(
			'Target: 7'
		);
		expect(formatCellSpecRange({ type: 'text' })).toBeNull();
	});
});
