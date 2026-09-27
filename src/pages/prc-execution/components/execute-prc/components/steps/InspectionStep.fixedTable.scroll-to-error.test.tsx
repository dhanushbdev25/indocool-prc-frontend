import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExecutionData, TimelineStep } from '../../../../types/execution.types';
import InspectionStep from './InspectionStep';

// The icons barrel opens thousands of files under vitest; stub the handful this step uses.
vi.mock('@mui/icons-material', () => ({
	Image: () => <span>image</span>,
	ExpandMore: () => <span>expand</span>,
	ExpandLess: () => <span>collapse</span>,
	CameraAlt: () => <span>camera</span>,
	Delete: () => <span>delete</span>,
	Add: () => <span>add</span>
}));
vi.mock('../ImageAnnotator', () => ({ default: () => <div>annotator</div> }));

const TEMPLATE_STEP_ID = 26374;
const PARAM_ID = 17174;

/**
 * A fixed-table parameter: the tallest thing that can sit inside a collapsed row, which is why
 * scrolling before its `Collapse` settles used to leave the error below the fold.
 */
const step: TimelineStep = {
	stepNumber: 3,
	type: 'inspection',
	title: 'Demoulding Inspection',
	description: 'Demoulding Inspection',
	status: 'in-progress',
	ctq: false,
	stepData: { prcTemplateStepId: TEMPLATE_STEP_ID },
	inspectionParameters: [
		{
			id: PARAM_ID,
			parameterName: 'Inspector details',
			type: 'fixed-table',
			ctq: false,
			role: 'Quality',
			columns: [],
			specification: '',
			order: 1,
			version: 1,
			isLatest: true,
			createdAt: '',
			updatedAt: '',
			inspectionId: 1,
			tableConfig: {
				columns: [
					{ name: 'Employee Code', type: 'number' },
					{ name: 'Employee Name', type: 'text' }
				],
				rows: [
					{
						cells: {
							'Employee Code': { value: '', readOnly: false },
							'Employee Name': { value: '', readOnly: false }
						}
					}
				]
			}
		}
	]
} as unknown as TimelineStep;

const executionData = { prcAggregatedSteps: {} } as unknown as ExecutionData;

describe('InspectionStep fixed-table scroll-to-first-error', () => {
	let scrollTargets: HTMLElement[];

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
		scrollTargets = [];
		// happy-dom does not implement scrollIntoView.
		Element.prototype.scrollIntoView = vi.fn(function (this: HTMLElement) {
			scrollTargets.push(this);
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('expands the fixed table, waits for it to finish opening, then scrolls to the bad cell', () => {
		const onStepComplete = vi.fn();
		render(<InspectionStep step={step} executionData={executionData} onStepComplete={onStepComplete} />);

		fireEvent.click(screen.getByRole('button', { name: /complete step/i }));

		expect(onStepComplete).not.toHaveBeenCalled();
		// Failing validation opened the fixed table, so the operator can see what is missing.
		expect(screen.getByText(/please fill in all required fields/i)).toBeInTheDocument();
		expect(screen.getAllByText(/is required/i).length).toBeGreaterThan(0);

		act(() => {
			vi.advanceTimersToNextFrame();
		});
		act(() => {
			vi.advanceTimersToNextFrame();
		});

		// The row is still growing at this point — scrolling here is what used to strand the
		// error below the fold.
		expect(scrollTargets).toHaveLength(0);

		const collapse = document.querySelector('.MuiCollapse-root')!;
		act(() => {
			collapse.dispatchEvent(Object.assign(new Event('transitionend', { bubbles: true }), { propertyName: 'height' }));
		});

		expect(scrollTargets).toHaveLength(1);
		// It lands on the erroring cell itself, not on the summary alert at the foot of the step.
		expect(scrollTargets[0].closest('.MuiCollapse-root')).toBe(collapse);
		expect(scrollTargets[0].className).toContain('Mui-error');
	});
});
