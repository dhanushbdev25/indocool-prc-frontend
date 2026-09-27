import { act, render } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useScrollToFirstError } from './useScrollToFirstError';

/**
 * Renders a step-shaped container: an error field sitting inside a MUI `Collapse` that the
 * failed validation has just opened. `entered` mirrors the class MUI stamps once the height
 * transition has finished — verified against MUI 7's real render output, which goes
 * `MuiCollapse-root MuiCollapse-vertical` while animating and adds `MuiCollapse-entered`
 * at the end, firing `transitionend` for `height` on that same root.
 *
 * `collapsed={false}` drops the wrapper entirely, which is the shape SequenceStep and BomStep
 * render — their errors are never hidden behind a row.
 */
const Harness = ({
	entered,
	trigger,
	collapsed = true
}: {
	entered: boolean;
	trigger: number;
	collapsed?: boolean;
}) => {
	const { containerRef, requestScrollToError } = useScrollToFirstError();

	useEffect(() => {
		if (trigger > 0) requestScrollToError();
	}, [trigger, requestScrollToError]);

	const field = (
		<div className="MuiFormControl-root">
			<label className="Mui-error">Employee Code is required</label>
			<input />
		</div>
	);

	return (
		<div ref={containerRef}>
			{collapsed ? (
				<div className={`MuiCollapse-root${entered ? ' MuiCollapse-entered' : ''}`} data-testid="collapse">
					{field}
				</div>
			) : (
				field
			)}
		</div>
	);
};

const twoFrames = () => {
	act(() => {
		vi.advanceTimersToNextFrame();
	});
	act(() => {
		vi.advanceTimersToNextFrame();
	});
};

describe('useScrollToFirstError', () => {
	let scrollIntoView: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout'] });
		scrollIntoView = vi.fn();
		Element.prototype.scrollIntoView = scrollIntoView;
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('waits for the Collapse height transition before scrolling', () => {
		const { getByTestId, rerender } = render(<Harness entered={false} trigger={0} />);
		rerender(<Harness entered={false} trigger={1} />);

		twoFrames();

		// The row is still growing — scrolling now measures a layout that is not final and
		// leaves the error below the fold.
		expect(scrollIntoView).not.toHaveBeenCalled();

		act(() => {
			getByTestId('collapse').dispatchEvent(
				Object.assign(new Event('transitionend', { bubbles: true }), { propertyName: 'height' })
			);
		});

		expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center', inline: 'nearest' });
	});

	it('scrolls straight away when the error is not behind a Collapse at all', () => {
		const { rerender } = render(<Harness entered={false} trigger={0} collapsed={false} />);
		rerender(<Harness entered={false} trigger={1} collapsed={false} />);

		twoFrames();

		expect(scrollIntoView).toHaveBeenCalledTimes(1);
	});

	it('scrolls straight away when the Collapse has already finished opening', () => {
		const { rerender } = render(<Harness entered trigger={0} />);
		rerender(<Harness entered trigger={1} />);

		twoFrames();

		expect(scrollIntoView).toHaveBeenCalledTimes(1);
	});

	it('still scrolls if the transition never reports back', () => {
		const { rerender } = render(<Harness entered={false} trigger={0} />);
		rerender(<Harness entered={false} trigger={1} />);

		twoFrames();
		expect(scrollIntoView).not.toHaveBeenCalled();

		act(() => {
			vi.advanceTimersByTime(1000);
		});

		expect(scrollIntoView).toHaveBeenCalledTimes(1);
	});

	it('ignores transitions bubbling up from inner elements', () => {
		const { getByTestId, rerender } = render(<Harness entered={false} trigger={0} />);
		rerender(<Harness entered={false} trigger={1} />);

		twoFrames();

		act(() => {
			getByTestId('collapse')
				.querySelector('input')!
				.dispatchEvent(Object.assign(new Event('transitionend', { bubbles: true }), { propertyName: 'height' }));
		});

		expect(scrollIntoView).not.toHaveBeenCalled();
	});
});
