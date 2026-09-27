/**
 * Scroll-to-first-error helper shared by the PRC execution step forms.
 *
 * Every step keeps its own `errors` map and paints red helper text inline, but on a long
 * parameter table the offending field can sit well outside the viewport — the operator taps
 * "Complete step"/"Next", nothing visibly happens, and they have to hunt for the red field.
 *
 * Rather than maintain a key -> DOM mapping for each of the four step forms, we lean on what
 * MUI already stamps on the DOM: any `TextField`/`FormControl` rendered with `error` carries
 * the `Mui-error` class. Errors rendered as a bare `<Typography color="error">` opt in with
 * `ERROR_ANCHOR_CLASS`. Document order is visual order, so the first match is the first error.
 */

/** Opt-in marker for error text that MUI does not stamp with `Mui-error`. */
export const ERROR_ANCHOR_CLASS = 'prc-field-error';

const ERROR_SELECTOR = `.Mui-error, .${ERROR_ANCHOR_CLASS}`;

const FOCUSABLE_SELECTOR = 'input:not([type="hidden"]), textarea, select, [role="combobox"]';

/** Finds the input belonging to an error node so we can focus it after scrolling. */
const findFocusTarget = (element: HTMLElement): HTMLElement | null => {
	const formControl = element.closest('.MuiFormControl-root, .MuiTextField-root');
	const candidate = formControl?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? null;
	if (candidate && !candidate.hasAttribute('disabled') && candidate.getAttribute('aria-hidden') !== 'true') {
		return candidate;
	}
	return null;
};

/** The first error in document order — document order is visual order. */
export const findFirstErrorElement = (container: HTMLElement | null): HTMLElement | null =>
	container?.querySelector<HTMLElement>(ERROR_SELECTOR) ?? null;

/**
 * The enclosing MUI `Collapse` that is still animating its height, if there is one.
 *
 * `Collapse timeout="auto"` derives its duration from the content height, so a parameter table
 * animates for roughly 250-450ms. Measuring a scroll position part-way through that transition
 * anchors on a layout that is still growing: the rest of the expansion pushes the error further
 * down after the browser has settled the scroll, and a tall panel (a fixed table with row-image
 * cells) leaves it below the fold entirely. MUI stamps `MuiCollapse-entered` once it is done.
 */
export const findExpandingCollapse = (element: HTMLElement | null): HTMLElement | null => {
	const collapse = element?.closest<HTMLElement>('.MuiCollapse-root') ?? null;
	if (!collapse || collapse.classList.contains('MuiCollapse-entered')) return null;
	return collapse;
};

/**
 * Scrolls the first visible validation error inside `container` into view and focuses its input.
 *
 * @returns true when an error element was found and scrolled to.
 */
export const scrollToFirstError = (container: HTMLElement | null): boolean => {
	if (!container) return false;

	const target = findFirstErrorElement(container);
	if (!target) return false;

	target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

	// Focus after scrolling so the caret lands on the field, but let the smooth scroll above
	// own the scroll position rather than the browser's focus jump.
	findFocusTarget(target)?.focus({ preventScroll: true });

	return true;
};

/**
 * Pulls the inspection-parameter ids out of a set of error keys.
 *
 * `InspectionStep` keys every error off the parameter id — `"12"`, `"12_row_0_Length"`,
 * `"ft_12_0_Value"` — and hides table/multi-column rows behind `<Collapse unmountOnExit>`.
 * A collapsed row's error is not in the DOM at all, so those rows have to be expanded before
 * there is anything to scroll to.
 */
export const parameterIdsFromErrorKeys = (errorKeys: string[]): number[] => {
	const ids = new Set<number>();
	errorKeys.forEach(key => {
		const match = /^(?:ft_)?(\d+)(?:_|$)/.exec(key);
		if (match) ids.add(Number(match[1]));
	});
	return [...ids];
};
