/** Grid for `ReportField`s: one column on phones, two on tablets, `columns` on desktop and in print. */
export function reportFieldGridSx(columns: number) {
	return {
		display: 'grid',
		gridTemplateColumns: {
			xs: 'minmax(0, 1fr)',
			sm: 'repeat(2, minmax(0, 1fr))',
			md: `repeat(${columns}, minmax(0, 1fr))`
		},
		gap: 2,
		'@media print': {
			gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
		}
	} as const;
}

/** Shows an empty or missing value as an em dash, with an optional unit after it. */
export function displayValue(value: unknown, unit?: string): string {
	const text = value == null ? '' : String(value).trim();
	if (!text) return '—';
	return unit ? `${text} ${unit}` : text;
}
