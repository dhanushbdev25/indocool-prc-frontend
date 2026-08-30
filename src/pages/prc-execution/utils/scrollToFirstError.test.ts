import { describe, expect, it, vi } from 'vitest';
import { ERROR_ANCHOR_CLASS, parameterIdsFromErrorKeys, scrollToFirstError } from './scrollToFirstError';

const mountContainer = (html: string): HTMLElement => {
	const container = document.createElement('div');
	container.innerHTML = html;
	document.body.appendChild(container);
	return container;
};

describe('scrollToFirstError', () => {
	it('scrolls to the first error in document order, not the last', () => {
		const container = mountContainer(`
			<div class="MuiFormControl-root"><label class="Mui-error" id="first">A</label></div>
			<div class="MuiFormControl-root"><label class="Mui-error" id="second">B</label></div>
		`);
		const scrolled: string[] = [];
		container.querySelectorAll('label').forEach(el => {
			el.scrollIntoView = vi.fn(() => scrolled.push(el.id));
		});

		expect(scrollToFirstError(container)).toBe(true);
		expect(scrolled).toEqual(['first']);
	});

	it('finds error text that only carries the opt-in anchor class', () => {
		const container = mountContainer(`<span class="${ERROR_ANCHOR_CLASS}" id="ack">Acknowledge</span>`);
		const target = container.querySelector('span')!;
		target.scrollIntoView = vi.fn();

		expect(scrollToFirstError(container)).toBe(true);
		expect(target.scrollIntoView).toHaveBeenCalled();
	});

	it('focuses the input belonging to the error without fighting the smooth scroll', () => {
		const container = mountContainer(`
			<div class="MuiFormControl-root">
				<label class="Mui-error">Quantity</label>
				<input id="qty" />
			</div>
		`);
		const label = container.querySelector('label')!;
		label.scrollIntoView = vi.fn();
		const input = container.querySelector('input')!;
		input.focus = vi.fn();

		scrollToFirstError(container);

		expect(input.focus).toHaveBeenCalledWith({ preventScroll: true });
	});

	it('skips a disabled input rather than trying to focus it', () => {
		const container = mountContainer(`
			<div class="MuiFormControl-root">
				<label class="Mui-error">Quantity</label>
				<input id="qty" disabled />
			</div>
		`);
		container.querySelector('label')!.scrollIntoView = vi.fn();
		const input = container.querySelector('input')!;
		input.focus = vi.fn();

		expect(scrollToFirstError(container)).toBe(true);
		expect(input.focus).not.toHaveBeenCalled();
	});

	it('reports false when there is nothing to scroll to', () => {
		expect(scrollToFirstError(mountContainer('<div>All good</div>'))).toBe(false);
		expect(scrollToFirstError(null)).toBe(false);
	});
});

describe('parameterIdsFromErrorKeys', () => {
	it('reads the parameter id out of every inspection error key shape', () => {
		expect(
			parameterIdsFromErrorKeys(['12', '12_row_0_Length', 'ft_34_0_Value', '56_instrumentId', '78_Width_acknowledge'])
		).toEqual([12, 34, 56, 78]);
	});

	it('ignores keys that are not parameter-scoped', () => {
		expect(parameterIdsFromErrorKeys(['measurements_count', 'instrumentId'])).toEqual([]);
	});
});
