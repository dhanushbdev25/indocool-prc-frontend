import { describe, expect, it } from 'vitest';
import { findInsertIndexForGroup, sequenceForIndex } from './sequenceInsertion';

const step = (group: string) => ({ group });

describe('findInsertIndexForGroup', () => {
	it('appends when target group is unknown', () => {
		const fields = [step('A'), step('B')];
		expect(findInsertIndexForGroup(fields, ['A', 'B'], 'C')).toBe(2);
	});

	it('returns 0 for the first group when no steps exist yet', () => {
		expect(findInsertIndexForGroup([], ['A'], 'A')).toBe(0);
	});

	it('appends to the end when adding to the last group', () => {
		const fields = [step('A'), step('A'), step('B'), step('B'), step('B')];
		expect(findInsertIndexForGroup(fields, ['A', 'B'], 'B')).toBe(5);
	});

	it('inserts after the last step of the target group when later groups exist', () => {
		// User adds a 3rd step to Op A while Op B already has 3 steps.
		const fields = [step('A'), step('A'), step('B'), step('B'), step('B')];
		expect(findInsertIndexForGroup(fields, ['A', 'B'], 'A')).toBe(2);
	});

	it('inserts at the boundary even when the target group is empty', () => {
		// Op A has no steps yet. Op B has 3. Adding to A → index 0 (before all of B).
		const fields = [step('B'), step('B'), step('B')];
		expect(findInsertIndexForGroup(fields, ['A', 'B'], 'A')).toBe(0);
	});

	it('handles three operations with target in the middle', () => {
		// addedGroups = [A, B, C]. fields = [A,A,B,B,C,C]. Adding to B → insert at 4 (before first C).
		const fields = [step('A'), step('A'), step('B'), step('B'), step('C'), step('C')];
		expect(findInsertIndexForGroup(fields, ['A', 'B', 'C'], 'B')).toBe(4);
	});

	it("never inserts before earlier groups' steps", () => {
		const fields = [step('A'), step('B'), step('C')];
		// Adding to C → should append (no later group exists).
		expect(findInsertIndexForGroup(fields, ['A', 'B', 'C'], 'C')).toBe(3);
		// Adding to A → before first B.
		expect(findInsertIndexForGroup(fields, ['A', 'B', 'C'], 'A')).toBe(1);
		// Adding to B → before first C.
		expect(findInsertIndexForGroup(fields, ['A', 'B', 'C'], 'B')).toBe(2);
	});
});

describe('sequenceForIndex', () => {
	it('reserves 1 and 2 for default BOM and Catalyst Mixing steps', () => {
		expect(sequenceForIndex(0)).toBe(3);
		expect(sequenceForIndex(1)).toBe(4);
		expect(sequenceForIndex(5)).toBe(8);
	});
});

describe('end-to-end sequencing through insert + renumber', () => {
	// Simulates the renumber effect (`sequence = index + 3`) on the post-insert array.
	function simulateInsertAndRenumber(
		fields: ReadonlyArray<{ group: string }>,
		addedGroups: ReadonlyArray<string>,
		newStep: { group: string }
	) {
		const idx = findInsertIndexForGroup(fields, addedGroups, newStep.group);
		const next = [...fields.slice(0, idx), newStep, ...fields.slice(idx)];
		return next.map((s, i) => ({ ...s, sequence: sequenceForIndex(i) }));
	}

	it('user repro: Op1 [3,4] + Op2 [5,6,7] → add to Op1 → Op1 [3,4,5], Op2 [6,7,8]', () => {
		const fields = [
			{ group: 'Op1' },
			{ group: 'Op1' },
			{ group: 'Op2' },
			{ group: 'Op2' },
			{ group: 'Op2' }
		];
		const result = simulateInsertAndRenumber(fields, ['Op1', 'Op2'], { group: 'Op1' });
		expect(result.map(r => [r.group, r.sequence])).toEqual([
			['Op1', 3],
			['Op1', 4],
			['Op1', 5], // ← newly added step lands here
			['Op2', 6],
			['Op2', 7],
			['Op2', 8]
		]);
	});

	it("user's literal example: Op1 empty + Op2 [3,4,5] → add to Op1 → Op1 [3], Op2 [4,5,6]", () => {
		const fields = [{ group: 'Op2' }, { group: 'Op2' }, { group: 'Op2' }];
		const result = simulateInsertAndRenumber(fields, ['Op1', 'Op2'], { group: 'Op1' });
		expect(result.map(r => [r.group, r.sequence])).toEqual([
			['Op1', 3], // ← new step in previously-empty Op1
			['Op2', 4],
			['Op2', 5],
			['Op2', 6]
		]);
	});

	it('adding to the last operation effectively appends', () => {
		const fields = [{ group: 'Op1' }, { group: 'Op2' }];
		const result = simulateInsertAndRenumber(fields, ['Op1', 'Op2'], { group: 'Op2' });
		expect(result.map(r => [r.group, r.sequence])).toEqual([
			['Op1', 3],
			['Op2', 4],
			['Op2', 5] // ← appended
		]);
	});

	it('first step in first operation gets sequence 3', () => {
		const result = simulateInsertAndRenumber([], ['Op1'], { group: 'Op1' });
		expect(result).toEqual([{ group: 'Op1', sequence: 3 }]);
	});
});
