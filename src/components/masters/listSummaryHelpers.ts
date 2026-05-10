/**
 * Canonical copy for “Showing n of m …” on master list racks.
 */
export function formatFilteredListSummary(
	filteredCount: number,
	totalCount: number,
	recordLabelPlural: string
): string {
	if (totalCount <= 0) {
		return `No ${recordLabelPlural} loaded`;
	}
	if (filteredCount >= totalCount) {
		return `Showing all ${totalCount} ${recordLabelPlural}`;
	}
	return `Showing ${filteredCount} of ${totalCount} ${recordLabelPlural}`;
}
