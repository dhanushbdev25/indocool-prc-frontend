import { describe, expect, it } from 'vitest';
import {
	CRITICALITY_TAGS,
	INSPECTION_CRITICALITY_OPTIONS,
	SEQUENCE_CRITICALITY_OPTIONS,
	formatInspectionCriticality,
	formatSequenceCriticality,
	getCriticalityChipColor,
	normalizeCriticalityTag,
	resolveCriticality,
	toCriticalityFields,
	type CriticalityValue
} from './criticality';

describe('resolveCriticality', () => {
	it('reads a gating step as CTQ', () => {
		expect(resolveCriticality({ ctq: true, criticalityTag: null })).toBe('CTQ');
	});

	it('reads each tag back from criticalityTag', () => {
		expect(resolveCriticality({ ctq: false, criticalityTag: 'CTA' })).toBe('CTA');
		expect(resolveCriticality({ ctq: false, criticalityTag: 'CTP' })).toBe('CTP');
	});

	it('reads an untagged step as NONE', () => {
		expect(resolveCriticality({ ctq: false, criticalityTag: null })).toBe('NONE');
	});

	it('treats rows saved before the tag column existed as NONE', () => {
		expect(resolveCriticality({ ctq: false })).toBe('NONE');
	});

	it('lets ctq win over a tag so a gating step is never shown as a plain tag', () => {
		expect(resolveCriticality({ ctq: true, criticalityTag: 'CTA' })).toBe('CTQ');
	});

	it('falls back to NONE for unrecognised tag values', () => {
		expect(resolveCriticality({ ctq: false, criticalityTag: 'CTX' })).toBe('NONE');
		expect(resolveCriticality({ ctq: false, criticalityTag: 7 })).toBe('NONE');
	});

	it('handles a missing source', () => {
		expect(resolveCriticality(undefined)).toBe('NONE');
		expect(resolveCriticality(null)).toBe('NONE');
	});
});

describe('toCriticalityFields', () => {
	it('sets only ctq for CTQ', () => {
		expect(toCriticalityFields('CTQ')).toEqual({ ctq: true, criticalityTag: null });
	});

	it('sets only the tag for CTA and CTP', () => {
		expect(toCriticalityFields('CTA')).toEqual({ ctq: false, criticalityTag: 'CTA' });
		expect(toCriticalityFields('CTP')).toEqual({ ctq: false, criticalityTag: 'CTP' });
	});

	it('clears both for NONE', () => {
		expect(toCriticalityFields('NONE')).toEqual({ ctq: false, criticalityTag: null });
	});

	it('never produces a row that is both gating and tagged', () => {
		const values: CriticalityValue[] = ['NONE', 'CTQ', 'CTA', 'CTP'];

		for (const value of values) {
			const fields = toCriticalityFields(value);
			expect(fields.ctq && fields.criticalityTag !== null).toBe(false);
		}
	});

	it('round-trips every value through the persisted fields', () => {
		const values: CriticalityValue[] = ['NONE', 'CTQ', 'CTA', 'CTP'];

		for (const value of values) {
			expect(resolveCriticality(toCriticalityFields(value))).toBe(value);
		}
	});
});

describe('normalizeCriticalityTag', () => {
	it('accepts known tags and rejects everything else', () => {
		for (const tag of CRITICALITY_TAGS) {
			expect(normalizeCriticalityTag(tag)).toBe(tag);
		}

		expect(normalizeCriticalityTag('CTQ')).toBeNull();
		expect(normalizeCriticalityTag('')).toBeNull();
		expect(normalizeCriticalityTag(null)).toBeNull();
		expect(normalizeCriticalityTag(undefined)).toBeNull();
	});
});

describe('labels', () => {
	it('uses the inspection master Gate wording', () => {
		expect(formatInspectionCriticality({ ctq: true })).toBe('Gate');
		expect(formatInspectionCriticality({ ctq: false })).toBe('Not Gate');
		expect(formatInspectionCriticality({ ctq: false, criticalityTag: 'CTA' })).toBe('CTA');
	});

	it('renders CTP in the inspection master when the data carries it, rather than hiding it', () => {
		expect(formatInspectionCriticality({ ctq: false, criticalityTag: 'CTP' })).toBe('CTP');
	});

	it('uses acronyms and None in the sequence master', () => {
		expect(formatSequenceCriticality({ ctq: true })).toBe('CTQ');
		expect(formatSequenceCriticality({ ctq: false })).toBe('None');
		expect(formatSequenceCriticality({ ctq: false, criticalityTag: 'CTP' })).toBe('CTP');
	});
});

describe('options', () => {
	it('offers all four values in the sequence master', () => {
		expect(SEQUENCE_CRITICALITY_OPTIONS.map(o => o.value)).toEqual(['NONE', 'CTQ', 'CTA', 'CTP']);
	});

	it('offers Gate, Not Gate and CTA in the inspection master but not CTP', () => {
		expect(INSPECTION_CRITICALITY_OPTIONS.map(o => o.value)).toEqual(['CTQ', 'NONE', 'CTA']);
		expect(INSPECTION_CRITICALITY_OPTIONS.map(o => o.label)).toEqual(['Gate', 'Not Gate', 'CTA']);
	});
});

describe('getCriticalityChipColor', () => {
	it('keeps CTQ on the warning colour it has always used', () => {
		expect(getCriticalityChipColor('CTQ')).toBe('warning');
	});

	it('distinguishes tags from the neutral state', () => {
		expect(getCriticalityChipColor('CTA')).toBe('info');
		expect(getCriticalityChipColor('CTP')).toBe('info');
		expect(getCriticalityChipColor('NONE')).toBe('default');
	});
});
