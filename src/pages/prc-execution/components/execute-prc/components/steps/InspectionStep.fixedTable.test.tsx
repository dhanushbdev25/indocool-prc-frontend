import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ExecutionData, TimelineStep } from '../../../../types/execution.types';
import InspectionStep from './InspectionStep';

// The icon barrel opens every file in the package, which exhausts file handles on Windows.
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

/** The Inspector details table every Demould Inspection carries. */
const demouldStep: TimelineStep = {
	stepNumber: 3,
	type: 'inspection',
	title: 'Demoulding Inspection',
	description: 'Demoulding Inspection',
	status: 'completed',
	ctq: false,
	stepData: { prcTemplateStepId: TEMPLATE_STEP_ID },
	inspectionMetadata: { type: 'Demould Inspection', status: 'ACTIVE', version: 1 },
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
					{ name: 'Inspection Date', type: 'date' },
					{ name: 'Employee Code', type: 'number' },
					{ name: 'Employee Name', type: 'text' }
				],
				rows: [
					{
						cells: {
							'Inspection Date': { value: '', readOnly: false },
							'Employee Code': { value: '', readOnly: false },
							'Employee Name': { value: '', readOnly: false }
						}
					}
				]
			}
		}
	]
} as unknown as TimelineStep;

const savedRow = {
	'Inspection Date': '2026-08-29',
	'Employee Code': '9946',
	'Employee Name': 'JAGADESHAN P'
};

const executionDataWith = (value: unknown) =>
	({
		prcAggregatedSteps: {
			[String(TEMPLATE_STEP_ID)]: {
				[String(PARAM_ID)]: { value }
			}
		}
	}) as unknown as ExecutionData;

const renderStep = (executionData: ExecutionData) => {
	render(<InspectionStep step={demouldStep} executionData={executionData} onStepComplete={vi.fn()} readOnlyOverride />);
	// The table sits inside a collapsed row that unmounts its children.
	fireEvent.click(screen.getAllByRole('button')[0]);
};

describe('InspectionStep fixed-table restore', () => {
	it('shows saved rows stored as an array', () => {
		renderStep(executionDataWith([savedRow]));

		expect(screen.getByText('9946')).toBeInTheDocument();
		expect(screen.getByText('JAGADESHAN P')).toBeInTheDocument();
		expect(screen.getByText('2026-08-29')).toBeInTheDocument();
	});

	// Re-saving a step used to spread the saved row array into an index-keyed object, so most
	// existing executions hold `{ "0": {...} }` where the row array should be.
	it('shows saved rows stored as an index-keyed object', () => {
		renderStep(executionDataWith({ 0: savedRow }));

		expect(screen.getByText('9946')).toBeInTheDocument();
		expect(screen.getByText('JAGADESHAN P')).toBeInTheDocument();
		expect(screen.getByText('2026-08-29')).toBeInTheDocument();
	});
});
