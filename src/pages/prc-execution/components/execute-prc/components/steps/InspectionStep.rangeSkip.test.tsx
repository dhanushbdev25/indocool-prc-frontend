import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

/** A multi-column parameter whose numeric column carries the given acceptance range. */
const stepWithRange = (min: unknown, max: unknown): TimelineStep =>
	({
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
				columns: [{ name: 'Thickness', type: 'number', minimumAcceptanceValue: min, maximumAcceptanceValue: max }],
				specification: '',
				order: 1,
				version: 1,
				isLatest: true,
				createdAt: '',
				updatedAt: '',
				inspectionId: 40
			}
		]
	}) as unknown as TimelineStep;

const executionData = { prcAggregatedSteps: {} } as unknown as ExecutionData;

const enter = (step: TimelineStep, value: string) => {
	const onStepComplete = vi.fn();
	render(<InspectionStep step={step} executionData={executionData} onStepComplete={onStepComplete} />);

	// The fields live in a collapsed row; open it before typing.
	fireEvent.click(screen.getByText('expand'));
	fireEvent.change(screen.getByLabelText(/thickness/i), { target: { value } });
	fireEvent.click(screen.getByRole('button', { name: /complete step/i }));

	return onStepComplete;
};

describe('InspectionStep acceptance-range skip', () => {
	const range = stepWithRange('5', '10');

	it('does not raise a deviation for a zero reading', () => {
		const onStepComplete = enter(range, '0');

		// A zero is not a measurement to judge against the range — it must not block the step.
		expect(screen.queryByText(/out of range/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/please fill in all required fields/i)).not.toBeInTheDocument();
		expect(onStepComplete).toHaveBeenCalled();
	});

	it('still raises a deviation for a genuinely out-of-range reading', () => {
		const onStepComplete = enter(range, '2');

		expect(screen.getByText(/out of range/i)).toBeInTheDocument();
		expect(onStepComplete).not.toHaveBeenCalled();
	});

	it('still accepts a reading inside the range', () => {
		const onStepComplete = enter(range, '7');

		expect(screen.queryByText(/out of range/i)).not.toBeInTheDocument();
		expect(onStepComplete).toHaveBeenCalled();
	});
});

describe('InspectionStep unconfigured acceptance range', () => {
	// The master coerces blank numeric fields to 0 (applyNumberDefaults), so a column the author
	// left without a range arrives here as 0 to 0. That is "no range", not "must equal zero".
	it('treats a 0 to 0 band as no range rather than flagging every reading', () => {
		const onStepComplete = enter(stepWithRange(0, 0), '47');

		expect(screen.queryByText(/out of range/i)).not.toBeInTheDocument();
		expect(onStepComplete).toHaveBeenCalled();
	});

	it('treats null bounds as no range', () => {
		const onStepComplete = enter(stepWithRange(null, null), '47');

		expect(screen.queryByText(/out of range/i)).not.toBeInTheDocument();
		expect(onStepComplete).toHaveBeenCalled();
	});

	it('still honours a range that legitimately starts at zero', () => {
		const onStepComplete = enter(stepWithRange(0, 10), '47');

		expect(screen.getByText(/out of range/i)).toBeInTheDocument();
		expect(onStepComplete).not.toHaveBeenCalled();
	});
});
