import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ExecutionData, TimelineStep } from '../../../../types/execution.types';
import BomStep from './BomStep';

const step = {
	stepNumber: 3,
	title: 'Catalyst Mixing',
	type: 'bom',
	status: 'completed',
	items: [{ id: 15, materialCode: '1000000015', materialName: 'Ortho resin', quantity: '7.03', uom: 'KG', order: 1 }]
} as unknown as TimelineStep;

const executionData = {
	prcAggregatedSteps: {
		bom: {
			15: {
				1: {
					temperature: '24.5',
					humidity: '75.3',
					actualQuantity: '7.03',
					catalystQuantity: '126.54',
					validationStatus: 'Lesser',
					acknowledged: true,
					canNumber: '',
					fodCheckpoint: 'ok',
					employeeName: 'Ravi',
					employeeCode: '',
					role: 'l2'
				}
			}
		}
	}
} as unknown as ExecutionData;

const renderStep = (labelValueFields: boolean) =>
	render(
		<BomStep
			step={step}
			executionData={executionData}
			onStepComplete={() => {}}
			readOnlyOverride
			expandAccordionsForPdf
			labelValueFields={labelValueFields}
		/>
	);

describe('BomStep in the printed report', () => {
	it('shows the recorded values as label / value text, not form fields', async () => {
		renderStep(true);

		expect(await screen.findByText('24.5 °C')).toBeInTheDocument();
		expect(screen.getByText('75.3 %')).toBeInTheDocument();
		expect(screen.getByText('126.54')).toBeInTheDocument();
		expect(screen.getByText('L2')).toBeInTheDocument();
		expect(screen.getByText('Ravi')).toBeInTheDocument();
		// Empty values read as a dash rather than a blank box.
		expect(screen.getAllByText('—').length).toBeGreaterThan(0);

		expect(screen.queryAllByRole('textbox')).toHaveLength(0);
		expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);
		expect(screen.queryAllByRole('combobox')).toHaveLength(0);
		expect(screen.queryAllByRole('radio')).toHaveLength(0);
		expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
		expect(screen.queryByText(/I acknowledge that the catalyst quantity/)).not.toBeInTheDocument();
		// Input helper text has no place on paper.
		expect(screen.queryByText('Enter temperature in °C')).not.toBeInTheDocument();
		expect(screen.queryByText('Optional')).not.toBeInTheDocument();
	});

	it('keeps the form fields on the execution screen', async () => {
		renderStep(false);

		expect(await screen.findByDisplayValue('24.5')).toBeInTheDocument();
		expect(screen.getAllByRole('radio').length).toBeGreaterThan(0);
		expect(screen.getByText(/I acknowledge that the catalyst quantity/)).toBeInTheDocument();
	});
});
