import { fireEvent, render, screen } from '@testing-library/react';
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

/**
 * A multi-column parameter: its inputs live inside a `<Collapse unmountOnExit>` row that starts
 * closed, so the required-field error has nowhere to render until the row is expanded.
 */
const step: TimelineStep = {
	stepNumber: 1,
	type: 'inspection',
	title: 'Dimensional check',
	description: 'Dimensional check',
	status: 'in-progress',
	ctq: false,
	stepData: { prcTemplateStepId: 40 },
	inspectionParameters: [
		{
			id: 401,
			parameterName: 'Panel dimensions',
			type: 'text',
			ctq: false,
			role: 'Production',
			columns: [
				{ name: 'Length', type: 'text' },
				{ name: 'Width', type: 'text' }
			],
			specification: '',
			order: 1,
			version: 1,
			isLatest: true,
			createdAt: '',
			updatedAt: '',
			inspectionId: 40
		}
	]
} as unknown as TimelineStep;

const executionData = { prcAggregatedSteps: {} } as unknown as ExecutionData;

describe('InspectionStep scroll-to-first-error', () => {
	let scrollIntoView: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
		scrollIntoView = vi.fn();
		// happy-dom does not implement scrollIntoView.
		Element.prototype.scrollIntoView = scrollIntoView;
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('expands the collapsed row holding the error and scrolls to it', () => {
		const onStepComplete = vi.fn();
		render(<InspectionStep step={step} executionData={executionData} onStepComplete={onStepComplete} />);

		// The row is collapsed to start with, so neither the inputs nor any error are rendered.
		expect(screen.queryByLabelText(/length/i)).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: /complete step/i }));

		expect(onStepComplete).not.toHaveBeenCalled();
		// Failing the validation opened the row, so the operator can see what is missing.
		expect(screen.getByText(/please fill in all required fields/i)).toBeInTheDocument();
		expect(screen.getAllByText(/is required/i).length).toBeGreaterThan(0);

		// The scroll is deferred by two frames so the Collapse transition has real height.
		expect(scrollIntoView).not.toHaveBeenCalled();
		vi.advanceTimersToNextFrame();
		vi.advanceTimersToNextFrame();
		expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center', inline: 'nearest' });
	});
});
