import { describe, expect, it } from 'vitest';
import { remapIndexSetAfterMove, remapIndexSetAfterRemove, sortByNumericOrder } from './orderedRecords';

describe('sortByNumericOrder', () => {
	it('sorts by order without mutating the source and keeps ties stable', () => {
		const source = [
			{ id: 'third', order: 3 },
			{ id: 'first-a', order: 1 },
			{ id: 'first-b', order: 1 }
		];

		expect(sortByNumericOrder(source).map(item => item.id)).toEqual(['first-a', 'first-b', 'third']);
		expect(source.map(item => item.id)).toEqual(['third', 'first-a', 'first-b']);
	});

	it('sorts valid orders first and appends missing or invalid orders stably', () => {
		const source = [
			{ id: 'missing', order: null },
			{ id: 'second', order: 2 },
			{ id: 'invalid', order: 0 },
			{ id: 'first', order: 1 }
		];

		expect(sortByNumericOrder(source).map(item => item.id)).toEqual(['first', 'second', 'missing', 'invalid']);
	});
});

describe('indexed UI state remapping', () => {
	it('moves the selected index and shifts indexes crossed by the move', () => {
		expect([...remapIndexSetAfterMove(new Set([0, 1, 3]), 0, 2)].sort()).toEqual([0, 2, 3]);
		expect([...remapIndexSetAfterMove(new Set([0, 2, 3]), 3, 1)].sort()).toEqual([0, 1, 3]);
	});

	it('drops a removed index and shifts following indexes down', () => {
		expect([...remapIndexSetAfterRemove(new Set([0, 2, 3]), 2)].sort()).toEqual([0, 2]);
	});
});
