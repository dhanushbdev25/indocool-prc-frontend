/** User-facing labels for the persisted inspection parameter field `ctq`. */

export const GATE_FIELD_LABEL = 'Gate / Not Gate';

export const GATE_POSITIVE_LABEL = 'Gate';

export const GATE_NEGATIVE_LABEL = 'Not Gate';

export function formatGateValueForDisplay(ctq: boolean): string {
	return ctq ? GATE_POSITIVE_LABEL : GATE_NEGATIVE_LABEL;
}

export function formatGateCountLabel(count: number): string {
	return count === 1 ? '1 Gate parameter' : `${count} Gate parameters`;
}
