import { describe, expect, it } from 'vitest';
import { isAuditHistory, isAuditHistoryEntry } from './audit-history.validators';

const baseEntry = {
	id: 1,
	version: 2,
	changeType: 'UPDATE',
	changedAt: '2026-07-24T20:00:00.000Z',
	changedBy: 7,
	changedByName: 'Test User',
	changes: [
		{
			field: 'catalyst.chartSupplier',
			type: 'MODIFIED',
			oldValue: 'Old',
			newValue: 'New'
		}
	]
};

describe('audit history validators', () => {
	it('accepts the common backend history shape', () => {
		expect(isAuditHistoryEntry(baseEntry)).toBe(true);
		expect(isAuditHistory([baseEntry])).toBe(true);
	});

	it('accepts domain-specific nested changes', () => {
		expect(
			isAuditHistoryEntry({
				...baseEntry,
				changes: [],
				stepGroupChanges: [
					{
						changeType: 'MODIFIED',
						processName: 'Layup',
						details: [{ field: 'sequence', oldValue: 1, newValue: 2 }],
						stepChanges: [
							{
								changeType: 'ADDED',
								parameterDescription: 'Temperature',
								stepNumber: 3
							}
						]
					}
				]
			})
		).toBe(true);
	});

	it('rejects malformed entries', () => {
		expect(isAuditHistoryEntry({ ...baseEntry, changeType: 'CHANGED' })).toBe(false);
		expect(isAuditHistoryEntry({ ...baseEntry, changes: [{ field: 'name' }] })).toBe(false);
		expect(isAuditHistory({ history: [baseEntry] })).toBe(false);
	});
});
