import { describe, expect, it } from 'vitest';
import { readStoredRowList } from './storedRowList';

describe('readStoredRowList', () => {
	it('reads legacy index-keyed objects as rows', () => {
		expect(readStoredRowList({ '0': { a: 1 }, '1': { a: 2 } })).toEqual([{ a: 1 }, { a: 2 }]);
	});
	it('passes arrays through', () => {
		const rows = [{ a: 1 }];
		expect(readStoredRowList(rows)).toBe(rows);
	});
	it('returns no rows for anything else', () => {
		expect(readStoredRowList('x')).toEqual([]);
		expect(readStoredRowList(null)).toEqual([]);
	});
});
