import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ExecutionData, TimelineStep } from '../../../../types/execution.types';
import type { ListConfig } from '../../../../../../types/list-config.types';
import InspectionStep from './InspectionStep';

// The icons barrel opens thousands of files under vitest; stub the handful this step uses.
vi.mock('@mui/icons-material', () => ({
	Image: () => <span>image</span>,
	ExpandMore: () => <span>expand</span>,
	ExpandLess: () => <span>collapse</span>,
	CameraAlt: () => <span>camera</span>,
	Delete: () => <span>delete</span>,
	Add: () => <span>add</span>,
	Lock: () => <span>lock</span>
}));
vi.mock('../ImageAnnotator', () => ({ default: () => <div>annotator</div> }));
vi.mock('../../../../../../store/api/business/prc-execution/prc-execution.api', () => ({
	useFetchWorkstationsComboQuery: () => ({ data: [] })
}));

const PARAM_ID = 4242;

const listConfig: ListConfig = {
	items: [
		{
			id: 'temp',
			label: 'Mould temperature',
			type: 'number',
			required: true,
			readOnly: false,
			defaultValue: '',
			minimumAcceptanceValue: '20',
			maximumAcceptanceValue: '30'
		},
		{ id: 'mould', label: 'Mould number', type: 'text', required: true, readOnly: true, defaultValue: 'M-07' },
		{ id: 'remarks', label: 'Remarks', type: 'text', required: false, readOnly: false, defaultValue: '' }
	]
};

const listStep = (status = 'in-progress'): TimelineStep =>
	({
		stepNumber: 4,
		type: 'inspection',
		title: 'Mould check',
		description: 'Mould check',
		status,
		ctq: false,
		stepData: { prcTemplateStepId: 900 },
		inspectionParameters: [
			{
				id: PARAM_ID,
				parameterName: 'Mould readings',
				type: 'list',
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
				listConfig
			}
		]
	}) as unknown as TimelineStep;

const renderStep = (
	executionData: ExecutionData = { prcAggregatedSteps: {} } as unknown as ExecutionData,
	step: TimelineStep = listStep()
) => {
	const onStepComplete = vi.fn();
	render(<InspectionStep step={step} executionData={executionData} onStepComplete={onStepComplete} />);
	return onStepComplete;
};

/** A list parameter that still carries the columns and range it had as an earlier type. */
const listStepWithStaleColumns = (): TimelineStep => {
	const step = listStep();
	const [param] = step.inspectionParameters ?? [];
	Object.assign(param, {
		minimumAcceptanceValue: '9.5',
		maximumAcceptanceValue: '10.5',
		columns: [
			{ name: 'Stale temperature', type: 'number', defaultValue: '0', minimumAcceptanceValue: '0', maximumAcceptanceValue: '0' },
			{ name: 'Stale check', type: 'ok/not ok' }
		]
	});
	return step;
};

const rowFor = (label: string) => screen.getByText(label).closest('tr') as HTMLElement;
const submit = () => fireEvent.click(screen.getByRole('button', { name: /complete step/i }));

describe('InspectionStep list parameter', () => {
	it('shows each label on the left with its input, open by default', () => {
		renderStep();

		expect(screen.getByText('Mould readings - List')).toBeInTheDocument();
		expect(within(rowFor('Mould temperature')).getByRole('spinbutton')).toBeInTheDocument();
		// Read-only items show their master value instead of an input.
		expect(within(rowFor('Mould number')).getByText('M-07')).toBeInTheDocument();
		expect(within(rowFor('Mould number')).queryByRole('textbox')).not.toBeInTheDocument();
		expect(screen.getByText('Range: 20 to 30')).toBeInTheDocument();
	});

	it('blocks completion while a required item is empty', () => {
		const onStepComplete = renderStep();
		submit();

		expect(screen.getByText('Mould temperature is required')).toBeInTheDocument();
		expect(onStepComplete).not.toHaveBeenCalled();
	});

	it('requires an acknowledgement for an out-of-range reading, then saves it', () => {
		const onStepComplete = renderStep();
		fireEvent.change(within(rowFor('Mould temperature')).getByRole('spinbutton'), { target: { value: '35' } });
		submit();

		expect(screen.getByText(/out of range\. please acknowledge deviation/i)).toBeInTheDocument();
		expect(onStepComplete).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole('checkbox', { name: /acknowledge this deviation/i }));
		submit();

		const saved = onStepComplete.mock.calls[0][0] as Record<string, { value: unknown[] }>;
		expect(saved[String(PARAM_ID)].value).toEqual([
			{
				id: 'temp',
				label: 'Mould temperature',
				type: 'number',
				value: '35',
				validationStatus: 'Greater',
				minimumAcceptanceValue: '20',
				maximumAcceptanceValue: '30',
				acknowledged: true
			},
			{ id: 'mould', label: 'Mould number', type: 'text', value: 'M-07' },
			{ id: 'remarks', label: 'Remarks', type: 'text', value: '' }
		]);
	});

	it('reopens a collapsed list before pointing at its error', () => {
		const onStepComplete = renderStep();
		const toggle = screen.getByRole('button', { name: /toggle mould readings list/i });
		fireEvent.click(toggle);
		// The toggle shows the expand icon while the row is collapsed.
		expect(toggle).toHaveTextContent('expand');

		submit();

		expect(onStepComplete).not.toHaveBeenCalled();
		expect(toggle).toHaveTextContent('collapse');
		expect(screen.getByText('Mould temperature is required')).toBeInTheDocument();
	});

	it('loads saved answers back into the list', () => {
		renderStep({
			prcAggregatedSteps: {
				900: {
					[PARAM_ID]: {
						value: [
							{ id: 'temp', label: 'Mould temperature', type: 'number', value: '25' },
							{ id: 'remarks', label: 'Remarks', type: 'text', value: 'Looks fine' }
						]
					}
				}
			}
		} as unknown as ExecutionData);

		expect(within(rowFor('Mould temperature')).getByRole('spinbutton')).toHaveValue(25);
		expect(within(rowFor('Remarks')).getByRole('textbox')).toHaveValue('Looks fine');
	});

	it('ignores columns left over from an earlier type and renders only the list', () => {
		const onStepComplete = renderStep(undefined, listStepWithStaleColumns());

		expect(screen.getByText('Mould readings - List')).toBeInTheDocument();
		expect(screen.queryByText('Stale temperature')).not.toBeInTheDocument();
		expect(screen.queryByText('Stale check')).not.toBeInTheDocument();
		expect(screen.queryByText(/2 fields/)).not.toBeInTheDocument();

		fireEvent.change(within(rowFor('Mould temperature')).getByRole('spinbutton'), { target: { value: '25' } });
		submit();

		const saved = onStepComplete.mock.calls[0][0] as Record<string, { value: unknown }>;
		expect(Array.isArray(saved[String(PARAM_ID)].value)).toBe(true);
		expect(screen.queryByText(/stale temperature is required/i)).not.toBeInTheDocument();
	});
});
