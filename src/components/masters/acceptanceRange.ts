/**
 * A blank numeric bound is stored as 0 by the masters (their number fields coerce an empty input
 * to 0), so a 0-to-0 band means "no range configured" rather than "must equal zero" — the same
 * reading execution applies before it flags a deviation. Such a band is reported as no range.
 *
 * Returns null when there is no range worth showing, so callers can omit the line entirely.
 */
export const formatAcceptanceRange = (min?: string | number | null, max?: string | number | null): string | null => {
	const parse = (value?: string | number | null) => {
		if (value === null || value === undefined) return null;
		const text = String(value).trim();
		if (text === '') return null;
		const parsed = Number(text);
		return Number.isFinite(parsed) ? parsed : null;
	};

	const low = parse(min);
	const high = parse(max);
	if (low === null && high === null) return null;
	if (low === 0 && high === 0) return null;
	return `${low ?? '-'} to ${high ?? '-'}`;
};
