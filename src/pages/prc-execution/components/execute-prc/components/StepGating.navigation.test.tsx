import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ExecutionData, TimelineStep } from '../../../types/execution.types';
import StepDetailView from './StepDetailView';
import StepList from './StepList';

vi.mock('@mui/icons-material', () => ({
	ArrowBack: () => <span>back</span>,
	ArrowForward: () => <span>forward</span>,
	CheckCircle: () => <span>complete</span>,
	PictureAsPdf: () => <span>pdf</span>,
	PlayArrow: () => <span>play</span>
}));
vi.mock('./steps/RawMaterialsStep', () => ({ default: () => <div>Raw materials form</div> }));
vi.mock('./steps/BomStep', () => ({ default: () => <div>BOM form</div> }));
vi.mock('./steps/SequenceStep', () => ({ default: () => <div>Sequence form</div> }));
vi.mock('./steps/InspectionStep', () => ({ default: () => <div>Inspection form</div> }));
vi.mock('./steps/ExecutionSetupStep', () => ({ default: () => <div>Setup form</div> }));
vi.mock('./steps/SapConfirmationStep', () => ({ default: () => <div>SAP form</div> }));
vi.mock('../../StepExecutionMetaSummary', () => ({ default: () => null }));

const demouldingStep: TimelineStep = {
	stepNumber: 2,
	type: 'inspection',
	title: 'Demoulding inspection',
	description: 'Demoulding inspection',
	status: 'in-progress',
	ctq: false,
	stepData: { prcTemplateStepId: 20 },
	inspectionParameters: [
		{
			id: 201,
			parameterName: 'Surface',
			type: 'text',
			ctq: false,
			role: 'Production',
			columns: [],
			specification: '',
			order: 1,
			version: 1,
			isLatest: true,
			createdAt: '',
			updatedAt: '',
			inspectionId: 20
		}
	]
};

describe('PRC execution navigation gating', () => {
	it('does not make a later sidebar step clickable before Demoulding is complete', () => {
		const onStepClick = vi.fn();
		const steps: TimelineStep[] = [
			{
				stepNumber: 1,
				type: 'setup',
				title: 'Setup',
				description: 'Setup',
				status: 'completed',
				ctq: false
			},
			demouldingStep,
			{
				...demouldingStep,
				stepNumber: 3,
				title: 'Final inspection',
				status: 'pending',
				stepData: { prcTemplateStepId: 30 }
			}
		];

		render(
			<StepList steps={steps} currentStepIndex={1} frontierIndex={1} onStepClick={onStepClick} stepStartEndTime={{}} />
		);

		fireEvent.click(screen.getByText('Final inspection'));
		expect(onStepClick).not.toHaveBeenCalled();

		fireEvent.click(screen.getByText('Demoulding inspection'));
		expect(onStepClick).toHaveBeenCalledWith(1);
	});

	it('keeps detail Next disabled until Demoulding has stepCompleted', () => {
		const onNextStep = vi.fn();
		const incompleteAggregated = {
			20: {
				201: { value: 'OK' },
				productionApproved: true
			}
		};
		const executionData = {
			prcAggregatedSteps: incompleteAggregated
		} as unknown as ExecutionData;
		const props = {
			step: demouldingStep,
			executionData,
			aggregatedStepsSnapshot: incompleteAggregated,
			onBackToList: vi.fn(),
			onPreviousStep: vi.fn(),
			onNextStep,
			onStepComplete: vi.fn(),
			canGoPrevious: true,
			canGoNext: true
		};

		const { rerender } = render(<StepDetailView {...props} />);
		expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();

		const completedAggregated = {
			20: {
				201: { value: 'OK' },
				productionApproved: true,
				stepCompleted: true
			}
		};
		rerender(
			<StepDetailView
				{...props}
				step={{ ...demouldingStep, status: 'completed' }}
				aggregatedStepsSnapshot={completedAggregated}
			/>
		);

		const nextButton = screen.getByRole('button', { name: /next/i });
		expect(nextButton).toBeEnabled();
		fireEvent.click(nextButton);
		expect(onNextStep).toHaveBeenCalledOnce();
	});
});
