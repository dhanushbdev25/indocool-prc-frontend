/**
 * User-facing labels for the persisted inspection parameter field `ctq`.
 *
 * To render a parameter's classification, use `formatInspectionCriticality` from
 * `utils/criticality.ts` rather than reading `ctq` directly — a parameter can also
 * carry a non-gating CTA/CTP tag, which these labels alone cannot express.
 */

export const GATE_FIELD_LABEL = 'Gate / Not Gate';

export const GATE_POSITIVE_LABEL = 'Gate';

export const GATE_NEGATIVE_LABEL = 'Not Gate';

export function formatGateCountLabel(count: number): string {
	return count === 1 ? '1 Gate parameter' : `${count} Gate parameters`;
}
