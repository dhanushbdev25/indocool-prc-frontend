import { describe, expect, it } from 'vitest';
import {
	OK_NOT_OK_NA_VALUE,
	OK_NOT_OK_NEGATIVE_VALUE,
	OK_NOT_OK_OPTIONS,
	OK_NOT_OK_POSITIVE_VALUE,
	acceptsOkNotOkComment,
	formatOkNotOkValueForDisplay,
	isNegativeOkNotOk,
	isNotApplicableOkNotOk,
	isValidOkNotOkValue,
	requiresOkNotOkComment
} from './okNotOkLabels';

describe('isValidOkNotOkValue', () => {
	it('accepts all three answers', () => {
		expect(isValidOkNotOkValue(OK_NOT_OK_POSITIVE_VALUE)).toBe(true);
		expect(isValidOkNotOkValue(OK_NOT_OK_NEGATIVE_VALUE)).toBe(true);
		expect(isValidOkNotOkValue(OK_NOT_OK_NA_VALUE)).toBe(true);
	});

	it('rejects blanks and anything unrecognised', () => {
		expect(isValidOkNotOkValue('')).toBe(false);
		expect(isValidOkNotOkValue(undefined)).toBe(false);
		expect(isValidOkNotOkValue(null)).toBe(false);
		expect(isValidOkNotOkValue('maybe')).toBe(false);
		expect(isValidOkNotOkValue('NA')).toBe(false);
	});
});

describe('isNegativeOkNotOk', () => {
	it('treats only a deviation as negative, so Not Applicable never flags a row', () => {
		expect(isNegativeOkNotOk(OK_NOT_OK_NEGATIVE_VALUE)).toBe(true);
		expect(isNegativeOkNotOk(OK_NOT_OK_NA_VALUE)).toBe(false);
		expect(isNegativeOkNotOk(OK_NOT_OK_POSITIVE_VALUE)).toBe(false);
	});
});

describe('isNotApplicableOkNotOk', () => {
	it('identifies only the Not Applicable value', () => {
		expect(isNotApplicableOkNotOk(OK_NOT_OK_NA_VALUE)).toBe(true);
		expect(isNotApplicableOkNotOk(OK_NOT_OK_NEGATIVE_VALUE)).toBe(false);
		expect(isNotApplicableOkNotOk(OK_NOT_OK_POSITIVE_VALUE)).toBe(false);
	});
});

describe('comment rules', () => {
	it('shows the comment box for a deviation and for Not Applicable', () => {
		expect(acceptsOkNotOkComment(OK_NOT_OK_NEGATIVE_VALUE)).toBe(true);
		expect(acceptsOkNotOkComment(OK_NOT_OK_NA_VALUE)).toBe(true);
	});

	it('hides the comment box for OK', () => {
		expect(acceptsOkNotOkComment(OK_NOT_OK_POSITIVE_VALUE)).toBe(false);
		expect(acceptsOkNotOkComment('')).toBe(false);
	});

	it('only blocks submission on a deviation, so Not Applicable stays optional', () => {
		expect(requiresOkNotOkComment(OK_NOT_OK_NEGATIVE_VALUE)).toBe(true);
		expect(requiresOkNotOkComment(OK_NOT_OK_NA_VALUE)).toBe(false);
		expect(requiresOkNotOkComment(OK_NOT_OK_POSITIVE_VALUE)).toBe(false);
	});
});

describe('formatOkNotOkValueForDisplay', () => {
	it('labels each stored value', () => {
		expect(formatOkNotOkValueForDisplay(OK_NOT_OK_POSITIVE_VALUE)).toBe('OK');
		expect(formatOkNotOkValueForDisplay(OK_NOT_OK_NEGATIVE_VALUE)).toBe('OK with deviation');
		expect(formatOkNotOkValueForDisplay(OK_NOT_OK_NA_VALUE)).toBe('Not Applicable');
	});

	it('passes through anything it does not recognise', () => {
		expect(formatOkNotOkValueForDisplay('something else')).toBe('something else');
	});
});

describe('OK_NOT_OK_OPTIONS', () => {
	it('lists the three choices in display order', () => {
		expect(OK_NOT_OK_OPTIONS.map(o => o.value)).toEqual(['ok', 'not ok', 'not applicable']);
		expect(OK_NOT_OK_OPTIONS.map(o => o.label)).toEqual(['OK', 'OK with deviation', 'Not Applicable']);
	});

	it('offers only values validation accepts', () => {
		for (const option of OK_NOT_OK_OPTIONS) {
			expect(isValidOkNotOkValue(option.value)).toBe(true);
		}
	});
});
