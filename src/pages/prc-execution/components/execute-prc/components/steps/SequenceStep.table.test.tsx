import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ExecutionData, TimelineStep } from '../../../../types/execution.types';
import type { TableConfig } from '../../../../../../types/table-config.types';
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

const stepWith = (tableConfig: TableConfig) =>
	({
		stepNumber: 2,
		type: 'sequence',
		title: 'Cure',
		description: 'Cure',
		status: 'in-progress',
		ctq: false,
		stepData: {
			prcTemplateStepId: 11,
			stepGroupId: 22,
			stepId: 33,
			targetValueType: 'table',
			uom: '',
			multipleMeasurements: false,
			notes: '',
			parameterDescription: 'Cure readings',
			evaluationMethod: 'Visual',
			allowAttachments: false,
			tableConfig
		}
	}) as unknown as TimelineStep;

const renderStep = (tableConfig: TableConfig) => {
	const onStepComplete = vi.fn();
	render(
		<SequenceStep
			step={stepWith(tableConfig)}
			executionData={{ prcAggregatedSteps: {}, plantCode: 'P1' } as unknown as ExecutionData}
			onStepComplete={onStepComplete}
		/>
	);
	return onStepComplete;
};

const bodyRows = () => screen.getAllByRole('row').slice(1);
const submit = () => fireEvent.click(screen.getByRole('button', { name: /complete step/i }));

/** Two rows in one "Reading" column: a 10-20 range cell and a Yes/No cell. */
const perCellConfig: TableConfig = {
	cellTypes: true,
	columns: [
		{ name: 'Check', type: 'text' },
		{ name: 'Reading', type: 'text' }
	],
	rows: [
		{
			cells: {
				Check: { value: 'Temperature', readOnly: true, type: 'text' },
				Reading: { value: '', readOnly: false, type: 'range', minimumAcceptanceValue: 10, maximumAcceptanceValue: 20 }
			}
		},
		{
			cells: {
				Check: { value: 'Cover fitted', readOnly: true, type: 'text' },
				Reading: { value: '', readOnly: false, type: 'boolean' }
			}
		}
	]
};

describe('SequenceStep table target', () => {
	it('gives each cell the input for its own data type', () => {
		renderStep(perCellConfig);
		const [rangeRow, booleanRow] = bodyRows();
		expect(within(rangeRow).getByRole('spinbutton')).toBeInTheDocument();
		expect(within(rangeRow).getByText('Range: 10 to 20')).toBeInTheDocument();
		expect(within(booleanRow).getByRole('combobox')).toBeInTheDocument();
		expect(within(booleanRow).queryByRole('spinbutton')).not.toBeInTheDocument();
	});

	it('blocks an out-of-range reading until acknowledged, then saves the deviation', () => {
		const onStepComplete = renderStep(perCellConfig);
		const [rangeRow, booleanRow] = bodyRows();
		fireEvent.change(within(rangeRow).getByRole('spinbutton'), { target: { value: '25' } });
		fireEvent.mouseDown(within(booleanRow).getByRole('combobox'));
		fireEvent.click(screen.getByRole('option', { name: 'Yes' }));

		submit();
		expect(screen.getByText('Row 1, Reading out of range. Please acknowledge deviation.')).toBeInTheDocument();
		expect(onStepComplete).not.toHaveBeenCalled();

		fireEvent.click(within(rangeRow).getByRole('checkbox', { name: 'Acknowledge deviation' }));
		submit();
		expect(onStepComplete).toHaveBeenCalledTimes(1);
		const saved = onStepComplete.mock.calls[0][0].data;
		expect(saved[0]).toMatchObject({
			Check: 'Temperature',
			Reading: '25',
			Reading_validationStatus: 'Greater',
			Reading_minimumAcceptanceValue: 10,
			Reading_maximumAcceptanceValue: 20,
			Reading_acknowledged: true
		});
		expect(saved[1]).toEqual({ Check: 'Cover fitted', Reading: 'Yes' });
	});

	it('still uses column types for a table saved before per-cell types', () => {
		const onStepComplete = renderStep({
			columns: [{ name: 'Qty', type: 'number' }],
			rows: [{ cells: { Qty: { value: '', readOnly: false } } }]
		});
		fireEvent.change(within(bodyRows()[0]).getByRole('spinbutton'), { target: { value: '7' } });
		submit();
		expect(onStepComplete.mock.calls[0][0].data).toEqual([{ Qty: '7' }]);
	});
});
