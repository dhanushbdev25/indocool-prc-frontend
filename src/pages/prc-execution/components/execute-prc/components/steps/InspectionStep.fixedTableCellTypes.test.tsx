import { fireEvent, render, screen, within } from '@testing-library/react';
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
vi.mock('../../../../../../store/api/business/prc-execution/prc-execution.api', () => ({
	useFetchWorkstationsComboQuery: () => ({ data: [{ value: 'WS-1', label: 'Press 1' }] })
}));

const PARAM_ID = 9100;

/** One column, "Reading", whose rows each carry their own data type. */
const stepWithCells = (cells: Record<string, unknown>[], cellTypes = true): TimelineStep =>
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
				parameterName: 'Checks',
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
					cellTypes,
					columns: [{ name: 'Reading', type: 'text' }],
					rows: cells.map(cell => ({ cells: { Reading: { value: '', readOnly: false, ...cell } } }))
				}
			}
		]
	}) as unknown as TimelineStep;

const executionData = { prcAggregatedSteps: {}, plantCode: '1000' } as unknown as ExecutionData;

const renderStep = (step: TimelineStep) => {
	const onStepComplete = vi.fn();
	render(<InspectionStep step={step} executionData={executionData} onStepComplete={onStepComplete} />);
	const complete = () => fireEvent.click(screen.getByRole('button', { name: /complete step/i }));
	return { onStepComplete, complete };
};

describe('InspectionStep fixed-table per-cell data types', () => {
	it('renders each cell with the widget of its own type', () => {
		renderStep(stepWithCells([{ type: 'integer' }, { type: 'text' }, { type: 'boolean' }, { type: 'workstation' }]));

		expect(screen.getAllByRole('spinbutton')).toHaveLength(1);
		expect(screen.getAllByRole('textbox')).toHaveLength(1);
		expect(screen.getAllByRole('combobox')).toHaveLength(2);
	});

	it('keeps the column type when per-cell types are off', () => {
		renderStep(stepWithCells([{ type: 'integer' }], false));

		expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
		expect(screen.getByRole('textbox')).toBeInTheDocument();
	});

	it('rejects a decimal in an integer cell', () => {
		const { onStepComplete, complete } = renderStep(stepWithCells([{ type: 'integer' }]));

		fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '2.5' } });
		complete();

		expect(screen.getByText(/must be a whole number/i)).toBeInTheDocument();
		expect(onStepComplete).not.toHaveBeenCalled();
	});

	it('judges a reading against the range of its own cell and saves the deviation', () => {
		const { onStepComplete, complete } = renderStep(
			stepWithCells([{ type: 'integer', minimumAcceptanceValue: '5', maximumAcceptanceValue: '10' }])
		);

		expect(screen.getByText(/range:\s*5\s*to\s*10/i)).toBeInTheDocument();
		fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '12' } });
		complete();
		expect(screen.getByText('Greater')).toBeInTheDocument();
		expect(onStepComplete).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole('checkbox', { name: /acknowledge deviation/i }));
		complete();

		const saved = onStepComplete.mock.calls[0][0] as Record<string, { value: Record<string, unknown>[] }>;
		expect(saved[String(PARAM_ID)].value[0]).toMatchObject({
			Reading: '12',
			Reading_validationStatus: 'Greater',
			Reading_minimumAcceptanceValue: '5',
			Reading_maximumAcceptanceValue: '10',
			Reading_acknowledged: true
		});
	});

	it('flags any reading other than the target of an exact value', () => {
		const { onStepComplete, complete } = renderStep(
			stepWithCells([{ type: 'exact value', minimumAcceptanceValue: '7', maximumAcceptanceValue: '7' }])
		);

		expect(screen.getByText(/target:\s*7/i)).toBeInTheDocument();
		fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '6' } });
		complete();

		expect(screen.getByText('Lesser')).toBeInTheDocument();
		expect(onStepComplete).not.toHaveBeenCalled();
	});

	it('offers Yes and No for a boolean cell and the plant workstations for a workstation cell', () => {
		renderStep(stepWithCells([{ type: 'boolean' }, { type: 'workstation' }]));
		const [booleanSelect, workstationSelect] = screen.getAllByRole('combobox');

		fireEvent.mouseDown(booleanSelect);
		let listbox = within(screen.getByRole('listbox'));
		expect(listbox.getByText('Yes')).toBeInTheDocument();
		expect(listbox.getByText('No')).toBeInTheDocument();
		fireEvent.click(listbox.getByText('Yes'));

		fireEvent.mouseDown(workstationSelect);
		listbox = within(screen.getByRole('listbox'));
		expect(listbox.getByText('Press 1')).toBeInTheDocument();
	});

	it('requires a value in an editable cell whatever its type', () => {
		const { onStepComplete, complete } = renderStep(stepWithCells([{ type: 'boolean' }]));

		complete();

		expect(screen.getByText(/row 1, reading is required/i)).toBeInTheDocument();
		expect(onStepComplete).not.toHaveBeenCalled();
	});
});
