export interface NumericOrderRecord {
	order?: number | null;
}

export function sortByNumericOrder<T extends NumericOrderRecord>(records: readonly T[]): T[] {
	return records
		.map((record, index) => ({
			record,
			index,
			hasValidOrder:
				typeof record.order === 'number' &&
				Number.isFinite(record.order) &&
				Number.isInteger(record.order) &&
				record.order > 0
		}))
		.sort((a, b) => {
			if (a.hasValidOrder && b.hasValidOrder) {
				return (a.record.order as number) - (b.record.order as number) || a.index - b.index;
			}
			if (a.hasValidOrder !== b.hasValidOrder) return a.hasValidOrder ? -1 : 1;
			return a.index - b.index;
		})
		.map(({ record }) => record);
}

export function remapIndexSetAfterMove(indexes: ReadonlySet<number>, fromIndex: number, toIndex: number): Set<number> {
	return new Set(
		[...indexes].map(index => {
			if (index === fromIndex) return toIndex;
			if (fromIndex < toIndex && index > fromIndex && index <= toIndex) return index - 1;
			if (toIndex < fromIndex && index >= toIndex && index < fromIndex) return index + 1;
			return index;
		})
	);
}

export function remapIndexSetAfterRemove(indexes: ReadonlySet<number>, removedIndex: number): Set<number> {
	return new Set(
		[...indexes].filter(index => index !== removedIndex).map(index => (index > removedIndex ? index - 1 : index))
	);
}
