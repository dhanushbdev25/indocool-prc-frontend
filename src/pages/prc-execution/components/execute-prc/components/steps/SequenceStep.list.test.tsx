import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ExecutionData, TimelineStep } from '../../../../types/execution.types';
import type { ListConfig } from '../../../../../../types/list-config.types';
import SequenceStep from './SequenceStep';

vi.mock('@mui/icons-material', () => ({
	Add: () => <span>add</span>,
	Delete: () => <span>delete</span>,
	CheckCircle: () => <span>ok</span>,
	Warning: () => <span>warning</span>,
	Error: () => <span>error</span>,
	Lock: () => <span>lock</span>
}));
vi.mock('../../../../../../store/api/business/prc-execution/prc-execution.api', () => ({
	useFetchWorkstationsComboQuery: () => ({ data: [{ value: 'WS-1', label: 'Workstation 1' }] })
}));

const listConfig: ListConfig = {
	items: [
		{ id: 'op', label: 'Operator', type: 'text', required: true, readOnly: false, defaultValue: '' },
		{ id: 'shift', label: 'Shift', type: 'shift', required: true, readOnly: false, defaultValue: 'Shift A' },
		{ id: 'notes', label: 'Notes', type: 'text', required: false, readOnly: false, defaultValue: '' }
	]
};

const step = {
	stepNumber: 2,
	type: 'sequence',
	title: 'Gel coat',
	description: 'Gel coat',
	status: 'in-progress',
	ctq: false,
	stepData: {
		prcTemplateStepId: 11,
		stepGroupId: 22,
		stepId: 33,
		targetValueType: 'list',
		uom: '',
		multipleMeasurements: false,
		notes: '',
		parameterDescription: 'Application details',
		evaluationMethod: 'Visual',
		allowAttachments: false,
		listConfig
	}
} as unknown as TimelineStep;

const renderStep = (executionData = { prcAggregatedSteps: {}, plantCode: 'P1' } as unknown as ExecutionData) => {
	const onStepComplete = vi.fn();
	render(<SequenceStep step={step} executionData={executionData} onStepComplete={onStepComplete} />);
	return onStepComplete;
};

const rowFor = (label: string) => screen.getByText(label).closest('tr') as HTMLElement;
const submit = () => fireEvent.click(screen.getByRole('button', { name: /complete step/i }));

describe('SequenceStep list target', () => {
	it('pre-fills defaults and requires the required items', () => {
		const onStepComplete = renderStep();
		expect(within(rowFor('Shift')).getByRole('combobox')).toHaveTextContent('Shift A');

		submit();
		expect(screen.getByText('Operator is required')).toBeInTheDocument();
		expect(onStepComplete).not.toHaveBeenCalled();
	});

	it('saves one entry per item under the step', () => {
		const onStepComplete = renderStep();
		fireEvent.change(within(rowFor('Operator')).getByRole('textbox'), { target: { value: 'Ravi' } });
		submit();

		expect(onStepComplete).toHaveBeenCalledWith({
			data: [
				{ id: 'op', label: 'Operator', type: 'text', value: 'Ravi' },
				{ id: 'shift', label: 'Shift', type: 'shift', value: 'Shift A' },
				{ id: 'notes', label: 'Notes', type: 'text', value: '' }
			],
			stepId: 33,
			stepGroupId: 22,
			prcTemplateStepId: 11
		});
	});

	it('shows a saved list read-only', () => {
		renderStep({
			prcAggregatedSteps: {
				11: { 22: { 33: { data: [{ id: 'op', label: 'Operator', type: 'text', value: 'Ravi' }] } } }
			},
			plantCode: 'P1'
		} as unknown as ExecutionData);

		expect(within(rowFor('Operator')).getByRole('textbox')).toHaveValue('Ravi');
		expect(within(rowFor('Operator')).getByRole('textbox')).toBeDisabled();
		expect(screen.queryByRole('button', { name: /complete step/i })).not.toBeInTheDocument();
	});
});
