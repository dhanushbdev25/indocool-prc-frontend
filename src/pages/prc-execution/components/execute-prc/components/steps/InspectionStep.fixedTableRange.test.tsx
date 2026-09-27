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

const PARAM_ID = 17174;

/** A fixed-table parameter with a single numeric column carrying the given acceptance range. */
const stepWithRange = (min: unknown, max: unknown): TimelineStep =>
	({
		stepNumber: 3,
		type: 'inspection',
		title: 'Demoulding Inspection',
		description: 'Demoulding Inspection',
		status: 'in-progress',
		ctq: false,
		stepData: { prcTemplateStepId: 26374 },
		inspectionParameters: [
			{
				id: PARAM_ID,
				parameterName: 'Thickness check',
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
					columns: [{ name: 'Thickness', type: 'number', minimumAcceptanceValue: min, maximumAcceptanceValue: max }],
					rows: [{ cells: { Thickness: { value: '', readOnly: false } } }]
				}
			}
		]
	}) as unknown as TimelineStep;

const executionData = { prcAggregatedSteps: {} } as unknown as ExecutionData;

const enter = (step: TimelineStep, value: string) => {
	const onStepComplete = vi.fn();
	render(<InspectionStep step={step} executionData={executionData} onStepComplete={onStepComplete} />);

	// The fixed table lives in a collapsed row; open it before typing.
	fireEvent.click(screen.getByText('expand'));
	fireEvent.change(screen.getByRole('spinbutton'), { target: { value } });
	fireEvent.click(screen.getByRole('button', { name: /complete step/i }));

	return onStepComplete;
};

describe('InspectionStep fixed-table acceptance range', () => {
	const range = stepWithRange('5', '10');

	it('blocks a reading outside the range until it is acknowledged', () => {
		const onStepComplete = enter(range, '2');

		expect(screen.getByText('Lesser')).toBeInTheDocument();
		expect(screen.getByText(/out of range/i)).toBeInTheDocument();
		expect(onStepComplete).not.toHaveBeenCalled();
	});

	it('lets the operator acknowledge the deviation and continue', () => {
		const onStepComplete = enter(range, '2');
		expect(onStepComplete).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole('checkbox', { name: /acknowledge deviation/i }));
		fireEvent.click(screen.getByRole('button', { name: /complete step/i }));

		expect(onStepComplete).toHaveBeenCalled();
	});

	it('saves the deviation and the acknowledgement with the reading', () => {
		const onStepComplete = enter(range, '2');
		fireEvent.click(screen.getByRole('checkbox', { name: /acknowledge deviation/i }));
		fireEvent.click(screen.getByRole('button', { name: /complete step/i }));

		const saved = onStepComplete.mock.calls[0][0] as Record<string, { value: Record<string, unknown>[] }>;
		expect(saved[String(PARAM_ID)].value[0]).toMatchObject({
			Thickness: '2',
			Thickness_validationStatus: 'Lesser',
			Thickness_minimumAcceptanceValue: '5',
			Thickness_maximumAcceptanceValue: '10',
			Thickness_acknowledged: true
		});
	});

	it('flags a reading above the range the same way', () => {
		const onStepComplete = enter(range, '40');

		expect(screen.getByText('Greater')).toBeInTheDocument();
		expect(screen.getByText(/out of range/i)).toBeInTheDocument();
		expect(onStepComplete).not.toHaveBeenCalled();
	});

	it('shows the configured range against the cell', () => {
		enter(range, '7');

		expect(screen.getByText(/range:\s*5\s*to\s*10/i)).toBeInTheDocument();
	});

	/** No deviation chip means the reading was never judged against a range. */
	const expectNoDeviation = () => {
		expect(screen.queryByText('Lesser')).not.toBeInTheDocument();
		expect(screen.queryByText('Greater')).not.toBeInTheDocument();
	};

	it('accepts a reading inside the range', () => {
		const onStepComplete = enter(range, '7');

		expectNoDeviation();
		expect(onStepComplete).toHaveBeenCalled();
	});

	it('skips the range check for a zero reading', () => {
		const onStepComplete = enter(range, '0');

		expectNoDeviation();
		expect(onStepComplete).toHaveBeenCalled();
	});

	it('treats an unset 0 to 0 band as no range', () => {
		const onStepComplete = enter(stepWithRange(0, 0), '47');

		expectNoDeviation();
		expect(onStepComplete).toHaveBeenCalled();
	});

	it('leaves columns without a configured range alone', () => {
		const onStepComplete = enter(stepWithRange(undefined, undefined), '47');

		expectNoDeviation();
		expect(screen.queryByText(/range:/i)).not.toBeInTheDocument();
		expect(onStepComplete).toHaveBeenCalled();
	});
});
