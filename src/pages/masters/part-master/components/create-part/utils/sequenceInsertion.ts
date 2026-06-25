/**
 * Compute the flat-array index at which a new step for `group` should be inserted
 * so that the resulting array stays sorted by operation in `addedGroups` order.
 *
 * It's the position right after the last existing step of the same operation, or —
 * if the operation has no steps yet — the position just before the first step
 * belonging to any later-added operation. If nothing comes after, the index is the
 * array length (append).
 */
export function findInsertIndexForGroup(
	fields: ReadonlyArray<{ group?: string | null | undefined }>,
	addedGroups: ReadonlyArray<string>,
	group: string
): number {
	const groupOrder = addedGroups.indexOf(group);
	if (groupOrder === -1) return fields.length;
	for (let i = 0; i < fields.length; i++) {
		const stepGroup = fields[i]?.group ?? '';
		const stepGroupOrder = addedGroups.indexOf(stepGroup);
		if (stepGroupOrder > groupOrder) return i;
	}
	return fields.length;
}

/**
 * Compute the sequence number a step at flat-array `index` should carry.
 * Operation steps start at 3 because positions 1 and 2 are reserved for the
 * hard-coded Bill of Material and Catalyst Mixing default steps shown at
 * the top of the Linked Masters tab.
 */
export function sequenceForIndex(index: number): number {
	return index + 3;
}
