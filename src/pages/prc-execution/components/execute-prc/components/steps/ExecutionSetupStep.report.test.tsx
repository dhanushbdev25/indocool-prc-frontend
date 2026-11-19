import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ExecutionData, TimelineStep } from '../../../../types/execution.types';

vi.mock('../../../../../../hooks/useCurrentRole', () => ({
	useCurrentRole: () => ({ userInfo: { id: 1, name: 'Viewer', email: 'viewer@example.com' } })
}));

vi.mock('../../../../../../store/api/business/mould/mould.api', () => ({
	useFetchMouldComboQuery: () => ({
		data: [{ value: 9, label: 'M1', data: { mouldId: 'M1' } }],
		isLoading: false,
		isFetching: false
	})
}));

import ExecutionSetupStep from './ExecutionSetupStep';

const step = { stepNumber: 1, title: 'Execution setup', type: 'setup', status: 'completed' } as unknown as TimelineStep;

const executionData = {
	partId: 5,
	prcAggregatedSteps: { prcmetadata: { prcSetId: '1933', productionSetId: '119', mouldId: 'M1' } }
} as unknown as ExecutionData;

const renderStep = (labelValueFields: boolean) =>
	render(
		<ExecutionSetupStep
			step={step}
			executionData={executionData}
			onStepComplete={() => {}}
			readOnlyOverride
			plainReadOnlyFields
			hideLoggedInUser
			labelValueFields={labelValueFields}
		/>
	);

describe('ExecutionSetupStep in the printed report', () => {
	it('shows only SAP Set ID, as label / value text without helper text', async () => {
		renderStep(true);

		expect(await screen.findByText('119')).toBeInTheDocument();
		// PRC Set ID and Mould are already in the report header.
		expect(screen.queryByText('PRC Set ID')).not.toBeInTheDocument();
		expect(screen.queryByText('1933')).not.toBeInTheDocument();
		expect(screen.queryByText('Mould')).not.toBeInTheDocument();
		expect(screen.queryByText('M1')).not.toBeInTheDocument();
		expect(screen.queryAllByRole('textbox')).toHaveLength(0);
		expect(screen.queryByText('Production set and mould used for this run')).not.toBeInTheDocument();
		expect(screen.queryByText('Auto-populated from SAP')).not.toBeInTheDocument();
	});

	it('keeps the form fields and subtitle on the execution screen', async () => {
		renderStep(false);

		expect(await screen.findByDisplayValue('1933')).toBeInTheDocument();
		expect(screen.getByText('Production set and mould used for this run')).toBeInTheDocument();
	});
});
