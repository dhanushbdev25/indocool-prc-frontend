/**
 * Criticality classification for inspection parameters and sequence process steps.
 *
 * The user picks a single value, but it is persisted across two fields:
 *
 * | Picked | `ctq`   | `criticalityTag` |
 * | ------ | ------- | ---------------- |
 * | None   | `false` | `null`           |
 * | CTQ    | `true`  | `null`           |
 * | CTA    | `false` | `'CTA'`          |
 * | CTP    | `false` | `'CTP'`          |
 *
 * `ctq` keeps its existing meaning — it is the only value that gates a step during
 * execution (see `stepGating.ts`) and the only one counted by `ctqSteps` / `totalCtq`.
 * CTA and CTP are classification tags with no execution behaviour, so they live in a
 * separate nullable column and leave every existing reader of `ctq` untouched.
 *
 * Because the two fields never both carry a value, `resolveCriticality` and
 * `toCriticalityFields` round-trip losslessly. Anything that writes criticality should
 * go through `toCriticalityFields` so an impossible pair can never be produced.
 */

import { GATE_NEGATIVE_LABEL, GATE_POSITIVE_LABEL } from './gateLabels';

/** Non-gating tags, persisted in `criticalityTag`. */
export const CRITICALITY_TAGS = ['CTA', 'CTP'] as const;

export type CriticalityTag = (typeof CRITICALITY_TAGS)[number];

/** The single value a user picks in the masters. */
export type CriticalityValue = 'NONE' | 'CTQ' | CriticalityTag;

/** The persisted shape this module reads from — matches both API rows and form values. */
export interface CriticalitySource {
	ctq?: boolean | null;
	criticalityTag?: unknown;
}

export interface CriticalityFields {
	ctq: boolean;
	criticalityTag: CriticalityTag | null;
}

/** Narrows unknown persisted data to a known tag, so bad values read as "no tag". */
export function normalizeCriticalityTag(value: unknown): CriticalityTag | null {
	return CRITICALITY_TAGS.includes(value as CriticalityTag) ? (value as CriticalityTag) : null;
}

/**
 * Persisted fields -> the single value to display or preselect.
 *
 * `ctq` wins if both are somehow set, so a gating step is never shown as a plain tag.
 */
export function resolveCriticality(source: CriticalitySource | null | undefined): CriticalityValue {
	if (!source) return 'NONE';
	if (source.ctq) return 'CTQ';
	return normalizeCriticalityTag(source.criticalityTag) ?? 'NONE';
}

/** The single picked value -> the two persisted fields. */
export function toCriticalityFields(value: CriticalityValue): CriticalityFields {
	if (value === 'CTQ') return { ctq: true, criticalityTag: null };
	return { ctq: false, criticalityTag: normalizeCriticalityTag(value) };
}

export const CRITICALITY_FIELD_LABEL = 'Criticality';

/** Sequence master names the neutral state "None" and shows each tag by its acronym. */
const SEQUENCE_LABELS: Record<CriticalityValue, string> = {
	NONE: 'None',
	CTQ: 'CTQ',
	CTA: 'CTA',
	CTP: 'CTP'
};

/** Inspection master has always called `ctq` "Gate" and its absence "Not Gate". */
const INSPECTION_LABELS: Record<CriticalityValue, string> = {
	NONE: GATE_NEGATIVE_LABEL,
	CTQ: GATE_POSITIVE_LABEL,
	CTA: 'CTA',
	CTP: 'CTP'
};

export interface CriticalityOption {
	value: CriticalityValue;
	label: string;
}

const toOptions = (
	values: readonly CriticalityValue[],
	labels: Record<CriticalityValue, string>
): CriticalityOption[] => values.map(value => ({ value, label: labels[value] }));

export const SEQUENCE_CRITICALITY_OPTIONS = toOptions(['NONE', 'CTQ', 'CTA', 'CTP'], SEQUENCE_LABELS);

/** Inspection deliberately offers CTA but not CTP. */
export const INSPECTION_CRITICALITY_OPTIONS = toOptions(['CTQ', 'NONE', 'CTA'], INSPECTION_LABELS);

export function formatSequenceCriticality(source: CriticalitySource | null | undefined): string {
	return SEQUENCE_LABELS[resolveCriticality(source)];
}

/**
 * Formats using the inspection wording. CTP is not offered in the inspection master, but
 * it is still rendered if the data carries it rather than being silently shown as Not Gate.
 */
export function formatInspectionCriticality(source: CriticalitySource | null | undefined): string {
	return INSPECTION_LABELS[resolveCriticality(source)];
}

/** MUI `color` prop for chips. CTQ keeps the warning colour it has always had. */
export function getCriticalityChipColor(value: CriticalityValue): 'warning' | 'info' | 'default' {
	if (value === 'CTQ') return 'warning';
	return value === 'NONE' ? 'default' : 'info';
}

export interface CriticalityChipStyle {
	background: string;
	color: string;
}

/** Solid chips: for the call sites that style through `sx` rather than the `color` prop. */
export const CRITICALITY_CHIP_HEX: Record<CriticalityValue, CriticalityChipStyle> = {
	NONE: { background: '#9e9e9e', color: '#ffffff' },
	CTQ: { background: '#ff9800', color: '#ffffff' },
	CTA: { background: '#1976d2', color: '#ffffff' },
	CTP: { background: '#7b1fa2', color: '#ffffff' }
};

/** Tinted chips: pale fill with dark text, used in the dense execution preview tables. */
export const CRITICALITY_CHIP_TINT: Record<CriticalityValue, CriticalityChipStyle> = {
	NONE: { background: '#f5f5f5', color: '#666666' },
	CTQ: { background: '#fff3e0', color: '#f57c00' },
	CTA: { background: '#e3f2fd', color: '#1565c0' },
	CTP: { background: '#f3e5f5', color: '#6a1b9a' }
};
